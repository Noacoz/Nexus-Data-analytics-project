const fs = require('fs');
const s = fs.readFileSync('server.js', 'utf8');
const results = {
  '01 Redis .on(error) handler present':       s.includes("redis.on('error'"),
  '02 No chunkCount variable anywhere':        !s.includes('chunkCount'),
  '03 No buffer-accumulation pattern':         !s.includes('let buffer ='),
  '04 res.flushHeaders() in chat handler':     s.includes('res.flushHeaders()'),
  '05 CORS has credentials:true':              s.includes('credentials: true'),
  '06 Exactly ONE app.listen() call':          (s.match(/app\.listen\s*\(/g)||[]).length === 1,
  '07 Exactly ONE POST /api/chat handler':     (s.match(/app\.post\s*\(\s*[\'"]\/api\/chat/g)||[]).length === 1,
  '08 No pg Pool import':                      !s.includes("from 'pg'") && !s.includes('from "pg"'),
  '09 No express-session import':              !s.includes('express-session'),
  '10 No axios import':                        !s.includes('import axios'),
  '11 No os/fs unused imports':                !s.includes('import os from') && !s.includes('import fs from'),
  '12 No Message-required string':             !s.includes('Message required'),
  '13 Supabase createClient before app.get':   s.indexOf('createClient') < s.indexOf('app.get('),
  '14 app.use(cors) before app.post':          s.indexOf('app.use(cors') < s.indexOf('app.post('),
  '15 app.listen after all app.post calls':    s.lastIndexOf('app.listen') > s.lastIndexOf('app.post('),
};
let pass = true;
console.log('\n=== NEXUS 15-POINT STRUCTURAL VERIFICATION ===\n');
for (const [k, v] of Object.entries(results)) {
  console.log((v ? 'PASS' : 'FAIL') + ' | ' + k);
  if (!v) pass = false;
}
console.log('');
console.log(pass ? '>>> ALL 15 PASSED — SAFE TO START SERVER' : '>>> ONE OR MORE FAILED — DO NOT START SERVER');
