import React from 'react'
import ViewShell from '../ViewShell'

const alerts = [
  { title: 'Data drift detected', status: 'High', time: '5m ago' },
  { title: 'API latency spike', status: 'Medium', time: '18m ago' },
  { title: 'Pipeline delay', status: 'Low', time: '42m ago' },
]

export default function MonitoringView() {
  return (
    <ViewShell
      title="Monitoring"
      subtitle="Track alerts, anomaly detection, and KPI performance across your analytics stack."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Live alerts</p>
              <h2 className="text-2xl font-semibold text-white">Operational health</h2>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 border border-emerald-500/20">Stable</span>
          </div>
          <div className="space-y-4">
            {alerts.map((alert, idx) => (
              <div key={idx} className="rounded-3xl bg-slate-900/80 border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-semibold text-white">{alert.title}</p>
                  <span className={`text-xs font-semibold ${alert.status === 'High' ? 'text-rose-400' : alert.status === 'Medium' ? 'text-amber-300' : 'text-emerald-300'}`}>{alert.status}</span>
                </div>
                <p className="text-sm text-slate-400">{alert.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">KPI tracking</h3>
            <div className="grid gap-4">
              {['Availability', 'Throughput', 'Error rate'].map((metric, idx) => (
                <div key={idx} className="rounded-3xl bg-slate-900/80 p-4 border border-white/10">
                  <p className="text-sm text-slate-400">{metric}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{metric === 'Error rate' ? '0.8%' : '99.9%'}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-3xl border border-white/10 p-6 bg-gradient-to-br from-violet-600/5 to-cyan-600/5">
            <h3 className="text-lg font-semibold text-white mb-3">Anomaly detection</h3>
            <p className="text-slate-400">Future analytics integrations can surface anomalies and trigger automation when thresholds cross.</p>
          </div>
        </div>
      </div>
    </ViewShell>
  )
}
