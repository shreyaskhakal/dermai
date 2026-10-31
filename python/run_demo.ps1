# =========================================================================
# DermaAI Academic Python Demonstration Suite - PowerShell Launcher
# =========================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$PythonExe = "python"
if (Test-Path "$ScriptDir\.venv\Scripts\python.exe") {
    $PythonExe = "$ScriptDir\.venv\Scripts\python.exe"
}

Write-Host "Starting DermaAI Academic Demonstration..." -ForegroundColor Cyan
& $PythonExe -m dermai_python.run_demo $args

