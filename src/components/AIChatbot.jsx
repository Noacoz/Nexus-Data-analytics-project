import React, { useEffect, useState, useRef } from 'react'

export default function AIChatbot({ dataset, pushToastFn }){
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello! I'm your AI data assistant for **${dataset?.name || 'your dataset'}**. I can help you analyze and understand your data. What would you like to know?` }
  ])
  const [input, setInput] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [insights, setInsights] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(()=>{ runAutomatedAnalysis() }, [dataset?.id])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const streamResponse = async (messagesArray, systemPrompt) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ messages: messagesArray }),
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue
        const d = line.slice(6)
        if (d === '[DONE]') return text
        try {
          const token = JSON.parse(d).choices?.[0]?.delta?.content || ''
          if (token) {
            console.log('TOKEN:', token)
            text += token
            setMessages(prev => {
              const u = [...prev]
              u[u.length - 1] = { role: 'assistant', content: text }
              return u
            })
          }
        } catch {}
      }
    }
    return text
  }

  const runAutomatedAnalysis = async ()=>{
    setAnalyzing(true)
    try {
      const systemPrompt = `You are a data analyst expert. Analyze a dataset called "${dataset?.name || 'Unknown'}" and provide 2-3 key insights. Format your response as JSON:
[{"type":"trend","title":"Title","description":"Description","confidence":0.92}]`

      const message = `Analyze this dataset: ${dataset?.name || 'Unknown'}. It has ${dataset?.rows || dataset?.row_count || 'unknown'} rows and is in ${dataset?.format || 'CSV'} format.`
      
      const newMessages = [{ role: 'user', content: message }]
      setMessages(prev=>[...prev,{ role: 'user', content: message }])
      setMessages(prev=>[...prev,{ role: 'assistant', content: '' }])
      
      const response = await streamResponse(newMessages, systemPrompt)
      
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const newInsights = JSON.parse(jsonMatch[0])
          setInsights(newInsights)
        }
      } catch (e) {
        console.error('Failed to parse insights JSON:', e)
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setMessages(prev=>[...prev,{ role: 'assistant', content: 'Unable to analyze dataset. Please check your connection.' }])
    } finally {
      setAnalyzing(false)
    }
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMessage = { role: 'user', content: text }
    setMessages(prev=>[...prev,userMessage])
    setInput('')
    setMessages(prev=>[...prev,{ role: 'assistant', content: '' }])
    
    try {
      const systemPrompt = `You are an expert data analyst for the Nexus Analytics platform. You are analyzing a dataset named "${dataset?.name}" with ${dataset?.rows || dataset?.row_count || 'unknown'} rows in ${dataset?.format || 'CSV'} format. Description: "${dataset?.description || 'No description provided'}". Provide concise, insightful, data-driven analysis. Be specific and actionable.`
      const newMessages = messages.slice(-5).map(m => ({role: m.role, content: m.content})).concat([{role: 'user', content: text}])
      await streamResponse(newMessages, systemPrompt)
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev=>{const u=[...prev]; u[u.length-1]={role:'assistant',content:'Connection error. Please try again.'}; return u})
    }
  }

  const handleQuickQuestion = (q) => sendMessage(q)

  const InsightCard = ({ insight }) => {
    const icons = { trend: '📈', anomaly: '⚠️', suggestion: '💡', correlation: '🔗' }
    return (
      <div style={{padding:12,background:'rgba(99,102,241,0.1)',borderRadius:8,borderLeft:'3px solid #6366f1'}}>
        <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
          <div style={{fontSize:18}}>{icons[insight.type] || '⭐'}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:'#f1f5f9'}}>{insight.title}</div>
            <div style={{color:'#cbd5e1',fontSize:13,marginTop:4}}>{insight.description}</div>
            {insight.confidence && <div style={{fontSize:11,color:'#94a3b8',marginTop:6}}>Confidence: {(insight.confidence*100).toFixed(0)}%</div>}
          </div>
        </div>
      </div>
    )
  }

  const predefinedQuestions = ['What are the key trends?','Show me anomalies','Summarize this data','Find patterns','What insights?']

  return (
    <div style={{padding:16}}>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
        <div style={{borderRadius:12,overflow:'hidden',border:'1px solid #334155',background:'#0f172a'}}>
          <div style={{padding:12,borderBottom:'1px solid #1e293b'}}>
            <h2 style={{margin:0,color:'#f1f5f9'}}>AI Data Assistant</h2>
          </div>
          <div style={{minHeight:220,maxHeight:320,marginTop:0,background:'#0b1220',padding:12,overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
            {messages.map((m,i)=> (
              <div key={i} style={{textAlign: m.role === 'user' ? 'right' : 'left'}}>
                {m.role === 'assistant' && <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg, #6366f1, #06b6d4)',display:'inline-flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:12,marginRight:8,marginBottom:4}}>✦</div>}
                <div style={{display:'inline-block',maxWidth:'75%',padding:'10px 14px',borderRadius:12,background: m.role === 'user' ? '#4f46e5' : '#1e293b',color:'#e6eef8',textAlign:'left',lineHeight:1.5}}>{m.content || <span style={{opacity:0.5}}>▋</span>}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div style={{padding:12,borderTop:'1px solid #1e293b'}}>
            {messages.length <= 1 && (
              <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
                {predefinedQuestions.map((q,i)=>(<button key={i} onClick={()=>handleQuickQuestion(q)} style={{padding:'6px 10px',fontSize:'12px',background:'#1e293b',color:'#cbd5e1',border:'1px solid #334155',borderRadius:6,cursor:'pointer',transition:'all 0.2s'}} onMouseOver={e=>e.target.style.borderColor='#6366f1'} onMouseOut={e=>e.target.style.borderColor='#334155'}>{q}</button>))}
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&sendMessage(input)} placeholder="Ask about your data..." style={{flex:1,padding:10,background:'#1e293b',border:'1px solid #334155',borderRadius:8,color:'#e6eef8',outline:'none'}} onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#334155'} />
              <button onClick={()=>sendMessage(input)} disabled={!input.trim()} style={{padding:10,background:'#4f46e5',color:'white',border:'none',borderRadius:8,cursor:!input.trim()?'not-allowed':'pointer',opacity:!input.trim()?0.5:1}}>→</button>
            </div>
          </div>
        </div>

        <div style={{borderRadius:12,overflow:'hidden',border:'1px solid #334155',background:'#0f172a'}}>
          <div style={{padding:12,borderBottom:'1px solid #1e293b',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h3 style={{margin:0,color:'#f1f5f9'}}>Insights</h3>
            <button onClick={runAutomatedAnalysis} disabled={analyzing} style={{padding:'6px 10px',background:'#4f46e5',color:'white',border:'none',borderRadius:6,cursor:analyzing?'not-allowed':'pointer',opacity:analyzing?0.5:1,fontSize:12}}>{analyzing? '⏳':'Re-analyze'}</button>
          </div>
          <div style={{padding:12,minHeight:300,background:'#0b1220',overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
            {analyzing ? (
              <div style={{padding:16,textAlign:'center',color:'#94a3b8'}}>Analyzing dataset...</div>
            ) : insights.length === 0 ? (
              <div style={{padding:16,textAlign:'center',color:'#94a3b8'}}>Insights will appear here</div>
            ) : (
              insights.map((ins,i)=> <div key={i}><InsightCard insight={ins} /></div>)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
