/**
 * Nexus API Service Layer
 * Centralizes all API calls to the backend
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================================
// DATASETS
// ============================================================================

/**
 * Upload a dataset file
 */
export async function uploadDataset(file, userId) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);

  try {
    const response = await apiClient.post("/datasets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.dataset || response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Upload failed");
  }
}

/**
 * Get dataset status
 */
export async function getDatasetStatus(datasetId) {
  try {
    const response = await apiClient.get(`/datasets/${datasetId}/status`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch status");
  }
}

/**
 * Get all insights for a dataset
 */
export async function getInsights(datasetId) {
  try {
    const response = await apiClient.get(`/datasets/${datasetId}/insights`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch insights");
  }
}

/**
 * Get latest snapshot for a dataset
 */
export async function getSnapshot(datasetId) {
  try {
    const response = await apiClient.get(`/datasets/${datasetId}/snapshot`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch snapshot");
  }
}

/**
 * Get reasoning output for a dataset
 */
export async function getReasoning(datasetId) {
  try {
    const response = await apiClient.get(`/datasets/${datasetId}/reasoning`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 409) return { reasoning: null };
    throw new Error(error.response?.data?.error || "Failed to fetch reasoning");
  }
}

/**
 * Get lineage and validation metadata for a dataset
 */
export async function getLineage(datasetId) {
  try {
    const response = await apiClient.get(`/datasets/${datasetId}/lineage`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return { latest_snapshot: null, latest_reasoning: null, validation: null };
    throw new Error(error.response?.data?.error || "Failed to fetch lineage metadata");
  }
}

/**
 * Trigger deterministic recompute for a dataset
 */
export async function recomputeDataset(datasetId) {
  try {
    const response = await apiClient.post(`/datasets/${datasetId}/recompute`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to trigger recompute");
  }
}

/**
 * Get audit logs for a dataset
 * Supports ?limit=50&action_type=UPLOAD&status=success
 */
export async function getAuditLogs(datasetId, { limit = 50, action_type, status } = {}) {
  try {
    const params = new URLSearchParams({ limit });
    if (action_type) params.append('action_type', action_type);
    if (status) params.append('status', status);
    
    const response = await apiClient.get(`/datasets/${datasetId}/audit-logs?${params}`);
    return response.data.audit_logs || [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw new Error(error.response?.data?.error || "Failed to fetch audit logs");
  }
}

// ============================================================================
// INTELLIGENCE FEATURES
// ============================================================================

/**
 * Get executive summary for dataset
 */
export async function getExecutiveSummary(datasetId) {
  try {
    const response = await apiClient.get(`/datasets/${datasetId}/executive-summary`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to generate summary");
  }
}

/**
 * Hypothesize about dataset
 */
export async function hypothesize(datasetId, question) {
  try {
    const response = await apiClient.post(`/datasets/${datasetId}/hypothesize`, {
      question,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to rank hypotheses");
  }
}

// ============================================================================
// CHAT
// ============================================================================

/**
 * Send chat message
 */
export async function sendChatMessage(message, sessionId, datasetId, userId) {
  try {
    const response = await apiClient.post("/chat", {
      message,
      sessionId,
      datasetId,
      userId,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to send message");
  }
}

// ============================================================================
// ALERTS
// ============================================================================

/**
 * Get all alerts for user
 */
export async function getAlerts(userId) {
  try {
    const response = await apiClient.get(`/alerts/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch alerts");
  }
}

/**
 * Mark alert as seen
 */
export async function markAlertSeen(alertId) {
  try {
    const response = await apiClient.patch(`/alerts/${alertId}/seen`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to update alert");
  }
}

export default apiClient;
