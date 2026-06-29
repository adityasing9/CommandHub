# CmdForge Interactive Installer
# Usage: irm https://raw.githubusercontent.com/adityasing9/CommandHub/main/scripts/install.ps1 | iex

$ErrorActionPreference = "Stop"

# ─────────────────────────────────────────
#  COLORS & HELPERS
# ─────────────────────────────────────────
function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ██████╗███╗   ███╗██████╗     ███████╗██████╗ ██████╗  ██████╗ ███████╗" -ForegroundColor Cyan
    Write-Host " ██╔════╝████╗ ████║██╔══██╗    ██╔════╝██╔══██╗██╔══██╗██╔════╝ ██╔════╝" -ForegroundColor Cyan
    Write-Host " ██║     ██╔████╔██║██║  ██║    █████╗  ██████╔╝██████╔╝██║  ███╗█████╗  " -ForegroundColor Cyan
    Write-Host " ██║     ██║╚██╔╝██║██║  ██║    ██╔══╝  ██╔══██╗██╔══██╗██║   ██║██╔══╝  " -ForegroundColor Cyan
    Write-Host " ╚██████╗██║ ╚═╝ ██║██████╔╝    ██║     ██║  ██║██║  ██║╚██████╔╝███████╗" -ForegroundColor Cyan
    Write-Host "  ╚═════╝╚═╝     ╚═╝╚═════╝     ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Search. Learn. Execute." -ForegroundColor DarkCyan
    Write-Host "  github.com/adityasing9/CommandHub" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ────────────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
}

function Write-Success($msg) { Write-Host "  ✔  $msg" -ForegroundColor Green }
function Write-Info($msg)    { Write-Host "  ●  $msg" -ForegroundColor Cyan }
function Write-Warn($msg)    { Write-Host "  ⚠  $msg" -ForegroundColor Yellow }
function Write-Err($msg)     { Write-Host "  ✖  $msg" -ForegroundColor Red }
function Write-Step($msg)    { Write-Host "  →  $msg" -ForegroundColor White }

function Pause-Menu {
    Write-Host ""
    Write-Host "  Press any key to return to the menu..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# ─────────────────────────────────────────
#  CONSTANTS
# ─────────────────────────────────────────
$AppName    = "CmdForge"
$InstallDir = "$env:LOCALAPPDATA\Programs\$AppName"
$ShortcutPath = "$env:USERPROFILE\Desktop\$AppName.lnk"
$RepoURL    = "https://github.com/adityasing9/CommandHub"
$ReleaseAPI = "https://api.github.com/repos/adityasing9/CommandHub/releases/latest"

# ─────────────────────────────────────────
#  ACTIONS
# ─────────────────────────────────────────

function Show-SystemInfo {
    Write-Header
    Write-Host "  ═══════════════ SYSTEM INFORMATION ════════════════" -ForegroundColor DarkCyan
    Write-Host ""

    $os      = (Get-CimInstance Win32_OperatingSystem).Caption
    $ram     = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
    $arch    = $env:PROCESSOR_ARCHITECTURE
    $psVer   = $PSVersionTable.PSVersion.ToString()
    $already = if (Test-Path "$InstallDir\$AppName.exe") { "Yes ✔" } else { "Not installed" }

    Write-Host "  OS           : $os" -ForegroundColor White
    Write-Host "  Architecture : $arch" -ForegroundColor White
    Write-Host "  RAM          : $ram GB" -ForegroundColor White
    Write-Host "  PowerShell   : $psVer" -ForegroundColor White
    Write-Host "  Install Path : $InstallDir" -ForegroundColor White
    Write-Host "  Installed    : $already" -ForegroundColor White
    Write-Host ""

    Pause-Menu
}

function Install-App {
    Write-Header
    Write-Host "  ═══════════════ INSTALL $AppName ════════════════" -ForegroundColor DarkCyan
    Write-Host ""
    Write-Info "This will install $AppName on your system."
    Write-Host ""

    $confirm = Read-Host "  Proceed with installation? (Y/N)"
    if ($confirm -notmatch "^[Yy]$") {
        Write-Warn "Installation cancelled."
        Pause-Menu
        return
    }

    Write-Host ""
    Write-Step "Creating install directory..."
    if (!(Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    }
    Write-Success "Directory ready: $InstallDir"

    Write-Step "Fetching latest release info from GitHub..."
    try {
        $release = Invoke-RestMethod -Uri $ReleaseAPI -Headers @{ "User-Agent" = "CmdForge-Installer" }
        $version = $release.tag_name
        Write-Success "Latest version: $version"

        # Find the Windows asset
        $asset = $release.assets | Where-Object { $_.name -like "*windows*" -or $_.name -like "*.exe" } | Select-Object -First 1

        if ($asset) {
            Write-Step "Downloading $($asset.name)..."
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile "$InstallDir\$AppName.exe" -UseBasicParsing
            Write-Success "Download complete."
        } else {
            Write-Warn "No Windows binary found in the release yet (GitHub Actions build may still be running)."
            Write-Warn "Clone and run from source: $RepoURL"
        }
    } catch {
        Write-Warn "Could not fetch release assets."
        Write-Info "You can build from source: git clone $RepoURL"
    }

    Write-Step "Creating Desktop shortcut..."
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.TargetPath = "$InstallDir\$AppName.exe"
        $Shortcut.IconLocation = "$InstallDir\$AppName.exe"
        $Shortcut.Save()
        Write-Success "Shortcut created on Desktop."
    } catch {
        Write-Warn "Could not create shortcut (binary not downloaded yet)."
    }

    Write-Step "Adding to PATH..."
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$InstallDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$InstallDir", "User")
        Write-Success "Added to User PATH."
    } else {
        Write-Info "Already in PATH."
    }

    Write-Host ""
    Write-Success "$AppName installation complete!"
    Write-Info "Run '$AppName' from any terminal or use the Desktop shortcut."
    Write-Host ""
    Pause-Menu
}

