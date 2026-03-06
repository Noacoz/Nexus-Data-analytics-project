/**
 * Nexus Formatting Utilities  
 * Number formatting, confidence labels, date formatting
 */

/**
 * Format number with appropriate precision
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return "N/A";
  if (typeof value !== "number") return String(value);

  // For very large numbers, use abbreviations
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  }

  // For percentages (values between 0-1), convert to percentage
  if (value >= 0 && value <= 1) {
    return (value * 100).toFixed(decimals) + "%";
  }

  return value.toFixed(decimals);
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return "N/A";
  return (value * 100).toFixed(decimals) + "%";
}

/**
 * Get confidence badge color
 */
export function getConfidenceColor(label) {
  switch (label) {
    case "High":
      return "bg-green-100 text-green-800 border-green-300";
    case "Medium":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "Low":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

/**
 * Get insight type color
 */
export function getInsightTypeColor(type) {
  const colors = {
    trend: "bg-blue-100 text-blue-800",
    anomaly: "bg-red-100 text-red-800",
    correlation: "bg-purple-100 text-purple-800",
    risk: "bg-orange-100 text-orange-800",
    opportunity: "bg-green-100 text-green-800",
    data_quality: "bg-yellow-100 text-yellow-800",
    forecast: "bg-indigo-100 text-indigo-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
}

/**
 * Get insight type icon/emoji
 */
export function getInsightTypeEmoji(type) {
  const emojis = {
    trend: "📈",
    anomaly: "⚠️",
    correlation: "🔗",
    risk: "🚨",
    opportunity: "⭐",
    data_quality: "✅",
    forecast: "🔮",
  };
  return emojis[type] || "💡";
}

/**
 * Format date to human-readable
 */
export function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // Less than a minute
    if (diff < 60000) {
      return "just now";
    }

    // Less than an hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} minute${mins > 1 ? "s" : ""} ago`;
    }

    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    // Default format
    return date.toLocaleDateString();
  } catch {
    return "Unknown";
  }
}

/**
 * Format ISO datetime to readable format
 */
export function formatDateTime(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return "Unknown";
  }
}

/**
 * Get severity color
 */
export function getSeverityColor(severity) {
  const colors = {
    critical: "bg-red-100 text-red-800 border-red-300",
    warning: "bg-amber-100 text-amber-800 border-amber-300",
    info: "bg-blue-100 text-blue-800 border-blue-300",
  };
  return colors[severity] || "bg-gray-100 text-gray-800 border-gray-300";
}

/**
 * Get alert type label
 */
export function getAlertTypeLabel(type) {
  const labels = {
    drift: "Statistical Drift",
    anomaly: "Anomaly Detected",
    threshold: "Threshold Exceeded",
    trend_reversal: "Trend Reversal",
    weekly_summary: "Weekly Summary",
  };
  return labels[type] || type;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 100) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Format large numbers with commas
 */
export function formatWithCommas(value) {
  if (typeof value !== "number") return String(value);
  return value.toLocaleString();
}

/**
 * Convert value to confidence-appropriate format
 */
export function formatWithConfidence(value, confidence) {
  const formatted = formatNumber(value);
  if (confidence < 0.6) {
    return `~${formatted}`;
  }
  return formatted;
}

/**
 * Get data quality label
 */
export function getQualityBadgeColor(label) {
  const colors = {
    High: "bg-green-100 text-green-800 border-green-300",
    Medium: "bg-amber-100 text-amber-800 border-amber-300",
    Low: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[label] || "bg-gray-100 text-gray-800 border-gray-300";
}
