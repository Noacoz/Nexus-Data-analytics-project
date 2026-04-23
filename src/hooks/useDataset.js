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
  getReasoning,
  getKpiSummary,
  getLineage,
  getAuditLogs,
  recomputeDataset,
} from "../lib/nexus-api";

export function useDataset() {
  const [dataset, setDataset] = useState(null);
  const [status, setStatus] = useState(null);
  const [insights, setInsights] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
[reasoning, setReasoning] = useState(null);
  const [kpiSummary, setKpiSummary] = useState(null);
  const [lineage, setLineage] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [auditLimit, setAuditLimit] = useState(20);
  const [auditFilters, setAuditFilters] = useState({ action_type: '', status: '' });
  const [hasMoreAuditLogs, setHasMoreAuditLogs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollIntervalRef = useRef(null);
  const pollCountRef = useRef(0);

  /**
   * Load dataset and its data
   */
  const loadAuditLogs = useCallback(async (datasetId, filters = {}, limit = 20) => {
    setAuditLoading(true);
    setAuditError(null);

    try {
      const logs = await getAuditLogs(datasetId, { ...filters, limit });
      setAuditLogs(logs || []);
      setHasMoreAuditLogs((logs?.length || 0) >= limit);
      return logs;
    } catch (err) {
      setAuditError(err.message);
      setAuditLogs([]);
      setHasMoreAuditLogs(false);
      throw err;
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const getKpiSummaryLocal = useCallback(async (datasetId) => {
    try {
      const data = await getKpiSummary(datasetId);
      setKpiSummary(data);
      return data;
    } catch (err) {
      console.warn('[useDataset] KPI summary fetch failed:', err.message);
      setKpiSummary(null);
      return null;
    }
  }, []);

  const loadDataset = useCallback(async (datasetId) => {
    setLoading(true);
    setError(null);

    try {
      const [statusData, insightsData, snapshotData, reasoningData, lineageData, kpiSummaryData] = await Promise.all([
        getDatasetStatus(datasetId),
        getInsights(datasetId),
        getSnapshot(datasetId),
        getReasoning(datasetId),
        getLineage(datasetId),
        getKpiSummary(datasetId),
      ]);

      setDataset(statusData);
      setStatus(statusData.status);
      setInsights(insightsData);
      setSnapshot(snapshotData);
      setReasoning(reasoningData?.reasoning || null);
      setLineage(lineageData);
      setKpiSummary(kpiSummaryData);
      setAuditLogs([]);
      setAuditError(null);
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

        if (statusData.status === "completed" || statusData.status === "ready") {
          // Dataset complete, fetch full data
          const [insightsData, snapshotData, reasoningData, lineageData, auditLogsData, kpiSummaryData] = await Promise.all([
            getInsights(datasetId),
            getSnapshot(datasetId),
            getReasoning(datasetId),
            getLineage(datasetId),
            getAuditLogs(datasetId),
            getKpiSummary(datasetId),
          ]);
          setAuditLogs(auditLogsData);
          setInsights(insightsData);
          setSnapshot(snapshotData);
          setReasoning(reasoningData?.reasoning || null);
          setLineage(lineageData);
          setKpiSummary(kpiSummaryData);

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

  const refreshAuditLogs = useCallback(async () => {
    if (!dataset?.id) return;
    await loadAuditLogs(dataset.id, auditFilters, auditLimit);
  }, [dataset?.id, auditFilters, auditLimit, loadAuditLogs]);

  const recompute = useCallback(async () => {
    if (!dataset?.id) throw new Error('No dataset loaded for recompute');
    setLoading(true);
    setError(null);
    try {
      await recomputeDataset(dataset.id);
      await loadDataset(dataset.id);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataset?.id, loadDataset]);

  // Cleanup on unmount
  useEffect(() => {
    if (dataset?.id) {
      loadAuditLogs(dataset.id, auditFilters, auditLimit).catch(() => {});
    }
  }, [dataset?.id, auditFilters, auditLimit, loadAuditLogs]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    dataset,
    status,
    insights,
    snapshot,
    reasoning,
    lineage,
    auditLogs,
    auditLoading,
    auditError,
    auditFilters,
    setAuditFilters,
    auditLimit,
    setAuditLimit,
    hasMoreAuditLogs,
    loading,
    error,
    upload,
    loadDataset,
    refresh,
    refreshAuditLogs,
    recompute,
    kpiSummary,
    getKpiSummary: getKpiSummaryLocal,
    startPolling,
    stopPolling,
  };
}
