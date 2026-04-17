import { formatNumber, formatPercent } from "../lib/formatting";

export function StatisticalSnapshot({ snapshot }) {
  if (!snapshot) {
    return (
      <div className="glass rounded-2xl p-12 text-center border border-white/5">
        <p className="text-zinc-400">No snapshot data available</p>
      </div>
    );
  }

  const qualityScore = (snapshot.data_quality?.overall_score * 100).toFixed(0);
  const qualityLabel = snapshot.data_quality?.quality_label || "Unknown";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6 border border-white/5">
          <p className="text-sm text-zinc-500 mb-2">Data Quality</p>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-white tracking-tight">{qualityScore}%</p>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              qualityLabel === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
              qualityLabel === 'Good' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
              'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {qualityLabel}
            </span>
          </div>
          <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-cyan-600 rounded-full transition-all"
              style={{ width: `${qualityScore}%` }}
            />
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/5">
          <p className="text-sm text-zinc-500 mb-2">Confidence Ceiling</p>
          <p className="text-4xl font-bold text-white tracking-tight">
            {(snapshot.confidence_base * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-zinc-500 mt-3">Maximum insight confidence</p>
        </div>

        <div className="glass rounded-xl p-6 border border-white/5">
          <p className="text-sm text-zinc-500 mb-2">Dataset Size</p>
          <p className="text-4xl font-bold text-white tracking-tight">
            {snapshot.row_count?.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mt-3">total rows</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">Column Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left py-4 px-6 font-medium text-zinc-400">Column</th>
                <th className="text-left py-4 px-6 font-medium text-zinc-400">Type</th>
                <th className="text-left py-4 px-6 font-medium text-zinc-400">Completeness</th>
                <th className="text-left py-4 px-6 font-medium text-zinc-400">Unique</th>
                <th className="text-left py-4 px-6 font-medium text-zinc-400">Mean / Mode</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(snapshot.column_stats || {}).map(([name, stats]) => (
                <tr key={name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6 font-medium text-white">{name}</td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-violet-500/10 text-violet-300 rounded-full text-xs font-medium border border-violet-500/20">
                      {stats.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-300">{formatPercent(stats.completeness)}</span>
                      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-600 to-cyan-600 rounded-full"
                          style={{ width: `${stats.completeness * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-zinc-300">{stats.unique_count}</td>
                  <td className="py-4 px-6 text-zinc-300">
                    {stats.type === "numeric" ? formatNumber(stats.mean) : stats.mode}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {snapshot.correlations?.strong_correlations?.length > 0 && (
        <div className="glass rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Strong Correlations</h3>
          <div className="space-y-3">
            {snapshot.correlations.strong_correlations.map((corr, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-white">
                    {corr.columns[0]} ↔ {corr.columns[1]}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {corr.direction} correlation • p-value: {corr.p_value.toFixed(4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    r = {corr.r.toFixed(3)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(snapshot.trends || {}).length > 0 && (
        <div className="glass rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Trend Analysis</h3>
          <div className="space-y-2">
            {Object.entries(snapshot.trends).map(([col, trend]) => (
              <div key={col} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-white">{col}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {trend.direction} • Strength: {trend.strength} (R²: {trend.r_squared.toFixed(3)})
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${trend.pct_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
