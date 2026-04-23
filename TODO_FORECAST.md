# Forecast & Risk Intelligence Layer - Implementation TODO

## Status: [ ] Not Started

### Step 1: [ ] Backend Functions (server.js)
- Add `computeForecast(snapshot)`
- Add `computeRiskScore(snapshot)` using countAnomalies
- Add `generateForecastNarrative(forecast, risk)`

### Step 2: [ ] Backend Endpoint (server.js)
- Add `GET /api/datasets/:id/forecast` verifyToken
- Fetch snapshot → compute → return {forecast, risk, narrative}

### Step 3: [ ] API Layer (nexus-api.js)
- Add `getForecast(datasetId)`

### Step 4: [ ] Hook Layer (useDataset.js)
- Add `forecast` state
- Add `getForecast`
- Integrate into loadDataset/startPolling Promise.all

### Step 5: [ ] Frontend Tab (DatasetDetailView.jsx)
- Add `{ id: 'forecast', label: 'Forecast & Risk', icon: '🔮' }` to tabs
- Render: Risk Card (color-coded), Forecast List, Narrative block
- Safety: Empty if no snapshot, no raw JSON

### Step 6: [ ] Test & Validate
- Upload dataset → Forecast & Risk tab
- Verify risk level, forecasts, narrative
- No trends → graceful "stable" fallbacks

**Notes:**
- Reuse snapshot.trends, anomalies, data_quality
- Risk colors: high=red, medium=yellow, low=green
- Limit forecast to 3 columns max
- Narrative tight, readable paragraph

