$ErrorActionPreference = "Stop"

$url = "https://news.google.com/rss/search?q=KOSPI200%20OR%20%22KOSPI%20200%22%20OR%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20when:7d&hl=ko&gl=KR&ceid=KR:ko"
$output = Join-Path $PSScriptRoot "..\data\kospi200-news-rss.xml"

Invoke-WebRequest -UseBasicParsing $url -OutFile $output
Write-Host "Updated KOSPI200 news cache: $output"
