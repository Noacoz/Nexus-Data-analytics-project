import React, { useState } from 'react'
import { pushToast } from '../lib/shims'

export default function Reports({ setCurrentView }){
  const [reports, setReports] = useState([
    { id: 1, title: 'Q1 Sales Performance', type: 'Sales', updated: '2 days ago', status: 'Published', views: 1245, icon: '💰' },
    { id: 2, title: 'Customer Segmentation', type: 'Marketing', updated: '1 week ago', status: 'Draft', views: 342, icon: '👥' },
    { id: 3, title: 'Revenue Forecast 2024', type: 'Finance', updated: '3 days ago', status: 'Published', views: 892, icon: '📈' },
    { id: 4, title: 'Website Analytics', type: 'Product', updated: '5 days ago', status: 'Published', views: 2156, icon: '🌐' },
    { id: 5, title: 'Churn Analysis', type: 'Analytics', updated: '1 day ago', status: 'Draft', views: 178, icon: '📉' },
    { id: 6, title: 'Marketing ROI', type: 'Marketing', updated: '4 days ago', status: 'Published', views: 567, icon: '🎯' }
  ])
  const [creatingReport, setCreatingReport] = useState(false)
  const [filter, setFilter] = useState('all')

  const handleCreateReport = () => {
    setCreatingReport(true)
    setTimeout(()=>{
      const newReport = { 
        id: Date.now(), 
        title: `New Report ${reports.length + 1}`, 
        type: 'Custom', 
        updated: 'Just now', 
        status: 'Draft', 
        views: 0,
        icon: '📄'
      }
      setReports(prev=>[newReport, ...prev])
      setCreatingReport(false)
      pushToast('New report created successfully','success')
    }, 1200)
  }

  const handleExportReport = (reportId, format) => {
    pushToast(`Report exported as ${format.toUpperCase()}`,'success')
  }

  const handleDeleteReport = (reportId) => {
    setReports(prev => prev.filter(r=>r.id!==reportId))
    pushToast('Report deleted','info')
  }

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status.toLowerCase() === filter)

  const stats = [
    { label: 'Total Reports', value: reports.length, icon: '📋', color: 'from-violet-600 to-cyan-600' },
    { label: 'Published', value: reports.filter(r=>r.status==='Published').length, icon: '✅', color: 'from-emerald-600 to-teal-600' },
    { label: 'Drafts', value: reports.filter(r=>r.status==='Draft').length, icon: '📝', color: 'from-amber-600 to-orange-600' },
    { label: 'Total Views', value: reports.reduce((acc,r)=>acc+r.views,0).toLocaleString(), icon: '👁️', color: 'from-blue-600 to-indigo-600' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Reports
          </h1>
          <p className="text-zinc-400 mt-1">Create, manage, and share your analytics reports</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={()=>setCurrentView && setCurrentView('dashboard')} 
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-700 rounded-xl hover:bg-zinc-800/50 transition-all"
          >
            ← Dashboard
          </button>
          <button 
            onClick={handleCreateReport} 
            disabled={creatingReport} 
            className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl hover:from-violet-700 hover:to-cyan-700 transition-all shadow-md shadow-violet-900/30"
          >
            {creatingReport ? 'Creating...' : '+ New Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="glass rounded-xl p-5 border border-white/5 hover:border-violet-500/30 transition-all duration-300">
            <div className="flex items-start justify-between">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-white mt-3 tracking-tight">{stat.value}</p>
            <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'published', 'draft'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              filter === f
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map(report => (
          <div 
            key={report.id} 
            className="glass rounded-2xl border border-white/5 hover:border-violet-500/30 transition-all duration-300 overflow-hidden group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 flex items-center justify-center text-2xl">
                  {report.icon}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  report.status === 'Published' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {report.status}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-1">{report.title}</h3>
              <p className="text-sm text-zinc-500 mb-4">{report.type} • Updated {report.updated}</p>
              
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                <span>👁️</span>
                <span>{report.views.toLocaleString()} views</span>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button 
                  onClick={()=>pushToast(`Opening ${report.title}`,'info')} 
                  className="flex-1 py-2 text-sm font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-all"
                >
                  View
                </button>
                <button 
                  onClick={()=>handleExportReport(report.id,'pdf')} 
                  className="flex-1 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  Export
                </button>
                <button 
                  onClick={()=>handleDeleteReport(report.id)} 
                  className="px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center border border-white/5">
          <p className="text-zinc-400 text-lg">No reports found</p>
          <p className="text-zinc-500 mt-2">Create your first report to get started</p>
        </div>
      )}
    </div>
  )
}
