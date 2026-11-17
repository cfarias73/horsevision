# HorseVision — Equine Biomechanics & Computer Vision Suite

Sistema integrado de análisis biomecánico equino en 2D que combina un motor de visión artificial en Python (**FastAPI + OpenCV + SciPy + YOLOv8/SuperAnimal/DLC_Horse/ElectrifAi**) con una experiencia móvil nativa oscura (**React + Tailwind CSS + HTML5 Canvas API**).

## Arquitectura

### Bloque 1: Backend (`backend/`)
- `pipeline/quality_gate.py` (**RHDA**): Detección y tracking del bounding box del caballo, validación de relación de aspecto lateral 90° (`ancho > alto`) y filtrado de oclusiones o desenfoque antes de inferencia profunda.
- `pipeline/pose_extractor.py` (**SuperAnimal-Quadruped / MMPose AP-10K / DLC_Horse**): Extracción de 20 puntos anatómicos clave (`poll`, `nostrils`, `withers`, `hip`, hombros/babillas, rodillas/corvejones, menudillos y cascos), adaptación de video con flujo óptico Lucas-Kanade y suavizado Savitzky-Golay (`window=7, polyorder=3`) para aproximar los *Anatomical Joint Centers (AJC)*.
- `pipeline/kinematics_dlc.py` (**DLC_Horse**): Cálculo cuadro por cuadro de ángulos articulares internos (corvejón, rodilla, menudillo), primera derivada de posición `(x, y)` de cada casco para segmentar *foot-strike* / *toe-off* (**Stance ms** y **Swing ms**) y longitud de zancada normalizada por altura de la cruz.
- `pipeline/symmetry_engine.py` (**ElectrifAi**): Análisis de series temporales verticales ($Y$) para **Head Nod** (`LF` vs `RF`) y **Pelvic Hike / Drop** (`LH` vs `RH`), cálculo del Índice de Simetría (`SI %`), Score Global (`0-100`) y alertas veterinarias (`>10%` leve, `>15%` moderada/alta).
- `main.py`: API FastAPI (`GET /api/health`, `POST /api/analyze`, `GET /api/videos/{filename}`).

### Bloque 2: Frontend Móvil Nativo (`frontend/`)
- `src/components/NativeShell.jsx`: Viewport móvil nativo (`max-width: 430px` en escritorio, `100dvh` en móvil, `safe-area-inset-bottom`, estética oscura `#09090B` con resplandores carmesí y tipografía `JetBrains Mono` + `Inter`).
- `src/components/UploadView.jsx`: Captura directa con cámara (`capture="environment"`), carga de `.mp4`/`.mov` y carga de videos demo reales a través del pipeline completo.
- `src/components/AnalysisView.jsx`: Visor cinemático sincronizado cuadro por cuadro (`requestVideoFrameCallback` + `<canvas>`), dibujo de vectores anatómicos, arcos de ángulo en vivo, selector de cámara lenta (`0.25x`, `0.5x`, `1x`) y métricas en tiempo real.
- `src/components/ReportView.jsx`: Score Global (`0-100`) con anillo SVG, semáforo clínico, gráfica temporal de oscilación vertical, tarjetas 2×2 por extremidad (`LF`, `RF`, `LH`, `RH`) y reporte de hallazgos.

## Ejecución Rápida

```bash
chmod +x start.sh
./start.sh
```

O manualmente:
- Backend: `cd backend && .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000`
- Frontend: `cd frontend && npm run dev -- --host`

## Pruebas del Pipeline

```bash
cd backend && .venv/bin/pytest -v tests/test_pipeline.py
```
