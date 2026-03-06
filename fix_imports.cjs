const fs = require('fs');
const lines = fs.readFileSync('server.js', 'utf8').split('\n');
const seen = new Set();
const out = lines.filter(line => {
  const t = line.trim();
  if (!t.startsWith('import ')) return true;
  if (seen.has(t)) return false;
  seen.add(t);
  return true;
});
fs.writeFileSync('server.js', out.join('\n'), 'utf8');
console.log('Done - duplicates removed');
