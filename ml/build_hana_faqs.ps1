$ErrorActionPreference = 'Stop'

[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
Add-Type -AssemblyName System.IO.Compression.FileSystem

$workspace = Split-Path -Parent $PSScriptRoot
$downloads = Join-Path $env:USERPROFILE 'Downloads'

# Build Korean match words without embedding non-ASCII literals in this PS5 script.
$hanaCard = -join @([char]0xD558, [char]0xB098, [char]0xCE74, [char]0xB4DC)
$classification = -join @([char]0xBD84, [char]0xB958)
$recording1 = -join @([char]0xB179, [char]0xCDE8)
$recording2 = -join @([char]0xB179, [char]0xC74C)
$callWord = -join @([char]0xD1B5, [char]0xD654)
$specificWord = -join @([char]0xD2B9, [char]0xC815)
$casualDid = -join @([char]0xD588, [char]0xC5B4)

$zipFiles = Get-ChildItem -LiteralPath $downloads -Recurse -File -Filter '*.zip' |
  Where-Object {
    $_.Name.Contains($hanaCard) -and
    $_.Name.Contains($classification) -and
    ($_.Name.StartsWith('TL_') -or $_.Name.StartsWith('VL_'))
  } |
  Sort-Object FullName

if ($zipFiles.Count -eq 0) {
  throw 'No Hana Card classification zip files found under Downloads.'
}

function Normalize-Instruction {
  param([string]$Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return '' }
  $clean = $Text.Trim()
  $clean = $clean.Trim([char]34).Trim([char]0x201C).Trim([char]0x201D)
  return (($clean -replace '\s+', ' ').Trim())
}

$rows = New-Object System.Collections.Generic.List[object]
$classifierRows = New-Object System.Collections.Generic.List[object]
$stats = [ordered]@{
  source_files = 0
  source_zips = $zipFiles.Count
  raw_rows = 0
  kept_rows = 0
  skipped_blank = 0
  skipped_recording_specific = 0
  skipped_casual_question = 0
  classifier_rows = 0
}

foreach ($zipFile in $zipFiles) {
  $split = if ($zipFile.Name.StartsWith('TL_')) { 'Training' } else { 'Validation' }
  $archive = [System.IO.Compression.ZipFile]::OpenRead($zipFile.FullName)
  try {
    foreach ($entry in $archive.Entries) {
      if (-not $entry.FullName.EndsWith('.json')) { continue }
      $stats.source_files++

      $reader = [IO.StreamReader]::new($entry.Open(), [Text.Encoding]::UTF8)
      try {
        $items = @($reader.ReadToEnd() | ConvertFrom-Json)
      }
      finally {
        $reader.Dispose()
      }

      foreach ($item in $items) {
        $category = (($item.consulting_category -as [string]) -replace '\s+', ' ').Trim()
        if ([string]::IsNullOrWhiteSpace($category)) { continue }

        foreach ($block in @($item.instructions)) {
          foreach ($record in @($block.data)) {
            $stats.raw_rows++
            $instruction = Normalize-Instruction ($record.instruction -as [string])

            if ([string]::IsNullOrWhiteSpace($instruction)) {
              $stats.skipped_blank++
              continue
            }

            if ($instruction.Contains($recording1) -or $instruction.Contains($recording2) -or ($instruction.Contains($callWord) -and $instruction.Contains($specificWord))) {
              $stats.skipped_recording_specific++
              continue
            }

            if ($instruction.Contains($casualDid + '?') -or $instruction.Contains($casualDid + [char]0xFF1F)) {
              $stats.skipped_casual_question++
              continue
            }

            $rows.Add([pscustomobject]@{
              category = $category
              question = $instruction
              answer = "Category: $category"
              source = "AIHub HanaCard Classification $split`:$($item.source_id)"
            })
            $stats.kept_rows++

            $inputText = (($record.input -as [string]) -replace '\s+', ' ').Trim()
            if (-not [string]::IsNullOrWhiteSpace($inputText)) {
              $classifierRows.Add([pscustomobject]@{
                category = $category
                text = $inputText
                source = "AIHub HanaCard Classification $split`:$($item.source_id)"
              })
              $stats.classifier_rows++
            }
          }
        }
      }
    }
  }
  finally {
    $archive.Dispose()
  }
}

$dataDir = Join-Path $workspace 'data'
if (-not (Test-Path -LiteralPath $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}

$outputPath = Join-Path $dataDir 'faqs.csv'
$rows | Export-Csv -LiteralPath $outputPath -NoTypeInformation -Encoding UTF8

$classifierPath = Join-Path $PSScriptRoot 'hana_classifier_dataset.csv'
$classifierRows | Export-Csv -LiteralPath $classifierPath -NoTypeInformation -Encoding UTF8

$statsPath = Join-Path $PSScriptRoot 'hana_faqs_stats.json'
($stats | ConvertTo-Json -Depth 4) | Set-Content -LiteralPath $statsPath -Encoding UTF8

Write-Output "saved=$outputPath"
Write-Output "classifier_dataset=$classifierPath"
Write-Output "source_zips=$($stats.source_zips)"
Write-Output "source_files=$($stats.source_files)"
Write-Output "raw_rows=$($stats.raw_rows)"
Write-Output "kept_rows=$($stats.kept_rows)"
Write-Output "classifier_rows=$($stats.classifier_rows)"
Write-Output "skipped_recording_specific=$($stats.skipped_recording_specific)"
Write-Output "skipped_casual_question=$($stats.skipped_casual_question)"
