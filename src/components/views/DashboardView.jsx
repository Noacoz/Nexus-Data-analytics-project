import React, { useState } from 'react'

export default function DashboardView({ 
  datasets = [], 
  isLoading = false, 
  onViewDataset, 
  onUpload, 
  showTrialBanner = true, 
  onDismissTrial, 
  setCurrentView, 
  pushToast, 
  currentUser 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredDatasets = datasets.filter(ds => {
    const matchesSearch = ds.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const stats = [
    { label: 'Total Datasets', value: datasets.length, icon: '📊', trend: '+2', trendUp: true, gradient: 'from-violet-600 to-indigo-600' },
    { label: 'Total Rows Analyzed', value: datasets.reduce((acc, d) => acc + (d.rows || 0), 0).toLocaleString(), icon: '🔢', trend: '+12.4K', trendUp: true, gradient: 'from-cyan-600 to-blue-600' },
    { label: 'Insights Generated', value: datasets.reduce((acc, d) => acc + (d.insights || 0), 0), icon: '💡', trend: '+8', trendUp: true, gradient: 'from-emerald-600 to-teal-600' },
    { label: 'Reports Created', value: 6, icon: '📋', trend: '+2', trendUp: true, gradient: 'from-amber-600 to-orange-600' },
  ]

  const quickActions = [
    { label: 'Upload Dataset', icon: '📤', action: onUpload, gradient: 'from-violet-600 to-cyan-600' },
    { label: 'New Report', icon: '📝', action: () => setCurrentView('reports'), gradient: 'from-emerald-600 to-teal-600' },
    { label: 'Team Settings', icon: '👥', action: () => setCurrentView('team'), gradient: 'from-blue-600 to-indigo-600' },
  ]

  return (
    <div className="min-h-screen bg-[#09090B] p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Welcome back, {currentUser?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-zinc-400 mt-1">Your analytics dashboard is ready</p>
      </div>

      {/* Trial Banner */}
      {showTrialBanner && (
        <div className="mb-6 p-4 bg-gradient-to-r from-violet-600/10 via-cyan-600/10 to-violet-600/10 border border-violet-500/30 rounded-2xl backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white text-xl">
              ⚡
            </div>
            <div>
              <p className="font-semibold text-white">Free trial active</p>
              <p className="text-sm text-zinc-400">You have 14 days remaining. Upgrade to unlock all features.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('pricing')}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl hover:from-violet-700 hover:to-cyan-700 transition-all shadow-md shadow-violet-900/30"
            >
              Upgrade Now
            </button>
            <button 
              onClick={onDismissTrial}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={action.action}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.gradient} p-[1px] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
          >
            <div className="relative h-full w-full rounded-2xl bg-[#09090B]/90 backdrop-blur-sm p-5 transition-all duration-300 group-hover:bg-transparent">
              <span className="text-2xl mb-3 block">{action.icon}</span>
              <p className="font-semibold text-white group-hover:text-white/90">{action.label}</p>
              <p className="text-xs text-zinc-500 group-hover:text-white/60 mt-1">Click to continue</p>
            </div>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="glass rounded-xl p-5 border border-white/5 hover:border-violet-500/30 transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {stat.trend}
              </span>
            </div>
            <p className="text-3xl font-bold text-white mt-3 tracking-tight group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-cyan-400 group-hover:bg-clip-text group-hover:text-transparent transition-all">
              {stat.value}
            </p>
            <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datasets Section */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Datasets</h2>
              <button 
                onClick={onUpload}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl hover:from-violet-700 hover:to-cyan-700 transition-all shadow-md shadow-violet-900/30"
              >
                + Upload Dataset
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-11 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 bg-white/[0.02] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredDatasets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 flex items-center justify-center text-3xl">
                  📂
                </div>
                <p className="text-zinc-400 mb-2">No datasets yet</p>
                <p className="text-sm text-zinc-500 mb-4">Upload your first dataset to get started</p>
                <button 
                  onClick={onUpload}
                  className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl hover:from-violet-700 hover:to-cyan-700 transition-all"
                >
                  Upload Dataset
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDatasets.slice(0, 5).map(dataset => (
                  <div 
                    key={dataset.id}
                    onClick={() => onViewDataset(dataset.id)}
                    className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 flex items-center justify-center text-lg">
                        {dataset.format === 'CSV' ? '📄' : '📊'}
                      </div>
                      <div>
                        <p className="font-medium text-white group-hover:text-violet-400 transition-colors">
                          {dataset.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {dataset.rows?.toLocaleString() || 0} rows • {dataset.format || 'CSV'} • {dataset.createdAt ? new Date(dataset.createdAt).toLocaleDateString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">{dataset.insights || 0} insights</span>
                      <span className="text-zinc-400 group-hover:text-violet-400 group-hover:translate-x-1 transition-all">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Support Card */}
        <div className="space-y-4">
          <div className="glass rounded-2xl border border-white/5 p-6 bg-gradient-to-br from-violet-600/5 to-cyan-600/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white text-xl mb-4">
              🆘
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Need support?</h3>
            <p className="text-sm text-zinc-400 mb-4">Check out our documentation or contact our support team for assistance.</p>
            <button 
              onClick={() => setCurrentView('support')}
              className="w-full py-2.5 text-sm font-medium bg-white/[0.05] border border-white/10 rounded-xl text-white hover:bg-white/[0.08] hover:border-violet-500/30 transition-all"
            >
              Contact Support
            </button>
          </div>

          <div className="glass rounded-2xl border border-white/5 p-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button onClick={() => setCurrentView('dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all">
                <span className="text-lg">📊</span>
                <span className="text-sm font-medium">Datasets</span>
                <span className="ml-auto text-zinc-500">→</span>
              </button>
              <button onClick={() => setCurrentView('reports')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all">
                <span className="text-lg">📋</span>
                <span className="text-sm font-medium">Reports</span>
                <span className="ml-auto text-zinc-500">→</span>
              </button>
              <button onClick={() => setCurrentView('team')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all">
                <span className="text-lg">👥</span>
                <span className="text-sm font-medium">Team</span>
                <span className="ml-auto text-zinc-500">→</span>
              </button>
              <button onClick={() => setCurrentView('settings')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all">
                <span className="text-lg">⚙️</span>
                <span className="text-sm font-medium">Settings</span>
                <span className="ml-auto text-zinc-500">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
