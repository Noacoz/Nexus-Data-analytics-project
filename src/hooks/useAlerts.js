/**
 * useAlerts Hook
 * Polls for alerts and manages alert state
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { getAlerts, markAlertSeen } from "../lib/nexus-api";

export function useAlerts(userId) {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollIntervalRef = useRef(null);

  /**
   * Fetch alerts
   */
  const fetchAlerts = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await getAlerts(userId);
      setAlerts(data);

      // Count unseen
      const unseen = data.filter((a) => !a.seen).length;
      setUnreadCount(unseen);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    // Fetch immediately
    fetchAlerts();

    // Then poll every 60 seconds
    pollIntervalRef.current = setInterval(fetchAlerts, 60000);
  }, [fetchAlerts]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  /**
   * Mark alert as seen
   */
  const markSeen = useCallback(
    async (alertId) => {
      try {
        await markAlertSeen(alertId);

        // Update local state
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, seen: true } : a))
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark alert as seen:", error);
      }
    },
    []
  );

  // Start polling on mount if userId provided
  useEffect(() => {
    if (userId) {
      startPolling();
    }

    return () => stopPolling();
  }, [userId, startPolling, stopPolling]);

  return {
    alerts,
    unreadCount,
    loading,
    fetchAlerts,
    markSeen,
    startPolling,
    stopPolling,
  };
}
