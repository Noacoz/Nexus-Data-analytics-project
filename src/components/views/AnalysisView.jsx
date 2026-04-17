import React from 'react'
import ViewShell from '../ViewShell'

const cards = [
  { title: 'Regression models', description: 'Evaluate trends across numerical variables and predict outcomes.', metric: 'R² 0.84' },
  { title: 'Correlation matrix', description: 'Identify relationships between features and surface leading drivers.', metric: '8 strong signals' },
  { title: 'Forecasting pipeline', description: 'Project future performance using historical series data.', metric: '12 month horizon' },
]

export default function AnalysisView() {
  return (
    <ViewShell
      title="Analysis / Models"
      subtitle="View regression, correlation, and forecasting placeholders ready for model development."
    >
      <div className="grid gap-6 xl:grid-cols-3">
        {cards.map((item, index) => (
          <div key={index} className="glass rounded-3xl border border-white/10 p-6 hover:border-violet-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Section</p>
              <span className="text-xs text-slate-400">Placeholder</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">{item.title}</h2>
            <p className="text-slate-400 mb-6">{item.description}</p>
            <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300 border border-white/10">
              {item.metric}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Model readiness</h3>
          <p className="text-slate-400">Once data is curated, these sections will connect to analytics workloads for scoring and feature extraction.</p>
          <div className="mt-6 grid gap-4">
            {['Feature importance', 'Training notes', 'Validation score'].map((item, idx) => (
              <div key={idx} className="rounded-3xl bg-slate-900/80 p-4 border border-white/10">
                <p className="text-sm text-slate-400">{item}</p>
                <p className="mt-2 text-white font-semibold">Coming soon</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Recent model activity</h3>
          <div className="space-y-4">
            {['Regression analysis scheduled', 'Correlation scan completed', 'Forecast draft ready'].map((note, idx) => (
              <div key={idx} className="rounded-3xl bg-slate-900/80 p-4 border border-white/10">
                <p className="text-sm text-slate-400">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ViewShell>
  )
}
