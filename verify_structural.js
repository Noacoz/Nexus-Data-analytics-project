const fs = require('fs');
const s = fs.readFileSync('server.js','utf8');
const checks = {
  'Redis error handler': s.includes('redis.on("error"'),
  'No chunkCount': !s.includes('chunkCount'),
  'No buffer approach': !s.includes('let buffer ='),
  'flushHeaders present': s.includes('res.flushHeaders()'),
  'credentials:true in CORS': s.includes('credentials: true'),
  'Single app.listen': (s.match(/app\.listen\(/g)||[]).length === 1,
  'Single /api/chat': (s.match(/app\.post\(["']\/api\/chat/g)||[]).length === 1,
  'No Pool import': !s.includes('from "pg"'),
  'No session import': !s.includes('from "express-session"'),
  'Supabase before routes': s.indexOf('createClient') < s.indexOf('app.post'),
  'Middleware before routes': s.indexOf('app.use(cors') < s.indexOf('app.post'),
  'app.listen at bottom': s.indexOf('app.listen(') > s.indexOf('app.post("/api/chat"'),
};
let pass = true;
for (const [k,v] of Object.entries(checks)) {
  const icon = v ? '' : '';
  if (!v) pass = false;
  console.log(icon, k);
}
console.log('');
console.log(pass ? ' ALL CHECKS PASSED' : ' SOME CHECKS FAILED  DO NOT START SERVER');
