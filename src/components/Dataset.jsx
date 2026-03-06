import React, { useEffect, useState, useRef } from 'react'
import { pushToast, Icon, TiltCard, makeChart, Papa } from '../lib/shims'

export default function Dataset({ setView }){
  const [activeTab, setActiveTab] = useState('overview')
  const [visualizations, setVisualizations] = useState([])
  const [creatingViz, setCreatingViz] = useState(false)
  const [chartData, setChartData] = useState(null)
  const canvasRef = useRef(null)

  useEffect(()=>{
    setChartData({ labels:['Jan','Feb','Mar','Apr','May'], datasets:[{label:'Revenue',data:[65000,81000,72000,89000,93000],borderColor:'#06b6d4',backgroundColor:'rgba(6,182,212,0.1)',tension:0.4}] })
  },[])

  useEffect(()=>{
    if(!chartData || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const chart = makeChart(ctx, { type:'line', data: chartData, options: {} })
    return ()=> chart && chart.destroy && chart.destroy()
  },[chartData])

  const handleDownload = ()=>{
    const csvContent = 'Date,Revenue\nJan,65000\nFeb,81000\nMar,72000\nApr,89000\nMay,93000'
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
      const newViz = { id: visualizations.length + 1, title: `Visualization ${visualizations.length + 1}`, type: 'line', createdAt: new Date().toLocaleDateString() }
      setVisualizations(prev=>[...prev,newViz])
      setCreatingViz(false)
      pushToast('New visualization created','success')
    },900)
  }

  return (
    <div style={{padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h2>Visualizations</h2>
        <div>
          <button onClick={handleCreateVisualization} disabled={creatingViz} style={{marginRight:8}}>{creatingViz? 'Creating...':'Create Visualization'}</button>
          <button onClick={()=>setView && setView('data-cleaning')}>Clean Data</button>
        </div>
      </div>

      <TiltCard>
        <div style={{padding:12,background:'#071028',borderRadius:10}}>
          {chartData && (<div style={{height:220}}><canvas ref={canvasRef} id='datasetChart' style={{width:'100%',height:'100%'}}/></div>)}
          {visualizations.length>0 && <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8,marginTop:12}}>{visualizations.map(v=>(<div key={v.id} style={{padding:8,background:'#0b1524',borderRadius:8}}><div style={{fontWeight:600}}>{v.title}</div><div style={{color:'#94a3b8',fontSize:12}}>Type: {v.type}</div></div>))}</div>}
        </div>
      </TiltCard>

      <div style={{marginTop:12,display:'flex',gap:8}}>
        <button onClick={handleDownload}>Download</button>
        <button onClick={()=>pushToast('AI Analysis coming soon','info')}>AI Analysis</button>
      </div>
    </div>
  )
}
