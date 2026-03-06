import fs from 'fs';
const s = fs.readFileSync('server.js', 'utf8');

console.log('=== NEXUS 15-POINT STRUCTURAL VERIFICATION ===\n');

// Check 1: Redis error handler
console.log((s.includes('redis.on("error"') ? '✅ PASS' : '❌ FAIL') + ' | 01 Redis .on(error) handler present');

// Check 2: No chunkCount
console.log((!s.includes('chunkCount') ? '✅ PASS' : '❌ FAIL') + ' | 02 No chunkCount variable anywhere');

// Check 3: No buffer pattern
console.log((!s.includes('let buffer =') ? '✅ PASS' : '❌ FAIL') + ' | 03 No buffer-accumulation pattern');

// Check 4: flushHeaders
console.log((s.includes('res.flushHeaders()') ? '✅ PASS' : '❌ FAIL') + ' | 04 res.flushHeaders() in chat handler');

// Check 5: CORS credentials
console.log((s.includes('credentials: true') ? '✅ PASS' : '❌ FAIL') + ' | 05 CORS has credentials:true');

// Check 6: Single app.listen
let listenCount = (s.match(/app\.listen\s*\(/g) || []).length;
console.log((listenCount === 1 ? '✅ PASS' : '❌ FAIL') + ' | 06 Exactly ONE app.listen() call (found: ' + listenCount + ')');

// Check 7: Single /api/chat handler
let chatCount = (s.match(/app\.post\s*\(\s*['"]\/api\/chat/g) || []).length;
console.log((chatCount === 1 ? '✅ PASS' : '❌ FAIL') + ' | 07 Exactly ONE POST /api/chat handler (found: ' + chatCount + ')');

// Check 8: No pg import
console.log((!s.includes('from "pg"') && !s.includes('from \'pg\'') ? '✅ PASS' : '❌ FAIL') + ' | 08 No pg Pool import');

// Check 9: No express-session
console.log((!s.includes('express-session') ? '✅ PASS' : '❌ FAIL') + ' | 09 No express-session import');

// Check 10: No axios
console.log((!s.includes('import axios') ? '✅ PASS' : '❌ FAIL') + ' | 10 No axios import');

// Check 11: No os/fs
console.log((!s.includes('import os from') && !s.includes('import fs from') ? '✅ PASS' : '❌ FAIL') + ' | 11 No os/fs unused imports');

// Check 12: No Message required
console.log((!s.includes('Message required') ? '✅ PASS' : '❌ FAIL') + ' | 12 No Message-required string');

// Check 13: Supabase before app.get
let createClientPos = s.indexOf('createClient');
let appGetPos = s.indexOf('app.get(');
console.log((createClientPos < appGetPos ? '✅ PASS' : '❌ FAIL') + ' | 13 Supabase createClient before app.get');

// Check 14: CORS before app.post
let corsPos = s.indexOf('app.use(cors');
let appPostPos = s.indexOf('app.post(');
console.log((corsPos < appPostPos ? '✅ PASS' : '❌ FAIL') + ' | 14 app.use(cors) before app.post');

// Check 15: app.listen at bottom
let lastListen = s.lastIndexOf('app.listen');
let lastPost = s.lastIndexOf('app.post(');
console.log((lastListen > lastPost ? '✅ PASS' : '❌ FAIL') + ' | 15 app.listen after all app.post calls');

console.log('\n' + (lastListen > lastPost && corsPos < appPostPos && createClientPos < appGetPos && 
                   !s.includes('Message required') && !s.includes('import os from') && 
                   !s.includes('import axios') && !s.includes('express-session') && 
                   !s.includes('from "pg"') && chatCount === 1 && listenCount === 1 && 
                   s.includes('credentials: true') && s.includes('res.flushHeaders()') && 
                   !s.includes('let buffer =') && !s.includes('chunkCount') && 
                   s.includes('redis.on("error"') ? 
                   '>>> ALL 15 PASSED — SAFE TO START SERVER' : 
                   '>>> ONE OR MORE FAILED — DO NOT START SERVER'));
