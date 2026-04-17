/**
 * useDataset Hook
 * Manages dataset state, polling, and insights loading
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  uploadDataset,
  getDatasetStatus,
  getInsights,
  getSnapshot,
} from "../lib/nexus-api";

export function useDataset() {
  const [dataset, setDataset] = useState(null);
  const [status, setStatus] = useState(null);
  const [insights, setInsights] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollIntervalRef = useRef(null);
  const pollCountRef = useRef(0);

  /**
   * Load dataset and its data
   */
  const loadDataset = useCallback(async (datasetId) => {
    setLoading(true);
    setError(null);

    try {
      const [statusData, insightsData, snapshotData] = await Promise.all([
        getDatasetStatus(datasetId),
        getInsights(datasetId),
        getSnapshot(datasetId),
      ]);

      setDataset(statusData);
      setStatus(statusData.status);
      setInsights(insightsData);
      setSnapshot(snapshotData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Start polling for status
   */
  const startPolling = useCallback((datasetId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollCountRef.current = 0;
    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusData = await getDatasetStatus(datasetId);
        setStatus(statusData.status);
        setDataset(statusData);

        if (statusData.status === "ready") {
          // Dataset ready, fetch full data
          const [insightsData, snapshotData] = await Promise.all([
            getInsights(datasetId),
            getSnapshot(datasetId),
          ]);
          setInsights(insightsData);
          setSnapshot(snapshotData);

          // Stop polling
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        } else if (statusData.status === "error") {
          // Error occurred, stop polling
          setError("Dataset processing failed");
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        pollCountRef.current++;
        if (pollCountRef.current > 150) {
          // 5 minutes at 2 second intervals
          setError("Processing timeout");
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // Poll every 2 seconds
  }, []);

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
   * Upload and process dataset
   */
  const upload = useCallback(
    async (file, userId) => {
      setLoading(true);
      setError(null);

      try {
        const result = await uploadDataset(file, userId);
        const datasetObject = result.dataset || result;
        setDataset(datasetObject);
        setStatus(datasetObject.status || 'processing');

        const datasetId = datasetObject.id || datasetObject.dataset_id;
        if (datasetId) {
          // Start polling for completion
          startPolling(datasetId);
        }

        return datasetId;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [startPolling]
  );

  /**
   * Refresh dataset data
   */
  const refresh = useCallback(async () => {
    if (!dataset?.id) return;
    await loadDataset(dataset.id);
  }, [dataset?.id, loadDataset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    dataset,
    status,
    insights,
    snapshot,
    loading,
    error,
    upload,
    loadDataset,
    refresh,
    startPolling,
    stopPolling,
  };
}
