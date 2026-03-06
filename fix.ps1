$c = Get-Content server.js -Raw
$c = $c -replace 'async function generateInsights\(datasetId', 'async function generateDatasetInsights(datasetId'
$c = $c -replace 'generateInsights\(data\.id, name,', 'generateDatasetInsights(data.id, name,'
$c = $c -replace 'generateInsights\(data\.id, data\.name,', 'generateDatasetInsights(data.id, data.name,'
Set-Content server.js $c