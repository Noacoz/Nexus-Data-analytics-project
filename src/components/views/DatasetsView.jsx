import React from 'react'
import ViewShell from '../ViewShell'

export default function DatasetsView({ datasets = [], onViewDataset, onUpload }) {
  return (
    <ViewShell
      title="Datasets"
      subtitle="Manage your data assets, see dataset health, and jump into exploration quickly."
      actions={(
        <button
          onClick={onUpload}
          className="px-5 py-3 text-sm font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-2xl shadow-lg shadow-violet-900/30 hover:from-violet-700 hover:to-cyan-700 transition-all"
        >
          Upload dataset
        </button>
      )}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Active datasets</p>
                <h2 className="text-2xl font-semibold text-white">{datasets.length}</h2>
              </div>
              <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300 border border-white/10">
                Latest dataset analytics ready
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl border border-white/10 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recent datasets</h3>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Updated</span>
            </div>
            <div className="space-y-4">
              {datasets.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                  No datasets yet. Upload a dataset to begin exploring your data.
                </div>
              ) : (
                datasets.slice(0, 6).map(dataset => (
                  <button
                    key={dataset.id}
                    onClick={() => onViewDataset(dataset.id)}
                    className="w-full text-left rounded-3xl border border-white/10 bg-slate-900/70 p-4 transition-all hover:border-violet-500/30 hover:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{dataset.name}</p>
                        <p className="text-sm text-slate-400">{dataset.row_count?.toLocaleString() || dataset.rows?.toLocaleString() || 0} rows • {dataset.format || 'CSV'}</p>
                      </div>
                      <span className="text-sm text-slate-400">{dataset.insights || 0} insights</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-400">
                      <span className={`${dataset.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {dataset.status === 'completed' ? 'Lineage available' : 'Pending lineage'}
                      </span>
                      <span>{dataset.status === 'completed' ? 'Open to verify' : 'Processing'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Dataset readiness</h3>
            <div className="grid grid-cols-1 gap-4">
              {['Profile completeness', 'Quality score', 'Last refresh'].map((metric, index) => (
                <div key={index} className="rounded-3xl bg-slate-900/80 border border-white/10 p-4">
                  <p className="text-sm text-slate-500">{metric}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{metric === 'Last refresh' ? '1 hour ago' : `${80 + index * 5}%`}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl border border-white/10 p-6 bg-gradient-to-br from-violet-600/5 to-cyan-600/5">
            <h3 className="text-lg font-semibold text-white mb-3">Ready for exploration</h3>
            <p className="text-sm text-slate-400">Navigate to Data Explorer to validate schema and filter datasets before modeling.</p>
          </div>
        </div>
      </div>
    </ViewShell>
  )
}
