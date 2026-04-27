# AURORA-GUARDIAN Audit Script
Set-Location "c:/Users/Noah Mutharimi/Downloads/nexus-app"
Write-Output "=== SECTION 1 — File integrity audit ==="

Write-Output "--- 1.1 Route count ---"
$routeCount = (Select-String -Path "server.js" -Pattern "app\.(get|post|put|delete|patch)\(").Count
Write-Output "Route count: $routeCount"
if ($routeCount -ge 30 -and $routeCount -le 60) { Write-Output "PASS: between 30 and 60" } else { Write-Output "FAIL: expected 30-60" }

Write-Output "--- 1.2 Unprotected non-auth routes ---"
$unprotected = Select-String -Path "server.js" -Pattern "app\.(get|post|put|delete|patch)\(" | Where-Object { $_.Line -notmatch 'verifyToken' } | Where-Object { $_.Line -notmatch 'auth/signin|auth/signup|auth/signout|auth/google|auth/github|api/health' } | Where-Object { $_.Line -notmatch "app\.get\('\*'" }
if ($unprotected.Count -eq 0) {
    Write-Output "PASS: zero unprotected routes"
} else {
    Write-Output "FAIL: $($unprotected.Count) unprotected routes found:"
    $unprotected | ForEach-Object { Write-Output $_.Line.Trim() }
}

Write-Output "--- 1.3 Hardcoded internal service URLs ---"
$hardcoded = Select-String -Path "server.js" -Pattern "localhost:8001|localhost:4000" | ForEach-Object { $_.Line.Trim() }
if ($hardcoded.Count -eq 0) {
    Write-Output "PASS: zero hardcoded URLs"
} else {
    Write-Output "FAIL: hardcoded URLs found:"
    $hardcoded | ForEach-Object { Write-Output $_ }
}

Write-Output "--- 1.4 TODO/FIXME/HACK/console.log count ---"
$badPatterns = Select-String -Path "server.js" -Pattern "TODO|FIXME|HACK|console\.log"
Write-Output "Count: $($badPatterns.Count)"
$badPatterns | ForEach-Object { Write-Output $_.Line.Trim() }

Write-Output ""
Write-Output "=== SECTION 2 — Route completeness check ==="
Select-String -Path "server.js" -Pattern "app\.(get|post|put|delete|patch)\(" | ForEach-Object { Write-Output $_.Line.Trim() } | Sort-Object

Write-Output ""
Write-Output "=== SECTION 3 — Database schema audit ==="
Write-Output "--- 3.1 Schema contents ---"
Get-Content "db/schema.sql"

Write-Output "--- 3.2 Supabase tables accessed ---"
Select-String -Path "server.js" -Pattern "supabase\.from\(" | ForEach-Object { $_.Line.Trim() } | Sort-Object -Unique

Write-Output ""
Write-Output "=== SECTION 4 — Analytics service audit ==="
Write-Output "--- 4.1 Analytics endpoints ---"
Select-String -Path "analytics_service/main.py" -Pattern "@app\.(get|post)" | ForEach-Object { Write-Output $_.Line.Trim() }

Write-Output "--- 4.2 API key dependency count ---"
$apiKeyCount = (Select-String -Path "analytics_service/main.py" -Pattern "Depends\(verify_api_key\)").Count
Write-Output "Count: $apiKeyCount"
if ($apiKeyCount -ge 10) { Write-Output "PASS: 10+ dependencies" } else { Write-Output "FAIL: expected 10+" }

Write-Output "--- 4.3 Core functions ---"
$functions = @("def execute_query", "def write_parquet", "def bronze_to_silver", "def build_model", "def translate_and_execute", "def compute_distribution_drift")
foreach ($func in $functions) {
    $found = Select-String -Path "analytics_service/main.py" -Pattern $func
    if ($found) { Write-Output "PASS: $func" } else { Write-Output "FAIL: $func missing" }
}

Write-Output ""
Write-Output "=== SECTION 5 — Frontend component audit ==="
Write-Output "--- 5.1 JSX files ---"
Get-ChildItem "src" -Recurse -Filter "*.jsx" | Select-Object Name, @{N='Size';E={$_.Length}}, @{N='Lines';E={(Get-Content $_.FullName).Count}} | Sort-Object Lines -Descending | Format-Table -AutoSize

Write-Output "--- 5.2 DatasetDetailView NL query ---"
$nlQuery = Select-String -Path "src/components/views/DatasetDetailView.jsx" -Pattern "handleNlQuery|nlQuestion|nlResult|nlError"
if ($nlQuery.Count -gt 0) { Write-Output "PASS: NL query references found ($($nlQuery.Count))" } else { Write-Output "FAIL: NL query references not found" }

