// Clean minimal backend: file-backed comments store + 2FA demo
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const speakeasy = require('speakeasy')
const fs = require('fs')
const path = require('path')

const app = express()
const port = process.env.PORT || 4000
const DATA_DIR = path.join(__dirname, 'data')
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json')

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:8000'] }))
app.use(bodyParser.json())

// In-memory 2FA store
const twofa = {}

// Simple file-backed comments store
let commentsStore = {}
try{
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)
  if(fs.existsSync(COMMENTS_FILE)) commentsStore = JSON.parse(fs.readFileSync(COMMENTS_FILE,'utf8')||'{}')
}catch(e){ console.warn('Failed to load comments store', e); commentsStore = {} }

function saveComments(){ try{ fs.writeFileSync(COMMENTS_FILE, JSON.stringify(commentsStore,null,2)) }catch(e){ console.warn('Failed to save comments', e) } }

// Require an API key for write endpoints. Default for local/dev is 'dev-key'.
const API_KEY = process.env.API_KEY || 'dev-key'
function requireApiKey(req,res,next){ const key = req.headers['x-api-key']||req.query.api_key; if(key===API_KEY) return next(); return res.status(401).json({ok:false}) }

app.get('/health', (req,res)=>res.json({ok:true}))

app.post('/api/2fa/provision', (req,res)=>{
  const { userId='demo-user', email='user@example.com' } = req.body || {}
  const secret = speakeasy.generateSecret({ length: 20, name: `NexusAnalytics:${email}` })
  twofa[userId] = { secret: secret.base32 }
  res.json({ ok:true, secret: secret.base32, otpauth_url: secret.otpauth_url })
})

app.post('/api/2fa/verify', (req,res)=>{
  const { userId='demo-user', token } = req.body || {}
  const entry = twofa[userId]
  if(!entry || !entry.secret) return res.status(404).json({ ok:false, error:'no-secret' })
  const verified = speakeasy.totp.verify({ secret: entry.secret, encoding: 'base32', token, window:1 })
  res.json({ ok:true, verified: !!verified })
})

app.get('/api/comments/:datasetId', (req,res)=>{
  const { datasetId } = req.params
  res.json({ ok:true, comments: commentsStore[datasetId] || [] })
})

app.post('/api/comments/:datasetId', requireApiKey, (req,res)=>{
  const { datasetId } = req.params
  const { user='Anonymous', text='' } = req.body || {}
  if(!text || !text.trim()) return res.status(400).json({ ok:false, error:'empty' })
  const comment = { id: Date.now(), user, text, time: new Date().toISOString(), avatar: (user||'A').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase(), likes:0, liked:false, replies:[] }
  commentsStore[datasetId] = [comment, ...(commentsStore[datasetId]||[])]
  saveComments()
  res.json({ ok:true, comment })
})

app.post('/api/comments/:datasetId/:commentId/reply', requireApiKey, (req,res)=>{
  const { datasetId, commentId } = req.params
  const { user='Anonymous', text='' } = req.body || {}
  if(!text || !text.trim()) return res.status(400).json({ ok:false, error:'empty' })
  const reply = { id: Date.now(), user, text, time: new Date().toISOString(), avatar: (user||'A').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase() }
  commentsStore[datasetId] = (commentsStore[datasetId]||[]).map(c => c.id === Number(commentId) ? { ...c, replies: [...(c.replies||[]), reply] } : c)
  saveComments()
  res.json({ ok:true, reply })
})

app.post('/api/comments/:datasetId/:commentId/toggle-like', requireApiKey, (req,res)=>{
  const { datasetId, commentId } = req.params
  let updated = null
  commentsStore[datasetId] = (commentsStore[datasetId]||[]).map(c => {
    if(String(c.id) === String(commentId)){
      const liked = !c.liked
      const likes = liked ? (c.likes||0) + 1 : Math.max(0, (c.likes||0)-1)
      updated = { ...c, liked, likes }
      return updated
    }
    return c
  })
  saveComments()
  res.json({ ok:true, comment: updated })
})

app.listen(port, ()=>console.log(`2FA backend listening on http://localhost:${port}`))
