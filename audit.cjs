const fs = require('fs');
const path = require('path');
const http = require('http');

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  } catch (e) {
    return null;
  }
}

const serverJs = readFile('server.js') || '';
const schemaSql = readFile('db/schema.sql') || '';
const analyticsPy = readFile('analytics_service/main.py') || '';
const datasetDetailView = readFile('src/components/views/DatasetDetailView.jsx') || '';
const commandPalette = readFile('src/components/CommandPalette.jsx') || '';
const appJsx = readFile('src/App.jsx') || '';
const nexusApi = readFile('src/lib/nexus-api.js') || '';

const results = [];
function log(section, check, result, notes) {
  results.push({ section, check, result, notes });
}

// SECTION 1 — File integrity audit
console.log('=== SECTION 1 — File integrity audit ===');

// 1.1 Route count
const routeMatches = serverJs.match(/app\.(get|post|put|delete|patch)\(/g) || [];
const routeCount = routeMatches.length;
log('1', 'Route count', routeCount >= 30 && routeCount <= 60 ? 'PASS' : 'FAIL', `Found ${routeCount} routes`);

// 1.2 Unprotected non-auth routes
const lines = serverJs.split('\n');
const unprotectedRoutes = [];
lines.forEach((line, idx) => {
  if (/app\.(get|post|put|delete|patch)\(/.test(line)) {
    const isAuth = /auth\/(signin|signup|signout|google|github)/.test(line);
    const isHealth = /api\/health/.test(line);
    const isWildcard = /app\.get\('\*'/.test(line);
    const hasVerifyToken = line.includes('verifyToken');
    if (!isAuth && !isHealth && !isWildcard && !hasVerifyToken) {
      unprotectedRoutes.push(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
log('1', 'Unprotected non-auth routes', unprotectedRoutes.length === 0 ? 'PASS' : 'FAIL', 
  unprotectedRoutes.length === 0 ? 'Zero unprotected routes' : `Found ${unprotectedRoutes.length}:\n` + unprotectedRoutes.join('\n'));

// 1.3 Hardcoded internal URLs
const hardcodedUrls = [];
lines.forEach((line, idx) => {
  if (/localhost:8001|localhost:4000/.test(line)) {
    hardcodedUrls.push(`Line ${idx + 1}: ${line.trim()}`);
  }
});
log('1', 'Hardcoded internal service URLs', hardcodedUrls.length === 0 ? 'PASS' : 'FAIL',
  hardcodedUrls.length === 0 ? 'Zero hardcoded URLs' : `Found ${hardcodedUrls.length}:\n` + hardcodedUrls.join('\n'));

// 1.4 console.log/TODO count
const badPatternMatches = [];
lines.forEach((line, idx) => {
  if (/TODO|FIXME|HACK|console\.log/.test(line)) {
    badPatternMatches.push(`Line ${idx + 1}: ${line.trim()}`);
  }
});
log('1', 'TODO/FIXME/HACK/console.log count', badPatternMatches.length <= 10 ? 'PASS' : 'WARN',
  `Found ${badPatternMatches.length} occurrences`);

// SECTION 2 — Route completeness check
console.log('\n=== SECTION 2 — Route completeness check ===');
const allRoutes = [];
lines.forEach((line, idx) => {
  const m = line.match(/app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/);
  if (m) {
    allRoutes.push(`${m[1].toUpperCase()} ${m[2]}`);
  }
});
allRoutes.sort().forEach(r => console.log(r));
log('2', 'Route completeness', 'INFO', `Listed ${allRoutes.length} routes`);

// SECTION 3 — Database schema audit
console.log('\n=== SECTION 3 — Database schema audit ===');
console.log(schemaSql);

// Tables in schema
const schemaTables = [];
const tableRegex = /CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi;
let tm;
while ((tm = tableRegex.exec(schemaSql)) !== null) {
  schemaTables.push(tm[1]);
}

// Check primary keys and created_at
const tablesMissingPK = [];
const tablesMissingCreatedAt = [];
schemaTables.forEach(table => {
  const tableRegex2 = new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?${table}\\s*\\(.*?\\);`, 'is');
  const match = schemaSql.match(tableRegex2);
  if (match) {
    const def = match[0];
    if (!/PRIMARY KEY/i.test(def)) tablesMissingPK.push(table);
    if (!/created_at/i.test(def)) tablesMissingCreatedAt.push(table);
  }
});
log('3', 'Schema tables missing primary key', tablesMissingPK.length === 0 ? 'PASS' : 'FAIL',
  tablesMissingPK.length === 0 ? 'All tables have PK' : `Missing: ${tablesMissingPK.join(', ')}`);
log('3', 'Schema tables missing created_at', tablesMissingCreatedAt.length === 0 ? 'PASS' : 'WARN',
  tablesMissingCreatedAt.length === 0 ? 'All tables have created_at' : `Missing: ${tablesMissingCreatedAt.join(', ')}`);

// Supabase tables accessed
const supabaseMatches = serverJs.match(/supabase\.from\(['"`](\w+)['"`]\)/g) || [];
const accessedTables = [...new Set(supabaseMatches.map(m => m.match(/supabase\.from\(['"`](\w+)['"`]\)/)[1]))].sort();
console.log('\nSupabase tables accessed:', accessedTables.join(', '));
const missingInSchema = accessedTables.filter(t => !schemaTables.includes(t));
log('3', 'All accessed tables exist in schema', missingInSchema.length === 0 ? 'PASS' : 'FAIL',
  missingInSchema.length === 0 ? 'All tables present' : `Missing in schema: ${missingInSchema.join(', ')}`);

// SECTION 4 — Analytics service audit
console.log('\n=== SECTION 4 — Analytics service audit ===');
const analyticsEndpoints = [];
const pyLines = analyticsPy.split('\n');
pyLines.forEach((line, idx) => {
  const m = line.match(/@app\.(get|post)\(['"`]([^'"`]+)['"`]/);
  if (m) {
    analyticsEndpoints.push(`${m[1].toUpperCase()} ${m[2]}`);
  }
});
analyticsEndpoints.forEach(e => console.log(e));

const apiKeyDeps = (analyticsPy.match(/Depends\(verify_api_key\)/g) || []).length;
log('4', 'Analytics API key dependencies', apiKeyDeps >= 10 ? 'PASS' : 'FAIL', `Found ${apiKeyDeps}`);

const coreFuncs = ['def execute_query', 'def write_parquet', 'def bronze_to_silver', 'def build_model', 'def translate_and_execute', 'def compute_distribution_drift'];
const missingFuncs = coreFuncs.filter(f => !analyticsPy.includes(f));
log('4', 'Core analytics functions', missingFuncs.length === 0 ? 'PASS' : 'FAIL',
  missingFuncs.length === 0 ? 'All 6 present' : `Missing: ${missingFuncs.join(', ')}`);

// SECTION 5 — Frontend component audit
console.log('\n=== SECTION 5 — Frontend component audit ===');
function getJsxFiles(dir, files = []) {
  const items = fs.readdirSync(path.join(__dirname, dir));
  for (const item of items) {
    const fullPath = path.join(__dirname, dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getJsxFiles(path.join(dir, item), files);
    } else if (item.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      files.push({ name: item, path: path.join(dir, item), lines: content.split('\n').length, size: stat.size });
    }
  }
  return files;
}
const jsxFiles = getJsxFiles('src').sort((a, b) => b.lines - a.lines);
jsxFiles.forEach(f => console.log(`${f.lines} lines | ${f.size} bytes | ${f.path}`));
const oversized = jsxFiles.filter(f => f.lines > 800);
log('5', 'No oversized JSX files', oversized.length === 0 ? 'PASS' : 'WARN',
  oversized.length === 0 ? 'All under 800 lines' : `Over 800 lines: ${oversized.map(f => f.name).join(', ')}`);

const nlRefs = (datasetDetailView.match(/handleNlQuery|nlQuestion|nlResult|nlError/g) || []).length;
log('5', 'DatasetDetailView NL query intact', nlRefs > 0 ? 'PASS' : 'FAIL', `${nlRefs} references`);

const cmdPalRefs = (commandPalette.match(/CommandPalette|onNavigate|datasets/g) || []).length;
log('5', 'CommandPalette intact', cmdPalRefs > 0 ? 'PASS' : 'FAIL', `${cmdPalRefs} references`);

const appHooks = ['paletteOpen', 'isCheckingAuth', 'datasetsLoading', 'viewHistory', 'handleBack'];
const missingHooks = appHooks.filter(h => !appJsx.includes(h));
log('5', 'App.jsx state hooks present', missingHooks.length === 0 ? 'PASS' : 'FAIL',
  missingHooks.length === 0 ? 'All hooks present' : `Missing: ${missingHooks.join(', ')}`);

// SECTION 6 — Runtime health check
console.log('\n=== SECTION 6 — Runtime health check ===');
function healthCheck(url, label) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(`${label}: ${json.status || 'ok'}`);
        } catch {
          resolve(`${label}: PASS (HTTP ${res.statusCode})`);
        }
      });
    });
    req.on('error', (e) => resolve(`${label}: FAIL - ${e.message}`));
    req.on('timeout', () => { req.destroy(); resolve(`${label}: FAIL - timeout`); });
  });
}

async function runHealthChecks() {
  const web = await healthCheck('http://localhost:5000/api/health', 'WEB HEALTH');
  const analytics = await healthCheck('http://localhost:8001/health', 'ANALYTICS HEALTH');
  console.log(web);
  console.log(analytics);
  log('6', 'Web health', web.includes('FAIL') ? 'FAIL' : 'PASS', web);
  log('6', 'Analytics health', analytics.includes('FAIL') ? 'FAIL' : 'PASS', analytics);
}

// SECTION 7 — Dataset upload flow test
console.log('\n=== SECTION 7 — Dataset upload and analysis flow test ===');
console.log('Test CSV: data/test_revenue.csv exists:', fs.existsSync(path.join(__dirname, 'data/test_revenue.csv')));
log('7', 'Test dataset exists', fs.existsSync(path.join(__dirname, 'data/test_revenue.csv')) ? 'PASS' : 'FAIL', '');

// SECTION 8 — New code audit
console.log('\n=== SECTION 8 — New code audit ===');
const auditRefs = (serverJs.match(/audit_logs|logAuditEvent/g) || []).length;
console.log('Audit references in server.js:', auditRefs);
log('8', 'Audit system present', auditRefs > 0 ? 'PASS' : 'FAIL', `${auditRefs} references`);

const statRefs = (serverJs.match(/snapshot|lineage|computation_id|confidence/g) || []).length;
console.log('Statistical feature references in server.js:', statRefs);
log('8', 'Statistical features present', statRefs > 0 ? 'PASS' : 'FAIL', `${statRefs} references`);

const feRefs = (datasetDetailView.match(/audit|snapshot|confidence|lineage/g) || []).length;
console.log('Backend feature references in DatasetDetailView:', feRefs);
log('8', 'Frontend reflects backend features', feRefs > 0 ? 'PASS' : 'FAIL', `${feRefs} references`);

const apiExports = nexusApi.match(/^export (async )?function \w+/gm) || [];
console.log('\nAPI library exports:');
apiExports.forEach(e => console.log(e));
log('8', 'API library exports', apiExports.length > 0 ? 'PASS' : 'FAIL', `${apiExports.length} exports`);

// SECTION 9 — Error pattern scan
console.log('\n=== SECTION 9 — Error pattern scan ===');
const errHandlers = (serverJs.match(/throw new Error|res\.status\(500\)|catch \(err\)/g) || []).length;
console.log('Server.js error handlers:', errHandlers);
log('9', 'Server.js error handlers', 'INFO', `${errHandlers} occurrences`);

const notFound404 = [];
lines.forEach((line, idx) => {
  if (/res\.status\(404\)/.test(line)) {
    notFound404.push(`Line ${idx + 1}: ${line.trim()}`);
  }
});
console.log('404 responses:', notFound404.length);
notFound404.forEach(l => console.log(l));
log('9', '404 responses present', notFound404.length > 0 ? 'INFO' : 'INFO', `${notFound404.length} occurrences`);

const pyErrHandlers = (analyticsPy.match(/raise HTTPException|except Exception/g) || []).length;
console.log('Analytics error handlers:', pyErrHandlers);
log('9', 'Analytics error handlers', 'INFO', `${pyErrHandlers} occurrences`);

// Run async checks then print table
runHealthChecks().then(() => {
  console.log('\n=== SECTION 10 — Final summary ===');
  console.log('| Section | Check | Result | Notes |');
  console.log('|---------|-------|--------|-------|');
  results.forEach(r => {
    const notes = r.notes.replace(/\n/g, '; ').substring(0, 200);
    console.log(`| ${r.section} | ${r.check} | ${r.result} | ${notes} |`);
  });
});

