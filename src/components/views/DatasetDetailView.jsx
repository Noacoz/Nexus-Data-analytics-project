import React, { useState, useEffect, useRef } from 'react'
import { useDataset } from '../../hooks/useDataset'
import { makeChart } from '../../lib/shims'

export default function DatasetDetailView({ datasetId, datasets, onBack }) {
  const { dataset, insights, snapshot, loading, error, loadDataset } = useDataset()
  const [activeTab, setActiveTab] = useState('overview')
  const chartRef = useRef(null)
  const pieChartRef = useRef(null)

  useEffect(() => {
    loadDataset(datasetId)
  }, [datasetId, loadDataset])

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
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'data', label: 'Data Preview', icon: '🔢' },
    { id: 'insights', label: 'Insights', icon: '💡' },
    { id: 'schema', label: 'Schema', icon: '📐' },
  ]

  return (
    <div className="min-h-screen bg-[#09090B] p-6">
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="text-zinc-400 hover:text-white transition-colors mb-3 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white text-2xl">
            📊
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{current.name}</h1>
            <p className="text-zinc-400">
              {current.row_count?.toLocaleString() || snapshot?.row_count?.toLocaleString() || '—'} rows • {current.file_format || 'CSV'} • {current.status || 'processing'}
            </p>
          </div>
        </div>
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
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{insight.insight_type || 'Insight'}</span>
                        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">{Math.round((insight.confidence || 0) * 100)}%</span>
                      </div>
                      <h2 className="text-xl font-semibold text-white mb-3">{insight.title}</h2>
                      <p className="text-slate-400 mb-6">{insight.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="glass rounded-2xl border border-white/5 p-12 text-center">
              <p className="text-zinc-400">Schema and metadata analysis will be surfaced here after processing.</p>
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
