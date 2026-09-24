# Feedants Competition Details Module

Full-stack implementation of the Competition Details screen for the Feedants internship assignment — React Native frontend, Node.js/Express backend, MongoDB.

No design file/image was included with the brief I received, just the text spec. I designed a dark-themed competition details screen around the requirements listed (status, countdown, participant spots, registration CTA, schedule, rules) instead of matching pixels to a mock. Layout, spacing and colors are mine.

## Repo layout

```
backend/    Express API + MongoDB models
frontend/   React Native (Expo) app
```

## Running the backend

```
cd backend
cp .env.example .env     # fill in MONGO_URI, JWT_SECRET
npm install
npm run seed              # wipes and reseeds demo users + competitions
npm run dev                # nodemon, http://localhost:5000
```

The seed script prints the competition IDs it created and two demo logins (`alice@example.com` / `bob@example.com`, password `password123`). It seeds one competition in each lifecycle phase (upcoming, open, almost full, closed, ongoing/completed) so you can see every screen state without waiting for real time to pass.

**Mongo requirement:** registration uses a multi-document transaction, which needs a replica set (or Atlas, which is a replica set by default). A single standalone `mongod` will throw on `session.withTransaction`. Easiest fix locally:

```
mongod --replSet rs0 --dbpath /your/data/dir
mongosh --eval "rs.initiate()"
```

Or just point `MONGO_URI` at a free Atlas cluster.

### Env vars (backend/.env)

| Var | Purpose |
|---|---|
| `PORT` | API port, default 5000 |
| `MONGO_URI` | Mongo connection string (replica set) |
| `JWT_SECRET` | signing secret for auth tokens |
| `JWT_EXPIRES_IN` | token lifetime, e.g. `7d` |
| `CORS_ORIGIN` | `*` or comma-separated origins |

## Running the frontend

```
cd frontend
npm install
npm start
```

Scan the QR with Expo Go, or press `a` / `i` for an emulator. Edit `API_BASE_URL` in `src/services/api.js` — `localhost` only works from the iOS simulator; on a physical device or Android emulator point it at your machine's LAN IP (`http://192.168.x.x:5000/api`) or use `adb reverse tcp:5000 tcp:5000` for Android.

Open the app, log in with a seeded account, paste one of the competition IDs the seed script printed, and it opens the details screen.

## What the screen actually does

The competition document doesn't store a "status" field that some cron job has to keep flipping. Every field that depends on time — phase, countdown target/label, spots remaining, whether the register button is even clickable — gets computed from the raw dates on every request (`Competition.computePhase()` in the model, `buildCompetitionResponse()` in `utils/competitionState.js`). Phases: `UPCOMING → REGISTRATION_OPEN → REGISTRATION_FULL → REGISTRATION_CLOSED → ONGOING → COMPLETED`, plus `CANCELLED`/`DRAFT` for admin control. The API also returns `serverTime` so the app's countdown timer can correct for a device clock that's off, instead of trusting `Date.now()` blindly.

The frontend never decides on its own whether the register button should be enabled — it just renders whatever `phase` / `viewer.canRegister` / `viewer.canWithdraw` the server sent back. That was a deliberate call: duplicating the eligibility rules on the client is how you end up with a button that says "Register" for a competition that's actually full, because the client's copy of the rules drifted from the server's.

## Concurrency — the part that actually matters here

The interesting failure mode in this assignment is two people hitting "Register" on the last open spot at the same instant. If you do the obvious thing — read the participant count, check `count < max` in JS, then write — two concurrent requests can both pass the check before either one writes, and you oversell the competition.

`registerForCompetition` in `competitionController.js` avoids that by doing the check-and-increment as a single atomic Mongo operation instead of a read-then-write:

```js
Competition.findOneAndUpdate(
  { _id: id, $expr: { $lt: ['$currentParticipantsCount', '$maxParticipants'] } },
  { $inc: { currentParticipantsCount: 1 } },
  { new: true }
)
```

The condition and the increment happen in the same operation the database executes, so there's no gap for a second request to sneak through. If two requests race for the last spot, one gets a document back and one gets `null` (which becomes a 409 "competition full").

Separately, "a user can't register twice" is enforced with a unique compound index on `(competition, user)` in the `Registration` collection — at the database level, not just app logic, so it holds even if two requests from the same user land on two different app server instances (which they will, once this is horizontally scaled).

Both writes — the counter increment and the `Registration` insert — run inside one MongoDB transaction. If the insert fails (duplicate key, from a double-submit), the whole transaction aborts and the increment rolls back with it, so a failed registration never leaks a phantom reserved spot. Withdrawal is symmetric: decrement is also guarded (`currentParticipantsCount: { $gt: 0 }`) so it can never go negative.

