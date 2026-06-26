<#
  build-store.ps1 — produce a Chrome Web Store-ready package of the ExamFill extension.

  What it does (your dev source is never modified):
    1. Copies the extension into  dist/examfill-extension/
    2. Rewrites the manifest: strips every http://localhost and http://127.0.0.1
       entry from host_permissions and content_scripts[].matches (dev-only URLs
       that the Web Store rejects). A content-script block whose matches become
       empty is dropped entirely.
    3. Leaves out files that must not ship: *.test.js, dead bundled adapters,
       this script, and the dist/ folder itself.
    4. Zips the result to  dist/examfill-extension-v<version>.zip  — upload that.

  Run from the examfill-extension folder:  ./build-store.ps1
#>

$ErrorActionPreference = 'Stop'
$root    = $PSScriptRoot
$distDir = Join-Path $root 'dist'
$pkgDir  = Join-Path $distDir 'examfill-extension'

# Files/dirs that must never be in the shipped package.
$excludeNames = @('dist', 'build-store.ps1', 'STORE_SUBMISSION.md', '.git')
$excludeFiles = @(
  (Join-Path $root 'utils\formatter.test.js'),   # unit test — not runtime
  (Join-Path $root 'adapters\nata.json')         # dead: adapters load from the backend
)

# ── Fresh dist ─────────────────────────────────────────────────────
if (Test-Path $distDir) { Remove-Item $distDir -Recurse -Force }
New-Item -ItemType Directory -Path $pkgDir -Force | Out-Null

# ── Copy source, applying exclusions ───────────────────────────────
Get-ChildItem -Path $root -Force | Where-Object { $excludeNames -notcontains $_.Name } | ForEach-Object {
  Copy-Item $_.FullName -Destination $pkgDir -Recurse -Force
}
foreach ($f in $excludeFiles) {
  $rel = $f.Substring($root.Length).TrimStart('\','/')
  $target = Join-Path $pkgDir $rel
  if (Test-Path $target) { Remove-Item $target -Force }
}

# ── Rewrite the manifest: drop localhost / 127.0.0.1 ───────────────
$isDevUrl = { param($u) $u -match '://(localhost|127\.0\.0\.1)(:|/|$)' }

$manifestPath = Join-Path $pkgDir 'manifest.json'
# Read as UTF-8 explicitly — Get-Content -Raw uses the ANSI codepage on PS 5.1 and
# would mojibake the em dash in the extension name.
$manifest = [System.IO.File]::ReadAllText($manifestPath, (New-Object System.Text.UTF8Encoding($false))) | ConvertFrom-Json

$manifest.host_permissions = @($manifest.host_permissions | Where-Object { -not (& $isDevUrl $_) })

if ($manifest.content_scripts) {
  $manifest.content_scripts = @(
    foreach ($cs in $manifest.content_scripts) {
      $cs.matches = @($cs.matches | Where-Object { -not (& $isDevUrl $_) })
      if ($cs.matches.Count -gt 0) { $cs }   # drop a block with no remaining matches
    }
  )
}

# ConvertTo-Json mangles nested arrays at shallow depth — go deep, write UTF-8 (no BOM).
$json = $manifest | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($manifestPath, $json, (New-Object System.Text.UTF8Encoding($false)))

# ── Zip ────────────────────────────────────────────────────────────
$version = $manifest.version
$zipPath = Join-Path $distDir "examfill-extension-v$version.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $pkgDir '*') -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "OK  Store package built:" -ForegroundColor Green
Write-Host "    $zipPath"
Write-Host "    host_permissions kept: $($manifest.host_permissions.Count)"
Write-Host "    Upload that zip at https://chrome.google.com/webstore/devconsole"