Write-Output "--- 5.3 CommandPalette ---"
$cmdPal = Select-String -Path "src/components/CommandPalette.jsx" -Pattern "CommandPalette|onNavigate|datasets"
if ($cmdPal.Count -gt 0) { Write-Output "PASS: CommandPalette references found ($($cmdPal.Count))" } else { Write-Output "FAIL: CommandPalette references not found" }

Write-Output "--- 5.4 App.jsx state hooks ---"
$hooks = @("paletteOpen", "isCheckingAuth", "datasetsLoading", "viewHistory", "handleBack")
foreach ($hook in $hooks) {
    $found = Select-String -Path "src/App.jsx" -Pattern $hook
    if ($found) { Write-Output "PASS: $hook found" } else { Write-Output "FAIL: $hook missing" }
}

Write-Output ""
Write-Output "=== SECTION 6 — Runtime health check ==="
$webHealth = try { $h = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5; "WEB HEALTH: $($h.status)" } catch { "WEB HEALTH: FAIL - $_" }
Write-Output $webHealth

$analyticsHealth = try { $h = Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 5; "ANALYTICS HEALTH: $($h.status)" } catch { "ANALYTICS HEALTH: FAIL - $_" }
Write-Output $analyticsHealth

Write-Output ""
Write-Output "=== SECTION 7 — Dataset upload and analysis flow test ==="
Write-Output "--- 7.1 Create test CSV ---"
$csv = "product,revenue,region,month`nWidget A,42000,North,Jan`nWidget B,31000,South,Feb`nWidget C,28000,East,Mar`nWidget D,51000,West,Apr`nWidget E,19000,North,May"
Set-Content -Path "test_dataset.csv" -Value $csv -Encoding UTF8
Write-Output "Test CSV created"

Write-Output "--- 7.2 Login attempt ---"
try {
    $headers = @{"Content-Type"="application/json"}
    $body = '{"email":"aurora.test@gmail.com","password":"Mutharimi,,07"}'
    $response = Invoke-WebRequest -Uri "http://localhost:5000/auth/signin" -Method POST -Headers $headers -Body $body -SessionVariable session
    $loginData = $response.Content | ConvertFrom-Json
    Write-Output "LOGIN STATUS: $($response.StatusCode)"
    Write-Output "USER: $($loginData.user.email)"
    $global:authSession = $session
    $global:userData = $loginData
} catch {
    Write-Output "LOGIN FAIL: $_"
}

Write-Output "--- 7.3 Dataset listing ---"
if ($global:authSession) {
    try {
        $datasets = Invoke-RestMethod -Uri "http://localhost:5000/api/datasets" -WebSession $global:authSession -TimeoutSec 10
        Write-Output "DATASETS ENDPOINT: PASS - returned $($datasets.datasets.Count) datasets"
        if ($datasets.datasets.Count -gt 0) {
            Write-Output "FIRST DATASET: $($datasets.datasets[0].name) - ID: $($datasets.datasets[0].id)"
        }
    } catch {
        Write-Output "DATASETS ENDPOINT: FAIL - $_"
    }
} else {
    Write-Output "DATASETS ENDPOINT: SKIPPED - no auth session"
}

Write-Output ""
Write-Output "=== SECTION 8 — New code audit ==="
Write-Output "--- 8.1 Audit system ---"
$auditRefs = (Select-String -Path "server.js" -Pattern "audit_logs|logAuditEvent").Count
Write-Output "Audit references count: $auditRefs"

Write-Output "--- 8.2 Statistical features ---"
$statRefs = (Select-String -Path "server.js" -Pattern "snapshot|lineage|computation_id|confidence").Count
Write-Output "Statistical feature references count: $statRefs"

Write-Output "--- 8.3 Frontend backend features ---"
$feRefs = (Select-String -Path "src/components/views/DatasetDetailView.jsx" -Pattern "audit|snapshot|confidence|lineage").Count
Write-Output "Frontend backend feature references count: $feRefs"

Write-Output "--- 8.4 API library exports ---"
Select-String -Path "src/lib/nexus-api.js" -Pattern "^export (async )?function" | ForEach-Object { Write-Output $_.Line.Trim() }

Write-Output ""
Write-Output "=== SECTION 9 — Error pattern scan ==="
Write-Output "--- 9.1 Server.js error handlers ---"
$errCount = (Select-String -Path "server.js" -Pattern "throw new Error|res\.status\(500\)|catch \(err\)").Count
Write-Output "Error handler count: $errCount"

Write-Output "--- 9.2 Server.js 404 responses ---"
$notFound = Select-String -Path "server.js" -Pattern "res\.status\(404\)" | ForEach-Object { $_.Line.Trim() }
Write-Output "404 count: $($notFound.Count)"
$notFound | ForEach-Object { Write-Output $_ }

Write-Output "--- 9.3 Analytics service error handlers ---"
$pyErrCount = (Select-String -Path "analytics_service/main.py" -Pattern "raise HTTPException|except Exception").Count
Write-Output "Python error handler count: $pyErrCount"

