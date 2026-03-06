import fs from 'fs';
const s = fs.readFileSync('server.js','utf8');
console.log('=== NEXUS 15-POINT VERIFICATION ===\n');
const checks = [
  ['Redis error handler', s.includes('redis.on("error"')],
  ['No chunkCount', !s.includes('chunkCount')],
  ['No buffer approach', !s.includes('let buffer =')],
  ['flushHeaders present', s.includes('res.flushHeaders()')],
  ['CORS credentials:true', s.includes('credentials: true')],
  ['Single app.listen', (s.match(/app\.listen\(/g)||[]).length === 1],
  ['Single /api/chat', (s.match(/app\.post\([\/"]\/api\/chat/g)||[]).length === 1],
  ['No pg import', !s.includes('from "pg"')],
  ['No express-session', !s.includes('express-session')],
  ['No axios', !s.includes('import axios')],
  ['No os/fs', !s.includes('import os from') && !s.includes('import fs from')],
  ['No Message required', !s.includes('Message required')]
];
checks.forEach(([name, result]) => {
  console.log(result ? '✅ PASS' : '❌ FAIL', name);
});
