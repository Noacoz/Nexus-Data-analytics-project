import React, { useState, useEffect, useRef } from 'react'
import { useDataset } from '../../hooks/useDataset'
import { makeChart } from '../../lib/shims'
import ConversationalAnalyst from '../ConversationalAnalyst'

export default function DatasetDetailView({ datasetId, datasets, onBack }) {
  const { dataset, insights, snapshot, reasoning, kpiSummary, lineage, auditLogs, auditLoading, auditError, auditFilters, setAuditFilters, auditLimit, setAuditLimit, hasMoreAuditLogs, loading, error, loadDataset, refreshAuditLogs, recompute } = useDataset()
  const [activeTab, setActiveTab] = useState('overview')
  const [recomputing, setRecomputing] = useState(false)
  const chartRef = useRef(null)
  const pieChartRef = useRef(null)

  useEffect(() => {
    loadDataset(datasetId)
  }, [datasetId, loadDataset])

  const handleRecompute = async () => {
    if (!recompute || recomputing) return
    setRecomputing(true)
    try {
      await recompute()
      setActiveTab('data-flow')
    } catch (err) {
      console.error('[Recompute] failed', err.message || err)
    } finally {
      setRecomputing(false)
    }
  }

  const current = dataset || datasets?.find(d => d.id === datasetId) || {
    name: 'Revenue Analytics 2024',
    row_count: 12450,
    file_format: 'CSV',
    status: 'processing',
  }

  const stats = [
    { label: 'Total Rows', value: current.row_count?.toLocaleString() || snapshot?.row_count?.toLocaleString() || '—', change: current.status || 'processing', trend: current.status === 'ready', icon: '📊' },
    { label: 'Columns', value: snapshot?.column_count || current.column_count || '—', change: 'Schema', trend: false, icon: '🔢' },
    { label: 'Quality Score', value: snapshot?.data_quality?.overall_score ? `${(snapshot.data_quality.overall_score * 100).toFixed(0)}%` : 'Pending', change: snapshot?.data_quality?.quality_label || 'Pending', trend: !!snapshot?.data_quality?.overall_score, icon: '✨' },
    { label: 'Insights', value: insights?.length ?? 0, change: 'Generated', trend: insights?.length > 0, icon: '💡' },
  ]

  useEffect(() => {
    if (activeTab === 'overview' && chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      const gradient = ctx.createLinearGradient(0, 0, 0, 300)
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)')
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)')

      makeChart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Signal',
            data: [65000, 72000, 81000, 89000, 93000, 98000, 105000, 112000, 118000, 125000, 135000, 142000],
            borderColor: '#8B5CF6',
            backgroundColor: gradient,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#8B5CF6',
            pointBorderColor: '#09090B',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(20, 20, 30, 0.95)',
              titleColor: '#FAFAFA',
              bodyColor: '#A1A1AA',
              borderColor: 'rgba(139, 92, 246, 0.3)',
              borderWidth: 1
            }
          },
          scales: {
            x: { 
              grid: { display: false, drawBorder: false },
              ticks: { color: '#A1A1AA' }
            },
            y: { 
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#A1A1AA', callback: (v) => '$' + (v / 1000) + 'k' }
            }
          }
        }
      })
    }

    if (activeTab === 'overview' && pieChartRef.current) {
      const ctx = pieChartRef.current.getContext('2d')
      makeChart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Product A', 'Product B', 'Product C', 'Services'],
          datasets: [{
            data: [45, 28, 18, 9],
            backgroundColor: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'],
            borderWidth: 0,
            borderRadius: 8,
            spacing: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { 
              position: 'bottom',
              labels: { color: '#A1A1AA', padding: 16, usePointStyle: true }
            }
          }
        }
      })
    }
  }, [activeTab])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'insights', label: 'Insights' },
    { id: 'data-flow', label: 'Data Flow' },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">
          {dataset?.name || 'Dataset'}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {dataset?.description || 'Analyze and understand your dataset'}
        </p>
      </div>

      <div className="flex gap-1 mb-6 p-1 glass rounded-2xl border border-white/5 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-900/30"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && !dataset ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <p className="text-zinc-400">Loading dataset analytics...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, i) => (
                  <div key={i} className="glass rounded-xl p-5 border border-white/5 hover:border-violet-500/30 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        stat.trend
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-1 tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Dataset signal overview</h3>
                  <div className="h-72">
                    <canvas ref={chartRef} className="w-full h-full" />
                  </div>
                </div>

                <div className="glass rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Key metrics</h3>
                  <div className="h-64">
                    <canvas ref={pieChartRef} className="w-full h-full" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-sm text-zinc-400">Status</p>
                    <p className="text-2xl font-bold text-white">{current.status || 'processing'}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'data' && (
            <div className="glass rounded-2xl border border-white/5 p-12 text-center">
              <p className="text-zinc-400">Data preview and sample rows will appear once the dataset is fully analyzed.</p>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Insights</h2>
              {insights.length === 0 ? (
                <div className="glass rounded-2xl border border-white/5 p-12 text-center">
                  <p className="text-zinc-400">No insights are available yet. Analysis may still be running.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {insights.map((insight) => (
                    <div key={insight.id} className="glass rounded-3xl border border-white/10 p-6 hover:border-violet-500/30 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{insight.type || 'Insight'}</span>
                        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">{Math.round((insight.confidence || 0) * 100)}%</span>
                      </div>
                      <h2 className="text-xl font-semibold text-white mb-3">{insight.title}</h2>
                      <p className="text-slate-400 mb-6">{insight.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

{activeTab === 'reasoning' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">AI Reasoning</h2>
              {!reasoning ? (
                <div className="glass rounded-2xl border border-white/5 p-12 text-center">
                  <p className="text-zinc-400">Reasoning is not available until analytics has finished processing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="glass rounded-3xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Primary Explanation</p>
                        <h3 className="text-2xl font-semibold text-white mt-2">{reasoning.primary_explanation.hypothesis}</h3>
                      </div>
                      <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">{Math.round((reasoning.confidence || 0) * 100)}%</span>
                    </div>
                    <p className="text-slate-400 mb-4">{reasoning.primary_explanation.supporting_evidence.type === 'correlation' ? 'This explanation is grounded in computed association metrics and avoids claiming causality.' : 'This explanation is grounded in computed statistics and highlights uncertainty clearly.'}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300 border border-white/10">
                        <p className="font-semibold text-slate-300">Evidence</p>
                        <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">{JSON.stringify(reasoning.primary_explanation.supporting_evidence, null, 2)}</pre>
                      </div>
                      <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300 border border-white/10">
                        <p className="font-semibold text-slate-300">Uncertainty</p>
                        <ul className="mt-2 list-disc list-inside text-xs text-slate-400">
                          {(reasoning.uncertainty_factors || []).map((factor, idx) => (
                            <li key={idx}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-3xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Alternative explanations</h3>
                    <div className="space-y-4">
                      {reasoning.alternative_explanations.map((alternative, index) => (
                        <div key={index} className="rounded-3xl bg-slate-900/80 p-5 border border-white/10">
                          <p className="text-sm text-slate-400">Rank {index + 2}</p>
                          <h4 className="text-lg font-semibold text-white mt-2">{alternative.hypothesis}</h4>
                          <p className="text-slate-400 mt-2">Confidence: {Math.round((alternative.score || 0) * 100)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass rounded-3xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recommended next steps</h3>
                    <ul className="list-disc list-inside text-sm text-slate-400 space-y-2">
                      {(reasoning.recommended_next_steps || []).map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'kpi-intelligence' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">KPI Intelligence</h2>
              {kpiSummary ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="glass rounded-3xl border border-white/10 p-6 hover:border-violet-500/30 transition-all">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xl">
                          📊
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Rows</p>
                          <p className="text-3xl font-bold text-white">{kpiSummary.kpis.total_rows.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-3xl border border-white/10 p-6 hover:border-violet-500/30 transition-all">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl">
                          ✨
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Quality Score</p>
                          <p className="text-3xl font-bold text-white">{(kpiSummary.kpis.data_quality_score * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-3xl border border-white/10 p-6 hover:border-violet-500/30 transition-all">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xl">
                          ⚠️
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Anomalies</p>
                          <p className="text-3xl font-bold text-white">{kpiSummary.kpis.anomaly_count}</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-3xl border border-white/10 p-6 hover:border-violet-500/30 transition-all">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl">
                          📈
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Trends</p>
                          <p className="text-3xl font-bold text-white">{kpiSummary.kpis.trend_summary === 'No significant trends detected' ? 0 : kpiSummary.kpis.trend_summary.match(/\d+/)?.[0] || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-3xl border border-white/10 p-8">
                    <h3 className="text-lg font-semibold text-white mb-6">Executive Summary</h3>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-lg leading-relaxed text-slate-300">{kpiSummary.narrative}</p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-zinc-400 uppercase tracking-wider font-medium mb-3">Key Trends</p>
                        <p className="text-slate-300">{kpiSummary.kpis.trend_summary}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400 uppercase tracking-wider font-medium mb-3">Strong Correlations</p>
                        <p className="text-slate-300">{kpiSummary.kpis.top_correlations}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass rounded-3xl border border-white/5 p-12 text-center">
                  <div className="text-4xl mb-4 opacity-20">📈</div>
                  <h3 className="text-xl font-semibold text-white mb-2">KPI Intelligence</h3>
                  <p className="text-zinc-400 max-w-md mx-auto">
                    {snapshot ? 'Computing KPIs from snapshot...' : 'No snapshot available yet. Upload and process a dataset to see KPI intelligence.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="glass rounded-2xl border border-white/5 p-12 text-center">
              <p className="text-zinc-400">Schema and metadata analysis will be surfaced here after processing.</p>
            </div>
          )}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Audit Logs</h2>
                  <p className="text-sm text-slate-400">Filtered audit trail for uploads, analytics, insights, recomputes, and validation events.</p>
                </div>
                <button
                  onClick={refreshAuditLogs}
                  className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-xl text-sm transition-all"
                >
                  Refresh
                </button>
              </div>
              
              <div className="grid gap-3 md:grid-cols-3">
                <div className="glass rounded-3xl border border-white/10 p-4">
                  <label className="block text-sm text-slate-400 mb-2">Action Type</label>
                  <select
                    value={auditFilters.action_type}
                    onChange={(event) => setAuditFilters({ ...auditFilters, action_type: event.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-violet-500 outline-none"
                  >
                    <option value="">All Actions</option>
                    <option value="UPLOAD">Upload</option>
                    <option value="ANALYSIS">Analysis</option>
                    <option value="INSIGHT_GEN">Insight Generation</option>
                    <option value="REASONING_GEN">Reasoning Generation</option>
                    <option value="RECOMPUTE">Recompute</option>
                  </select>
                </div>
                <div className="glass rounded-3xl border border-white/10 p-4">
                  <label className="block text-sm text-slate-400 mb-2">Status</label>
                  <select
                    value={auditFilters.status}
                    onChange={(event) => setAuditFilters({ ...auditFilters, status: event.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-violet-500 outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="processing">Processing</option>
                  </select>
                </div>
                <div className="glass rounded-3xl border border-white/10 p-4">
                  <label className="block text-sm text-slate-400 mb-2">Limit</label>
                  <select
                    value={auditLimit}
                    onChange={(event) => setAuditLimit(Number(event.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-violet-500 outline-none"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">Use higher limits to fetch more entries.</p>
                </div>
              </div>

              {auditLoading ? (
                <div className="glass rounded-3xl border border-white/10 p-16 text-center">
                  <p className="text-slate-400">Loading audit logs…</p>
                </div>
              ) : auditError ? (
                <div className="glass rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
                  <p className="text-rose-300 font-semibold">Unable to load audit logs</p>
                  <p className="text-slate-400 mt-2">{auditError}</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="glass rounded-3xl border border-white/10 p-12 text-center">
                  <div className="text-4xl mb-4 opacity-20">📋</div>
                  <p className="text-zinc-400 text-lg">No audit logs yet</p>
                  <p className="text-sm text-zinc-500 mt-2">Logs will appear here after dataset operations like uploads, analysis, or recomputes.</p>
                </div>
              ) : (
                <div className="glass rounded-3xl border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-900/50">
                          <th className="p-4 text-left text-sm font-semibold text-slate-300">Action</th>
                          <th className="p-4 text-left text-sm font-semibold text-slate-300">Status</th>
                          <th className="p-4 text-left text-sm font-semibold text-slate-300 hidden md:table-cell">Timestamp</th>
                          <th className="p-4 text-left text-sm font-semibold text-slate-300">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.slice(0, 20).map((log, index) => (
                          <tr key={log.id || index} className="border-b border-white/5 hover:bg-slate-800/50 transition-colors">
                            <td className="p-4">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r bg-slate-700 text-slate-300">
                                {log.action_type}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                log.status === 'failed' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-slate-400 hidden md:table-cell">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="p-4 max-w-md">
                              <div className="text-sm text-slate-300 truncate" title={log.message}>
                                {log.message}
                              </div>
                              {log.details && (
                                <details className="mt-2 p-2 bg-slate-900/50 rounded-xl text-xs">
                                  <summary className="cursor-pointer text-slate-400 hover:text-white mb-1">Details ({Object.keys(log.details).length} keys)</summary>
                                  <pre className="mt-2 text-slate-400 overflow-auto max-h-32">{JSON.stringify(log.details, null, 2)}</pre>
                                </details>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {hasMoreAuditLogs && (
                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/50">
                      Showing {auditLogs.length} logs.{' '}
                      <button
                        onClick={() => setAuditLimit(auditLimit + 20)}
                        className="text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ask-data' && (
            <div className="h-full">
              <ConversationalAnalyst datasetId={dataset?.id} />
            </div>
          )}
        </>
      )}

      {error && (
        <div className="fixed bottom-6 right-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 backdrop-blur-xl">
          {error}
        </div>
      )}
    </div>
  )
}
