import React from 'react'
import ViewShell from '../ViewShell'

const logs = [
  { time: '09:42:18', event: 'Login success', source: 'Web UI' },
  { time: '09:38:03', event: 'Dataset uploaded', source: 'Import service' },
  { time: '09:35:47', event: 'Report generated', source: 'Reports engine' },
  { time: '09:12:10', event: 'API heartbeat', source: 'Monitoring service' },
]

export default function SystemLogsView() {
  return (
    <ViewShell
      title="System Logs"
      subtitle="Browse your log stream and audit events in a clean, searchable viewer."
    >
      <div className="glass rounded-3xl border border-white/10 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Activity log</p>
            <h2 className="text-2xl font-semibold text-white">Recent system events</h2>
          </div>
          <button className="rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition-all">Refresh</button>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <div className="grid grid-cols-[1.2fr_2.6fr_1fr] gap-0 bg-slate-900/90 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-500">
            <span>Timestamp</span>
            <span>Event</span>
            <span>Source</span>
          </div>
          <div className="divide-y divide-white/10 bg-slate-950/90">
            {logs.map((log, index) => (
              <div key={index} className="grid grid-cols-[1.2fr_2.6fr_1fr] gap-0 px-4 py-4 text-sm text-slate-300">
                <span className="text-slate-400">{log.time}</span>
                <span>{log.event}</span>
                <span className="text-slate-400">{log.source}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ViewShell>
  )
}
