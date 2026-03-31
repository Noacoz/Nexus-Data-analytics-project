/**
 * NEXUS ANALYTICS — GATEWAY SERVER (CANONICAL CLEAN VERSION v3.1)
 * Stack: Express 4 + Supabase + Groq llama-3.3-70b + ioredis
 */

import express      from 'express';
import cors         from 'cors';
import dotenv       from 'dotenv';
import multer       from 'multer';
import { parse as csvParse }             from 'csv-parse/sync';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';
import Redis        from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';
import jwt          from 'jsonwebtoken';
import bcrypt       from 'bcryptjs';
import path         from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT       = process.env.PORT       || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5000';

const redis = new Redis({
  host:          process.env.REDIS_HOST || 'localhost',
  port:          Number(process.env.REDIS_PORT) || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect:   true,
});
redis.on('error', (err) =>
  console.warn('[Redis] non-fatal connection error:', err.message)
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only CSV, Excel, and JSON files are allowed'));
  },
});

const app = express();

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const setAuthCookie = (res, token) =>
  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });

function parseFile(buffer, mimetype, originalname) {
  if (!mimetype || !originalname) throw new Error('Missing mimetype or filename');
  if (mimetype === 'text/csv' || originalname.endsWith('.csv'))
    return csvParse(buffer.toString(), { columns: true, skip_empty_lines: true, trim: true });
  if (mimetype.includes('spreadsheet') || mimetype.includes('excel') || originalname.endsWith('.xlsx') || originalname.endsWith('.xls')) {
    const wb = xlsxRead(buffer);
    return xlsxUtils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  }
  if (mimetype === 'application/json' || originalname.endsWith('.json')) {
    const parsed = JSON.parse(buffer.toString());
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  throw new Error('Unsupported file format. Use CSV, Excel (.xlsx), or JSON.');
}

async function generateDatasetInsights(datasetId, datasetName, fileFormat, userId) {
  try {
    const prompt = `You are a senior data analyst. A user uploaded a dataset called "${datasetName}" (${fileFormat} format) to Nexus Analytics. Generate exactly 4 realistic, specific AI insights. Return ONLY a valid JSON array — no markdown, no explanation, no code fences:
[
  {"title":"specific title","content":"Two concrete data-driven sentences.","type":"trend","border_color":"cyan"},
  {"title":"specific title","content":"Two concrete data-driven sentences.","type":"anomaly","border_color":"purple"},
  {"title":"specific title","content":"Two concrete data-driven sentences.","type":"recommendation","border_color":"green"},
  {"title":"specific title","content":"Two concrete data-driven sentences.","type":"pattern","border_color":"yellow"}
]`;
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 700, stream: false, temperature: 0.7 }),
    });
    if (!groqRes.ok) throw new Error(`Groq API returned ${groqRes.status}`);
    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content || '[]';
    const insights = JSON.parse(raw.replace(/```json|```/gi, '').trim());
    if (!Array.isArray(insights) || insights.length === 0) throw new Error('Invalid insights array');
    await supabase.from('insights').insert(insights.map((i) => ({ dataset_id: datasetId, ...i })));
    await supabase.from('notifications').insert({ user_id: userId, title: 'AI insights ready', message: `${insights.length} insights generated for "${datasetName}". Click to view.`, type: 'insight' });
  } catch (err) {
    console.error('[Insights] Generation failed:', err.message);
    await supabase.from('insights').insert([{ dataset_id: datasetId, title: 'Dataset processed successfully', content: 'Your dataset has been uploaded and is ready for analysis.', type: 'general', border_color: 'cyan' }]);
  }
}

