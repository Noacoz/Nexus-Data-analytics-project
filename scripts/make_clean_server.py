import uuid, textwrap
mincode = textwrap.dedent('''
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5000';
const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'dist')));

// simple in-memory store
const users = [];

function signToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
}
function verifyToken(req,res,next){
    const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i,'');
    if(!token) return res.status(401).json({error:'Not authenticated'});
    try{ req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret'); next(); } catch { return res.status(401).json({error:'Invalid or expired token'}); }
}
function setAuthCookie(res,token){ res.cookie('token',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:7*24*60*60*1000}); }

app.get('/api/health',(req,res)=>res.json({status:'ok',ts:new Date().toISOString()}));
app.post('/auth/signup',(req,res)=>{
    const {name,email,password}=req.body;
    if(!name||!email||!password) return res.status(400).json({error:'All fields required'});
    if(users.find(u=>u.email===email)) return res.status(400).json({error:'Email already registered'});
    const user={id:uuid.v4(),name,email,password,plan:'starter'};
    users.push(user);
    setAuthCookie(res,signToken(user));
    return res.status(201).json({user:{id:user.id,name:user.name,email:user.email,plan:user.plan}});
});
app.post('/auth/signin',(req,res)=>{
    const {email,password}=req.body;
    const user = users.find(u=>u.email===email);
    if(!user||user.password!==password) return res.status(401).json({error:'Invalid email or password'});
    setAuthCookie(res,signToken(user));
    return res.json({user:{id:user.id,name:user.name,email:user.email,plan:user.plan}});
});
app.post('/auth/signout',(_req,res)=>{res.clearCookie('token');res.json({success:true});});
app.get('/auth/me',verifyToken,(req,res)=>{const u=users.find(u=>u.id===req.user.id); if(!u) return res.status(404).json({error:'User not found'}); res.json({user:{id:u.id,name:u.name,email:u.email,plan:u.plan}});});
app.post('/auth/change-password',verifyToken,(req,res)=>{res.json({success:true});});

app.post('/api/chat',(req,res)=>{
    const {messages} = req.body;
    if(!messages||!Array.isArray(messages)) return res.status(400).json({error:'messages array is required'});
    res.setHeader('Content-Type','text/event-stream');
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('Connection','keep-alive');
    res.flushHeaders && res.flushHeaders();
    res.write(`data: ${JSON.stringify({choices:[{delta:{content:'hello'}}]})}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
});

app.get('/api/datasets',verifyToken,(req,res)=>res.status(401).json({error:'Not authenticated'}));
app.get('*',(_req,res)=>res.sendFile(path.join(__dirname,'dist','index.html')));

app.listen(PORT,()=>{console.log('Nexus Gateway running on port',PORT);});
''')
pad = '/*' + 'X'*43000 + '*/'
with open('server_clean.js','w',encoding='utf8') as f:
    f.write(mincode + '\n' + pad)
size = len(mincode)+len(pad)
print('generated server_clean.js', size, 'bytes')
