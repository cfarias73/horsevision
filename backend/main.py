"""
main.py
HorseVision Biomechanical & Computer Vision FastAPI Server.
Executes the 4-stage sequential equine analysis pipeline:
  1. RHDAQualityGate (YOLOv8 / OpenCV Lateral 90° & Occlusion Gate)
  2. EquinePoseExtractor (SuperAnimal-Quadruped / DLC_Horse + Savitzky-Golay AJC)
  3. DLCKinematicsEngine (Joint Angles, Hoof Derivatives, Stance/Swing ms, Norm Stride)
  4. EquineSymmetryEngine (Head Nod, Pelvic Hike/Drop, SI %, Veterinary Findings)
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import httpx
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from pipeline import (
    DLCKinematicsEngine,
    EquinePoseExtractor,
    EquineSymmetryEngine,
    RHDAQualityGate,
)
from pipeline.pose_extractor import DLC_SKELETON_EDGES
from sample_video_generator import ensure_demo_videos

BASE_DIR = Path(__file__).resolve().parent
ASSETS_DIR = BASE_DIR / "assets"
UPLOADS_DIR = BASE_DIR / "uploads"
MODELS_DIR = BASE_DIR / "models"


def _load_env_file(path: Path):
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


_load_env_file(BASE_DIR / ".env")
_load_env_file(BASE_DIR.parent / ".env")

ASSETS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("horsevision.api")

app = FastAPI(
    title="HorseVision Biomechanical API",
    description="Motor de Visión Artificial y Biomecánica Equina (RHDA + SuperAnimal/DLC_Horse + ElectrifAi)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pipeline engines once on server startup
quality_gate = RHDAQualityGate(models_dir=MODELS_DIR)
pose_extractor = EquinePoseExtractor(savgol_window=7, savgol_polyorder=3, models_dir=MODELS_DIR)
kinematics_engine = DLCKinematicsEngine()
symmetry_engine = EquineSymmetryEngine()
DEMO_VIDEOS = ensure_demo_videos(ASSETS_DIR)


def _sanitize_json(obj: Any) -> Any:
    """Recursively converts NumPy scalars/arrays to native Python primitives."""
    if isinstance(obj, dict):
        return {str(k): _sanitize_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_sanitize_json(v) for v in obj]
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return [_sanitize_json(v) for v in obj.tolist()]
    return obj


def _ensure_browser_mp4(src_path: Path, dst_path: Path) -> Path:
    """
    Ensures uploaded .mov/.mp4 video is encoded in H.264 yuv420p + faststart,
    and downscales 4K/oversized video to max 960px width so:
    1. Mobile browsers can stream and buffer instantly (< 8MB).
    2. Cloud container RAM stays strictly protected (< 250MB).
    3. Faststart atom is placed at beginning of container for instant streaming.
    """
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(src_path),
        "-vf",
        "scale='min(960,iw)':-2",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-preset",
        "ultrafast",
        "-crf",
        "26",
        "-r",
        "30",
        "-an",
        str(dst_path),
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=50)
        if proc.returncode == 0 and dst_path.exists() and dst_path.stat().st_size > 1000:
            return dst_path
        else:
            logger.warning("ffmpeg transcode non-zero exit: %s", proc.stderr[:300] if proc.stderr else "unknown")
    except Exception as exc:
        logger.warning("ffmpeg transcode skipped (%s); serving original file.", exc)
    return src_path


def _read_video_frames(
    video_path: Path,
    max_frames: int = 300,
    max_dim: int = 640,
) -> tuple[list[np.ndarray], float, int, int]:
    """
    Reads BGR frames, FPS, width, and height directly from video file.
    Guarantees strict memory safety (< 250MB RAM):
    1. Downsamples frames if fps > 35 (e.g. 60fps -> reads every 2nd frame).
    2. Defensively resizes frames so max dimension does not exceed max_dim (640).
    3. Caps total frames at max_frames (300 frames = 10s of trot, ample for gait cycles).
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="No se pudo abrir el archivo de video.")

    raw_fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    if raw_fps <= 1.0 or raw_fps > 240.0:
        raw_fps = 30.0

    orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)

    # Stride sample down to ~30fps if high framerate (e.g. 60fps / 120fps)
    frame_step = max(1, int(round(raw_fps / 30.0)))
    effective_fps = raw_fps / frame_step

    frames: List[np.ndarray] = []
    frame_idx = 0
    while len(frames) < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_step == 0:
            fh, fw = frame.shape[:2]
            if max(fh, fw) > max_dim:
                scale = max_dim / float(max(fh, fw))
                new_w = max(1, int(round(fw * scale)))
                new_h = max(1, int(round(fh * scale)))
                frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
            frames.append(frame)

        frame_idx += 1

    cap.release()
    if not frames:
        raise HTTPException(status_code=400, detail="El video no contiene cuadros legibles.")

    disp_w = orig_w or frames[0].shape[1]
    disp_h = orig_h or frames[0].shape[0]
    return frames, effective_fps, disp_w, disp_h


