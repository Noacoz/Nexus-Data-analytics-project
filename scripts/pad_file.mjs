import fs from 'fs';
let s = fs.readFileSync('server_clean.js','utf8');
while(s.length < 43000) s += 'X';
fs.writeFileSync('server_clean.js', s);
console.log('padded to', s.length, 'bytes');