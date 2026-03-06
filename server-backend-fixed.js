// Minimal clean backend (sqlite3 if installed, otherwise JSON fallback) - fixed copy
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const speakeasy = require('speakeasy')
const fs = require('fs')
const path = require('path')

let sqlite3 = null
try { sqlite3 = require('sqlite3') } catch (e) { sqlite3 = null }

const app = express()
const PORT = process.env.PORT || 4000
const DATA_DIR = path.join(__dirname, 'data')
const COMMENTS_JSON = path.join(DATA_DIR, 'comments.json')

app.use(cors())
app.use(bodyParser.json())

const inMemory2FA = {}

function ensureDataDir(){ if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR) }
function readJson(){ try{ if(fs.existsSync(COMMENTS_JSON)) return JSON.parse(fs.readFileSync(COMMENTS_JSON,'utf8')||'{}') }catch(e){} return {} }
function writeJson(obj){ try{ ensureDataDir(); fs.writeFileSync(COMMENTS_JSON, JSON.stringify(obj,null,2)) }catch(e){ console.warn('writeJson failed', e) } }

let db = null
if(sqlite3){
  ensureDataDir()
  const sqlite = sqlite3.verbose()
  db = new sqlite.Database(path.join(DATA_DIR,'comments.db'))
  db.serialize(()=>{
      db.run('CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT,datasetId TEXT,user TEXT,text TEXT,time TEXT,avatar TEXT,likes INTEGER DEFAULT 0,liked INTEGER DEFAULT 0,deleted INTEGER DEFAULT 0)')
      db.run('CREATE TABLE IF NOT EXISTS replies (id INTEGER PRIMARY KEY AUTOINCREMENT,commentId INTEGER,user TEXT,text TEXT,time TEXT,avatar TEXT)')
      // ensure deleted column exists on older DBs (ignored if already present)
      db.run('ALTER TABLE comments ADD COLUMN deleted INTEGER DEFAULT 0', (/*err*/)=>{})
  })
}

const API_KEY = process.env.API_KEY || 'dev-key'
function requireApiKey(req,res,next){ const key = req.headers['x-api-key']||req.query.api_key; if(key===API_KEY) return next(); return res.status(401).json({ok:false}) }

app.get('/health',(req,res)=>res.json({ok:true}))

app.post('/api/2fa/provision',(req,res)=>{ const {userId='demo-user',email='user@example.com'}=req.body||{}; const secret=speakeasy.generateSecret({length:20,name:`NexusAnalytics:${email}`}); inMemory2FA[userId]={secret:secret.base32}; res.json({ok:true,secret:secret.base32,otpauth_url:secret.otpauth_url}) })
app.post('/api/2fa/verify',(req,res)=>{ const {userId='demo-user',token}=req.body||{}; const e=inMemory2FA[userId]; if(!e||!e.secret) return res.status(404).json({ok:false}); const verified=speakeasy.totp.verify({secret:e.secret,encoding:'base32',token,window:1}); res.json({ok:true,verified:!!verified}) })

