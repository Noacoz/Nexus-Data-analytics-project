import React, { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { TiltCard, SpotlightCard } from '../Shared'
import API from '../../lib/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler)

function Sparkline({ color }) {
  const data = [40, 55, 48, 62, 58, 71, 65, 82, 90]
  return (
    <div style={{ height: 40, marginTop: 8 }}>
      <Line
        data={{
          labels: data.map((_, i) => i),
          datasets: [{ data, borderColor: color, backgroundColor: `${color}22`, fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }],
        }}
        options={{
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 600 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
        }}
      />
    </div>
  )
}

export default function DashboardView({ datasets, onViewDataset, onUpload, showTrialBanner, onDismissTrial, setCurrentView, pushToast }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [reportsData, setReportsData] = useState([])
  const [liveStats, setLiveStats] = useState({ rows: 0, insights: 0, reports: 0 })

  const unreadCount = (notifications || []).filter(n => !n.read).length

  const filteredDatasets = datasets.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close notifications when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-notifications-container]')) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showNotifications])

  useEffect(() => {
    // Load real notifications and reports
    API.getNotifications().then(({ notifications: n }) => { if (n) setNotifications(n); }).catch(() => {})
    API.getReports().then(({ reports: r }) => { if (r) setReportsData(r); }).catch(() => {})
  }, [])

  useEffect(() => {
    const totalRows = datasets.reduce((sum, d) => sum + (parseInt(d.row_count || d.rows) || 0), 0)
    const totalInsights = datasets.reduce((sum, d) => sum + (parseInt(d.insights) || 0), 0)
    setLiveStats({ rows: totalRows, insights: totalInsights, reports: reportsData.length })
  }, [datasets, reportsData])

  const handleMarkAllRead = async () => {
    await API.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (pushToast) pushToast('All notifications marked read', 'info')
  }

  return (
    <div className="min-h-screen pt-16 bg-slate-950">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 max-w-7xl mx-auto">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <nav className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-2">
              <button onClick={() => setCurrentView('dashboard')} className="w-full text-left px-4 py-2 rounded text-indigo-400 bg-indigo-600/20 font-medium">
                📊 Dashboard
              </button>
<button onClick={() => setCurrentView('dashboard')} className="w-full text-left px-4 py-2 rounded text-slate-400 hover:bg-slate-800 transition-colors">
                📁 Datasets
              </button>

              <button onClick={() => setCurrentView('reports')} className="w-full text-left px-4 py-2 rounded text-slate-400 hover:bg-slate-800 transition-colors">
                📈 Reports
              </button>
              <button onClick={() => setCurrentView('team')} className="w-full text-left px-4 py-2 rounded text-slate-400 hover:bg-slate-800 transition-colors">
                👥 Team
              </button>
              <button onClick={() => setCurrentView('settings')} className="w-full text-left px-4 py-2 rounded text-slate-400 hover:bg-slate-800 transition-colors">
                ⚙️ Settings
              </button>
            </nav>

            <div className="bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 border border-indigo-600/30 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Need support?</p>
              <p className="text-xs text-slate-400 mb-3">Check out our docs or contact support.</p>
              <button onClick={() => setCurrentView('support')} className="w-full px-3 py-2 bg-indigo-600/30 text-indigo-300 text-sm font-medium rounded hover:bg-indigo-600/40 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-slate-400">Manage and analyze your datasets</p>
            </div>
            <div className="flex gap-3">
              <div data-notifications-container className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 glass rounded-2xl border border-slate-700 shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <button onClick={handleMarkAllRead} className="text-xs text-cyan-400 hover:text-cyan-300">Mark all read</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(n => (
<div key={n.id} className={`p-4 border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors ${n.unread ? 'bg-slate-800/50' : ''}`} onClick={() => setCurrentView('dashboard')}>
                          <div className="flex items-start gap-3">

                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.unread ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-200">{n.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                              <p className="text-xs text-slate-600 mt-1">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-slate-700">
                      <button className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 flex items-center justify-center font-bold">
                A
              </div>
            </div>
          </div>

          {/* Trial Banner */}
          {showTrialBanner && (
            <div className="bg-gradient-to-r from-amber-600/20 to-amber-600/10 border border-amber-600/30 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-amber-300">Free trial active</p>
                <p className="text-sm text-amber-200/70">You have 14 days remaining</p>
              </div>
              <button
                onClick={onDismissTrial}
                className="text-slate-400 hover:text-slate-300"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search datasets..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Datasets', value: datasets.length, icon: '🗄️', color: '#6366f1' },
              { label: 'Total Rows Analysed', value: liveStats.rows.toLocaleString() || '0', icon: '📊', color: '#06b6d4' },
              { label: 'Insights Generated', value: liveStats.insights.toString() || '0', icon: '💡', color: '#10b981' },
              { label: 'Reports Created', value: liveStats.reports.toString() || '0', icon: '📄', color: '#f59e0b' },
            ].map((stat, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <Sparkline color={stat.color} />
              </div>
            ))}
          </div>

          {/* Dataset Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Card */}
            <div
              onClick={onUpload}
              className="p-8 border-2 border-dashed border-slate-700 rounded-lg hover:border-indigo-600/50 hover:bg-slate-900/50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-64"
            >
              <div className="text-4xl mb-4">📤</div>
              <p className="font-semibold mb-2">Upload Dataset</p>
              <p className="text-sm text-slate-400">CSV, JSON, Parquet, or Excel</p>
            </div>

            {/* Dataset Cards */}
            {filteredDatasets.map((dataset) => (
              <SpotlightCard
                key={dataset.id}
                onClick={() => onViewDataset(dataset.id)}
                className="p-6 cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold group-hover:text-indigo-400 transition-colors">
                      {dataset.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{dataset.description}</p>
                  </div>
                  <div className="text-2xl">📊</div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-slate-800">
                  <div>
                    <p className="text-2xl font-bold text-indigo-400">{dataset.rows}</p>
                    <p className="text-xs text-slate-400">Rows</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{dataset.format}</p>
                    <p className="text-xs text-slate-400">Format</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">{dataset.insights}</p>
                    <p className="text-xs text-slate-400">Insights</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4">Added {dataset.createdAt}</p>
              </SpotlightCard>
            ))}
          </div>

          {filteredDatasets.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-slate-400">No datasets found matching "{searchTerm}"</p>
            </div>
          )}

          {/* Recently Viewed */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4 text-slate-300">Recently Viewed</h3>
            <div className="space-y-3">
              {(() => {
                const recentItems = [
                  ...datasets.slice(0, 2).map(d => ({ name: d.name, type: 'Dataset', time: d.created_at ? new Date(d.created_at).toLocaleString() : 'Recently', icon: '🗄️' })),
                  ...reportsData.slice(0, 2).map(r => ({ name: r.title || r.name, type: 'Report', time: r.created_at ? new Date(r.created_at).toLocaleString() : 'Recently', icon: '📄' })),
                ].slice(0, 4);
                return recentItems.length > 0 ? recentItems : [
                  { name: 'Sales Data Q1 2024', type: 'Dataset', time: '2 minutes ago', icon: '🗄️' },
                  { name: 'Q1 Revenue Analysis', type: 'Report', time: '1 hour ago', icon: '📄' },
                  { name: 'Customer Feedback', type: 'Dataset', time: '3 hours ago', icon: '🗄️' },
                ];
              })().map((item, i) => (
                <div key={i} className="glass rounded-xl p-4 flex items-center gap-4 hover:border-slate-600 cursor-pointer transition-all hover:scale-[1.01]">
                  <div className="w-10 h-10 rounded-lg brand-gradient flex items-center justify-center text-lg flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.type} · {item.time}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Onboarding Progress Card */}
          {datasets.length < 3 && (
            <div className="mt-8 glass rounded-2xl p-6" style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Get started with Nexus</h3>
                <span className="text-sm text-cyan-400">1 of 3 complete</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-6">
                <div className="brand-gradient h-2 rounded-full" style={{ width: '33%' }} />
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Create your account', done: true },
                  { label: 'Upload your first dataset', done: datasets.length > 0 },
                  { label: 'Generate your first AI insight', done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-slate-700'}`}>
                      {step.done && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-sm ${step.done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={onUpload}
                className="mt-4 px-4 py-2 brand-gradient text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
              >
                Upload your first dataset →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
