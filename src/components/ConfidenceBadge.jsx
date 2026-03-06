/**
 * ConfidenceBadge Component
 * Reusable confidence indicator with color coding
 */

import { getConfidenceColor } from "../lib/formatting";

export function ConfidenceBadge({ score, label }) {
  if (!label) {
    return null;
  }

  const colorClass = getConfidenceColor(label);
  const percentage = (score * 100).toFixed(0);

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${colorClass}`}>
      <span className="text-sm font-semibold">{label}</span>
      <span className="ml-2 text-xs opacity-75">{percentage}%</span>
    </div>
  );
}

export default ConfidenceBadge;
