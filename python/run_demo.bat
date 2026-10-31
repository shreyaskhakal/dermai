@echo off
REM =========================================================================
REM DermaAI Academic Python Demonstration Suite - Windows Launcher
REM =========================================================================

echo Starting DermaAI Supplementary Academic Python Demonstration...

cd /d "%~dp0"

IF EXIST ".venv\Scripts\python.exe" (
    SET "PYTHON_EXE=.venv\Scripts\python.exe"
) ELSE (
    SET "PYTHON_EXE=python"
)

%PYTHON_EXE% -m dermai_python.run_demo %*

pause
