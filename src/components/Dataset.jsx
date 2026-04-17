import React, { useEffect, useState, useRef } from 'react'
import { pushToast, makeChart } from '../lib/shims'

export default function Dataset({ setView }){
  const [activeTab, setActiveTab] = useState('overview')
  const [visualizations, setVisualizations] = useState([])
  const [creatingViz, setCreatingViz] = useState(false)
  const [chartData, setChartData] = useState(null)
  const canvasRef = useRef(null)
  const chartInstanceRef = useRef(null)

  useEffect(()=>{
    setChartData({ 
      labels:['Jan','Feb','Mar','Apr','May','Jun'], 
      datasets:[{
        label:'Revenue',
        data:[65000,81000,72000,89000,93000,105000],
        borderColor:'#8B5CF6',
        backgroundColor:'rgba(139,92,246,0.1)',
        tension:0.4,
        fill: true
      }] 
    })
  },[])

  useEffect(()=>{
    if(!chartData || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (chartInstanceRef.current) chartInstanceRef.current.destroy()
    chartInstanceRef.current = makeChart(ctx, { 
      type:'line', 
      data: chartData, 
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#A1A1AA' } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#A1A1AA' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#A1A1AA' } }
        }
      }
    })
    return ()=> chartInstanceRef.current?.destroy()
  },[chartData])

  const handleDownload = ()=>{
    const csvContent = 'Month,Revenue\nJan,65000\nFeb,81000\nMar,72000\nApr,89000\nMay,93000\nJun,105000'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dataset.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    pushToast('Dataset downloaded successfully','success')
  }

  const handleCreateVisualization = ()=>{
    setCreatingViz(true)
    setTimeout(()=>{
      const newViz = { id: Date.now(), title: `Visualization ${visualizations.length + 1}`, type: 'line', createdAt: new Date().toLocaleDateString() }
      setVisualizations(prev=>[...prev,newViz])
      setCreatingViz(false)
      pushToast('New visualization created','success')
    },900)
  }

  const tabButtons = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'schema', label: 'Schema', icon: '🔢' },
    { id: 'visualizations', label: 'Visualizations', icon: '📈' },
    { id: 'history', label: 'History', icon: '🕐' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Sales Analytics Dataset</h2>
          <p className="text-zinc-400 text-sm mt-1">Last updated 2 hours ago</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownload}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-700 rounded-xl hover:bg-zinc-800/50 transition-all"
          >
            ↓ Download
          </button>
          <button 
            onClick={()=>setView && setView('data-cleaning')}
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl hover:from-violet-700 hover:to-cyan-700 transition-all shadow-md shadow-violet-900/30"
          >
            ✨ Clean Data
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 p-1 glass rounded-2xl border border-white/5 w-fit">
        {tabButtons.map(tab => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
            <div className="h-72">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Dataset Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Rows</span>
                <span className="text-white font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Columns</span>
                <span className="text-white font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Size</span>
                <span className="text-white font-medium">2.4 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Format</span>
                <span className="text-white font-medium">CSV</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div>
                <p className="text-zinc-400 text-sm">Mean Revenue</p>
                <p className="text-2xl font-bold text-white">$84,333</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Growth Rate</p>
                <p className="text-2xl font-bold text-emerald-400">+12.4%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'visualizations' && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Saved Visualizations</h3>
            <button 
              onClick={handleCreateVisualization} 
              disabled={creatingViz}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl hover:from-violet-700 hover:to-cyan-700 transition-all"
            >
              {creatingViz ? 'Creating...' : '+ New Visualization'}
            </button>
          </div>
          {visualizations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visualizations.map(v=>(
                <div key={v.id} className="glass rounded-xl p-5 border border-white/5 hover:border-violet-500/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 flex items-center justify-center mb-3">
                    <span className="text-2xl">📈</span>
                  </div>
                  <p className="font-semibold text-white">{v.title}</p>
                  <p className="text-sm text-zinc-500 mt-1">Type: {v.type}</p>
                  <p className="text-xs text-zinc-600 mt-2">{v.createdAt}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-12 text-center border border-white/5">
              <p className="text-zinc-400">No visualizations yet. Create your first one!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