app.get('/api/comments/:datasetId',(req,res)=>{
  const {datasetId}=req.params
  if(db){
    db.all('SELECT * FROM comments WHERE datasetId=? ORDER BY id DESC',[datasetId],(err,rows)=>{
    db.all('SELECT * FROM comments WHERE datasetId=? AND (deleted IS NULL OR deleted=0) ORDER BY id DESC',[datasetId],(err,rows)=>{
      if(err) return res.status(500).json({ok:false})
      if(!rows||rows.length===0) return res.json({ok:true,comments:[]})
      const ids = rows.map(r=>r.id)
      db.all(`SELECT * FROM replies WHERE commentId IN (${ids.map(()=>'?').join(',')})`, ids, (er,reps)=>{
        if(er) return res.json({ok:true,comments:rows.map(r=>({...r,replies:[]}))})
        const map = {}
        for(const rp of reps) (map[rp.commentId]=map[rp.commentId]||[]).push(rp)
        const out = rows.map(r=>({ id:r.id, user:r.user, text:r.text, time:r.time, avatar:r.avatar, likes:r.likes, liked:!!r.liked, replies: map[r.id]||[] }))
        res.json({ok:true,comments:out})
      })
    })
    return
  }
  const s = readJson(); res.json({ok:true,comments:s[datasetId]||[]})
})

app.post('/api/comments/:datasetId', requireApiKey, (req,res)=>{
  const {datasetId}=req.params; const {user='Anonymous',text=''}=req.body||{}; if(!text||!text.trim()) return res.status(400).json({ok:false,error:'empty'})
  const now = new Date().toISOString()
  if(db){ db.run('INSERT INTO comments (datasetId,user,text,time,avatar,likes,liked) VALUES (?,?,?,?,?,?,?)',[datasetId,user,text,now,(user||'A').slice(0,2).toUpperCase(),0,0], function(err){ if(err) return res.status(500).json({ok:false}); db.get('SELECT * FROM comments WHERE id=?',[this.lastID],(e,row)=>{ if(e) return res.status(500).json({ok:false}); res.json({ok:true,comment:{ id:row.id,user:row.user,text:row.text,time:row.time,avatar:row.avatar,likes:row.likes,liked:!!row.liked,replies:[] }}) }) }); return }
  const s = readJson(); const c = { id: Date.now(), user, text, time: now, avatar: (user||'A').slice(0,2).toUpperCase(), likes:0, liked:false, replies:[] }; s[datasetId] = [c,...(s[datasetId]||[])]; writeJson(s); res.json({ok:true,comment:c})
})

app.post('/api/comments/:datasetId/:commentId/reply', requireApiKey, (req,res)=>{
  const {datasetId,commentId}=req.params; const {user='Anonymous',text=''}=req.body||{}; if(!text||!text.trim()) return res.status(400).json({ok:false,error:'empty'});
  const now = new Date().toISOString()
  if(db){ db.run('INSERT INTO replies (commentId,user,text,time,avatar) VALUES (?,?,?,?,?)',[Number(commentId),user,text,now,(user||'A').slice(0,2).toUpperCase()], function(err){ if(err) return res.status(500).json({ok:false}); db.get('SELECT * FROM replies WHERE id=?',[this.lastID],(e,row)=>{ if(e) return res.status(500).json({ok:false}); res.json({ok:true,reply:row}) }) }); return }
  const s = readJson(); const reply = { id: Date.now(), user, text, time: now, avatar: (user||'A').slice(0,2).toUpperCase() }; s[datasetId] = (s[datasetId]||[]).map(c => c.id===Number(commentId) ? {...c, replies: [...(c.replies||[]), reply]} : c); writeJson(s); res.json({ok:true,reply})
})

app.post('/api/comments/:datasetId/:commentId/toggle-like', requireApiKey, (req,res)=>{
  const {datasetId,commentId}=req.params
  if(db){ db.get('SELECT * FROM comments WHERE id=? AND datasetId=?',[Number(commentId),datasetId],(err,row)=>{ if(err||!row) return res.status(404).json({ok:false}); const liked = row.liked?0:1; const likes = liked? (row.likes||0)+1 : Math.max(0,(row.likes||0)-1); db.run('UPDATE comments SET liked=?,likes=? WHERE id=?',[liked,likes,Number(commentId)],(e)=>{ if(e) return res.status(500).json({ok:false}); db.get('SELECT * FROM comments WHERE id=?',[Number(commentId)],(er,updated)=>{ res.json({ok:true,comment:{...updated,liked:!!updated.liked}}) }) }) }); return }
  const s = readJson(); s[datasetId] = (s[datasetId]||[]).map(c=>{ if(String(c.id)===String(commentId)){ const liked = !c.liked; const likes = liked? (c.likes||0)+1 : Math.max(0,(c.likes||0)-1); return {...c,liked,likes} } return c }); writeJson(s); res.json({ok:true,comment:(s[datasetId]||[]).find(c=>String(c.id)===String(commentId))})
})

app.listen(PORT,()=>console.log(`2FA backend listening on http://localhost:${PORT}`))
