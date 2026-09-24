import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchCompetition,
  registerForCompetition,
  withdrawFromCompetition,
} from '../services/api';

// Periodic refresh while the screen is open, so the participant count /
// phase stay reasonably fresh if other users are registering concurrently
// or a time-based transition (e.g. registration closing) happens while the
// screen is idle. A full production app might instead use a WebSocket /
// SSE push for the participant count; polling is a pragmatic default here.
const POLL_INTERVAL_MS = 20000;

export function useCompetitionDetails(competitionId, { isAuthenticated }) {
  const [data, setData] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const load = useCallback(
    async ({ silent } = {}) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const result = await fetchCompetition(competitionId);
        if (!mountedRef.current) return;
        setData(result);
        setFetchedAt(Date.now());
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err);
      } finally {
        if (mountedRef.current && !silent) setLoading(false);
      }
    },
    [competitionId]
  );

  useEffect(() => {
    load();
  }, [load, isAuthenticated]);

  useEffect(() => {
    const id = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  }, [load]);

  const register = useCallback(async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const result = await registerForCompetition(competitionId);
      setData(result);
      setFetchedAt(Date.now());
      return { ok: true };
    } catch (err) {
      setActionError(err);
      // A 409 (full/closed/duplicate) means our local state was stale -
      // resync with the server so the button reflects reality immediately.
      if (err.status === 409) load({ silent: true });
      return { ok: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [competitionId, load]);

  const withdraw = useCallback(async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const result = await withdrawFromCompetition(competitionId);
      setData(result);
      setFetchedAt(Date.now());
      return { ok: true };
    } catch (err) {
      setActionError(err);
      if (err.status === 409) load({ silent: true });
      return { ok: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [competitionId, load]);

  return {
    data,
    fetchedAt,
    loading,
    refreshing,
    error,
    actionLoading,
    actionError,
    onRefresh,
    reload: load,
    register,
    withdraw,
  };
}