function Uninstall-App {
    Write-Header
    Write-Host "  ══════════════ UNINSTALL $AppName ══════════════" -ForegroundColor Red
    Write-Host ""
    Write-Warn "This will remove $AppName from your system."
    Write-Host ""

    $confirm = Read-Host "  Are you sure you want to uninstall? (Y/N)"
    if ($confirm -notmatch "^[Yy]$") {
        Write-Info "Uninstall cancelled."
        Pause-Menu
        return
    }

    Write-Step "Removing install directory..."
    if (Test-Path $InstallDir) {
        Remove-Item -Recurse -Force $InstallDir
        Write-Success "Removed: $InstallDir"
    } else {
        Write-Warn "Install directory not found."
    }

    Write-Step "Removing Desktop shortcut..."
    if (Test-Path $ShortcutPath) {
        Remove-Item $ShortcutPath -Force
        Write-Success "Shortcut removed."
    }

    Write-Step "Removing from PATH..."
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $newPath = ($currentPath -split ";" | Where-Object { $_ -ne $InstallDir }) -join ";"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Success "Removed from PATH."

    Write-Host ""
    Write-Success "$AppName has been uninstalled."
    Write-Host ""
    Pause-Menu
}

function Check-ForUpdates {
    Write-Header
    Write-Host "  ════════════════ CHECK FOR UPDATES ═════════════════" -ForegroundColor DarkCyan
    Write-Host ""
    Write-Step "Checking latest release on GitHub..."
    try {
        $release = Invoke-RestMethod -Uri $ReleaseAPI -Headers @{ "User-Agent" = "CmdForge-Installer" }
        Write-Host ""
        Write-Success "Latest version : $($release.tag_name)"
        Write-Info "Released on    : $($release.published_at)"
        Write-Info "Release notes  : $($release.html_url)"
        Write-Host ""
        Write-Info "Run option [1] Install/Update to download this version."
    } catch {
        Write-Warn "Could not reach GitHub. Check your internet connection."
    }
    Write-Host ""
    Pause-Menu
}

function Open-GitHub {
    Write-Header
    Write-Info "Opening GitHub repository..."
    Start-Process $RepoURL
    Write-Success "Opened: $RepoURL"
    Pause-Menu
}

# ─────────────────────────────────────────
#  MAIN MENU LOOP
# ─────────────────────────────────────────
do {
    Write-Header
    Write-Host "  What would you like to do?" -ForegroundColor White
    Write-Host ""
    Write-Host "    [1]  Install / Update CmdForge" -ForegroundColor Green
    Write-Host "    [2]  Check for Updates" -ForegroundColor Cyan
    Write-Host "    [3]  System Information" -ForegroundColor Cyan
    Write-Host "    [4]  Open GitHub Repository" -ForegroundColor Cyan
    Write-Host "    [5]  Uninstall CmdForge" -ForegroundColor Yellow
    Write-Host "    [Q]  Quit" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ────────────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""

    $choice = Read-Host "  Enter your choice"

    switch ($choice.ToUpper()) {
        "1" { Install-App }
        "2" { Check-ForUpdates }
        "3" { Show-SystemInfo }
        "4" { Open-GitHub }
        "5" { Uninstall-App }
        "Q" {
            Write-Header
            Write-Info "Thanks for using CmdForge. Goodbye!"
            Write-Host ""
            break
        }
        default {
            Write-Header
            Write-Warn "Invalid choice '$choice'."
            Start-Sleep -Seconds 1
        }
    }
} while ($choice.ToUpper() -ne "Q")
