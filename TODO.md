# KPI Intelligence Layer - Implementation TODO

## Status: [ ] In Progress

### Step 1: [x] API Layer (nexus-api.js)
- Add `getKpiSummary(datasetId)` exporting fetch(`/api/datasets/${datasetId}/kpi-summary`)

### Step 2: [x] Hook Layer (useDataset.js)
- Add `kpiSummary` state
- Add `getKpiSummary` async fetcher
- Integrate into existing pattern

### Step 3: [ ] Backend Endpoint (server.js)
- Add `computeKpis(snapshot)` function
- Add `generateKpiNarrative(kpis)` template
- Add `GET /api/datasets/:id/kpi-summary` verifyToken endpoint

### Step 4: [ ] Frontend Tab (DatasetDetailView.jsx)
- Add `{ id: 'kpi-intelligence', label: 'KPI Intelligence', icon: '📈' }` to tabs
- New tab render: Loading/Empty/KPI cards (4 metrics) + Narrative prose
- Style: Glass cards, no JSON, readable paragraph

### Step 5: [ ] Test & Validate
- Upload dataset → verify processing → KPI tab loads
- Check cards: rows, quality %, anomalies, trends/corrs
- Empty state on no snapshot
- No crashes on partial data

**Notes:**
- server.js: Use snapshot.row_count, data_quality.overall_score, anomalies.length
- Narrative: Deterministic template only
- UI: Additive, match glassmorphism style

