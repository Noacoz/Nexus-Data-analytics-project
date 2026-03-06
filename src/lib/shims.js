import React from 'react'
import QRCode from 'qrcode'
import PapaParse from 'papaparse'
import { Chart, registerables } from 'chart.js'

// Minimal toast system
const toasts = []
let notify
export function ToastProvider({children}){
  const [list, setList] = React.useState([])
  React.useEffect(()=>{ notify = (msg,type='info') => {
    const id = Date.now()+Math.random()
    const t = {id,msg,type}
    setList(prev=>[...prev,t])
    setTimeout(()=> setList(prev=>prev.filter(x=>x.id!==id)), 4000)
  } }, [])
  return React.createElement(React.Fragment, null,
    children,
    React.createElement('div',{style:{position:'fixed',right:16,top:16,zIndex:9999}},
      list.map(t=>React.createElement('div',{key:t.id,style:{marginBottom:8,background:'#111827',padding:10,borderRadius:8,color:'#e6eef8'}}, t.msg))
    )
  )
}
export function pushToast(message, type='info'){ if(notify) notify(message,type); else console.log('toast',type,message) }

// Icon stub
export function Icon({name, className}){
  return React.createElement('span', {className}, name)
}

// TiltCard stub - simple wrapper
export function TiltCard({children}){
  return React.createElement('div',{style:{transform:'none'}}, children)
}

// QRCode wrapper using dynamic import of qrcode if available
export async function generateQrDataUrl(data, opts={width:200}){
  try{
    if(QRCode && typeof QRCode.toDataURL === 'function'){
      return await QRCode.toDataURL(data, { width: opts.width })
    }
    // fallback: return placeholder
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#e5e7eb"/></svg>'
  }catch(e){ console.warn('QR generation failed', e); return 'about:blank' }
}

// Chart stub - returns a fake API to avoid runtime errors
export function makeChart(ctx, config){
  Chart.register(...registerables)
  return new Chart(ctx, config)
}

// PapaParse stub
export const Papa = PapaParse

export default { pushToast, Icon, TiltCard, generateQrDataUrl, makeChart, Papa }
