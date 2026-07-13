param(
    [ValidateSet("claude", "antigravity", "codex", "opencode")]
    [string]$Platform,
    [switch]$DryRun,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

function Show-Usage {
    Write-Output "Usage: install.ps1 [-Platform claude|antigravity|codex|opencode] [-DryRun] [-Help]"
    Write-Output "Clones or safely updates Supergraph, then installs the selected platform plugin."
}

if ($Help) {
    Show-Usage
    exit 0
}

$gitCommand = Get-Command git -ErrorAction SilentlyContinue
if ($null -eq $gitCommand) {
    Write-Error "Supergraph installer requires Git. Install Git and retry."
    exit 1
}

$repoUrl = if ($env:SUPERGRAPH_REPO_URL) {
    $env:SUPERGRAPH_REPO_URL
} else {
    "https://github.com/datit309/supergraph.git"
}

$installDir = if ($env:SUPERGRAPH_INSTALL_DIR) {
    $env:SUPERGRAPH_INSTALL_DIR
} else {
    Join-Path $env:LOCALAPPDATA "supergraph"
}

if (-not (Test-Path -LiteralPath $installDir)) {
    $parentDir = Split-Path -Parent $installDir
    if ($parentDir) {
        New-Item -ItemType Directory -Force -Path $parentDir | Out-Null
    }
    Write-Output "Cloning Supergraph into $installDir"
    & git clone -- $repoUrl $installDir
    if ($LASTEXITCODE -ne 0) {
        throw "Git clone failed with exit code $LASTEXITCODE."
    }
} elseif (-not (Test-Path -LiteralPath (Join-Path $installDir ".git") -PathType Container)) {
    Write-Error "Refusing to update: $installDir is not a Git checkout."
    exit 1
} else {
    $status = & git -C $installDir status --porcelain
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect Supergraph checkout."
    }
    if (-not [string]::IsNullOrWhiteSpace(($status -join "`n"))) {
        Write-Error "Refusing to update: $installDir has uncommitted changes."
        exit 1
    }
    Write-Output "Updating Supergraph in $installDir"
    & git -C $installDir pull --ff-only
    if ($LASTEXITCODE -ne 0) {
        throw "Git fast-forward update failed with exit code $LASTEXITCODE."
    }
}

$pluginInstaller = Join-Path $installDir "plugins/supergraph/install.sh"
if (-not (Test-Path -LiteralPath $pluginInstaller -PathType Leaf)) {
    Write-Error "Supergraph plugin installer not found: $pluginInstaller"
    exit 1
}

$bashCommand = Get-Command bash -ErrorAction SilentlyContinue
if ($null -eq $bashCommand) {
    $gitRoot = Split-Path -Parent (Split-Path -Parent $gitCommand.Source)
    $gitBash = Join-Path $gitRoot "bin/bash.exe"
    if (Test-Path -LiteralPath $gitBash -PathType Leaf) {
        $bashCommand = Get-Item -LiteralPath $gitBash
    }
}
if ($null -eq $bashCommand) {
    Write-Error "Git Bash is required to install Supergraph plugin links."
    exit 1
}

$installerArgs = @()
if ($Platform) {
    $installerArgs += @("--platform", $Platform)
}
if ($DryRun) {
    $installerArgs += "--dry-run"
}

& $bashCommand.Source $pluginInstaller @installerArgs
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