const NEXUS_SYSTEM_PROMPT = `You are Nex — a senior data analytics engineer embedded inside Nexus Analytics. You have deep expertise in data engineering, statistical analysis, business intelligence, and machine learning. You think like a principal data scientist, communicate like a trusted colleague, and you get straight to what matters.

You are NOT a generic chatbot. You are a domain expert.

## IDENTITY AND TONE
- Warm, sharp, and direct — like a brilliant senior colleague who genuinely wants to help
- Confident without being arrogant. Precise without being cold.
- You never say "Great question!", "Certainly!", "Of course!", or "As an AI"
- You never ask multiple questions at once — one focused question maximum per reply
- You match the user's energy: casual when they're casual, technical when they need depth
- You reason out loud on complex problems — show brief thinking before conclusions

## GREETING BEHAVIOR — STRICTLY ENFORCED
When a user says Hi, Hello, Hey, or any casual opener:
- Greet them warmly and genuinely, like a person — not like a help desk
- Introduce yourself in ONE sentence
- Offer ONE clear opening — not a list of options

CORRECT: "Hey, good to meet you! I'm Nex — your analytics co-pilot here. Whether you're knee-deep in a dataset or just getting started, I've got you. What are we working on?"
CORRECT: "Hi there! Nex here — senior data analyst, at your service. What's on your plate today?"

WRONG (never do this): "How can I help you with Nexus Analytics today? Do you have questions about a feature, need help with data analysis, or want to troubleshoot an issue?"

## HOW YOU THINK ABOUT DATA PROBLEMS
When a user shares a business or data problem, you approach it like a senior analyst:
1. Identify the problem type: descriptive, diagnostic, predictive, or prescriptive
2. Ask the ONE most important clarifying question if needed
3. Recommend a specific analytical approach with your reasoning
4. Explain what the output will reveal and why it matters for the decision

You are fluent in:
- EDA: distributions, outliers, correlation, missing data, cardinality, skew
- Business metrics: CAC, LTV, churn, MRR, ARR, DAU/MAU, retention cohorts, conversion funnels
- Statistics: significance testing, confidence intervals, regression, clustering, segmentation, A/B testing
- Data quality: schema issues, duplicates, data drift, sampling bias, null patterns
- Visualization: which chart fits which question and why — you never suggest a pie chart for time series
- SQL: window functions, CTEs, aggregations, self-joins — you write real queries, not pseudocode
- Industry benchmarks: you know what healthy SaaS churn looks like, what a normal LTV:CAC ratio is, what good e-commerce conversion rates are

## INTELLIGENT FOLLOW-UP QUESTIONS
When you need context, ask the single most important question — make it specific:

GOOD: "What time period does this cover — and is this monthly revenue or transaction-level data?"
GOOD: "Is the drop happening across all user segments or concentrated in one cohort?"
GOOD: "Before I suggest a model — what decision will this analysis drive? That changes everything."
BAD: "What kind of data do you have?" (too vague)
BAD: Asking two questions in one reply

## NEXUS PLATFORM KNOWLEDGE
- Upload: CSV, Excel (.xlsx), JSON — up to 100MB per file
- AI insights generated automatically after every upload
- Visualizations: line, bar, scatter, heatmap, funnel, cohort charts
- Anomaly detection, trend recognition, pattern analysis
- Natural language querying — ask questions about data in plain English
- Team collaboration: shared datasets, comments, co-editing
- Automated scheduled reports: PDF, CSV, Excel export
- RBAC and full audit logs
- REST API for custom pipelines and integrations

## PRICING
- Starter (Free): 1 dataset, basic analytics, 5 visualizations, 7-day Pro trial
- Professional ($79/month or $65/month annually): 20 datasets, advanced analytics, unlimited visualizations, 5-member team, API access
- Enterprise ($149/month or $125/month annually): Unlimited datasets, ML insights, custom IAM, SSO/SAML, SLA support
- Annual billing: 20% savings on all paid plans

## RESPONSE FORMAT
- Lead with the answer — never with preamble or pleasantries mid-conversation
- Bullets only for genuine lists of 3+ items
- Numbered steps for sequential instructions
- Code blocks for all SQL, Python, or JSON
- Under 200 words unless complexity genuinely requires more
- Never fabricate statistics — if uncertain, say so and reason from principles
- Escalate unresolvable issues to support@nexusanalytics.com`;

// ROUTES

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase.from('users').insert({ name, email, password_hash, provider: 'email' }).select().single();
    if (error) { console.error('[signup]', error.message); return res.status(500).json({ error: 'Failed to create account' }); }
    supabase.from('notifications').insert({ user_id: user.id, title: 'Welcome to Nexus Analytics!', message: 'Your account is ready. Upload your first dataset to get AI-powered insights.', type: 'system' }).catch(console.error);
    setAuthCookie(res, signToken(user));
    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, plan: user.plan || 'starter' } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid email or password' });
    if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });
    setAuthCookie(res, signToken(user));
    return res.json({ user: { id: user.id, name: user.name, email: user.email, plan: user.plan || 'starter', avatar_url: user.avatar_url } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error during signin' });
  }
});

