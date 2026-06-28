# CommandHub Installer Script
# irm https://raw.githubusercontent.com/adityasing9/CommandHub/main/scripts/install.ps1 | iex

$appName = "CommandHub"
$installDir = "$env:LOCALAPPDATA\Programs\$appName"
$shortcutPath = "$env:USERPROFILE\Desktop\$appName.lnk"

Write-Host "Installing CommandHub..." -ForegroundColor Cyan

if (!(Test-Path -Path $installDir)) {
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
}

Write-Host "Downloading latest release..."
# Placeholder for downloading the actual binary
# Invoke-WebRequest -Uri "https://github.com/your-username/CommandHub/releases/latest/download/CommandHub.exe" -OutFile "$installDir\CommandHub.exe"

# Create shortcut
Write-Host "Creating desktop shortcut..."
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "$installDir\CommandHub.exe"
$Shortcut.Save()

Write-Host "Installation complete! You can now run CommandHub from your desktop." -ForegroundColor Green
