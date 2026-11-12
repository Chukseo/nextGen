# PowerShell Google Scholar Verification Script for nextgenuk.online
$Domain = "https://nextgenuk.online"
$WwwDomain = "https://www.nextgenuk.online"
$Slug = "cybersecurity-awareness-everyday-practices-and-privacy-behaviour-among-students-of-the-uni"

Write-Host "`n=== 1. Checking WWW -> Non-WWW Redirect ===" -ForegroundColor Cyan
try {
    $resWww = curl.exe -sI "$WwwDomain"
    $resWww | Select-Object -First 6
} catch { $_ }

Write-Host "`n=== 2. Checking Apex (Non-WWW) Status ===" -ForegroundColor Cyan
try {
    $resApex = curl.exe -sI "$Domain"
    $resApex | Select-Object -First 6
} catch { $_ }

Write-Host "`n=== 3. Checking robots.txt for Googlebot & Google-Scholar ===" -ForegroundColor Cyan
try {
    $robots = curl.exe -s "$Domain/robots.txt"
    $robots | Select-Object -First 20
} catch { $_ }

Write-Host "`n=== 4. Checking Google Scholar Meta Tags on Article ===" -ForegroundColor Cyan
try {
    $html = curl.exe -s -A "Google-Scholar" "$Domain/articles/$Slug"
    $meta = $html | Select-String -Pattern '<meta name="(citation_|DC\.)' -AllMatches
    $meta.Matches | Select-Object -First 25 | ForEach-Object { $_.Value }
} catch { $_ }

Write-Host "`n=== 5. Checking PDF Route (/article.pdf) ===" -ForegroundColor Cyan
try {
    $pdf = curl.exe -sI -A "Googlebot" "$Domain/articles/$Slug/article.pdf"
    $pdf | Select-Object -First 10
} catch { $_ }
