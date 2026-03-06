import React, { useState } from 'react'
import { pushToast, Icon, TiltCard } from '../lib/shims'

export default function Billing({ setCurrentView }){
  const [currentPlan, setCurrentPlan] = useState('Professional')
  const [usage, setUsage] = useState({ datasets: { used: 8, limit: 20 }, storage: { used: 2.4, limit: 100 }, apiCalls: { used: 1240, limit: 5000 } })
  const [paymentHistory] = useState([
    { id: 1, date: 'Apr 15, 2024', amount: 79.00, status: 'Paid', invoice: 'INV-2024-04-001' },
    { id: 2, date: 'Mar 15, 2024', amount: 79.00, status: 'Paid', invoice: 'INV-2024-03-001' },
    { id: 3, date: 'Feb 15, 2024', amount: 79.00, status: 'Paid', invoice: 'INV-2024-02-001' }
  ])
  const [upgrading, setUpgrading] = useState(false)

  const plans = [
    { name: 'Starter', price: 0, datasets: '1 dataset', features: ['Basic analytics', 'Community support'] },
    { name: 'Professional', price: 79, datasets: 'Up to 20 datasets', features: ['Advanced analytics', 'Team collaboration', 'API access'] },
    { name: 'Enterprise', price: 149, datasets: 'Unlimited datasets', features: ['Custom integrations', '24/7 support', 'ML insights'] }
  ]

  const currentPlanObj = plans.find(p=>p.name===currentPlan)

  const handleUpgrade = (planName) => {
    if (planName === currentPlan) { pushToast(`You are already on the ${planName} plan`,'info'); return }
    setUpgrading(true)
    setTimeout(()=>{ setCurrentPlan(planName); setUpgrading(false); pushToast(`Successfully upgraded to ${planName} plan`,'success') }, 1200)
  }

  const downloadInvoice = (invoiceId) => {
    const content = `Invoice: ${invoiceId}\nDate: ${new Date().toLocaleDateString()}\nAmount: $79.00\nStatus: Paid\n\nThank you for your business!`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoiceId}.txt`
    a.click()
    URL.revokeObjectURL(url)
    pushToast('Invoice downloaded','success')
  }

  const UsageMeter = ({ label, used, limit, unit = '' }) => {
    const percentage = (used/limit)*100
    return (
      <div style={{marginBottom:8}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'#cbd5e1'}}>{label}</span><span>{used}{unit} / {limit}{unit}</span></div>
        <div style={{height:8,background:'#0b1220',borderRadius:6,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(percentage,100)}%`,background:'linear-gradient(90deg,#06b6d4,#6366f1)'}}/></div>
      </div>
    )
  }

  return (
    <div style={{padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h1 style={{fontSize:22,fontWeight:700}}>Billing & Usage</h1>
        <button onClick={()=>setCurrentView && setCurrentView('dashboard')}>← Back to Dashboard</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
        <div>
          <TiltCard>
            <div style={{padding:12,background:'#071028',borderRadius:10}}>
              <h3>Current Plan</h3>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:18}}>{currentPlan}</div>
                  <div style={{color:'#94a3b8'}}>{(currentPlanObj && currentPlanObj.datasets) ? currentPlanObj.datasets : ''}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700,fontSize:18}}>${(currentPlanObj && (typeof currentPlanObj.price !== 'undefined')) ? currentPlanObj.price : ''}/month</div>
                  <button onClick={()=>setCurrentView && setCurrentView('pricing')} style={{marginTop:8}}>Change plan</button>
                </div>
              </div>

              <h4 style={{marginTop:12}}>Usage this month</h4>
              <UsageMeter label='Datasets' used={usage.datasets.used} limit={usage.datasets.limit} />
              <UsageMeter label='Storage' used={usage.storage.used} limit={usage.storage.limit} unit='GB' />
              <UsageMeter label='API Calls' used={usage.apiCalls.used} limit={usage.apiCalls.limit} />
            </div>
          </TiltCard>

          <TiltCard>
            <div style={{padding:12,background:'#071028',borderRadius:10,marginTop:12}}>
              <h3>Payment History</h3>
              <div style={{marginTop:8}}>
                {paymentHistory.map(p=> (
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:8,background:'#0b1220',borderRadius:8,marginBottom:8}}>
                    <div><div style={{fontWeight:600}}>{p.date}</div><div style={{color:'#94a3b8',fontSize:12}}>{p.invoice}</div></div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{fontWeight:700}}>${p.amount}</div>
                      <div style={{padding:'2px 6px',background:'rgba(16,185,129,0.06)',borderRadius:6}}>{p.status}</div>
                      <button onClick={()=>downloadInvoice(p.invoice)}>Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        </div>

        <div>
          <TiltCard>
            <div style={{padding:12,background:'#071028',borderRadius:10}}>
              <h3>Upgrade Plan</h3>
              <div style={{marginTop:8}}>
                {plans.filter(p=>p.name!==currentPlan).map(plan=> (
                  <div key={plan.name} style={{padding:10,background:'#0b1220',borderRadius:8,marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:700}}>{plan.name}</div>
                        <div style={{color:'#94a3b8'}}>{plan.datasets}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontWeight:700}}>${plan.price}/month</div>
                        <button onClick={()=>handleUpgrade(plan.name)} disabled={upgrading} style={{marginTop:6}}>{upgrading? 'Upgrading...':'Upgrade'}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>

          <TiltCard>
            <div style={{padding:12,background:'#071028',borderRadius:10,marginTop:12}}>
              <h3>Billing Information</h3>
              <div style={{marginTop:8}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#94a3b8'}}>Next billing date</span><span>May 15, 2024</span></div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}><span style={{color:'#94a3b8'}}>Payment method</span><div style={{display:'flex',alignItems:'center',gap:8}}><Icon name='creditCard' /><span>•••• 4242</span></div></div>
                <button onClick={()=>pushToast('Payment method management coming soon','info')} style={{marginTop:8}}>Update payment method</button>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  )
}