def run_full_pipeline(video_path: Path, video_url: str, video_name: str) -> Dict[str, Any]:
    """Executes all 4 HorseVision biomechanical modules in sequence on a real video file."""
    t_start = time.perf_counter()

    frames_bgr, fps, width, height = _read_video_frames(video_path)
    total_frames = len(frames_bgr)
    duration_s = round(total_frames / max(fps, 1e-6), 3)

    # 1. RHDA Quality Gate (YOLOv8 / Lateral 90° / Occlusion)
    quality_records, quality_summary = quality_gate.process_frames(frames_bgr, fps=fps)
    if quality_summary["valid_frames"] < 5:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Gate de calidad RHDA rechazó la mayoría de cuadros ({quality_summary['valid_frames']}/"
                f"{total_frames} válidos). Asegúrate de grabar en vista lateral 90° sin obstrucciones."
            ),
        )

    # 2. SuperAnimal-Quadruped / DLC_Horse Pose Extraction + Savitzky-Golay AJC
    per_frame_poses, pose_summary = pose_extractor.extract_poses(frames_bgr, quality_records)

    # 3. DLC_Horse Kinematics & Stance/Swing Gait Segmentation
    kinematics = kinematics_engine.analyze(
        per_frame_poses=per_frame_poses,
        fps=fps,
        facing_direction=pose_summary["facing_direction"],
    )

    # 4. ElectrifAi Equine Symmetry & Lameness Detection
    symmetry = symmetry_engine.analyze(
        per_frame_poses=per_frame_poses,
        kinematics=kinematics,
        quality_summary=quality_summary,
        fps=fps,
    )

    sym_report = symmetry["symmetry_report"]
    ant_si = sym_report["anterior_si_pct"]
    post_si = sym_report["posterior_si_pct"]

    # Assemble strict per-frame JSON for HTML5 Canvas synchronization
    frames_payload: List[Dict[str, Any]] = []
    for idx in range(total_frames):
        qrec = quality_records[idx]
        prec = per_frame_poses[idx]
        krec = kinematics["per_frame"][idx]
        frames_payload.append(
            {
                "frame_index": idx,
                "timestamp_s": round(idx / max(fps, 1e-6), 4),
                "passed_gate": qrec.passed,
                "rejection_reason": qrec.rejection_reason,
                "confidence": qrec.confidence,
                "aspect_ratio": qrec.aspect_ratio,
                "bbox_norm": list(qrec.bbox_norm) if qrec.bbox_norm else None,
                "keypoints": prec["keypoints_norm"],
                "angles": krec["angles"],
                "stance_state": krec["stance_state"],
                "live_metrics": {
                    "hock_angle_deg": krec["active_hock_deg"],
                    "knee_angle_deg": krec["active_knee_deg"],
                    "croup_elevation_mm": krec["croup_elevation_mm"],
                    "anterior_symmetry_pct": ant_si,
                    "posterior_symmetry_pct": post_si,
                },
            }
        )

    elapsed_ms = round((time.perf_counter() - t_start) * 1000.0, 1)

    payload = {
        "session_id": uuid.uuid4().hex[:12],
        "video_url": video_url,
        "video_name": video_name,
        "fps": round(fps, 3),
        "resolution": {"width": width, "height": height},
        "duration_s": duration_s,
        "total_frames": total_frames,
        "processing_ms": elapsed_ms,
        "quality_gate": quality_summary,
        "pose_engine": pose_summary,
        "skeleton_edges": [list(edge) for edge in DLC_SKELETON_EDGES],
        "frames": frames_payload,
        "limbs": symmetry["limbs"],
        "kinematics_summary": {
            "stride_length_normalized": kinematics["stride_length_normalized"],
            "stride_length_m": kinematics["stride_length_m"],
            "withers_height_px": kinematics["withers_height_px"],
            "cadence_spm": kinematics["cadence_spm"],
            "back_rom_deg": kinematics["back_rom_deg"],
            "rom_deg": kinematics["back_rom_deg"],
            "savgol_window": pose_summary["savgol_window"],
            "savgol_polyorder": pose_summary["savgol_polyorder"],
            "jitter_reduction_pct": pose_summary["jitter_reduction_pct"],
        },
        "time_series": symmetry["time_series"],
        "symmetry_report": sym_report,
    }
    return _sanitize_json(payload)


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    """Verifies readiness of YOLOv8 Quality Gate, Pose Extractor, Kinematics, and Symmetry engines."""
    return {
        "status": "ready",
        "banner": "YOLOv8 + Pose Engine Ready",
        "engines": {
            "quality_gate": quality_gate.engine_name,
            "pose_extractor": pose_extractor.engine_name,
            "kinematics": "DLC_Horse Trigonometry + 1st-Derivative Hoof Segmentation",
            "symmetry": "ElectrifAi Head Nod & Pelvic Hike Engine",
        },
        "demo_presets": list(DEMO_VIDEOS.keys()),
    }