On the client side, a 409 response (full / already registered / closed) triggers an immediate silent refetch, because getting a 409 means the screen's local copy of the competition state is stale — the fastest way to correct it is to just re-fetch rather than guess.

## Assumptions I made

- **Auth is intentionally thin.** Email/password + JWT, no refresh tokens, no password reset, no email verification. The assignment is about the competition module, not an identity system, and building a real auth flow would have eaten the time budget for the part that's actually being evaluated.
- **Entry fee is not actually charged.** The register endpoint doesn't integrate a payment provider — it records the entry fee on the competition and shows it on the CTA ("Register · Pay ₹99"), but registering a paid competition doesn't collect money. A real version would hold the seat in a `PENDING_PAYMENT` state until a payment webhook confirms, rather than confirming on click.
- **Withdrawal is only allowed while registration is still open (or full).** Once registration has closed, I don't let people un-register — organizers may have already planned capacity/logistics around the confirmed list. This is a product decision, not a technical constraint, and it's easy to change (`WITHDRAWABLE_PHASES` in `competitionState.js`).
- **One competition, one screen.** I didn't build a competitions list/browse API since it wasn't asked for — the RN app's home screen just takes a competition ID (from the seed script output) so the details screen is reachable. A real app would have a list/search/category-filter endpoint feeding into this screen.
- **"Almost full" threshold** is `min(3, 5% of capacity)` — arbitrary but reasonable for an urgency indicator; would probably be a competition-level or org-level config in production.

## Trade-offs I considered

- **Counter vs. live count query.** I keep `currentParticipantsCount` as a field on the competition document instead of running `Registration.countDocuments(...)` on every page view. Reading a field is O(1); counting is a collection scan (or index scan at best) that gets slower as a popular competition accumulates thousands of registrations, and this field gets read on every single page view of a competition. The cost is that the counter is a second source of truth that has to be kept in sync with the `Registration` collection — which is exactly what the transaction wrapping both writes is for.
- **Polling vs. WebSocket for live spot counts.** The app polls `GET /competitions/:id` every 20s while the screen is open, plus refetches after any action or 409. A WebSocket/SSE push would show the spot count drop in real time instead of up to 20s late, which matters more for a "last 3 spots, everyone's watching" competition than a quiet one. Went with polling because it's simpler to reason about and doesn't need a separate connection-management layer, at the cost of that staleness window.
- **Transactions require a replica set.** This is a real deployment constraint, not just a local dev annoyance — using `findOneAndUpdate` transactions means the MongoDB Atlas free tier (which is already a replica set) works fine, but a bare `mongod` doesn't. I considered doing the increment as a single atomic op with no transaction and accepting an extremely rare inconsistency window between the counter and the Registration record, but decided the transaction was worth the deployment requirement given "thousands of concurrent users" was explicitly called out in the brief.
- **Rate limiting is per-IP, in-memory.** `express-rate-limit` with no external store. Works for a single instance; the moment this runs behind a load balancer with multiple instances, each instance has its own counter and the limit is effectively multiplied by instance count. Fine for this assignment, wrong for production.

## What I'd change for a real production version

- Move the participant counter check to Redis (`INCR` + `WATCH`/Lua script) in front of Mongo, so registration writes don't all funnel through Mongo transactions under heavy load — transactions have real overhead and a replica-set requirement that a Redis-fronted counter avoids.
- Real payment integration (Razorpay/Stripe) with a `PENDING_PAYMENT` → `CONFIRMED` state machine on the registration, plus a TTL/cron to release seats that never complete payment.
- Push/WebSocket updates for spot count and phase transitions instead of polling.
- A proper admin API for creating/editing competitions (right now they only exist via the seed script or direct DB writes) with the `DRAFT`/`PUBLISHED`/`CANCELLED` lifecycle actually wired up to something.
- Idempotency keys on the register endpoint so a client retry after a timed-out request can't accidentally double-submit (the unique index protects data integrity either way, but the client currently sees a raw 409/"already registered" rather than the original success).
- A distributed rate limiter (Redis-backed) once this runs on more than one instance.
- Tests. There's no test suite here — for something this concurrency-sensitive, I'd want integration tests that specifically fire concurrent registration requests at a near-full competition and assert the counter never exceeds capacity, plus a Jest/RTL suite for the RN components' state rendering (loading/error/each phase of the CTA).
- Image upload/CDN for the banner instead of a raw URL field.

## Screen recording

`demo.mp4` (not included in this text response — record separately per the submission instructions) should show: browsing to a `REGISTRATION_OPEN` competition, registering, seeing the spot count and button state update, withdrawing, then opening a `REGISTRATION_FULL` / `COMPLETED` competition to show the disabled states.
