const Papa = require('papaparse')
const qrcode = require('qrcode')
const http = require('http')

async function libsCheck(){
  console.log('PapaParse version:', require('papaparse/package.json').version)
  console.log('qrcode version:', require('qrcode/package.json').version)
  const csv = 'name,score\nAlice,90\nBob,82\nCarol,95'
  const parsed = Papa.parse(csv, { header: true })
  console.log('Parsed CSV rows:', parsed.data.length)
  const dataUrl = await qrcode.toDataURL('https://example.com/test', { width: 200 })
  console.log('QR prefix:', dataUrl.slice(0,30))
}

function serverCheck(){
  return new Promise((resolve)=>{
    http.get('http://localhost:5173/', (res)=>{
      console.log('HTTP', res.statusCode)
      res.resume()
      resolve()
    }).on('error', (err)=>{ console.log('ERR', err.message); resolve() })
  })
}

(async ()=>{
  try{
    await libsCheck()
    await serverCheck()
    console.log('SMOKE_ALL OK')
  }catch(e){ console.error('SMOKE_ALL ERR', e); process.exitCode=1 }
})()
