/**
 * StatisticalSnapshot Component
 * Displays data quality, column stats, correlations, and trends
 */

import { formatNumber, formatPercent, getQualityBadgeColor } from "../lib/formatting";

export function StatisticalSnapshot({ snapshot }) {
  if (!snapshot) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <p className="text-gray-600">No snapshot data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Quality Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Data Quality</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {(snapshot.data_quality.overall_score * 100).toFixed(0)}%
              </p>
              <p
                className={`text-sm font-semibold mt-1 px-2 py-1 rounded inline-block ${getQualityBadgeColor(
                  snapshot.data_quality.quality_label
                )}`}
              >
                {snapshot.data_quality.quality_label}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Confidence Base</p>
          <p className="text-3xl font-bold text-gray-900">
            {(snapshot.confidence_base * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-600 mt-2">System ceiling for insights</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Dataset Size</p>
          <p className="text-3xl font-bold text-gray-900">
            {snapshot.row_count.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-2">rows</p>
        </div>
      </div>

      {/* Column Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Column Statistics
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                  Column
                </th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                  Type
                </th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                  Completeness
                </th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                  Unique
                </th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                  Mean/Mode
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(snapshot.column_stats || {}).map(([name, stats]) => (
                <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900">{name}</td>
                  <td className="py-3 px-3 text-gray-700">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {stats.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-700">
                    {formatPercent(stats.completeness)}
                  </td>
                  <td className="py-3 px-3 text-gray-700">{stats.unique_count}</td>
                  <td className="py-3 px-3 text-gray-700">
                    {stats.type === "numeric"
                      ? formatNumber(stats.mean)
                      : stats.mode}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strong Correlations */}
      {snapshot.correlations?.strong_correlations?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Strong Correlations
          </h3>
          <div className="space-y-3">
            {snapshot.correlations.strong_correlations.map((corr, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">
                    {corr.columns[0]} ↔ {corr.columns[1]}
                  </p>
                  <p className="text-xs text-gray-600">
                    {corr.direction} correlation • p-value: {corr.p_value.toFixed(4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    r = {corr.r.toFixed(3)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends */}
      {Object.keys(snapshot.trends || {}).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trends</h3>
          <div className="space-y-2">
            {Object.entries(snapshot.trends).map(([col, trend]) => (
              <div key={col} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{col}</p>
                  <p className="text-xs text-gray-600">
                    {trend.direction} • Strength: {trend.strength} (R²: {trend.r_squared.toFixed(3)})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {trend.pct_change >= 0 ? "+" : ""}{trend.pct_change.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticalSnapshot;
