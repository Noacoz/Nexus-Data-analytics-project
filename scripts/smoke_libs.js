const fs = require('fs')
const path = require('path')

async function run(){
  try{
    const Papa = require('papaparse')
    const qrcode = require('qrcode')

    console.log('PapaParse version:', require('papaparse/package.json').version)
    console.log('qrcode version:', require('qrcode/package.json').version)

    const csv = 'name,score\nAlice,90\nBob,82\nCarol,95'
    const parsed = Papa.parse(csv, { header: true })
    console.log('Parsed CSV:', parsed.data)

    const dataUrl = await qrcode.toDataURL('https://example.com/test', { width: 200 })
    console.log('QR data URL prefix:', dataUrl.slice(0,30))

    console.log('SMOKE OK')
  }catch(err){
    console.error('SMOKE ERROR', err && err.stack ? err.stack : err)
    process.exitCode = 1
  }
}

run()
