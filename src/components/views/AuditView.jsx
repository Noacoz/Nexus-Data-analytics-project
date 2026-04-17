import React from 'react'
import ViewShell from '../ViewShell'

const audits = [
  { title: 'Insight traceability', description: 'Link insights to dataset versions and reasoning paths.', status: 'Ready' },
  { title: 'Model decision logs', description: 'Track model decisions and parameter versions for review.', status: 'Draft' },
  { title: 'Access review', description: 'Audit user access and workspace changes over time.', status: 'Pending' },
]

export default function AuditView() {
  return (
    <ViewShell
      title="Audit"
      subtitle="Review traceability, model decisions, and governance metadata across the analytics platform."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {audits.map((item, index) => (
          <div key={index} className="glass rounded-3xl border border-white/10 p-6 hover:border-cyan-500/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">Governance</p>
              <span className="text-xs text-slate-400">{item.status}</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">{item.title}</h2>
            <p className="text-slate-400">{item.description}</p>
          </div>
        ))}
      </div>
      <div className="glass rounded-3xl border border-white/10 p-6 mt-6 bg-gradient-to-br from-violet-600/5 to-cyan-600/5">
        <h3 className="text-lg font-semibold text-white mb-3">Audit readiness</h3>
        <p className="text-slate-400">This space is ready to connect to audit logs, lineage metadata, and model governance workflows when backend APIs are available.</p>
      </div>
    </ViewShell>
  )
}
