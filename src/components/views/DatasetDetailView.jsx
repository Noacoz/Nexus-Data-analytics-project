import React, { useState, useEffect, useRef } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import API from '../../lib/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

function DatasetChart({ dataset }) {
  const isTime = ['time','monthly','weekly','sales','revenue','daily','annual','quarterly']
    .some(k => dataset?.name?.toLowerCase().includes(k))
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const rows = dataset?.row_count || dataset?.rows || 100
  const seed = dataset?.name?.length || 5
  const gen = (base, variance, count) =>
    Array.from({ length: count }, (_, i) => Math.max(0, Math.round(base + (i/count)*base*0.3 + (Math.sin(i*seed)+1)*variance)))
  const opts = { responsive: true, maintainAspectRatio: false, animation: { duration: 900 },
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } } } }
  if (isTime) return <div style={{height:220}}><Line data={{ labels: months.slice(0,6), datasets: [{ label: dataset.name, data: gen(rows*10,rows*2,6), borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.1)', fill: true, tension: 0.4 }] }} options={opts} /></div>
  return <div style={{height:220}}><Bar data={{ labels: ['Cat A','Cat B','Cat C','Cat D','Cat E'], datasets: [{ label: 'Count', data: gen(rows/5,rows/8,5), backgroundColor: ['rgba(99,102,241,0.8)','rgba(6,182,212,0.8)','rgba(16,185,129,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)'], borderRadius: 6 }] }} options={opts} /></div>
}

export default function DatasetDetailView({ datasetId, datasets, onBack, pushToast }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [insights, setInsights] = useState([])
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [chatMessages, setChatMessages] = useState([{role: 'assistant', content: ''}])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [nlQuestion, setNlQuestion] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlResult, setNlResult] = useState(null);
  const [nlError, setNlError] = useState(null);
  const chatEndRef = useRef(null)
  const dataset = datasets.find(d => d.id === datasetId)
  const quickQuestions = ['What are the key trends?', 'Summarize this dataset', 'Identify anomalies', 'Give me 3 actionable insights']

  useEffect(() => {
    if (!dataset?.id) return
    const loadData = async () => {
      try {
        const { insights: i } = await API.getInsights(dataset.id)
        if (i && Array.isArray(i)) setInsights(i)
      } catch (err) {
        console.error('Failed to load insights:', err)
      }
      try {
        const { comments: c } = await API.getComments(dataset.id)
        if (c && Array.isArray(c)) setComments(c)
      } catch (err) {
        console.error('Failed to load comments:', err)
      }
    }
    loadData()
    // Initialize chat with greeting
    if (dataset) {
      setChatMessages([{ role: 'assistant', content: `I'm your AI analyst for **${dataset?.name}**. Ask me anything about this dataset.` }])
    }
  }, [dataset?.id, dataset?.name])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  if (!dataset) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Dataset not found</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const tabs = ['overview', 'visualizations', 'insights', 'ai', 'comments', 'history']
  const rowCount = dataset.rows || dataset.row_count || 0
  const format = dataset.format || dataset.file_format || 'CSV'
  const createdAt = dataset.createdAt || (dataset.created_at ? new Date(dataset.created_at).toLocaleDateString() : 'Unknown')

  const handleAddComment = async () => {
    if (!comment.trim()) return
    try {
      const res = await API.addComment(dataset.id, comment.trim())
      if (res?.comment) {
        setComments(prev => [res.comment, ...prev])
        setComment('')
        if (pushToast) pushToast('Comment added', 'success')
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
      if (pushToast) pushToast('Failed to add comment', 'error')
    }
  }

  const sendChat = async (message) => {
    if (!message.trim() || chatLoading) return
    const userMsg = { role: 'user', content: message }
    const newMsgs = [...chatMessages, userMsg]
    setChatMessages(newMsgs)
    setChatInput('')
    setChatLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const d = line.slice(6)
          if (d === '[DONE]') break
          try {
            const token = JSON.parse(d).choices?.[0]?.delta?.content || ''
            if (token) { text += token; setChatMessages(prev => { const u=[...prev]; u[u.length-1]={role:'assistant',content:text}; return u }) }
          } catch {}
        }
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    }
    setChatLoading(false)
  }

  return (
    <div className="min-h-screen pt-16 bg-slate-950">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-300 mb-6 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-4xl font-bold mb-2">{dataset.name || 'Untitled Dataset'}</h1>
        <p className="text-slate-400 mb-6">{dataset.description || 'No description provided'}</p>

        {/* Tabs */}
        <div className="border-b border-slate-800 mb-8 flex gap-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'ai' ? '✨ AI Chat' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <p className="text-slate-400 text-sm mb-2">Total Rows</p>
                  <p className="text-3xl font-bold">{rowCount.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <p className="text-slate-400 text-sm mb-2">Format</p>
                  <p className="text-3xl font-bold">{format}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <p className="text-slate-400 text-sm mb-2">Created</p>
                  <p className="text-lg font-bold">{createdAt}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <p className="text-slate-400 text-sm mb-2">Insights</p>
                  <p className="text-3xl font-bold">{insights.length || 0}</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-6 col-span-full">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Data Distribution Preview</h3>
                <DatasetChart dataset={dataset} />
                <p className="text-xs text-slate-500 mt-3 text-center">Preview generated from dataset metadata</p>
              </div>
            </div>
          )}

          {activeTab === 'visualizations' && (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Trend Analysis</h3>
                <div style={{height:260}}>
                  <Line data={{ labels:['Jan','Feb','Mar','Apr','May','Jun'], datasets:[{ label:'Value', data:[42,58,51,73,68,85], borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,0.1)', fill:true, tension:0.4 }] }}
                    options={{ responsive:true, maintainAspectRatio:false, animation:{duration:900}, plugins:{legend:{labels:{color:'#94a3b8'}}}, scales:{ x:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,0.04)'}}, y:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,0.04)'}} } }} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Quarterly Distribution</h3>
                  <div style={{height:220}}>
                    <Bar data={{ labels:['Q1','Q2','Q3','Q4'], datasets:[{ label:'Count', data:[120,190,150,220], backgroundColor:['rgba(99,102,241,0.8)','rgba(6,182,212,0.8)','rgba(16,185,129,0.8)','rgba(245,158,11,0.8)'], borderRadius:6 }] }}
                      options={{ responsive:true, maintainAspectRatio:false, animation:{duration:900}, plugins:{legend:{display:false}}, scales:{ x:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,0.04)'}}, y:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,0.04)'}} } }} />
                  </div>
                </div>
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Composition</h3>
                  <div style={{height:220}}>
                    <Doughnut data={{ labels:['Segment A','Segment B','Segment C','Other'], datasets:[{ data:[38,27,22,13], backgroundColor:['#6366f1','#06b6d4','#10b981','#f59e0b'], borderColor:'rgba(15,23,42,0.5)', borderWidth:2 }] }}
                      options={{ responsive:true, maintainAspectRatio:false, animation:{duration:900}, plugins:{legend:{labels:{color:'#94a3b8'}}} }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p>No insights generated yet. Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {insights.map((insight, idx) => (
                    <div key={insight.id || idx} className="bg-slate-900/50 border-l-4 border-indigo-600 border border-slate-800 rounded-lg p-6">
                      <p className="text-slate-300 text-sm mb-2 font-semibold">{insight.type || 'Insight'}</p>
                      <p className="text-xl font-bold mb-2">{insight.title || insight.content || 'Untitled'}</p>
                      <p className="text-slate-400 text-sm">{insight.description || insight.content || ''}</p>
                      {insight.confidence && <p className="text-xs text-indigo-400 mt-3">Confidence: {Math.round(insight.confidence * 100)}%</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="glass rounded-2xl flex flex-col" style={{height:'520px'}}>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role==='user'?'justify-end':'justify-start'}`}>
                    {msg.role==='assistant' && <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white text-xs mr-3 mt-1 flex-shrink-0">✦</div>}
                    <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role==='user'?'bg-indigo-600 text-white rounded-tr-sm':'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                      {msg.content || <span className="animate-pulse text-slate-400">▋</span>}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {chatMessages.length <= 1 && (
                <div className="px-6 pb-2 flex flex-wrap gap-2">
                  {quickQuestions.map((q,i) => (
                    <button key={i} onClick={()=>sendChat(q)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full border border-slate-700 transition-colors">{q}</button>
                  ))}
                </div>
              )}
              <div className="p-4 border-t border-slate-700 flex gap-3">
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendChat(chatInput)}
                  placeholder="Ask about your data..." className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                <button onClick={()=>sendChat(chatInput)} disabled={!chatInput.trim()||chatLoading}
                  className="px-4 py-2.5 brand-gradient text-white rounded-xl text-sm font-medium disabled:opacity-40">Send</button>
              </div>
              <div style={{marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1.5rem'}}>
                <h3 style={{marginBottom: '1rem'}}>Ask AURORA</h3>
                <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
                  <input
                    type="text"
                    value={nlQuestion}
                    onChange={e => setNlQuestion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNlQuery()}
                    placeholder="Ask a question about this dataset..."
                    style={{flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #444', background: '#1a1a1a', color: '#fff'}}
                  />
                  <button onClick={handleNlQuery} disabled={nlLoading} style={{padding: '0.5rem 1.2rem', borderRadius: '6px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer'}}>
                    {nlLoading ? 'Thinking...' : 'Ask AURORA'}
                  </button>
                </div>
                {nlError && <div style={{color: '#f87171', marginBottom: '1rem'}}>{nlError}</div>}
                {nlResult && (
                  <div>
                    <div style={{marginBottom: '0.5rem', fontSize: '0.85rem', color: '#9ca3af'}}>Generated SQL:</div>
                    <pre style={{background: '#111', padding: '1rem', borderRadius: '6px', overflowX: 'auto', fontSize: '0.8rem', color: '#86efac', marginBottom: '1rem'}}>{nlResult.sql}</pre>
                    {nlResult.result?.rows?.length > 0 ? (
                      <div style={{overflowX: 'auto'}}>
                        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                          <thead>
                            <tr>{nlResult.result.columns.map(col => <th key={col} style={{padding: '0.5rem', borderBottom: '1px solid #333', textAlign: 'left', color: '#9ca3af'}}>{col}</th>)}</tr>
                          </thead>
                          <tbody>
                            {nlResult.result.rows.map((row, i) => (
                              <tr key={i}>{nlResult.result.columns.map(col => <td key={col} style={{padding: '0.5rem', borderBottom: '1px solid #222'}}>{row[col]}</td>)}</tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{color: '#9ca3af'}}>No rows returned.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <textarea 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors resize-none" 
                  placeholder="Add a comment..."
                  rows="4"
                />
                <button 
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Comment
                </button>
              </div>
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No comments yet. Be the first!</p>
                ) : (
                  comments.map((c, idx) => (
                    <div key={c.id || idx} className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                      <p className="font-semibold text-indigo-400 mb-2">{c.user_name || c.user || 'Anonymous'}</p>
                      <p className="text-slate-300 mb-3">{c.content || c.text || ''}</p>
                      <p className="text-xs text-slate-500">{new Date(c.created_at || Date.now()).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold mb-2">Version 1.0 - Original Upload</p>
                    <p className="text-slate-400 text-sm mb-2">{rowCount.toLocaleString()} rows • {format} format</p>
                  </div>
                  <span className="px-3 py-1 rounded bg-green-600/20 text-green-400 text-sm">Current</span>
                </div>
                <p className="text-xs text-slate-400 mt-4">Uploaded on {createdAt}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
