$ErrorActionPreference = "Stop"

$url = "https://query1.finance.yahoo.com/v8/finance/chart/%5EKS200?range=3mo&interval=1d&includePrePost=false"
$output = Join-Path $PSScriptRoot "..\data\kospi200-yahoo-chart.json"

Invoke-WebRequest -UseBasicParsing $url -OutFile $output
Write-Host "Updated KOSPI200 cache: $output"