app.post('/auth/signout', (_req, res) => { res.clearCookie('token'); return res.json({ success: true }); });

app.get('/auth/me', verifyToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: { id: user.id, name: user.name, email: user.email, plan: user.plan || 'starter', avatar_url: user.avatar_url, role: user.role, bio: user.bio } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user?.password_hash) return res.status(400).json({ error: 'Cannot change password for OAuth accounts' });
    if (!await bcrypt.compare(currentPassword, user.password_hash)) return res.status(401).json({ error: 'Current password is incorrect' });
    await supabase.from('users').update({ password_hash: await bcrypt.hash(newPassword, 12) }).eq('id', req.user.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/auth/google', (_req, res) => {
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: `${CLIENT_URL}/auth/google/callback`, response_type: 'code', scope: 'openid email profile', access_type: 'offline', prompt: 'select_account' });
  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.redirect('/?auth_error=google_denied');
  try {
    const tokens = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: `${CLIENT_URL}/auth/google/callback`, grant_type: 'authorization_code' }) })).json();
    if (!tokens.access_token) return res.redirect('/?auth_error=google_token_failed');
    const gu = await (await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } })).json();
    let { data: user } = await supabase.from('users').select('*').eq('email', gu.email).maybeSingle();
    if (!user) {
      const { data: nu, error: ce } = await supabase.from('users').insert({ name: gu.name, email: gu.email, avatar_url: gu.picture, provider: 'google', provider_id: gu.sub }).select().single();
      if (ce) return res.redirect('/?auth_error=db_error');
      user = nu;
      supabase.from('notifications').insert({ user_id: user.id, title: 'Welcome to Nexus Analytics!', message: 'Signed in with Google.', type: 'system' }).catch(console.error);
    } else {
      supabase.from('users').update({ avatar_url: gu.picture }).eq('id', user.id).catch(console.error);
    }
    setAuthCookie(res, signToken(user));
    return res.redirect('/?auth_success=true');
  } catch (err) {
    return res.redirect('/?auth_error=google_failed');
  }
});

app.get('/auth/github', (_req, res) => {
  const params = new URLSearchParams({ client_id: process.env.GITHUB_CLIENT_ID, redirect_uri: `${CLIENT_URL}/auth/github/callback`, scope: 'user:email' });
  return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.redirect('/?auth_error=github_denied');
  try {
    const td = await (await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }) })).json();
    if (!td.access_token) return res.redirect('/?auth_error=github_token_failed');
    const ghH = { Authorization: `Bearer ${td.access_token}`, 'User-Agent': 'Nexus-Analytics' };
    const gu = await (await fetch('https://api.github.com/user', { headers: ghH })).json();
    let email = gu.email;
    if (!email) {
      const emails = await (await fetch('https://api.github.com/user/emails', { headers: ghH })).json();
      email = emails.find((e) => e.primary && e.verified)?.email;
    }
    if (!email) return res.redirect('/?auth_error=github_no_email');
    let { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user) {
      const { data: nu, error: ce } = await supabase.from('users').insert({ name: gu.name || gu.login, email, avatar_url: gu.avatar_url, provider: 'github', provider_id: String(gu.id) }).select().single();
      if (ce) return res.redirect('/?auth_error=db_error');
      user = nu;
      supabase.from('notifications').insert({ user_id: user.id, title: 'Welcome to Nexus Analytics!', message: 'Signed in with GitHub.', type: 'system' }).catch(console.error);
    } else {
      supabase.from('users').update({ avatar_url: gu.avatar_url }).eq('id', user.id).catch(console.error);
    }
    setAuthCookie(res, signToken(user));
    return res.redirect('/?auth_success=true');
  } catch (err) {
    return res.redirect('/?auth_error=github_failed');
  }
});

