import React, { useState } from 'react'
import { pushToast, Icon, TiltCard } from '../lib/shims'

export default function Reports({ setCurrentView }){
  const [reports, setReports] = useState([
    { id: 1, title: 'Q1 Sales Performance', type: 'Sales', updated: '2 days ago', status: 'Published', data: 'sales_data_2024_q1' },
    { id: 2, title: 'Customer Segmentation', type: 'Marketing', updated: '1 week ago', status: 'Draft', data: 'customer_segmentation' },
    { id: 3, title: 'Revenue Forecast', type: 'Finance', updated: '3 days ago', status: 'Published', data: 'revenue_forecast' },
    { id: 4, title: 'Website Analytics', type: 'Product', updated: '5 days ago', status: 'Published', data: 'website_analytics' }
  ])
  const [creatingReport, setCreatingReport] = useState(false)
  const [exporting, setExporting] = useState(null)

  const handleCreateReport = () => {
    setCreatingReport(true)
    setTimeout(()=>{
      const newReport = { id: reports.length + 1, title: `New Report ${reports.length + 1}`, type: 'Custom', updated: 'Just now', status: 'Draft', data: 'new_data' }
      setReports(prev=>[newReport, ...prev])
      setCreatingReport(false)
      pushToast('New report created successfully','success')
    }, 1200)
  }

  const handleExportReport = (reportId, format) => {
    setExporting(reportId)
    setTimeout(()=>{
      const found = reports.find(r=>r.id===reportId)
      const title = found && found.title ? found.title : ''
      const content = `Nexus Analytics Report\nTitle: ${title}\nGenerated: ${new Date().toLocaleString()}`
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setExporting(null)
      pushToast(`Report exported as ${format.toUpperCase()}`,'success')
    }, 800)
  }

  const handleDeleteReport = (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return
    setReports(prev => prev.filter(r=>r.id!==reportId))
    pushToast('Report deleted successfully','info')
  }

  const handleShareReport = (reportId) => {
    const shareUrl = `${window.location.origin}/report/${reportId}`
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(shareUrl).then(()=> pushToast('Report link copied to clipboard','success')).catch(()=>{
        // fallback
        try{ const ta = document.createElement('textarea'); ta.value = shareUrl; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); pushToast('Report link copied to clipboard','success') }catch(e){ pushToast('Could not copy link — please copy manually','error') }
      })
    } else {
      try{ const ta = document.createElement('textarea'); ta.value = shareUrl; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); pushToast('Report link copied to clipboard','success') }catch(e){ pushToast('Could not copy link — please copy manually','error') }
    }
  }

  return (
    <div style={{padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700}}>Reports Dashboard</h1>
          <div style={{color:'#94a3b8'}}>Create, manage, and export your data reports</div>
        </div>
        <button onClick={()=>setCurrentView && setCurrentView('dashboard')} style={{padding:8}}>← Back to Dashboard</button>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h2>All Reports</h2>
        <button onClick={handleCreateReport} disabled={creatingReport} style={{padding:8}}>{creatingReport? 'Creating...':'Create Report'}</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>
        {reports.map(report => (
          <TiltCard key={report.id}>
            <div style={{padding:12,background:'#071028',borderRadius:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:8}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div style={{width:44,height:44,borderRadius:8,background:'#0ea5a5',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name='chart' /></div>
                  <div>
                    <div style={{fontWeight:700}}>{report.title}</div>
                    <div style={{color:'#94a3b8',fontSize:12}}>{report.type} • Updated {report.updated}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12,color: report.status==='Published'? '#34d399':'#f59e0b',padding:'2px 6px',borderRadius:6,background: report.status==='Published'?'rgba(52,211,153,0.06)':'rgba(245,158,11,0.06)'}}>{report.status}</div>
                </div>
              </div>

              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button onClick={()=>pushToast(`Opening report: ${report.title}`,'info')} style={{padding:'6px 8px'}}>View</button>
                <button onClick={()=>handleExportReport(report.id,'pdf')} disabled={exporting===report.id} style={{padding:'6px 8px'}}>{exporting===report.id? 'Exporting...':'Export'}</button>
                <button onClick={()=>handleShareReport(report.id)} style={{padding:'6px 8px'}}>Share</button>
                <button onClick={()=>handleDeleteReport(report.id)} style={{padding:'6px 8px',color:'#f87171'}}>Delete</button>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  )
}