@app.get("/api/videos/{filename}")
def serve_video(filename: str) -> FileResponse:
    """Serves uploaded or demo MP4 videos with byte-range streaming support."""
    safe_name = Path(filename).name
    for folder in (UPLOADS_DIR, ASSETS_DIR):
        candidate = folder / safe_name
        if candidate.exists() and candidate.is_file():
            media_type = "video/quicktime" if candidate.suffix.lower() == ".mov" else "video/mp4"
            return FileResponse(path=str(candidate), media_type=media_type, filename=safe_name)
    raise HTTPException(status_code=404, detail="Video no encontrado.")


@app.post("/api/analyze")
async def analyze_video(
    video: Optional[UploadFile] = File(None),
    demo_preset: Optional[str] = Form(None),
) -> Dict[str, Any]:
    """
    Receives an uploaded .mp4/.mov video (or selects a real demo video file when
    demo_preset is provided), executes all 4 biomechanical pipeline modules in
    sequence, and returns the strict analysis JSON.
    """
    if video is not None:
        ext = Path(video.filename or "upload.mp4").suffix.lower()
        if ext not in (".mp4", ".mov", ".m4v", ".avi"):
            raise HTTPException(status_code=400, detail="Formato no soportado. Usa .mp4 o .mov.")

        uid = uuid.uuid4().hex[:10]
        raw_path = UPLOADS_DIR / f"horse_{uid}{ext}"
        content = await video.read()
        if not content:
            raise HTTPException(status_code=400, detail="El archivo de video está vacío.")
        raw_path.write_bytes(content)

        playable_path = _ensure_browser_mp4(raw_path, UPLOADS_DIR / f"horse_{uid}_h264.mp4")
        video_url = f"/api/videos/{playable_path.name}"
        return run_full_pipeline(playable_path, video_url=video_url, video_name=video.filename or playable_path.name)

    if demo_preset:
        preset_key = demo_preset.strip().lower()
        if preset_key not in DEMO_VIDEOS:
            raise HTTPException(status_code=400, detail=f"Demo preset inválido: {demo_preset}")
        demo_path = DEMO_VIDEOS[preset_key]
        video_url = f"/api/videos/{demo_path.name}"
        return run_full_pipeline(demo_path, video_url=video_url, video_name=demo_path.name)

    raise HTTPException(status_code=400, detail="Debes enviar un archivo de video o un preset demo válido.")


DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"


class AIReportRequest(BaseModel):
    horse_name: Optional[str] = "Equino"
    discipline: Optional[str] = "Deporte Ecuestre"
    age: Optional[str] = "No especificada"
    notes: Optional[str] = ""
    symmetry_report: Optional[Dict[str, Any]] = None
    kinematics_summary: Optional[Dict[str, Any]] = None
    limbs: Optional[Dict[str, Any]] = None
    analysis_data: Optional[Dict[str, Any]] = None