app.get('/api/datasets', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('datasets').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ datasets: data || [] });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/datasets', verifyToken, async (req, res) => {
  try {
    const { name, file_format, row_count, file_size, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Dataset name required' });
    const { data, error } = await supabase.from('datasets').insert({ user_id: req.user.id, name: name.trim(), file_format: file_format || 'CSV', row_count: row_count || 0, file_size: file_size || 0, description: description || '', status: 'ready' }).select().single();
    if (error) throw error;
    generateDatasetInsights(data.id, data.name, data.file_format, req.user.id);
    return res.status(201).json({ dataset: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.delete('/api/datasets/:id', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase.from('datasets').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/datasets/upload', verifyToken, fileUpload.single('file'), async (req, res) => {
  try {
    let name = req.body.name, fileFormat = (req.body.file_format || 'CSV').toUpperCase();
    let fileSize = Number(req.body.file_size) || 0, rowCount = 0;
    if (req.file) {
      name = name || req.file.originalname.replace(/\.[^/.]+$/, '');
      fileFormat = req.file.originalname.split('.').pop().toUpperCase();
      fileSize = req.file.size;
      try { rowCount = parseFile(req.file.buffer, req.file.mimetype, req.file.originalname).length; }
      catch (pe) { return res.status(400).json({ error: `File parse error: ${pe.message}` }); }
    } else {
      rowCount = Number(req.body.row_count) || (Math.floor(Math.random() * 5000) + 100);
    }
    if (!name?.trim()) return res.status(400).json({ error: 'Dataset name required' });
    const { data, error } = await supabase.from('datasets').insert({ user_id: req.user.id, name: name.trim(), description: req.body.description || '', file_format: fileFormat, file_size: fileSize, row_count: rowCount, status: 'ready' }).select().single();
    if (error) throw error;
    generateDatasetInsights(data.id, data.name, data.file_format, req.user.id);
    return res.status(201).json({ success: true, dataset: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/datasets/:id/insights', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('insights').select('*').eq('dataset_id', req.params.id).order('created_at', { ascending: true });
    if (error) throw error;
    return res.json({ insights: data || [] });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/datasets/:id/comments', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('comments').select('*').eq('dataset_id', req.params.id).order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ comments: data || [] });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/datasets/:id/comments', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
    const { data: userRow } = await supabase.from('users').select('name').eq('id', req.user.id).single();
    const { data, error } = await supabase.from('comments').insert({ dataset_id: req.params.id, user_id: req.user.id, user_name: userRow?.name || 'You', content: content.trim() }).select().single();
    if (error) throw error;
    return res.status(201).json({ comment: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/reports', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('reports').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ reports: data || [] });
  } catch (err) { return res.json({ reports: [] }); }
});

app.post('/api/reports', verifyToken, async (req, res) => {
  try {
    const { title, type, dataset_id } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Report title required' });
    const { data, error } = await supabase.from('reports').insert({ user_id: req.user.id, title: title.trim(), type: type || 'Analytics', dataset_id: dataset_id || null, status: 'Draft' }).select().single();
    if (error) throw error;
    return res.status(201).json({ report: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    return res.json({ notifications: data || [] });
  } catch (err) { return res.json({ notifications: [] }); }
});

app.patch('/api/notifications/read-all', verifyToken, async (req, res) => {
  try {
    await supabase.from('notifications').update({ read: true }).eq('user_id', req.user.id);
    return res.json({ success: true });
  } catch (err) { return res.json({ success: true }); }
});

app.patch('/api/profile', verifyToken, async (req, res) => {
  try {
    const { name, role, bio } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (bio  !== undefined) updates.bio  = bio;
    const { data, error } = await supabase.from('users').update(updates).eq('id', req.user.id).select().single();
    if (error) throw error;
    return res.json({ user: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    const { data } = await supabase.from('settings').select('*').eq('user_id', req.user.id).maybeSingle();
    return res.json({ settings: data || { timezone: 'UTC', name: 'My Workspace' } });
  } catch (err) { return res.json({ settings: { timezone: 'UTC', name: 'My Workspace' } }); }
});

app.patch('/api/settings', verifyToken, async (req, res) => {
  try {
    const { name, timezone, anonymizeData, shareMetrics, retentionDays } = req.body;
    const { data, error } = await supabase.from('settings').upsert({ user_id: req.user.id, name, timezone, anonymizeData, shareMetrics, retentionDays }, { onConflict: 'user_id' }).select().single();
    if (error) throw error;
    return res.json({ settings: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/team', verifyToken, async (req, res) => {
  try {
    const { data } = await supabase.from('team_members').select('*').eq('workspace_id', req.user.id).order('created_at', { ascending: false });
    return res.json({ members: (data && data.length > 0) ? data : [{ name: 'You', email: req.user.email, role: 'owner', status: 'Active' }] });
  } catch (err) { return res.json({ members: [{ name: 'You', email: req.user.email, role: 'owner', status: 'Active' }] }); }
});

app.post('/api/team/invite', verifyToken, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email?.trim()) return res.status(400).json({ error: 'Email required' });
    const { data, error } = await supabase.from('team_invitations').insert({ workspace_id: req.user.id, email: email.trim(), role: role || 'member', invited_by: req.user.id, status: 'pending' }).select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, invitation: data });
  } catch (err) { return res.status(500).json({ error: err.message || 'Failed to send invite' }); }
});

app.post('/api/billing/create-payment-intent', verifyToken, async (req, res) => {
  try {
    const { amount, plan, currency } = req.body;
    if (!amount || !plan) return res.status(400).json({ error: 'amount and plan are required' });
    const pid = `pi_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    return res.json({ success: true, paymentIntentId: pid, clientSecret: `${pid}_secret_${Math.random().toString(36).slice(2, 22)}`, amount, currency: currency || 'usd' });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/billing/confirm-payment', verifyToken, async (req, res) => {
  try {
    const { paymentIntentId, cardholder, country, plan } = req.body;
    const { data, error } = await supabase.from('payments').insert({ user_id: req.user.id, payment_intent_id: paymentIntentId, cardholder_name: cardholder, country, status: 'succeeded', plan: plan || 'professional', amount: plan === 'enterprise' ? 14900 : 7900, currency: 'usd' }).select().single();
    if (error) throw error;
    await supabase.from('users').update({ plan: plan || 'professional', subscription_status: 'active', subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).eq('id', req.user.id);
    return res.json({ success: true, payment: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/chat', async (req, res) => {
  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages array is required' });

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: system || NEXUS_SYSTEM_PROMPT }, ...messages], max_tokens: 1024, stream: true, temperature: 0.7 }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('[chat] Groq error:', groqRes.status, errText);
      res.write(`data: ${JSON.stringify({ error: `AI error ${groqRes.status}. Please try again.` })}\n\n`);
      res.end(); return;
    }

    const decoder = new TextDecoder('utf-8');
    for await (const chunk of groqRes.body) {
      const text = decoder.decode(chunk, { stream: true });
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') { res.write('data: [DONE]\n\n'); res.end(); return; }
        try {
          const parsed = JSON.parse(payload);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: token } }] })}\n\n`);
        } catch { /* skip keep-alive lines */ }
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[chat] Streaming error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'AI temporarily unavailable. Please try again.' })}\n\n`);
    res.end();
  }
});

const ANALYTICS_URL = 'http://analytics:8001';
const ANALYTICS_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Analytics proxy helper
async function proxyToAnalytics(req, res, path, method = 'POST') {
  try {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': ANALYTICS_TOKEN
      }
    };
    if (method !== 'GET' && req.body) opts.body = JSON.stringify(req.body);
    const response = await fetch(`${ANALYTICS_URL}${path}`, opts);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Analytics service unavailable', detail: err.message });
  }
}

app.post('/api/nl-query/:datasetId', verifyToken, (req, res) =>
  proxyToAnalytics(req, res, `/nl-query/${req.params.datasetId}`));

app.post('/api/pipeline/bronze-to-silver/:datasetId', verifyToken, (req, res) =>
  proxyToAnalytics(req, res, `/pipeline/bronze-to-silver/${req.params.datasetId}`));

app.post('/api/model/build/:datasetId', verifyToken, (req, res) =>
  proxyToAnalytics(req, res, `/model/build/${req.params.datasetId}`));

app.get('/api/model/:datasetId', verifyToken, (req, res) =>
  proxyToAnalytics(req, res, `/model/${req.params.datasetId}`, 'GET'));

app.get('/api/drift/distribution/:datasetIdA/:datasetIdB', verifyToken, (req, res) =>
  proxyToAnalytics(req, res, `/drift/distribution/${req.params.datasetIdA}/${req.params.datasetIdB}`, 'GET'));

app.get('/api/schema/:datasetId', verifyToken, (req, res) =>
  proxyToAnalytics(req, res, `/schema/${req.params.datasetId}`, 'GET'));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('[unhandled error]', err.message);
  if (!res.headersSent) res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[Nexus Gateway] Running on port ${PORT}`);
  console.log(`[Client URL] ${CLIENT_URL}`);
});

process.on('SIGTERM', () => { redis.disconnect(); process.exit(0); });
process.on('unhandledRejection', (reason) => { console.error('[nexus] unhandled rejection:', reason); });
