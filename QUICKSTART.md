# Nexus — Quick Start Card

## One-Time Setup (5 minutes)

```bash
# 1. Install dependencies
npm install
cd analytics_service && pip install -r requirements.txt && cd ..

# 2. Setup environment
cp .env.example .env
# Edit .env and add:
#   - DATABASE_URL (your PostgreSQL connection)
#   - OPENAI_API_KEY (your API key)

# 3. Initialize database
psql $DATABASE_URL -f db/schema.sql

# Verify database created:
psql $DATABASE_URL -c "\dt"  # Should show 9 tables
```

---

## Every Time - Start Services (4 terminals)

### Terminal 1: Analytics Engine (Python)
```bash
cd analytics_service
source venv/bin/activate  # or: venv\Scripts\activate on Windows
uvicorn main:app --port 8001 --reload
```
Expected: `INFO: Application startup complete`

### Terminal 2: Gateway Server (Node.js)
```bash
npm run dev
# or: nodemon server.js
```
Expected: `[Server] Gateway listening on port 5000`

### Terminal 3: Monitoring Worker (Node.js) — Optional
```bash
npm run monitor
```
Expected: `[Scheduler] Scheduling complete`

### Terminal 4: Frontend (Vite)
```bash
npm run frontend:dev
```
Expected: `➜ Local: http://localhost:5173/`

---

## Quick Verification (Bash)

```bash
# All services running?
curl http://localhost:5000/api/health       # Gateway
curl http://localhost:8001/health            # Analytics
redis-cli PING                               # Redis
psql $DATABASE_URL -c "SELECT 1;"           # Database

# All should respond with status 200/OK or PONG
```

---

## First Use: Upload Dataset

1. Open http://localhost:5173 in browser
2. Click **Upload** tab
3. Drag CSV file or click to select
4. Watch status poll every 2 seconds
5. Once status = "ready", click **Insights** to see results

---

## Common Commands

| Goal | Command |
|------|---------|
| Build frontend | `npm run build` |
| Preview build | `npm run preview` |
| Run all tests | `npm run ci:smoke` |
| View database | `psql $DATABASE_URL` |
| View Redis cache | `redis-cli` |
| Clean build | `rm -rf dist node_modules && npm install` |

---

## Port Quick Reference

| Port | Service | URL |
|------|---------|-----|
| **5173** | Frontend (Dev) | http://localhost:5173 |
| **5000** | Gateway API | http://localhost:5000/api |
| **8001** | Analytics Engine | http://localhost:8001 |
| **5001** | Monitor (manual trigger) | http://localhost:5001 |
| **5432** | PostgreSQL | (internal) |
| **6379** | Redis | (internal) |

---

## Troubleshooting

**"Cannot connect to database"**
```bash
echo $DATABASE_URL  # Check format
psql $DATABASE_URL -c "SELECT 1"  # Test connection
```

**"Analytics engine not responding"**
```bash
curl http://localhost:8001/health
# If fails, restart analytics service
```

**"Redis error"**
```bash
redis-cli PING  # Should output: PONG
# If error, start redis: redis-server (or brew services start redis)
```

**"Frontend shows 500 errors"**
- Check Node gateway is running
- Verify VITE_API_URL in .env matches PORT
- Check browser console for specifics

---

## Full Documentation

- **Installation**: See `IMPLEMENTATION_GUIDE.md`
- **Architecture**: See `COMPLETION_SUMMARY.md`
- **Troubleshooting**: See `IMPLEMENTATION_GUIDE.md` (Troubleshooting section)

---

## Quick Links

| Document | Purpose |
|----------|---------|
| `.env.example` | Environment variables template |
| `db/schema.sql` | Database schema (9 tables) |
| `server.js` | Backend API gateway |
| `analytics_service/main.py` | Python statistical engine |
| `src/components/Dashboard.jsx` | Main UI orchestrator |
| `IMPLEMENTATION_GUIDE.md` | Complete setup & verification guide |
| `COMPLETION_SUMMARY.md` | Architecture & design decisions |

---

## System Architecture

```
Frontend (port 5173)
    ↓ HTTP Requests
Node.js Gateway (port 5000)
    ├→ Python Analytics (port 8001)
    ├→ PostgreSQL (port 5432)
    ├→ Redis (port 6379)
    ├→ OpenAI API
    └→ BullMQ Monitoring Worker (port 5001)
```

**Data Flow**:
1. User uploads CSV → Parsed by Node.js
2. Rows inserted into database
3. Python engine computes statistics (no raw data)
4. LLM receives statistics only
5. Insights stored with full schema
6. Frontend polls status → Shows results

---

## Key Features

✅ Upload CSV/Excel/JSON files  
✅ Automated statistical analysis  
✅ LLM-powered insights with confidence ceiling  
✅ Conversational chat with memory  
✅ Causal hypothesis ranking  
✅ Executive summaries  
✅ Autonomous monitoring every 6 hours  
✅ Real-time drift & anomaly detection  
✅ Alert system with unread tracking  

---

**Status**: Production-Ready  
**Last Updated**: 2025  
**Need Help**: See `IMPLEMENTATION_GUIDE.md`
