import React, { useState } from 'react'
import { pushToast } from '../lib/shims'

export default function DataCleaning({ setView }){
  const [cleaningOperations, setCleaningOperations] = useState([
    { id: 1, name: 'Handle Missing Values', type: 'missing', applied: false, loading: false },
    { id: 2, name: 'Standardize Formats', type: 'format', applied: false, loading: false },
    { id: 3, name: 'Remove Outliers', type: 'outliers', applied: false, loading: false },
    { id: 4, name: 'Deduplicate Records', type: 'deduplicate', applied: false, loading: false }
  ])
  const [dataFlowActive, setDataFlowActive] = useState(false)

  const applyCleaning = (operationId) => {
    setCleaningOperations(prev => prev.map(op => op.id === operationId ? { ...op, loading: true } : op))
    setDataFlowActive(true)
    setTimeout(() => {
      setCleaningOperations(prev => prev.map(op => op.id === operationId ? { ...op, applied: true, loading: false } : op))
      setDataFlowActive(false)
      const op = cleaningOperations.find(o => o.id === operationId)
      pushToast(`${(op && op.name) ? op.name : 'Operation'} applied successfully`,'success')
    }, 1400)
  }

  const runAllCleaning = () => {
    setDataFlowActive(true)
    let index = 0
    cleaningOperations.forEach((op, i) => {
      if (!op.applied) {
        setTimeout(() => {
          setCleaningOperations(prev => prev.map((o, ii) => ii === i ? { ...o, applied: true } : o))
          index++
          if (index === cleaningOperations.filter(o=>!o.applied).length) {
            setDataFlowActive(false)
            pushToast('All cleaning operations completed','success')
          }
        }, i * 900)
      }
    })
  }

  return (
    <div style={{padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Data Cleaning Tools</h2>
        <div>
          <button onClick={runAllCleaning} disabled={cleaningOperations.every(op=>op.applied) || dataFlowActive}>{dataFlowActive? 'Processing...':'Run All Cleaning'}</button>
        </div>
      </div>

      <div style={{marginTop:12}}>
        {cleaningOperations.map(op => (
          <div key={op.id} style={{padding:10,background:'#071028',borderRadius:8,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700}}>{op.name} {op.applied && <span style={{color:'#34d399',fontSize:12,marginLeft:8}}>Applied</span>}</div>
              <div style={{color:'#94a3b8',fontSize:13}}>{op.type === 'missing' ? 'Fill or remove missing values' : 'Standardize and normalize data'}</div>
            </div>
            <div>
              <button onClick={()=>applyCleaning(op.id)} disabled={op.applied || op.loading || dataFlowActive}>{op.loading? 'Applying...': op.applied? 'Applied':'Apply'}</button>
            </div>
          </div>
        ))}
        <div style={{marginTop:12}}><button onClick={()=>setView && setView('dataset')}>← Back to Dataset</button></div>
      </div>
    </div>
  )
}