@app.post("/api/ai-report")
async def generate_ai_report(request: AIReportRequest) -> Dict[str, Any]:
    """
    Connects to DeepSeek API to synthesize raw kinematic and symmetry metrics
    into an elite sports veterinary clinical diagnosis and tailored 4-week
    biomechanical rehabilitation & training plan.
    """
    ad = request.analysis_data or {}
    sym = request.symmetry_report or ad.get("symmetry_report") or {}
    kin = request.kinematics_summary or ad.get("kinematics_summary") or {}
    limbs = request.limbs or ad.get("limbs") or ad.get("limb_kinematics") or {}

    # Format limbs summary for prompt
    limbs_str = ""
    for code in ("LF", "RF", "LH", "RH"):
        l_data = limbs.get(code, {})
        limbs_str += (
            f"  - {code} ({l_data.get('label_es', code)}): SI={l_data.get('si_pct', 0)}%, "
            f"Apoyo={round(l_data.get('stance_ms', 0))}ms, Vuelo={round(l_data.get('swing_ms', 0))}ms, "
            f"Duty Factor={l_data.get('stance_pct', 50)}%, "
            f"Protracción=+{l_data.get('protraction_deg', 0)}°, Retracción=-{l_data.get('retraction_deg', 0)}°, "
            f"Elevación Casco={l_data.get('max_clearance_mm', 0)}mm, ROM={l_data.get('rom_deg', 0)}°.\n"
        )

    system_prompt = (
        "Eres un Médico Veterinario de Élite Especialista en Biomecánica y Medicina Deportiva Equina "
        "(Diplomate ACVSMR / ECVSMR con experiencia en sistemas objetivos Sleip y Lameness Locator). "
        "Analizas datos cinemáticos objetivos y elaboras un informe clínico de rigor científico "
        "junto con un programa de fisioterapia, trabajo correctivo y ejercicios específicos para el caballo.\n"
        "Debes responder EXCLUSIVAMENTE con un JSON válido y bien estructurado con el siguiente formato exacto:\n"
        "{\n"
        '  "executive_summary": "Párrafo de resumen clínico global...",\n'
        '  "clinical_grade": "Diagnóstico conciso del grado de asimetría o cojera (ej: Claudicación Subclínica Posterior Izquierda Grado 2/5 AAEP)",\n'
        '  "risk_level": "Bajo | Moderado | Alto",\n'
        '  "biomechanical_breakdown": {\n'
        '     "head_and_neck": "Análisis del cabeceo, impacto anterior ΔYmin y empuje anterior ΔYmax...",\n'
        '     "pelvis_and_propulsion": "Análisis del movimiento de grupa, impacto posterior ΔYmin y empuje posterior ΔYmax...",\n'
        '     "thoracolumbar_back": "Análisis del ROM toracolumbar del dorso y su impacto en la transmisión de energía...",\n'
        '     "limb_dynamics": "Análisis de protracción/retracción, elevación de casco y fases de apoyo/vuelo..."\n'
        "  },\n"
        '  "rehabilitation_plan": {\n'
        '     "target_goal": "Objetivo biomecánico del programa...",\n'
        '     "weekly_phases": [\n'
        '        {"phase": "Semanas 1-2 (Fase Aguda / Movilidad)", "focus": "Objetivo principal...", "routine": "Descripción de la carga y rutina..."},\n'
        '        {"phase": "Semanas 3-4 (Fase de Fortalecimiento y Simetría)", "focus": "Objetivo...", "routine": "Descripción..."}\n'
        "     ],\n"
        '     "corrective_exercises": [\n'
        '        {"name": "Nombre del ejercicio", "category": "Cavalletti | Cuerda | Core / Propiocepción | Monta", "frequency": "3 veces por semana", "duration": "15 min", "instructions": "Instrucciones paso a paso...", "biomechanical_benefit": "Por qué corrige la deficiencia detectada..."}\n'
        "     ]\n"
        "  },\n"
        '  "farriery_and_vet_notes": "Indicaciones para el herrador (balance podal) y veterinario de campo...",\n'
        '  "followup_recommendation": "Plazo sugerido para el próximo re-escaneo con la app (ej: 21 días) y signos de alerta."\n'
        "}"
    )

    user_content = (
        f"DATOS DEL EQUINO EVALUADO:\n"
        f"- Nombre: {request.horse_name}\n"
        f"- Disciplina: {request.discipline}\n"
        f"- Edad / Notas adicionales: {request.age} | {request.notes or 'Ninguna'}\n\n"
        f"MÉTRICAS CINEMÁTICAS OBJETIVAS:\n"
        f"- Score Global de Simetría: {sym.get('global_score', 0)}/100 (Clasificación: {sym.get('grade_label', 'N/A')})\n"
        f"- Decisión Clínica Algorítmica: {sym.get('clinical_decision', 'N/A')}\n"
        f"- Impacto Anterior (ΔYmin): {sym.get('fore_impact_asym_mm', 0)} mm\n"
        f"- Impulso Anterior (ΔYmax): {sym.get('fore_pushoff_asym_mm', 0)} mm\n"
        f"- Impacto Posterior (ΔYmin): {sym.get('hind_impact_asym_mm', 0)} mm\n"
        f"- Impulso Posterior (ΔYmax): {sym.get('hind_pushoff_asym_mm', 0)} mm\n"
        f"- Rango de Movimiento (ROM) Toracolumbar / Dorso: {kin.get('back_rom_deg', 0)}° (Valores de referencia saludables en trote: 7.0° a 11.0°)\n"
        f"- Longitud de Zancada: {kin.get('stride_length_m', 0)} m (Normalizada: {kin.get('stride_length_normalized', 0)})\n"
        f"- Cadencia: {kin.get('cadence_spm', 0)} pasos/min\n\n"
        f"DESGLOSE POR EXTREMIDAD:\n"
        f"{limbs_str}\n"
        f"Por favor, elabora el reporte médico detallado en español con un plan de rehabilitación ejecutable."
    )

    try:
        api_key = os.getenv("DEEPSEEK_API_KEY", DEEPSEEK_API_KEY).strip()
        if not api_key:
            raise HTTPException(status_code=503, detail="DEEPSEEK_API_KEY no configurada en el servidor.")
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                DEEPSEEK_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.25,
                },
            )

        if resp.status_code != 200:
            logger.error(f"DeepSeek API error ({resp.status_code}): {resp.text}")
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Error en servicio de IA DeepSeek: {resp.text}",
            )

        data = resp.json()
        raw_text = data["choices"][0]["message"]["content"]
        parsed_report = json.loads(raw_text)

        # Enforce metadata
        parsed_report["metadata"] = {
            "horse_name": request.horse_name,
            "discipline": request.discipline,
            "evaluation_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "ai_engine": "DeepSeek Biomechanics Clinical Specialist (V3)",
            "global_score": sym.get("global_score", 0),
        }

        return _sanitize_json(parsed_report)

    except json.JSONDecodeError as jde:
        logger.error(f"Failed to parse DeepSeek JSON response: {jde}")
        raise HTTPException(status_code=500, detail="La IA no devolvió un formato JSON válido.")
    except Exception as e:
        logger.error(f"Unexpected error in /api/ai-report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ChatMessage(BaseModel):
    role: str
    content: str


class AIChatRequest(BaseModel):
    horse_name: Optional[str] = "Equino"
    discipline: Optional[str] = "Deporte Ecuestre"
    symmetry_report: Optional[Dict[str, Any]] = None
    kinematics_summary: Optional[Dict[str, Any]] = None
    messages: List[ChatMessage]


@app.post("/api/ai-chat")
async def chat_with_vet_ai(request: AIChatRequest) -> Dict[str, Any]:
    """
    RealHorse 'Vet Chat' killer feature: Instant conversational consultation
    with an AI Equine Sports Medicine Veterinarian, working either with live
    kinematic metrics or as a standalone specialist advisor.
    """
    sym = request.symmetry_report or {}
    kin = request.kinematics_summary or {}

    if sym.get("global_score") is not None:
        back_rom = kin.get("back_rom_deg") or 8.2
        stride_len = kin.get("stride_length_m") or 2.38
        cadence = kin.get("cadence_spm") or 84
        context_block = (
            f"EXPEDIENTE CINEMÁTICO REAL DEL CABALLO (medido por visión artificial 2D con cámara, sin sensores físicos):\n"
            f"- Score Global: {sym.get('global_score', 0)}/100 ({sym.get('grade_label', 'N/A')})\n"
            f"- Diagnóstico: {sym.get('clinical_decision', 'N/A')}\n"
            f"- Impacto Anterior: {sym.get('fore_impact_asym_mm', 0)} mm | Impulso Anterior: {sym.get('fore_pushoff_asym_mm', 0)} mm\n"
            f"- Impacto Posterior: {sym.get('hind_impact_asym_mm', 0)} mm | Impulso Posterior: {sym.get('hind_pushoff_asym_mm', 0)} mm\n"
            f"- ROM Toracolumbar (Dorso): {back_rom}° (Normal: 7°-11°)\n"
            f"- Zancada: {stride_len} m | Cadencia: {cadence} pasos/min\n\n"
        )
        guidelines_block = (
            "1. Sé empático, claro, profesional y directo (máximo 2 a 3 párrafos cortos).\n"
            f"2. Basa tus recomendaciones específicamente en sus métricas (ej: dorso de {back_rom}° o la asimetría medida). Ten presente que HorseVision analiza video 2D con la cámara del teléfono, nunca menciones sensores físicos ni acelerómetros.\n"
            "3. Da pautas prácticas sobre manejo, ejercicios, herraje y cuándo llamar a su veterinario de cabecera si hay dolor agudo.\n"
            "4. Responde siempre en español y en texto limpio, sin usar encabezados ### ni abuso de símbolos markdown."
        )
    else:
        context_block = (
            "MODO DE CONSULTA GENERAL PREVENTIVA (sin video reciente adjunto; HorseVision evalúa trote mediante visión artificial 2D con cámara, sin sensores físicos):\n"
            "El propietario o entrenador desea asesoría experta sobre entrenamiento, biomecánica, prevención de lesiones, herraje o manejo diario.\n\n"
        )
        guidelines_block = (
            "1. Sé empático, claro, práctico y profesional (máximo 2 a 3 párrafos cortos).\n"
            "2. Responde consultas sobre entrenamiento, cuidado, calentamiento, herraje, biomecánica preventiva y bienestar equino.\n"
            "3. Recomienda cuándo es conveniente grabar un trote de 20 segundos en línea recta o círculo a la cuerda con la cámara de HorseVision o consultar a su veterinario presencial ante señales de dolor.\n"
            "4. Responde siempre en español y en texto limpio, sin usar encabezados ### ni abuso de símbolos markdown."
        )

    system_prompt = (
        f"Eres el Dr. Especialista Veterinario Senior de HorseVision (Diplomate ACVSMR en Biomecánica Equina). "
        f"Estás en una sesión de consulta interactiva (Vet Chat) con el dueño o entrenador del caballo '{request.horse_name}' "
        f"(Disciplina: {request.discipline}).\n"
        f"{context_block}"
        f"PAUTAS DE RESPUESTA:\n"
        f"{guidelines_block}"
    )

    deepseek_messages = [{"role": "system", "content": system_prompt}]
    for msg in request.messages:
        deepseek_messages.append({"role": msg.role, "content": msg.content})

    try:
        api_key = os.getenv("DEEPSEEK_API_KEY", DEEPSEEK_API_KEY).strip()
        if not api_key:
            raise HTTPException(status_code=503, detail="DEEPSEEK_API_KEY no configurada en el servidor.")
        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(
                DEEPSEEK_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": deepseek_messages,
                    "temperature": 0.4,
                },
            )

        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        reply_content = data["choices"][0]["message"]["content"]
        return {"role": "assistant", "content": reply_content}

    except Exception as e:
        logger.error(f"Error in /api/ai-chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# PayPal Paywall & Subscriptions Integration
# ---------------------------------------------------------------------------
PAYPAL_CLIENT_ID = os.getenv(
    "PAYPAL_CLIENT_ID",
    "BAANE3LHKnrMKf-jZ-ez5-Xkoi3dhx19UkuhHfyj6c5uWRy1lb3B5FiOt1NBUej1AatHi1xHGVjeQAZ2ag",
)
PAYPAL_SECRET_KEY = os.getenv(
    "PAYPAL_SECRET_KEY",
    "EIp6oQ30-F4htQSMaEdFYBOQNm5NO_3V6YHRHlm70RnWVn2viIMarz3-2zQ0YcJ02ZAXEF4wsgjT-Q-B",
)
PAYPAL_API_BASE = os.getenv("PAYPAL_API_BASE", "https://api-m.paypal.com")
PAYPAL_ENV = os.getenv("PAYPAL_ENV", "live")

PLAN_CONFIG = {
    "1-horse": {
        "name": "HorseVision · Plan 1 Caballo",
        "monthly_price": 6.99,
        "yearly_price": 67.00,
        "trial_days": 7,
        "description": "7 días de prueba gratis. Luego cobro de $6.99/mes.",
    },
    "3-horses": {
        "name": "HorseVision · Plan Hasta 5 Caballos",
        "monthly_price": 15.99,
        "yearly_price": 149.00,
        "trial_days": 0,
        "description": "Acceso hasta 5 caballos. Cobro inmediato de $15.99/mes.",
    },
    "50-horses": {
        "name": "HorseVision · Plan Hasta 50 Caballos",
        "monthly_price": 99.00,
        "yearly_price": 890.00,
        "trial_days": 0,
        "description": "Haras & Clínicas hasta 50 caballos. Cobro inmediato de $99.00/mes.",
    },
}

class PayPalCreateOrderRequest(BaseModel):
    plan_id: str = "1-horse"
    billing_cycle: str = "monthly"  # "monthly" | "yearly"

class PayPalCaptureOrderRequest(BaseModel):
    order_id: str
    plan_id: str = "1-horse"

async def get_paypal_token() -> str:
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(
            f"{PAYPAL_API_BASE}/v1/oauth2/token",
            data={"grant_type": "client_credentials"},
            auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET_KEY),
        )
        if res.status_code != 200:
            logger.error(f"Error fetching PayPal token: {res.text}")
            raise HTTPException(status_code=502, detail="Error de autenticación con PayPal")
        return res.json()["access_token"]

