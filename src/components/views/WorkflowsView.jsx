import React from 'react'
import ViewShell from '../ViewShell'

export default function WorkflowsView() {
  const pipelines = [
    { name: 'Ingestion pipeline', status: 'Active' },
    { name: 'Validation workflow', status: 'Paused' },
    { name: 'Report generation', status: 'Scheduled' },
  ]

  return (
    <ViewShell
      title="Workflows"
      subtitle="Manage scheduled jobs and analytics pipelines in one place."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Scheduled jobs</h3>
          <div className="space-y-3">
            {['Daily import', 'Weekly validation', 'Monthly summary'].map((job, index) => (
              <div key={index} className="rounded-3xl bg-slate-900/80 border border-white/10 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{job}</p>
                  <p className="text-sm text-slate-500">Scheduled for next run</p>
                </div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 border border-cyan-500/20">Ready</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pipeline overview</h3>
          <div className="space-y-4">
            {pipelines.map((pipeline, index) => (
              <div key={index} className="rounded-3xl bg-slate-900/80 border border-white/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-white">{pipeline.name}</p>
                  <span className="text-sm text-slate-400">{pipeline.status}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Ready for automation and integration with analytics triggers.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ViewShell>
  )
}
