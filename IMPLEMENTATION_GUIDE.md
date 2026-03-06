# Nexus Platform — Implementation & Deployment Guide

**Version:** 1.0.0  
**Status:** Phase 1-2 Complete (Phase 3 Verification Ongoing)  
**Last Updated:** 2025

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Requirements](#system-requirements)
3. [Installation & Setup](#installation--setup)
4. [Database Initialization](#database-initialization)
5. [Environment Configuration](#environment-configuration)
6. [Service Startup Sequence](#service-startup-sequence)
7. [Port Configuration](#port-configuration)
8. [Verification Checklist](#verification-checklist)
9. [Quality Gate Validation](#quality-gate-validation)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

Nexus is a **research-grade, AI-powered decision intelligence platform** comprising four core services:

### Service Stack

```
┌─────────────────┐
│  React Frontend │ (Port 5173 dev / 3000 production)
│  (Vite + React) │
└────────┬────────┘
         │ HTTP Requests
         │
┌────────▼──────────────┐
│  Node.js Gateway      │ (Port 5000)
│  (Express)            │
├───────────────────────┤
│ • File upload handler │
│ • API orchestrator    │
│ • Chat session mgmt   │
│ • Alert routing       │
└────────┬──────────────┘
         │
    ┌────┼─────┐
    │    │     │
    │    │     └─────────────────────┐
    │    │                           │
    │  ┌▼──────────────────┐    ┌───▼────────────┐
    │  │ Python Analytics │    │  Redis Cache   │
    │  │ (FastAPI)        │    │  (Session mgmt)│
    │  │ Port 8001        │    │  Port 6379     │
    │  ├──────────────────┤    └────────────────┘
    │  │ Statistical calc │
    │  │ No raw data      │
    │  │ Confidence base  │
    │  └──────────────────┘
    │
    └──────────────────────────┐
                               │
                        ┌──────▼───────┐
                        │  PostgreSQL  │
                        │  (Database)  │
                        │  Port 5432   │
                        ├──────────────┤
                        │ 9 tables     │
                        │ Full history │
                        └──────────────┘

    Optional:
    ┌────────────────────────┐
    │ Monitoring Worker      │
    │ (BullMQ)               │
    │ Port 5001              │
    ├────────────────────────┤
    │ • Drift detection      │
    │ • Anomaly monitoring   │
    │ • Alert generation     │
    │ • Cron: 0 */6 * * *   │
    └────────────────────────┘
```

### Key Architecture Principles

1. **LLM Data Isolation**: Raw data is NEVER passed to the LLM
   - Flow: Raw Data → Python Stats Engine → Computed Facts → LLM
   
2. **Confidence Ceiling**: LLM cannot claim confidence higher than system-computed base + 0.05
   - Implemented in `reasoning/promptArchitecture.js:enforceConfidenceCeiling()`
   
3. **Session Memory**: All conversations persist for context
   - Backend: Redis (30-min TTL)
   - Frontend: useChat hook with localStorage sessionId

4. **Autonomous Monitoring**: Background worker runs every 6 hours
   - Drift detection via Z-score analysis
   - Anomaly detection via Isolation Forest
   - Proactive insight generation when anomalies found

---

## System Requirements

### Minimum Specs
- **Node.js**: v20.0.0+
- **Python**: 3.11.0+
- **PostgreSQL**: 15.0+
- **Redis**: 6.0+
- **RAM**: 4GB minimum (8GB recommended)
- **Disk**: 10GB (varies by dataset size)

### Operating System
- Linux (recommended)
- macOS
- Windows (with WSL2 recommended)

### API Keys Required
- **OpenAI**: `OPENAI_API_KEY` (gpt-4o model)

---

## Installation & Setup

### Step 1: Clone/Obtain Repository
```bash
cd /path/to/nexus-app
```

### Step 2: Install Node.js Dependencies
```bash
npm install
```

This installs all dependencies specified in `package.json`, including:
- **Backend**: express, multer, pg, ioredis, bullmq, openai, axios
- **Frontend**: react, recharts, tailwindcss, vite
- **Dev**: nodemon, eslint, prettier (optional)

### Step 3: Set Up Python Environment
```bash
cd analytics_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Python packages installed**:
- fastapi==0.111.0
- uvicorn==0.29.0
- pandas==2.2.2
- scikit-learn==1.4.2
- scipy==1.13.0
- psycopg2-binary==2.9.9
- numpy==1.24.3

### Step 4: Verify Installation
```bash
node --version    # Should be v20.0.0+
python3 --version # Should be 3.11.0+
psql --version    # Should be 15.0+
```

---

## Database Initialization

### Create PostgreSQL Database
```bash
psql -U postgres
CREATE DATABASE nexus_db;
\q
```

### Load Schema
```bash
psql -U postgres nexus_db -f db/schema.sql
```

Or via npm script:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/nexus_db npm run db:init
```

### Verify Tables Created
```bash
psql -U postgres nexus_db
\dt  # List all tables (should show 9)
```

**Expected tables**:
1. `users` — User accounts
2. `datasets` — Dataset metadata
3. `dataset_rows` — Raw data rows (JSONB)
4. `statistical_snapshots` — Computed statistics
5. `insights` — Generated insights
6. `chat_sessions` — Conversation sessions
7. `chat_messages` — Message history
8. `monitoring_alerts` — Alert log
9. `reasoning_logs` — LLM reasoning trace

---

## Environment Configuration

### Create `.env` File
Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

### Required Variables

```dotenv
# DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/nexus_db

# REDIS
REDIS_URL=redis://localhost:6379

# API KEYS
OPENAI_API_KEY=sk-your-key-here

# PORTS
PORT=5000
MONITOR_PORT=5001

# SERVICE URLS
ANALYTICS_ENGINE_URL=http://localhost:8001
VITE_API_URL=http://localhost:5000/api

# SECURITY
SESSION_SECRET=generate-secure-random-string
JWT_SECRET=generate-another-secure-string
API_KEY=generate-third-secure-string
```

### Generate Secure Secrets
```bash
# On Linux/macOS:
openssl rand -base64 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Service Startup Sequence

### Option 1: Manual Terminal Sequence (Development)

**Terminal 1 — PostgreSQL**
```bash
# Usually runs as a service, verify it's running:
psql -U postgres -c "SELECT version();"
```

**Terminal 2 — Redis**
```bash
# Usually runs as a service, verify it's running:
redis-cli ping  # Should output: PONG
```

**Terminal 3 — Python Analytics Engine**
```bash
cd analytics_service
source venv/bin/activate  # or: venv\Scripts\activate
uvicorn main:app --port 8001 --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8001
INFO:     Application startup complete
```

**Terminal 4 — Node.js Gateway**
```bash
# From root directory
npm run dev
# Or: nodemon server.js
```

Expected output:
```
[Server] Gateway listening on port 5000
[Server] Connected to database
[Server] Redis connected
```

**Terminal 5 — Monitoring Worker (Optional)**
```bash
npm run monitor
```

Expected output:
```
[Scheduler] Starting dataset scheduling...
[Scheduler] Scheduling complete
[Monitor] Worker ready, listening for jobs
```

**Terminal 6 — Frontend (Vite)**
```bash
npm run frontend:dev
# Or: vite --config vite.config.mjs
```

Expected output:
```
  VITE vx.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Option 2: Using npm Run Scripts

Create a process manager setup or use concurrent runners:

```bash
# Install concurrently (optional)
npm install -D concurrently

# Create combined start script in package.json:
"start:all": "concurrently \"npm run dev\" \"cd analytics_service && python -m uvicorn main:app --port 8001\" \"npm run monitor\""
```

### Option 3: Production Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for Docker, PM2, systemd, and cloud options.

---

## Port Configuration

| Service | Port | Purpose | Runtime |
|---------|------|---------|---------|
| **Frontend** (Vite Dev) | 5173 | React development | npm run frontend:dev |
| **Frontend** (Vite Preview) | 4173 | Build preview | vite preview |
| **Node Gateway** | 5000 | API endpoint | npm run dev |
| **Monitor HTTP** | 5001 | Manual triggers | npm run monitor |
| **Python Analytics** | 8001 | Statistics engine | uvicorn main:app |
| **PostgreSQL** | 5432 | Database | systemctl start postgresql |
| **Redis** | 6379 | Cache/sessions | redis-server |

**Note**: All ports can be customized via environment variables (PORT, MONITOR_PORT, ANALYTICS_ENGINE_URL, etc.)

---

## Verification Checklist

After startup, verify all services are operational:

### 1. Database Connection
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
# Expected: Should connect and return 0 (if new database)
```

### 2. Redis Connection
```bash
redis-cli PING
# Expected: PONG
```

### 3. Analytics Engine Health
```bash
curl http://localhost:8001/health
# Expected: {"status": "healthy"}
```

### 4. Gateway Health
```bash
curl http://localhost:5000/api/health
# Expected: {"status": "ok"}
```

### 5. Frontend Build
```bash
curl http://localhost:5173
# Expected: HTML document (React app)
```

### 6. Database Tables
```bash
psql $DATABASE_URL -c "\dt"
# Expected: 9 tables listed
```

### 7. Sample API Call
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","sessionId":"test","userId":"test","datasetId":"test"}'
# Expected: JSON response (may be error due to no dataset, but server responds)
```

---

## Quality Gate Validation

### Gate Question 1: Can user upload CSV and receive insights?
**Verify**: 
- Upload CSV via web UI
- Observe status polling every 2 seconds
- Receive insights once status = 'ready'
- **Expected**: ✅ YES

**Code Path**: `DataUpload.jsx` → `nexus-api.js:uploadDataset()` → `server.js:/api/datasets/upload` → `runNexusPipeline()` → Python analytics → LLM insights

---

### Gate Question 2: Does every insight have all required fields?
**Verify**:
- Look at generated insights in `InsightCard.jsx`
- Check that each insight displays:
  - Title
  - Explanation
  - Confidence (with ceiling enforcement)
  - Label (High/Medium/Low)
  - Evidence box
  - Assumptions
  - Limitations
  - Hypotheses (with probability bars)
  - Recommended actions

**Code Path**: `db/schema.sql:insights` table has all fields → `reasoning/promptArchitecture.js` enforces schema → `InsightCard.jsx` displays all

---

### Gate Question 3: Is confidence capped by system base?
**Verify**:
```javascript
// In reasoning/promptArchitecture.js, line ~60
function enforceConfidenceCeiling(insight, confidenceBase) {
  const maxConfidence = confidenceBase + 0.05;
  insight.confidence = Math.min(insight.confidence, maxConfidence);
  return insight;
}
```

- Upload dataset
- Check `statistical_snapshots.confidence_base` in database
- Verify all insights have `confidence <= base + 0.05`
- **Expected**: ✅ YES

---

### Gate Question 4: Does chatbot maintain conversation memory?
**Verify**:
- Send message 1: "What's the trend?"
- Send message 2: "Why is that happening?"
- Verify message 2 acknowledges context from message 1
- Check `chat_sessions` table: `sessionId` should persist
- Check Redis: Session should have message history

**Code Path**: `ConversationalAnalyst.jsx` → `useChat.js` → `nexus-api.js:sendChatMessage()` → `server.js:/api/chat` → Redis session retrieval

---

### Gate Question 5: Does chatbot cite data it used?
**Verify**:
- In `ConversationalAnalyst.jsx`, expand "Reasoning Used" section
- Should show:
  - `data_referenced`: List of columns/metrics analyzed
  - `confidence_applied`: Confidence ceiling applied
  - `hedged`: Boolean indicating linguistic hedging

**Expected**: ✅ YES

---

### Gate Question 6: Does hypothesis engine rank explanations?
**Verify**:
- In `HypothesisPanel.jsx`, enter question: "What caused sales to drop?"
- Should display hypotheses ranked by probability
- Each hypothesis should have probability_weight (0.0-1.0)
- Evidence section shows supporting data

**Code Path**: `HypothesisPanel.jsx` → `nexus-api.js:hypothesize()` → `server.js:/api/datasets/:id/hypothesize` → `rankCausalHypotheses()`

---

### Gate Question 7: Does executive summary generate automatically?
**Verify**:
- In `Dashboard.jsx`, click "Summary" tab
- Should fetch `ExecutiveSummary.jsx`
- Should display:
  - Headline (gradient)
  - Summary paragraph (3-4 sentences)
  - Key metrics grid
  - Risks/Opportunities (color-coded)
  - Recommended priorities
  - Data reliability note
  - Next review suggestion

**Code Path**: `ExecutiveSummary.jsx` → `nexus-api.js:getExecutiveSummary()` → `server.js:/api/datasets/:id/executive-summary` → `generateExecutiveSummary()`

---

### Gate Question 8: Does monitoring run every 6 hours automatically?
**Verify**:
- Start `npm run monitor` (or monitoring worker in production)
- Check logs: Should show recurring job execution
- Look for cron pattern: `0 */6 * * *`
- Check `monitoring_alerts` table: New entries should appear every 6 hours

**Code Path**: `monitoring/monitor.js` → BullMQ Queue with cron pattern → `monitorDataset()` runs every 6 hours

---

### Gate Question 9: Can monitoring detect statistical drift?
**Verify**:
- Upload dataset with stable data
- Upload same dataset with shifted values (e.g., mean +50%)
- Wait 6 hours or trigger manually: `POST http://localhost:5001/trigger/:datasetId`
- Check `monitoring_alerts` table: Should contain drift alert
- Alert should show Z-score threshold crossed

**Code Path**: `monitoring/monitor.js:monitorDataset()` → Step 1: Z-score drift detection → Alert creation

---

### Gate Question 10: Does monitoring generate weekly summaries?
**Verify**:
- Monitor dataset for 7+ days (or trigger manually 7 times)
- Check `monitoring_alerts` table for `alert_type='weekly_summary'`
- Summary should aggregate all insights from the week

**Code Path**: `monitoring/monitor.js` → Step 4: Weekly summary check

---

### Gate Question 11: Does frontend poll upload status in real-time?
**Verify**:
- Open DevTools Network tab
- Upload file
- Observe repeated GET requests to `/api/datasets/:id/status` every 2 seconds
- Polling stops when status = 'ready'
- Timeout protection at 5 minutes (150 polls × 2s)

**Code Path**: `useDataset.js:startPolling()` → 2-second interval loop → Stops at terminal state

---

### Gate Question 12: Are all API errors handled gracefully?
**Verify**:
- Kill PostgreSQL or Redis midway through operation
- Upload with missing userId
- Send invalid file format
- Expected: User sees friendly error message in toast/modal, never raw server error

**Code Path**: All API functions in `nexus-api.js` wrap errors in try-catch, return `.error` property

---

### Gate Question 13: Is LLM isolated from raw data (never passes rows)?
**Verify** Source Code:
```javascript
// server.js, line ~150 (Step 2: Call analytics)
const analyticsResult = await axios.post(
  `${ANALYTICS_ENGINE_URL}/analyze/dataset/${datasetId}`,
  { dataset_id: datasetId }
);
// ✅ Passes only datasetId, not rows

// server.js, line ~170 (Step 3: Call LLM)
const llmResult = await generateInsights(
  analyticsResult,  // ✅ Passes only computed stats
  datasetName
);
// ❌ NEVER receives rows directly
```

**Expected**: ✅ YES — Raw data only in database, statistics only to LLM

---

### Gate Question 14: Are all insights stored with reasoning trace?
**Verify**:
- Upload dataset
- Check `insights` table: Column `reasoning_trace` should be JSONB with:
  - `step`: Number
  - `name`: String
  - `reasoning`: String

**Expected**: ✅ YES

---

### Gate Question 15: Is database fully normalized with constraints?
**Verify**:
```bash
psql $DATABASE_URL -c "\d+ insights"
```

Should show all 16 columns with proper:
- Data types (UUID, VARCHAR, JSONB, FLOAT, TIMESTAMP)
- Foreign keys (dataset_id REFERENCES datasets)
- NOT NULL constraints where required
- Indexes on foreign keys and frequent query columns

**Expected**: ✅ YES

---

### Gate Question 16: Are all exports/imports correctly matched?
**Verify**:
```bash
# Check frontend exports
grep -r "^export" src/lib/ src/hooks/ src/components/ | head -20

# Verify imports match in Dashboard.jsx, App.jsx
grep -r "^import" src/components/Dashboard.jsx
```

Expected sample:
```javascript
// nexus-api.js exports:
export async function uploadDataset(...) { ... }
export async function getDatasetStatus(...) { ... }

// Dashboard.jsx imports:
import { uploadDataset, getDatasetStatus } from "../../lib/nexus-api";
```

**Expected**: ✅ YES — All imports have matching exports

---

## Final Implementation Verification

### Quick Check Script
```bash
#!/bin/bash
# Save as verify.sh and run: bash verify.sh

echo "=== Nexus Implementation Verification ==="
echo ""
echo "✓ Checking file existence..."
test -f db/schema.sql && echo "  ✓ db/schema.sql" || echo "  ✗ db/schema.sql"
test -f analytics_service/main.py && echo "  ✓ analytics_service/main.py" || echo "  ✗ analytics_service/main.py"
test -f server.js && echo "  ✓ server.js" || echo "  ✗ server.js"
test -f monitoring/monitor.js && echo "  ✓ monitoring/monitor.js" || echo "  ✗ monitoring/monitor.js"
test -f src/components/Dashboard.jsx && echo "  ✓ src/components/Dashboard.jsx" || echo "  ✗ src/components/Dashboard.jsx"

echo ""
echo "✓ Checking for TODOs/FIXMEs..."
TODO_COUNT=$(grep -r "TODO\|FIXME" src/ server.js analytics_service/ 2>/dev/null | grep -v node_modules | wc -l)
if [ $TODO_COUNT -eq 0 ]; then
  echo "  ✓ Zero placeholders found"
else
  echo "  ✗ $TODO_COUNT TODOs/FIXMEs found"
fi

echo ""
echo "✓ Checking exports/imports..."
grep -q "export.*uploadDataset" src/lib/nexus-api.js && echo "  ✓ nexus-api exports" || echo "  ✗ nexus-api exports"
grep -q "import.*uploadDataset" src/components/Dashboard.jsx && echo "  ✓ Dashboard imports" || echo "  ✗ Dashboard imports"

echo ""
echo "✓ Database schema check..."
DB_TABLES=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null)
if [ "$DB_TABLES" = " 9" ]; then
  echo "  ✓ All 9 tables present"
else
  echo "  ✗ Expected 9 tables, found $DB_TABLES"
fi

echo ""
echo "=== Verification Complete ==="
```

---

## Troubleshooting

### Issue: "Cannot connect to PostgreSQL"
**Solution**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection string format
echo $DATABASE_URL
# Should be: postgresql://user:password@localhost:5432/nexus_db

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: "Python analytics engine not responding"
**Solution**:
```bash
# Check if running on correct port
curl http://localhost:8001/health

# Restart analytics service
cd analytics_service
source venv/bin/activate
uvicorn main:app --port 8001 --reload

# Check for Python errors in terminal output
```

### Issue: "Redis connection refused"
**Solution**:
```bash
# Check Redis is running
redis-cli ping  # Should output: PONG

# Start Redis if not running
redis-server  # or: brew services start redis (macOS)

# Verify REDIS_URL in .env
grep REDIS_URL .env
```

### Issue: "Frontend shows 'Cannot connect to API'"
**Solution**:
```bash
# Check gateway server is running
curl http://localhost:5000/api/health

# Check VITE_API_URL in .env
grep VITE_API_URL .env

# If running on different host, update vite.config.mjs proxy settings
```

### Issue: "Insights not generating"
**Solution**:
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY | head -c 5  # Should show "sk-"

# Check analytics engine produced valid statistics
curl -X POST http://localhost:8001/analyze/inline \
  -H "Content-Type: application/json" \
  -d '{"data": [{"x": 1}, {"x": 2}]}'

# Check error logs in server.js output
```

### Issue: "Monitoring not running"
**Solution**:
```bash
# Check monitoring process
ps aux | grep "node monitoring"

# Start monitoring manually
npm run monitor

# Check for database connectivity issues
psql $DATABASE_URL -c "SELECT COUNT(*) FROM datasets"

# Check Redis queue
redis-cli KEYS "*nexus*"
```

---

## Next Steps

1. **First Run**: Upload a test CSV file through the UI
2. **Verify Pipeline**: Observe real-time status polling
3. **Inspect Insights**: Review generated insights in InsightCard
4. **Test Chat**: Ask questions in ConversationalAnalyst
5. **Check Database**: Inspect actual data in insights table

```bash
psql $DATABASE_URL -c "SELECT title, explanation, confidence FROM insights LIMIT 1;"
```

6. **Monitor Alerts**: Wait 6 hours or manual trigger for alerts
7. **Review Code**: Examine `server.js` runNexusPipeline() to understand data flow

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review logs in terminal output
3. Verify all environment variables in `.env`
4. Check database schema: `psql $DATABASE_URL -c "\dt"`
5. Review specification requirements in master prompt

---

**End of Implementation Guide**
