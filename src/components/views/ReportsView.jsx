import React, { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import API from '../../lib/api'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
)

const sharedOpts = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900 },
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
    tooltip: {
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: 'rgba(99,102,241,0.3)',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
    },
  },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
}
const noScaleOpts = { ...sharedOpts, scales: undefined }

const REPORT_TEMPLATES = [
  {
    id: 'revenue',
    title: 'Revenue Performance',
    type: 'Sales',
    icon: '💰',
    color: '#06b6d4',
    previewData: [65, 78, 72, 89, 95, 88],
    previewColor: '#06b6d4',
    kpis: [
      { label: 'Total Revenue', value: '$1.24M', change: '+18.3%', up: true },
      { label: 'Avg Monthly', value: '$103K', change: '+12.1%', up: true },
      { label: 'Best Month', value: 'December', change: '$142K', up: true },
      { label: 'Growth Rate', value: '18.3%', change: 'YoY', up: true },
    ],
    charts: [
      {
        title: 'Monthly Revenue Trend',
        type: 'line',
        data: {
          labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          datasets: [{
            label: 'Revenue ($)',
            data: [65000,78000,72000,89000,95000,88000,102000,115000,108000,125000,118000,142000],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6,182,212,0.1)',
            fill: true, tension: 0.4, pointBackgroundColor: '#06b6d4', pointRadius: 4,
          }],
        },
      },
      {
        title: 'Revenue by Category',
        type: 'bar',
        data: {
          labels: ['Product A','Product B','Product C','Product D','Services'],
          datasets: [{
            label: 'Revenue ($)',
            data: [42000,35000,28000,19000,18000],
            backgroundColor: ['rgba(99,102,241,0.8)','rgba(6,182,212,0.8)','rgba(16,185,129,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)'],
            borderRadius: 6,
          }],
        },
      },
      {
        title: 'Revenue Split',
        type: 'doughnut',
        data: {
          labels: ['New Customers','Returning','Enterprise','SMB'],
          datasets: [{
            data: [35,28,22,15],
            backgroundColor: ['#6366f1','#06b6d4','#10b981','#f59e0b'],
            borderColor: 'rgba(15,23,42,0.5)', borderWidth: 2,
          }],
        },
      },
    ],
  },
  {
    id: 'customer',
    title: 'Customer Analytics',
    type: 'Marketing',
    icon: '👥',
    color: '#10b981',
    previewData: [1200,1580,2100,2800,3650,4820],
    previewColor: '#10b981',
    kpis: [
      { label: 'Total Customers', value: '4,820', change: '+32.1%', up: true },
      { label: 'Churn Rate', value: '7.5%', change: '-1.2%', up: true },
      { label: 'LTV', value: '$2,840', change: '+8.4%', up: true },
      { label: 'NPS Score', value: '72', change: '+5 pts', up: true },
    ],
    charts: [
      {
        title: 'Customer Growth',
        type: 'line',
        data: {
          labels: ['Q1 2023','Q2 2023','Q3 2023','Q4 2023','Q1 2024','Q2 2024'],
          datasets: [
            { label: 'Total Customers', data: [1200,1580,2100,2800,3650,4820], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 },
            { label: 'New Customers', data: [380,420,560,740,890,1200], borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.05)', fill: true, tension: 0.4, borderDash: [5,5] },
          ],
        },
      },
      {
        title: 'Customer Segments',
        type: 'doughnut',
        data: {
          labels: ['Enterprise','Mid-Market','SMB','Startup'],
          datasets: [{ data: [22,31,35,12], backgroundColor: ['#6366f1','#10b981','#06b6d4','#f59e0b'], borderColor: 'rgba(15,23,42,0.5)', borderWidth: 2 }],
        },
      },
      {
        title: 'Retention vs Churn',
        type: 'bar',
        data: {
          labels: ['Jan','Feb','Mar','Apr','May','Jun'],
          datasets: [
            { label: 'Retained', data: [92,89,94,91,96,93], backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 4 },
            { label: 'Churned', data: [8,11,6,9,4,7], backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 4 },
          ],
        },
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operations Overview',
    type: 'Operations',
    icon: '⚙️',
    color: '#f59e0b',
    previewData: [88,91,85,94,90,96],
    previewColor: '#f59e0b',
    kpis: [
      { label: 'Efficiency', value: '94.2%', change: '+2.1%', up: true },
      { label: 'Avg Processing', value: '2.3 days', change: '-0.4d', up: true },
      { label: 'Cost Reduction', value: '12.8%', change: 'YTD', up: true },
      { label: 'SLA Compliance', value: '98.7%', change: '+0.5%', up: true },
    ],
    charts: [
      {
        title: 'Operational Performance',
        type: 'bar',
        data: {
          labels: ['Efficiency','Throughput','Quality','Cost Control','Delivery'],
          datasets: [{ label: 'Score (%)', data: [94,88,96,82,91], backgroundColor: 'rgba(245,158,11,0.8)', borderRadius: 6 }],
        },
      },
      {
        title: 'Processing Time Trend',
        type: 'line',
        data: {
          labels: ['Jan','Feb','Mar','Apr','May','Jun'],
          datasets: [{ label: 'Days', data: [3.2,2.9,3.1,2.6,2.4,2.3], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4 }],
        },
      },
      {
        title: 'Resource Allocation',
        type: 'doughnut',
        data: {
          labels: ['Operations','Development','Support','Marketing'],
          datasets: [{ data: [42,28,18,12], backgroundColor: ['#f59e0b','#6366f1','#10b981','#06b6d4'], borderColor: 'rgba(15,23,42,0.5)', borderWidth: 2 }],
        },
      },
    ],
  },
  {
    id: 'financial',
    title: 'Financial Health',
    type: 'Financial',
    icon: '📈',
    color: '#6366f1',
    previewData: [420,455,438,510,495,560],
    previewColor: '#6366f1',
    kpis: [
      { label: 'Net Margin', value: '28.4%', change: '+3.2%', up: true },
      { label: 'EBITDA', value: '$892K', change: '+15.7%', up: true },
      { label: 'Cash Flow', value: '+$234K', change: 'Monthly', up: true },
      { label: 'Burn Rate', value: '$67K/mo', change: '-8.1%', up: true },
    ],
    charts: [
      {
        title: 'Revenue vs Expenses',
        type: 'line',
        data: {
          labels: ['Jan','Feb','Mar','Apr','May','Jun'],
          datasets: [
            { label: 'Revenue', data: [420000,455000,438000,510000,495000,560000], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 },
            { label: 'Expenses', data: [310000,325000,318000,355000,342000,385000], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', fill: true, tension: 0.4 },
          ],
        },
      },
      {
        title: 'Department Budget Usage',
        type: 'bar',
        data: {
          labels: ['Engineering','Marketing','Sales','Support','HR'],
          datasets: [{ label: 'Used (%)', data: [87,72,94,65,58], backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6 }],
        },
      },
      {
        title: 'Cost Breakdown',
        type: 'doughnut',
        data: {
          labels: ['Personnel','Infrastructure','Marketing','Operations'],
          datasets: [{ data: [55,20,15,10], backgroundColor: ['#6366f1','#06b6d4','#f59e0b','#10b981'], borderColor: 'rgba(15,23,42,0.5)', borderWidth: 2 }],
        },
      },
    ],
  },
]

function MiniChart({ data, color }) {
  return (
    <div style={{ height: 72 }}>
      <Line
        data={{
          labels: data.map((_, i) => i),
          datasets: [{
            data,
            borderColor: color,
            backgroundColor: `${color}22`,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 1200 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
        }}
      />
    </div>
  )
}

export default function ReportsView({ setCurrentView, pushToast }) {
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [aiSummary, setAiSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [creatingReport, setCreatingReport] = useState(false)
  const summaryRef = useRef(null)

  useEffect(() => {
    API.getReports()
      .then(res => { if (res?.reports) setReports(res.reports) })
      .catch(() => {})
  }, [])

  const generateAISummary = async (report) => {
    setSummaryLoading(true)
    setAiSummary('')
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate a concise executive summary for a "${report.title || 'Report'}" report. Include: 1) Key performance highlights, 2) Notable trends, 3) Three actionable recommendations. Be specific with the metrics provided. Format clearly with short paragraphs.`
          }],
        }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let text = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content || ''
            if (token) {
              text += token
              setAiSummary(text)
            }
          } catch {}
        }
      }
    } catch {
      setAiSummary('Unable to generate summary. Please check your connection and try again.')
    }
    setSummaryLoading(false)
  }

  const createNewReport = async () => {
    setCreatingReport(true)
    try {
      const nameRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Generate a single creative analytics report name. Respond with ONLY the report name, nothing else. Examples: "Q3 Growth Velocity", "Churn Prevention Analysis".' }],
        }),
      })
      const reader = nameRes.body.getReader()
      const decoder = new TextDecoder()
      let reportName = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try { reportName += JSON.parse(data).choices?.[0]?.delta?.content || '' } catch {}
        }
      }
      reportName = reportName.trim() || 'Custom Report'

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: reportName, type: 'Custom' }),
      })
      const data = await res.json()
      if (data.report) {
        const template = REPORT_TEMPLATES[Math.floor(Math.random() * REPORT_TEMPLATES.length)]
        setReports(prev => [{ ...data.report, title: reportName, _template: template }, ...prev])
      }
    } catch (err) {
      console.error('Failed to create report:', err)
    }
    setCreatingReport(false)
  }

  const exportReport = (report) => {
    const template = REPORT_TEMPLATES.find(t => t.id === report.id) || REPORT_TEMPLATES[0]
    const content = `NEXUS ANALYTICS — ${report.title || template.title}\nGenerated: ${new Date().toLocaleString()}\n\n${'='.repeat(60)}\n\nKEY METRICS\n${template.kpis.map(k => `• ${k.label}: ${k.value} (${k.change})`).join('\n')}\n\n${'='.repeat(60)}\n\nCHARTS INCLUDED\n${template.charts.map(c => `• ${c.title}`).join('\n')}\n\n${'='.repeat(60)}\n\nAI SUMMARY\n${aiSummary || 'No summary generated. Click "Generate AI Summary" to create one.'}\n`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(report.title || template.title).replace(/\s+/g, '_')}_report.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const visibleTemplates = REPORT_TEMPLATES.filter(t =>
    (activeFilter === 'All' || t.type === activeFilter) &&
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const visibleCustom = reports.filter(r =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (activeFilter === 'All' || activeFilter === 'Custom')
  )

  if (selectedReport) {
    const template = REPORT_TEMPLATES.find(t => t.id === selectedReport.id) || REPORT_TEMPLATES[0]
    return (
      <div className="min-h-screen pt-16 bg-slate-950">
        <div className="max-w-7xl mx-auto p-6">
          <button onClick={() => { setSelectedReport(null); setAiSummary('') }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-1 transition-transform">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to Reports
          </button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{selectedReport.title || template.title}</h1>
            <p className="text-slate-400">{template.type}</p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {template.kpis.map((kpi, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <p className="text-sm text-slate-400 mb-2">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className={`text-xs mt-1 ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>{kpi.change}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">{template.charts[0]?.title}</h2>
              <div style={{height: 300}}>
                {template.charts[0]?.type === 'line' && <Line data={template.charts[0]?.data} options={sharedOpts} />}
                {template.charts[0]?.type === 'bar' && <Bar data={template.charts[0]?.data} options={sharedOpts} />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {template.charts.slice(1).map((chart, i) => (
                <div key={i} className="glass rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4">{chart.title}</h2>
                  <div style={{height: 280}}>
                    {chart.type === 'line' && <Line data={chart.data} options={sharedOpts} />}
                    {chart.type === 'bar' && <Bar data={chart.data} options={sharedOpts} />}
                    {chart.type === 'doughnut' && <Doughnut data={chart.data} options={noScaleOpts} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Executive Summary</h2>
              <button onClick={() => generateAISummary(selectedReport)} disabled={summaryLoading}
                className="px-4 py-2 brand-gradient text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {summaryLoading ? '⏳ Generating...' : '✨ Generate AI Summary'}
              </button>
            </div>
            {aiSummary ? (
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{aiSummary}</div>
            ) : (
              <p className="text-slate-500 text-center py-8">Click "Generate AI Summary" to create an AI-powered analysis of this report</p>
            )}
          </div>

          <button onClick={() => exportReport(selectedReport)}
            className="mt-8 w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
            📥 Export Report
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-slate-950">
      <div className="max-w-6xl mx-auto p-6">
        <button onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-1 transition-transform">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>

        <h1 className="text-4xl font-bold mb-8">Reports</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search reports..."
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            {['All', 'Sales', 'Marketing', 'Operations', 'Financial', 'Custom'].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={createNewReport} disabled={creatingReport}
            className="px-4 py-2.5 brand-gradient text-white rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap">
            {creatingReport ? '✦ Generating...' : '+ New Report'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleTemplates.map(template => (
            <div key={template.id} onClick={() => setSelectedReport(template)}
              className="glass rounded-2xl p-6 hover:border-indigo-500/50 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-3xl mb-2">{template.icon}</p>
                  <h3 className="text-xl font-bold group-hover:text-indigo-400 transition-colors">{template.title}</h3>
                  <p className="text-sm text-slate-400">{template.type}</p>
                </div>
              </div>
              <MiniChart data={template.previewData} color={template.previewColor} />
              <button className="mt-4 px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 text-sm font-medium w-full">
                View Report →
              </button>
            </div>
          ))}

          {visibleCustom.map(report => (
            <div key={report.id} onClick={() => setSelectedReport(report)}
              className="glass rounded-2xl p-6 hover:border-indigo-500/50 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-3xl mb-2">📄</p>
                  <h3 className="text-xl font-bold group-hover:text-indigo-400 transition-colors">{report.title || 'Custom Report'}</h3>
                  <p className="text-sm text-slate-400">{report.type || 'Custom'}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4">Created {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'recently'}</p>
              <button className="mt-4 px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 text-sm font-medium w-full">
                View Report →
              </button>
            </div>
          ))}
        </div>

        {visibleTemplates.length === 0 && visibleCustom.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400">No reports match your search. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
