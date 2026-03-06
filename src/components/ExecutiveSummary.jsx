/**
 * ExecutiveSummary Component
 * High-level summary view for decision makers
 */

import { useState, useEffect } from "react";
import { getExecutiveSummary } from "../lib/nexus-api";

export function ExecutiveSummary({ datasetId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!datasetId) return;

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getExecutiveSummary(datasetId);
        setSummary(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [datasetId]);

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Generating summary...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
        {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-8 text-gray-600">
        No summary available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
        <h2 className="text-3xl font-bold mb-2">{summary.headline}</h2>
      </div>

      {/* Summary Paragraph */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <p className="text-gray-700 leading-relaxed">{summary.summary}</p>
      </div>

      {/* Key Metrics */}
      {summary.key_metrics?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Key Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.key_metrics.map((metric, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </p>
                <p className="text-sm text-gray-700">{metric.interpretation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risks */}
        {summary.top_risks?.length > 0 && (
          <div className="bg-white border border-red-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-4">
              🚨 Top Risks
            </h3>
            <ul className="space-y-2">
              {summary.top_risks.map((risk, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 text-sm text-gray-700"
                >
                  <span className="text-red-600 font-bold">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunities */}
        {summary.top_opportunities?.length > 0 && (
          <div className="bg-white border border-green-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">
              ⭐ Top Opportunities
            </h3>
            <ul className="space-y-2">
              {summary.top_opportunities.map((opp, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommended Priorities */}
      {summary.recommended_priorities?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recommended Priorities
          </h3>
          <ol className="space-y-3">
            {summary.recommended_priorities.map((priority, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {idx + 1}
                </span>
                <span className="text-gray-700 pt-0.5">{priority}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Data Reliability Note */}
      {summary.data_reliability_note && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-1">
            Data Reliability Note
          </p>
          <p className="text-sm text-blue-800">{summary.data_reliability_note}</p>
        </div>
      )}

      {/* Next Review Suggestion */}
      {summary.next_review_suggestion && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm font-semibold text-purple-900 mb-1">
            Next Review Suggested
          </p>
          <p className="text-sm text-purple-800">{summary.next_review_suggestion}</p>
        </div>
      )}
    </div>
  );
}

export default ExecutiveSummary;
