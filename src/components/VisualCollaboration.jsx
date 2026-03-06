import React, { useState, useRef, useEffect } from 'react'
import { pushToast, makeChart, Papa } from '../lib/shims'

export default function VisualCollaboration(){
  const [activeUsers, setActiveUsers] = useState([
    { id:1, name:'Sarah', color:'#06b6d4', position:{x:20,y:30}},
    { id:2, name:'Marcus', color:'#6366f1', position:{x:60,y:70}},
    { id:3, name:'Priya', color:'#10b981', position:{x:40,y:50}}
  ])
  const [animations, setAnimations] = useState([])

  const addAnimation = (type, data) => {
    const id = Date.now()
    const animation = { id, type, data, timestamp: new Date() }
    setAnimations(prev=>[animation,...prev.slice(0,4)])
    setTimeout(()=> setAnimations(prev=>prev.filter(a=>a.id!==id)), 3000)
  }

  const simulateDataFlow = ()=>{ addAnimation('data-flow',{from:'Dataset',to:'Visualization'}); setActiveUsers(prev=>prev.map(u=>({...u, position:{x: Math.random()*80+10, y: Math.random()*80+10}}))) }
  const simulateProcessing = (op)=>{ addAnimation('processing',{operation:op}); const el = document.querySelector('.visualization-area'); if(el){ el.classList.add('processing'); setTimeout(()=>el.classList.remove('processing'),1500) } }

  return (
    <div style={{padding:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontSize:18,fontWeight:700}}>Visual Collaboration</h2>
        <div style={{display:'flex',gap:8}}>
          <button onClick={simulateDataFlow}>Simulate Data Flow</button>
          <button onClick={()=>simulateProcessing('cleaning')}>Simulate Processing</button>
        </div>
      </div>

      <div style={{position:'relative',height:220,background:'#071028',border:'1px solid #0f172a',borderRadius:10,overflow:'hidden',marginTop:12}}>
        {activeUsers.map(user=> (
          <div key={user.id} style={{position:'absolute',left:`${user.position.x}%`,top:`${user.position.y}%`,transform:'translate(-50%,-50%)',transition:'all 0.5s'}}>
            <div style={{width:32,height:32,borderRadius:999,background:user.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{user.name.charAt(0)}</div>
          </div>
        ))}

        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
          {activeUsers.slice(0,-1).map((u,i)=>{
            const next = activeUsers[i+1]
            const x2 = (next && next.position && next.position.x) ? next.position.x : u.position.x
            const y2 = (next && next.position && next.position.y) ? next.position.y : u.position.y
            return (<line key={i} x1={`${u.position.x}%`} y1={`${u.position.y}%`} x2={`${x2}%`} y2={`${y2}%`} stroke={u.color} strokeWidth='2' strokeDasharray='5,5' opacity='0.5' />)
          })}
        </svg>

        <div style={{position:'absolute',bottom:8,left:8,right:8,display:'flex',gap:8,overflowX:'auto'}}>
          {animations.map(anim=> (
            <div key={anim.id} style={{padding:'6px 10px',background:'#0b1220',borderRadius:999,fontSize:12}}>{anim.type==='data-flow'?'📊 Data flowing...': anim.type==='processing'?`⚡ ${anim.data.operation}...`:'🔄 Collaborating...'}</div>
          ))}
        </div>
      </div>

      <div style={{marginTop:12,display:'flex',gap:8,alignItems:'center'}}>
        <button onClick={()=>{
          // Sample chart rendering into a popup area
          const canvas = document.getElementById('vc-sample-chart')
          if(!canvas){
            pushToast('Chart canvas not found')
            return
          }
          const ctx = canvas.getContext('2d')
          const data = {
            labels: ['Jan','Feb','Mar','Apr','May'],
            datasets: [{ label: 'Sample', data: [12,19,7,14,20], borderColor:'#60a5fa', backgroundColor:'rgba(96,165,250,0.2)'}]
          }
          try{ makeChart(ctx, { type: 'line', data }) }catch(e){ pushToast('Chart failed: '+e.message) }
        }}>Load Sample Chart</button>

        <input type="file" accept="text/csv" onChange={(e)=>{
          const f = e.target.files && e.target.files[0]
          if(!f) return
          const reader = new FileReader()
          reader.onload = (ev)=>{
              try{
              const res = Papa.parse(ev.target.result, { header: true })
              const parsedCount = (res && res.data && res.data.length) ? res.data.length : 0
              pushToast('Parsed '+ parsedCount +' rows')
              // if numeric columns present, try to chart first two columns
              const rows = res.data || []
              if(rows.length===0) return
              const keys = Object.keys(rows[0])
              const nums = keys.filter(k=>!isNaN(Number(rows[0][k])))
              if(nums.length>=1){
                const labels = rows.map((r,i)=>r[ keys[0] ] || String(i+1))
                const dataset = rows.map(r=>Number(r[nums[0]]))
                const canvas = document.getElementById('vc-sample-chart')
                if(canvas){
                  const ctx = canvas.getContext('2d')
                  try{ makeChart(ctx, { type:'bar', data:{ labels, datasets:[{ label: nums[0], data: dataset, backgroundColor:'#34d399' }] } }) }catch(e){ pushToast('Chart render failed') }
                }
              }
            }catch(err){ pushToast('CSV parse error') }
          }
          reader.readAsText(f)
        }} />

        <canvas id="vc-sample-chart" width="400" height="120" style={{background:'#021125',borderRadius:8,marginLeft:8}} />
      </div>

      <div style={{marginTop:12,padding:12,background:'#071028',borderRadius:8}}>
        <div style={{color:'#cbd5e1'}}>This visualization shows real-time collaboration. Use the buttons above to simulate workflows.</div>
      </div>
    </div>
  )
}
