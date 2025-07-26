# Fix Git PATH - Run this ONCE to permanently fix Git
Write-Host "🔧 Adding Git to your PATH permanently..." -ForegroundColor Yellow

# Get current user PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)

# Git paths to add
$gitBin = "C:\Program Files\Git\bin"
$gitCmd = "C:\Program Files\Git\cmd"

# Check if Git is already in PATH
if ($currentPath -notlike "*Git\bin*") {
    # Add Git to PATH
    $newPath = "$currentPath;$gitBin;$gitCmd"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
    Write-Host "✅ Git has been added to your PATH!" -ForegroundColor Green
    Write-Host "ℹ️  Restart PowerShell and Git will work in all future sessions." -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  Git is already in your PATH." -ForegroundColor Green
}

Write-Host "🎯 You can now use git commands in any PowerShell session!" -ForegroundColor Green 