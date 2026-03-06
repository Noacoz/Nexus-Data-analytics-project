import React, { useEffect, useState } from 'react'
import { TiltCard, pushToast } from '../lib/shims'

export default function ScaleWithoutLimits(){
  const [count, setCount] = useState(0)
  const [targetCount] = useState(99.99)
  const [activeCapability, setActiveCapability] = useState(0)
  const capabilities = [
    { title: 'Real-time Processing', icon: '⚡', description: 'Process millions of rows in seconds' },
    { title: 'Auto-scaling', icon: '📈', description: 'Automatically scale based on workload' },
    { title: 'Global Infrastructure', icon: '🌍', description: 'Deployed across 12 regions worldwide' },
    { title: 'Enterprise Security', icon: '🔒', description: 'SOC 2 Type II certified' }
  ]

  useEffect(()=>{
    const duration = 1600
    const steps = 60
    const increment = targetCount/steps
    let current = 0
    const timer = setInterval(()=>{
      current += increment
      if(current >= targetCount){ current = targetCount; clearInterval(timer) }
      setCount(parseFloat(current.toFixed(2)))
    }, duration/steps)
    return ()=> clearInterval(timer)
  },[targetCount])

  return (
    <TiltCard>
      <div style={{padding:16,background:'#071028',borderRadius:12}}>
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <div style={{flex:1}}>
            <h3 style={{fontSize:20,fontWeight:700}}>Scale Without Limits</h3>
            <p style={{color:'#cbd5e1'}}>From startups to Fortune 500 companies, Nexus Analytics grows with your data needs.</p>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
              {capabilities.map((cap,i)=> (
                <button key={i} onClick={()=>setActiveCapability(i)} style={{padding:12,background: activeCapability===i? '#0b1624':'#071028',borderRadius:8,textAlign:'left'}}>
                  <div style={{fontSize:18}}>{cap.icon}</div>
                  <div style={{fontWeight:700}}>{cap.title}</div>
                  <div style={{color:'#94a3b8',fontSize:13}}>{cap.description}</div>
                </button>
              ))}
            </div>

            <div style={{marginTop:12}}>
              <button onClick={()=>pushToast('Explore our enterprise capabilities','info')}>Explore Capabilities</button>
            </div>
          </div>

          <div style={{width:200,textAlign:'center'}}>
            <div style={{fontSize:32,fontWeight:800,background:'linear-gradient(90deg,#06b6d4,#6366f1)',WebkitBackgroundClip:'text',color:'transparent'}}>{count}%</div>
            <div style={{color:'#94a3b8'}}>Uptime SLA</div>
          </div>
        </div>
      </div>
    </TiltCard>
  )
}
