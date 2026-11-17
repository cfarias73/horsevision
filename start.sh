#!/usr/bin/env bash
# ==============================================================================
# HorseVision — Script de inicio integrado (FastAPI Backend + React Mobile UI)
# ==============================================================================

set -e
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  echo ""
  echo "Deteniendo servidores HorseVision..."
  kill $(jobs -p) 2>/dev/null || true
}
trap cleanup SIGINT SIGTERM EXIT

echo "========================================================"
echo "  HorseVision | Motor Biomecánico Equino + App Móvil   "
echo "========================================================"

# 1. Iniciar Backend FastAPI (puerto 8000)
echo "-> Iniciando Backend FastAPI en http://localhost:8000 ..."
cd "$PROJECT_DIR/backend"
"$PROJECT_DIR/backend/.venv/bin/uvicorn" main:app --host 0.0.0.0 --port 8000 &

sleep 2

# 2. Iniciar Frontend Vite (puerto 5173)
echo "-> Iniciando Frontend Móvil en http://localhost:5173 ..."
cd "$PROJECT_DIR/frontend"
npm run dev -- --host &

echo ""
echo "HorseVision activo:"
echo "  - App Móvil:      http://localhost:5173"
echo "  - API FastAPI:    http://localhost:8000"
echo "  - Docs OpenAPI:   http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios."

wait