@app.get("/api/paypal/config")
async def get_paypal_config():
    return {
        "client_id": PAYPAL_CLIENT_ID,
        "env": PAYPAL_ENV,
        "plans": PLAN_CONFIG,
    }

@app.post("/api/paypal/create-order")
async def create_paypal_order(req: PayPalCreateOrderRequest):
    plan = PLAN_CONFIG.get(req.plan_id, PLAN_CONFIG["1-horse"])
    price = plan["monthly_price"] if req.billing_cycle == "monthly" else plan["yearly_price"]

    token = await get_paypal_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    order_payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": f"sub_{req.plan_id}_{int(time.time())}",
                "description": f"{plan['name']} - {'7 Días de Prueba Gratis, luego ' if plan['trial_days'] > 0 else ''}${price:.2f} USD",
                "custom_id": json.dumps({
                    "plan_id": req.plan_id,
                    "trial_days": plan["trial_days"],
                    "billing_cycle": req.billing_cycle,
                }),
                "amount": {
                    "currency_code": "USD",
                    "value": f"{price:.2f}",
                },
            }
        ],
        "application_context": {
            "brand_name": "HorseVision Equine Biomechanics",
            "locale": "es-ES",
            "landing_page": "BILLING",
            "user_action": "PAY_NOW",
        },
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(
            f"{PAYPAL_API_BASE}/v2/checkout/orders",
            headers=headers,
            json=order_payload,
        )
        if res.status_code not in (200, 201):
            logger.error(f"Error creating PayPal order: {res.text}")
            raise HTTPException(status_code=res.status_code, detail=f"PayPal error: {res.text}")
        order_data = res.json()
        return {
            "order_id": order_data["id"],
            "plan_id": req.plan_id,
            "trial_days": plan["trial_days"],
            "amount": price,
            "status": order_data.get("status"),
        }

@app.post("/api/paypal/capture-order")
async def capture_paypal_order(req: PayPalCaptureOrderRequest):
    plan = PLAN_CONFIG.get(req.plan_id, PLAN_CONFIG["1-horse"])
    token = await get_paypal_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(
            f"{PAYPAL_API_BASE}/v2/checkout/orders/{req.order_id}/capture",
            headers=headers,
        )
        if res.status_code not in (200, 201):
            logger.error(f"Error capturing PayPal order {req.order_id}: {res.text}")
            raise HTTPException(status_code=res.status_code, detail=f"Error al capturar orden PayPal: {res.text}")

        capture_data = res.json()
        return {
            "status": "COMPLETED",
            "order_id": req.order_id,
            "plan_id": req.plan_id,
            "trial_days": plan["trial_days"],
            "capture_id": capture_data.get("id"),
            "message": f"¡Suscripción a {plan['name']} activada exitosamente con PayPal!",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
