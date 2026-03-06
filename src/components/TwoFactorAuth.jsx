import React, { useEffect, useState } from 'react'
import { pushToast, Icon, generateQrDataUrl } from '../lib/shims'

export default function TwoFactorAuth(){
  const [isEnabled, setIsEnabled] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [secret, setSecret] = useState('')
  const [step, setStep] = useState('setup')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    const enabled = localStorage.getItem('nexus_2fa_enabled') === 'true'
    setIsEnabled(enabled)
    if(enabled) setStep('enabled')
  }, [])

  const enable2FA = async ()=>{
    setLoading(true)
    // Try backend provisioning first
    try{
      const resp = await fetch('http://localhost:4000/api/2fa/provision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'demo-user' })
      })
      if (resp.ok){
        const data = await resp.json()
        const otpauth = data.otpauth_url || `otpauth://totp/NexusAnalytics:user@example.com?secret=${data.secret}&issuer=NexusAnalytics`
        const url = await generateQrDataUrl(otpauth, { width: 200 })
        setQrCode(url)
        setSecret(data.secret)
        setStep('verify')
        setLoading(false)
        return
      }
    }catch(e){ /* fallback to local mock */ }

    // Fallback: local mock generation
    setTimeout(async ()=>{
      const mockSecret = 'JBSWY3DPEHPK3PXP'
      const mockQrData = `otpauth://totp/NexusAnalytics:user@example.com?secret=${mockSecret}&issuer=NexusAnalytics`
      try{
        const url = await generateQrDataUrl(mockQrData, {width:200})
        setQrCode(url)
        setSecret(mockSecret)
        setStep('verify')
      }catch(e){ pushToast('Failed to generate QR code','error') }
      setLoading(false)
    }, 800)
  }

  const verify2FA = async ()=>{
    if(verificationCode.length !== 6){ pushToast('Please enter a 6-digit verification code','error'); return }
    setLoading(true)
    // Try backend verification if available
    try{
      const resp = await fetch('http://localhost:4000/api/2fa/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'demo-user', token: verificationCode })
      })
      if (resp.ok){
        const data = await resp.json()
        if (data.verified){
          localStorage.setItem('nexus_2fa_enabled','true')
          localStorage.setItem('nexus_2fa_secret', secret)
          setIsEnabled(true)
          setStep('enabled')
          pushToast('Two-factor authentication enabled successfully','success')
        } else {
          pushToast('Invalid verification code','error')
        }
        setLoading(false)
        return
      }
    }catch(e){ /* fallback to mock verification */ }

    // Fallback: accept any 6-digit for preview
    setTimeout(()=>{
      localStorage.setItem('nexus_2fa_enabled','true')
      localStorage.setItem('nexus_2fa_secret', secret)
      setIsEnabled(true)
      setStep('enabled')
      setLoading(false)
      pushToast('Two-factor authentication enabled (preview mode)','success')
    }, 800)
  }

  const disable2FA = ()=>{
    setLoading(true)
    setTimeout(()=>{
      localStorage.removeItem('nexus_2fa_enabled')
      localStorage.removeItem('nexus_2fa_secret')
      setIsEnabled(false)
      setStep('setup')
      setLoading(false)
      pushToast('Two-factor authentication disabled','info')
    }, 600)
  }

  return (
    <div style={{padding:16}}>
      <h3>Two-Factor Authentication</h3>
      <p style={{color:'#94a3b8'}}>Add an extra layer of security to your account.</p>

      {isEnabled ? (
        <div style={{padding:12,background:'rgba(4,120,87,0.06)',border:'1px solid rgba(4,120,87,0.2)',borderRadius:8,marginTop:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Icon name='check' />
            <span style={{color:'#34d399',fontWeight:600}}>2FA is enabled</span>
          </div>
          <p style={{color:'#c7d2fe'}}>Your account is protected with two-factor authentication.</p>
          <button onClick={disable2FA} disabled={loading} style={{marginTop:8}}>{loading? 'Disabling...':'Disable 2FA'}</button>
        </div>
      ) : step === 'setup' ? (
        <div style={{marginTop:12}}>
          <button onClick={enable2FA} disabled={loading}>{loading? 'Setting up...': 'Enable 2FA'}</button>
        </div>
      ) : step === 'verify' ? (
        <div style={{marginTop:12}}>
          <div style={{textAlign:'center'}}>
            <p>Scan this QR code with your authenticator app:</p>
            <div style={{display:'inline-block',padding:12,background:'#fff',borderRadius:8}}>
              {qrCode ? <img src={qrCode} alt='QR Code' width={160} height={160} /> : <div style={{width:160,height:160,background:'#e6e7eb'}} />}
            </div>
            <p style={{color:'#94a3b8',marginTop:8}}>Or enter this secret manually:</p>
            <code style={{background:'#0b1220',padding:6,borderRadius:6,display:'inline-block'}}>{secret}</code>
          </div>

          <div style={{marginTop:12}}>
            <label>Verification Code</label>
            <input value={verificationCode} onChange={e=>setVerificationCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder='123456' style={{display:'block',padding:8,marginTop:6,width:220}} />
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button onClick={()=>setStep('setup')}>Back</button>
              <button onClick={verify2FA} disabled={loading || verificationCode.length !== 6}>{loading? 'Verifying...':'Verify and Enable'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
