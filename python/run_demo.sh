#!/usr/bin/env bash
# =========================================================================
# DermaAI Academic Python Demonstration Suite - macOS / Linux Launcher
# =========================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f ".venv/bin/python" ]; then
    PYTHON_EXE=".venv/bin/python"
elif [ -f ".venv/bin/python3" ]; then
    PYTHON_EXE=".venv/bin/python3"
elif command -v python3 &>/dev/null; then
    PYTHON_EXE="python3"
else
    PYTHON_EXE="python"
fi

echo "Starting DermaAI Academic Demonstration..."
"$PYTHON_EXE" -m dermai_python.run_demo "$@"

