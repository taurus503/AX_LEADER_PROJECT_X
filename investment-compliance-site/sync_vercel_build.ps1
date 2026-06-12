$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$buildDir = Join-Path $root "build"

if (-not (Test-Path -LiteralPath $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir | Out-Null
}

$filesToCopy = @("index.html", "styles.css", "app.js")

foreach ($file in $filesToCopy) {
    Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $buildDir $file) -Force
}

$summary = [pscustomobject]@{
    BuildIndex = (Get-Item -LiteralPath (Join-Path $buildDir "index.html")).Length
    BuildStyles = (Get-Item -LiteralPath (Join-Path $buildDir "styles.css")).Length
    BuildApp = (Get-Item -LiteralPath (Join-Path $buildDir "app.js")).Length
    BuildPath = $buildDir
}

$summary | Format-List
