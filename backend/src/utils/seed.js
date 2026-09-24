/**
 * Seeds a couple of demo users and competitions in different lifecycle
 * phases (upcoming, open, almost full, closed, ongoing, completed) so the
 * RN app can be exercised against every UI state without waiting for real
 * time to pass.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');

const DAY = 24 * 60 * 60 * 1000;

async function run() {
  await connectDB();

  await Promise.all([User.deleteMany({}), Competition.deleteMany({}), Registration.deleteMany({})]);

  const passwordHash = await User.hashPassword('password123');
  const [alice, bob] = await User.create([
    { name: 'Alice Sharma', email: 'alice@example.com', passwordHash },
    { name: 'Bob Verma', email: 'bob@example.com', passwordHash },
  ]);

  const now = Date.now();

  const openComp = await Competition.create({
    title: 'National Code Sprint 2026',
    description:
      'A 48-hour competitive programming sprint open to college students across the country. Solve algorithmic challenges, climb the leaderboard, and win cash prizes.',
    rules: [
      'Individual participation only.',
      'Use of AI code-completion tools is disallowed during timed rounds.',
      'Decisions of the judging panel are final.',
    ],
    category: 'Coding',
    hostName: 'Feedants Community',
    bannerImageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
    prizePool: 50000,
    currency: 'INR',
    entryFee: 0,
    registrationStartDate: new Date(now - 2 * DAY),
    registrationEndDate: new Date(now + 3 * DAY),
    competitionStartDate: new Date(now + 4 * DAY),
    competitionEndDate: new Date(now + 6 * DAY),
    maxParticipants: 200,
    currentParticipantsCount: 0,
  });

  const almostFullComp = await Competition.create({
    title: 'UI/UX Design Jam',
    description: 'Design a mobile app screen from a brief in 24 hours. Judged on usability and visual craft.',
    rules: ['Submit a Figma link before the deadline.', 'Original work only.'],
    category: 'Design',
    hostName: 'Feedants Design Guild',
    bannerImageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
    prizePool: 15000,
    currency: 'INR',
    entryFee: 99,
    registrationStartDate: new Date(now - 1 * DAY),
    registrationEndDate: new Date(now + 1 * DAY),
    competitionStartDate: new Date(now + 2 * DAY),
    competitionEndDate: new Date(now + 3 * DAY),
    maxParticipants: 5,
    currentParticipantsCount: 4,
  });

  const upcomingComp = await Competition.create({
    title: 'Startup Pitch Battle',
    description: 'Pitch your early-stage startup to a panel of investors for funding and mentorship.',
    rules: ['5-minute pitch, 5-minute Q&A.', 'Teams of up to 4.'],
    category: 'Business',
    hostName: 'Feedants Ventures',
    bannerImageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7',
    prizePool: 200000,
    currency: 'INR',
    entryFee: 500,
    registrationStartDate: new Date(now + 2 * DAY),
    registrationEndDate: new Date(now + 10 * DAY),
    competitionStartDate: new Date(now + 12 * DAY),
    competitionEndDate: new Date(now + 12 * DAY + 6 * 60 * 60 * 1000),
    maxParticipants: 30,
    currentParticipantsCount: 0,
  });

  const closedComp = await Competition.create({
    title: 'Photography Challenge: Street Life',
    description: 'Capture the essence of street life in your city. Registration has closed; the event starts soon.',
    rules: ['One entry per participant.', 'No heavy post-processing.'],
    category: 'Photography',
    hostName: 'Feedants Studios',
    bannerImageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e',
    prizePool: 10000,
    currency: 'INR',
    entryFee: 0,
    registrationStartDate: new Date(now - 5 * DAY),
    registrationEndDate: new Date(now - 1 * DAY),
    competitionStartDate: new Date(now + 1 * DAY),
    competitionEndDate: new Date(now + 2 * DAY),
    maxParticipants: 100,
    currentParticipantsCount: 62,
  });

  const completedComp = await Competition.create({
    title: 'Winter Hackathon 2025',
    description: 'A 36-hour hackathon that wrapped up recently. Results are out.',
    rules: ['Teams of up to 5.'],
    category: 'Coding',
    hostName: 'Feedants Community',
    bannerImageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
    prizePool: 75000,
    currency: 'INR',
    entryFee: 0,
    registrationStartDate: new Date(now - 20 * DAY),
    registrationEndDate: new Date(now - 15 * DAY),
    competitionStartDate: new Date(now - 14 * DAY),
    competitionEndDate: new Date(now - 12 * DAY),
    maxParticipants: 150,
    currentParticipantsCount: 150,
  });

  await Registration.create([
    { competition: almostFullComp._id, user: alice._id, status: 'CONFIRMED' },
    { competition: closedComp._id, user: bob._id, status: 'CONFIRMED' },
  ]);

  console.log('Seeded users:');
  console.log('  alice@example.com / password123');
  console.log('  bob@example.com   / password123');
  console.log('\nSeeded competitions:');
  [openComp, almostFullComp, upcomingComp, closedComp, completedComp].forEach((c) => {
    console.log(`  ${c.title.padEnd(30)} -> ${c._id}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
