/**
 * InsightCard Component
 * Displays a single insight with full details
 */

import { useState } from "react";
import ConfidenceBadge from "./ConfidenceBadge";
import {
  getInsightTypeColor,
  getInsightTypeEmoji,
  truncate,
} from "../lib/formatting";

export function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {getInsightTypeEmoji(insight.insight_type)}
            </span>
            <span
              className={`inline-block px-2 py-1 rounded text-sm font-semibold ${getInsightTypeColor(
                insight.insight_type
              )}`}
            >
              {insight.insight_type.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {insight.title}
          </h3>
        </div>
        <ConfidenceBadge
          score={insight.confidence}
          label={insight.confidence_label}
        />
      </div>

      {/* Explanation */}
      <p className="text-gray-700 mb-4 leading-relaxed">
        {insight.explanation}
      </p>

      {/* Main Evidence */}
      {insight.evidence && (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">Evidence</p>
          <p className="text-sm text-gray-700">
            {insight.evidence.statistical_basis ||
              "Statistical analysis shows this pattern in the data."}
          </p>
        </div>
      )}

      {/* Expandable Section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-semibold text-blue-600 hover:text-blue-800 mb-4"
      >
        {expanded ? "▼ Hide" : "▶ Show"} Details
      </button>

      {expanded && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Hypotheses */}
          {insight.hypotheses && insight.hypotheses.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-2">Hypotheses</p>
              <div className="space-y-2">
                {insight.hypotheses.map((h, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">
                      {h.hypothesis}
                    </p>
                    <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{
                          width: `${(h.probability_weight || 0) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {((h.probability_weight || 0) * 100).toFixed(0)}% likely
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assumptions */}
          {insight.assumptions && insight.assumptions.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-2">
                Assumptions
              </p>
              <ul className="list-disc list-inside space-y-1">
                {insight.assumptions.map((a, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Limitations */}
          {insight.limitations && insight.limitations.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-2">Limitations</p>
              <ul className="list-disc list-inside space-y-1">
                {insight.limitations.map((l, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          {insight.recommended_actions &&
            insight.recommended_actions.length > 0 && (
              <div>
                <p className="font-semibold text-gray-700 mb-2">
                  Recommended Actions
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  {insight.recommended_actions.map((action, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      {action}
                    </li>
                  ))}
                </ol>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default InsightCard;
