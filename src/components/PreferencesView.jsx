import React, { useEffect, useState } from 'react'
import { pushToast, Icon, TiltCard } from '../lib/shims'

export default function PreferencesView({ setCurrentView }){
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    autoSave: true,
    autoBackup: false,
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false
  })
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    const saved = localStorage.getItem('nexus_preferences')
    if(saved) setPreferences(JSON.parse(saved))
  }, [])

  const handleToggle = (key)=>{
    setPreferences(prev => ({...prev, [key]: !prev[key]}))
  }
  const handleSelectChange = (key, value)=>{
    setPreferences(prev=>({...prev, [key]: value}))
  }
  const savePreferences = ()=>{
    setSaving(true)
    setTimeout(()=>{
      localStorage.setItem('nexus_preferences', JSON.stringify(preferences))
      setSaving(false)
      pushToast('Preferences saved successfully','success')
    }, 800)
  }

  const switchClass = (on) => ({
    display: 'inline-block', height: 26, width: 48, borderRadius: 999, background: on? '#06b6d4':'#334155', position: 'relative', verticalAlign:'middle'
  })
  const knobStyle = (on) => ({
    display:'inline-block', width:18, height:18, background:'#fff', borderRadius:999, position:'absolute', top:4, left: on?26:4, transition:'left 0.2s'
  })

  return (
    <div style={{padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2>Preferences</h2>
        <button onClick={()=>setCurrentView && setCurrentView('home')}>← Back to Dashboard</button>
      </div>

      <div style={{maxWidth:900}}>
        <TiltCard>
          <div style={{padding:16,background:'#071029',borderRadius:12,marginBottom:12}}>
            <h3>Appearance</h3>
            <div style={{display:'flex',gap:12,marginTop:8}}>
              <div style={{flex:1}}>
                <label>Theme</label>
                <select value={preferences.theme} onChange={e=>handleSelectChange('theme', e.target.value)} style={{width:'100%',padding:8,marginTop:6}}>
                  <option value='dark'>Dark</option>
                  <option value='light'>Light</option>
                  <option value='system'>System</option>
                </select>
              </div>
              <div style={{flex:1}}>
                <label>Language</label>
                <select value={preferences.language} onChange={e=>handleSelectChange('language', e.target.value)} style={{width:'100%',padding:8,marginTop:6}}>
                  <option value='en'>English</option>
                  <option value='es'>Spanish</option>
                  <option value='fr'>French</option>
                  <option value='de'>German</option>
                </select>
              </div>
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div style={{padding:16,background:'#071029',borderRadius:12,marginBottom:12}}>
            <h3>Notifications</h3>
            <div style={{marginTop:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10,background:'#0b1524',borderRadius:8,marginBottom:8}}>
                <div>
                  <div style={{fontWeight:600}}>Email Notifications</div>
                  <div style={{color:'#94a3b8',fontSize:13}}>Receive updates about your datasets and reports</div>
                </div>
                <button onClick={()=>handleToggle('emailNotifications')} style={switchClass(preferences.emailNotifications)} aria-checked={preferences.emailNotifications}>
                  <span style={knobStyle(preferences.emailNotifications)}></span>
                </button>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10,background:'#0b1524',borderRadius:8,marginBottom:8}}>
                <div>
                  <div style={{fontWeight:600}}>Push Notifications</div>
                  <div style={{color:'#94a3b8',fontSize:13}}>Get browser notifications for important updates</div>
                </div>
                <button onClick={()=>handleToggle('pushNotifications')} style={switchClass(preferences.pushNotifications)} aria-checked={preferences.pushNotifications}>
                  <span style={knobStyle(preferences.pushNotifications)}></span>
                </button>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10,background:'#0b1524',borderRadius:8}}>
                <div>
                  <div style={{fontWeight:600}}>Weekly Digest</div>
                  <div style={{color:'#94a3b8',fontSize:13}}>Receive a weekly summary of your analytics</div>
                </div>
                <button onClick={()=>handleToggle('weeklyDigest')} style={switchClass(preferences.weeklyDigest)} aria-checked={preferences.weeklyDigest}>
                  <span style={knobStyle(preferences.weeklyDigest)}></span>
                </button>
              </div>
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div style={{padding:16,background:'#071029',borderRadius:12,marginBottom:12}}>
            <h3>Data Preferences</h3>
            <div style={{marginTop:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10,background:'#0b1524',borderRadius:8,marginBottom:8}}>
                <div>
                  <div style={{fontWeight:600}}>Auto-save Changes</div>
                  <div style={{color:'#94a3b8',fontSize:13}}>Automatically save changes to datasets</div>
                </div>
                <button onClick={()=>handleToggle('autoSave')} style={switchClass(preferences.autoSave)} aria-checked={preferences.autoSave}>
                  <span style={knobStyle(preferences.autoSave)}></span>
                </button>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10,background:'#0b1524',borderRadius:8}}>
                <div>
                  <div style={{fontWeight:600}}>Auto-backup</div>
                  <div style={{color:'#94a3b8',fontSize:13}}>Create automatic backups of your datasets</div>
                </div>
                <button onClick={()=>handleToggle('autoBackup')} style={switchClass(preferences.autoBackup)} aria-checked={preferences.autoBackup}>
                  <span style={knobStyle(preferences.autoBackup)}></span>
                </button>
              </div>
            </div>
          </div>
        </TiltCard>

        <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}>
          <button onClick={savePreferences} disabled={saving} style={{padding:'10px 16px',background:'#0ea5a5',color:'#021124',borderRadius:8,fontWeight:600}}>
            {saving? 'Saving...': 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}
