"""
symmetry_engine.py
Module 4 — Equine Gait Symmetry & Lameness Estimation Engine
Inspired by ElectrifAi/model-aws-equine-gait-model.

Analyzes vertical displacement (Y) time series during left vs. right stance cycles:
  - Forelimbs (LF vs RF): Head Nod (poll & withers minimum vertical drop difference)
  - Hindlimbs (LH vs RH): Pelvic Hike / Drop (croup vertical ascent & descent asymmetry)
  - Computes Symmetry Index (SI %) per limb pair and per limb (LF, RF, LH, RH),
    plus Global Biomechanical Score (0-100).
  - Applies veterinary clinical thresholds:
      <= 10%: Optimal / Symmetric (#10B981)
      > 10% and <= 15%: Mild Asymmetry (#F59E0B)
      > 15%: Moderate / High Lameness Alert (#EF4444)
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from scipy.signal import detrend


def _classify_asymmetry(asym_pct: float) -> Tuple[str, str, str]:
    """Maps asymmetry percentage to veterinary traffic-light status."""
    if asym_pct > 15.0:
        return ("alert", "#EF4444", "Asimetría Moderada/Alta (>15%)")
    if asym_pct > 10.0:
        return ("mild", "#F59E0B", "Asimetría Leve (>10%)")
    return ("optimal", "#10B981", "Simétrico / Óptimo")


def _cycle_vertical_stats(
    signal_mm: np.ndarray,
    intervals: List[List[int]],
    pad_frames: int = 2,
) -> Dict[str, float]:
    """
    Computes mean minimum (drop), maximum (hike), and vertical excursion range
    across stance intervals of a limb.
    """
    n = len(signal_mm)
    if n == 0 or not intervals:
        return {"mean_min_mm": 0.0, "mean_max_mm": 0.0, "mean_range_mm": 0.0, "count": 0}

    mins: List[float] = []
    maxs: List[float] = []
    ranges: List[float] = []

    for start, end in intervals:
        s = max(0, start - pad_frames)
        e = min(n, end + pad_frames + 1)
        seg = signal_mm[s:e]
        if seg.size == 0:
            continue
        mn = float(np.min(seg))
        mx = float(np.max(seg))
        mins.append(mn)
        maxs.append(mx)
        ranges.append(mx - mn)

    if not mins:
        return {"mean_min_mm": 0.0, "mean_max_mm": 0.0, "mean_range_mm": 0.0, "count": 0}

    return {
        "mean_min_mm": float(np.mean(mins)),
        "mean_max_mm": float(np.mean(maxs)),
        "mean_range_mm": float(np.mean(ranges)),
        "count": len(mins),
    }


class EquineSymmetryEngine:
    """
    Computes Head Nod, Pelvic Hike/Drop, pair & per-limb Symmetry Indices (SI %),
    Global Score (0-100), and diagnostic veterinary findings from real gait waves.
    """

    def analyze(
        self,
        per_frame_poses: List[Dict[str, Any]],
        kinematics: Dict[str, Any],
        quality_summary: Dict[str, Any],
        fps: float,
    ) -> Dict[str, Any]:
        n_frames = len(per_frame_poses)
        if n_frames == 0:
            raise ValueError("No hay datos de pose para análisis de simetría.")

        mm_per_px = float(kinematics["mm_per_px"])
        limb_phases = kinematics["limb_phases"]

        # Extract vertical trajectories (pixels -> upward-positive millimeters, linearly detrended)
        poll_y_px = np.array([p["keypoints_px"]["poll"][1] for p in per_frame_poses], dtype=np.float64)
        withers_y_px = np.array([p["keypoints_px"]["withers"][1] for p in per_frame_poses], dtype=np.float64)
        hip_y_px = np.array([p["keypoints_px"]["hip"][1] for p in per_frame_poses], dtype=np.float64)

        poll_mm = detrend((np.median(poll_y_px) - poll_y_px) * mm_per_px, type="linear")
        withers_mm = detrend((np.median(withers_y_px) - withers_y_px) * mm_per_px, type="linear")
        croup_mm = detrend((np.median(hip_y_px) - hip_y_px) * mm_per_px, type="linear")

        # --- 1. FORELIMBS (LF vs RF): Head Nod & Withers Drop ---
        lf_iv = limb_phases["LF"]["stance_intervals"]
        rf_iv = limb_phases["RF"]["stance_intervals"]

        poll_lf = _cycle_vertical_stats(poll_mm, lf_iv)
        poll_rf = _cycle_vertical_stats(poll_mm, rf_iv)
        withers_lf = _cycle_vertical_stats(withers_mm, lf_iv)
        withers_rf = _cycle_vertical_stats(withers_mm, rf_iv)

        poll_min_diff_mm = abs(poll_lf["mean_min_mm"] - poll_rf["mean_min_mm"])
        poll_max_diff_mm = abs(poll_lf["mean_max_mm"] - poll_rf["mean_max_mm"])
        withers_min_diff_mm = abs(withers_lf["mean_min_mm"] - withers_rf["mean_min_mm"])
        head_nod_mm = 0.65 * poll_min_diff_mm + 0.35 * withers_min_diff_mm

        fore_range_mm = max(
            float(np.percentile(poll_mm, 95) - np.percentile(poll_mm, 5)),
            float(np.percentile(withers_mm, 95) - np.percentile(withers_mm, 5)),
            20.0,
        )
        fore_min_asym_pct = (head_nod_mm / fore_range_mm) * 100.0

        # Stance & ROM symmetry for forelimbs
        lf_st = max(limb_phases["LF"]["stance_ms"], 1.0)
        rf_st = max(limb_phases["RF"]["stance_ms"], 1.0)
        fore_stance_asym_pct = (abs(lf_st - rf_st) / (0.5 * (lf_st + rf_st))) * 100.0

        lf_rom = max(limb_phases["LF"]["rom_deg"], 1.0)
        rf_rom = max(limb_phases["RF"]["rom_deg"], 1.0)
        fore_rom_asym_pct = (abs(lf_rom - rf_rom) / (0.5 * (lf_rom + rf_rom))) * 100.0

        anterior_asymmetry_pct = min(
            100.0,
            0.70 * fore_min_asym_pct + 0.20 * fore_stance_asym_pct + 0.10 * fore_rom_asym_pct,
        )
        anterior_si_pct = max(0.0, 100.0 - anterior_asymmetry_pct)

        # Forelimb unloading signature ("down on sound": lame forelimb shows higher mean_min_mm = less drop)
        fore_affected: Optional[str] = None
        if anterior_asymmetry_pct > 10.0:
            score_lf = poll_lf["mean_min_mm"] + 0.5 * withers_lf["mean_min_mm"]
            score_rf = poll_rf["mean_min_mm"] + 0.5 * withers_rf["mean_min_mm"]
            if abs(score_lf - score_rf) >= 1.5:
                fore_affected = "LF" if score_lf > score_rf else "RF"
            else:
                fore_affected = "LF" if lf_st < rf_st else "RF"

        # --- 2. HINDLIMBS (LH vs RH): Pelvic Hike / Drop ---
        lh_iv = limb_phases["LH"]["stance_intervals"]
        rh_iv = limb_phases["RH"]["stance_intervals"]

        croup_lh = _cycle_vertical_stats(croup_mm, lh_iv)
        croup_rh = _cycle_vertical_stats(croup_mm, rh_iv)

        pelvic_drop_diff_mm = abs(croup_lh["mean_min_mm"] - croup_rh["mean_min_mm"])
        pelvic_hike_diff_mm = abs(croup_lh["mean_max_mm"] - croup_rh["mean_max_mm"])
        # Preserve both impact-type (drop) and push-off-type (hike) hindlimb lameness magnitudes
        pelvic_asym_mm = 0.75 * max(pelvic_drop_diff_mm, pelvic_hike_diff_mm) + 0.25 * min(pelvic_drop_diff_mm, pelvic_hike_diff_mm)

        hind_range_mm = max(float(np.percentile(croup_mm, 95) - np.percentile(croup_mm, 5)), 20.0)
        hind_vert_asym_pct = (pelvic_asym_mm / hind_range_mm) * 100.0

        lh_st = max(limb_phases["LH"]["stance_ms"], 1.0)
        rh_st = max(limb_phases["RH"]["stance_ms"], 1.0)
        hind_stance_asym_pct = (abs(lh_st - rh_st) / (0.5 * (lh_st + rh_st))) * 100.0

        lh_rom = max(limb_phases["LH"]["rom_deg"], 1.0)
        rh_rom = max(limb_phases["RH"]["rom_deg"], 1.0)
        hind_rom_asym_pct = (abs(lh_rom - rh_rom) / (0.5 * (lh_rom + rh_rom))) * 100.0

        posterior_asymmetry_pct = min(
            100.0,
            0.65 * hind_vert_asym_pct + 0.20 * hind_stance_asym_pct + 0.15 * hind_rom_asym_pct,
        )
        posterior_si_pct = max(0.0, 100.0 - posterior_asymmetry_pct)

        # Hindlimb unloading signature: higher pelvic hike / higher minimum (less descent) + shorter stance
        hind_affected: Optional[str] = None
        if posterior_asymmetry_pct > 10.0:
            unload_lh = (croup_lh["mean_min_mm"] + croup_lh["mean_max_mm"]) - 0.15 * lh_st
            unload_rh = (croup_rh["mean_min_mm"] + croup_rh["mean_max_mm"]) - 0.15 * rh_st
            hind_affected = "LH" if unload_lh >= unload_rh else "RH"

        # --- 3. PER-LIMB METRICS (LF, RF, LH, RH) & GLOBAL SCORE ---
        limb_labels_es = {
            "LF": "Mano Izquierda",
            "RF": "Mano Derecha",
            "LH": "Pata Izquierda",
            "RH": "Pata Derecha",
        }

        limbs_report: Dict[str, Dict[str, Any]] = {}
        for limb in ("LF", "RF", "LH", "RH"):
            base = dict(limb_phases[limb])
            is_fore = limb in ("LF", "RF")
            pair_asym = anterior_asymmetry_pct if is_fore else posterior_asymmetry_pct
            pair_affected = fore_affected if is_fore else hind_affected

            if pair_affected is None:
                limb_asym = pair_asym
                role_note = "Balanceado en par " + ("anterior" if is_fore else "posterior")
            elif pair_affected == limb:
                limb_asym = pair_asym
                role_note = "Extremidad con descarga detectada"
            else:
                # Contralateral sound reference limb
                limb_asym = min(pair_asym * 0.25, 6.5)
                role_note = "Contralateral de apoyo compensatorio"

            limb_si = max(0.0, 100.0 - limb_asym)
            l_status, l_color, l_label = _classify_asymmetry(limb_asym)

            base.update(
                {
                    "label_es": limb_labels_es[limb],
                    "si_pct": round(limb_si, 1),
                    "asymmetry_pct": round(limb_asym, 1),
                    "status": l_status,
                    "badge_color": l_color,
                    "badge_label": l_label,
                    "role_note": role_note,
                }
            )
            limbs_report[limb] = base

        # Global biomechanical score (0-100)
        max_pair_asym = max(anterior_asymmetry_pct, posterior_asymmetry_pct)
        mean_si = 0.5 * (anterior_si_pct + posterior_si_pct)
        # Penalize strongly when either fore or hind crosses >10% / >15%
        penalty = max(0.0, max_pair_asym - 5.0) * 0.65
        quality_bonus = 0.0 if quality_summary.get("pass_rate_pct", 100.0) >= 85.0 else -4.0
        global_score = int(round(max(10.0, min(100.0, mean_si - penalty + quality_bonus))))

        g_status, g_color, g_label = _classify_asymmetry(max_pair_asym)

        # --- 4. DIAGNOSTIC FINDINGS & VETERINARY ALERTS ---
        findings: List[Dict[str, Any]] = []
        primary_affected_limb: Optional[str] = None

        if posterior_asymmetry_pct > 10.0 and hind_affected is not None:
            p_status, p_color, p_label = _classify_asymmetry(posterior_asymmetry_pct)
            sev_es = "Alerta Moderada/Alta" if posterior_asymmetry_pct > 15.0 else "Asimetría Leve"
            findings.append(
                {
                    "id": f"hind_{hind_affected.lower()}",
                    "region": "Miembros Posteriores (LH vs RH)",
                    "affected_limb": hind_affected,
                    "affected_limb_name": f"{hind_affected} · {limb_labels_es[hind_affected]}",
                    "asymmetry_pct": round(posterior_asymmetry_pct, 1),
                    "si_pct": round(posterior_si_pct, 1),
                    "metric_name": "Pelvic Hike / Drop",
                    "metric_value_mm": round(pelvic_asym_mm, 1),
                    "severity": p_status,
                    "badge_color": p_color,
                    "title": f"{sev_es} en {hind_affected} ({limb_labels_es[hind_affected]})",
                    "description": (
                        f"Asimetría pélvica del {posterior_asymmetry_pct:.1f}% detectada durante el apoyo de "
                        f"{hind_affected} (diferencia Pelvic Hike/Drop de {pelvic_asym_mm:.1f} mm en grupa y "
                        f"apoyo {limb_phases[hind_affected]['stance_ms']:.0f} ms). "
                        + (
                            "Supera el umbral veterinario de >15%; se recomienda evaluación clínica de miembro posterior."
                            if posterior_asymmetry_pct > 15.0
                            else "Supera el umbral leve (>10%); vigilar evolución en trote en círculo."
                        )
                    ),
                }
            )
            primary_affected_limb = hind_affected

        if anterior_asymmetry_pct > 10.0 and fore_affected is not None:
            f_status, f_color, f_label = _classify_asymmetry(anterior_asymmetry_pct)
            sev_es = "Alerta Moderada/Alta" if anterior_asymmetry_pct > 15.0 else "Asimetría Leve"
            is_comp = primary_affected_limb is not None and anterior_asymmetry_pct < posterior_asymmetry_pct
            findings.append(
                {
                    "id": f"fore_{fore_affected.lower()}",
                    "region": "Miembros Anteriores (LF vs RF)",
                    "affected_limb": fore_affected,
                    "affected_limb_name": f"{fore_affected} · {limb_labels_es[fore_affected]}",
                    "asymmetry_pct": round(anterior_asymmetry_pct, 1),
                    "si_pct": round(anterior_si_pct, 1),
                    "metric_name": "Head Nod / Withers Drop",
                    "metric_value_mm": round(head_nod_mm, 1),
                    "severity": f_status,
                    "badge_color": f_color,
                    "title": f"{sev_es} en {fore_affected} ({limb_labels_es[fore_affected]})"
                    + (" — Posible compensación" if is_comp else ""),
                    "description": (
                        f"Asimetría de cabeceo (Head Nod) del {anterior_asymmetry_pct:.1f}% con diferencia "
                        f"vertical de nuca/cruz de {head_nod_mm:.1f} mm durante el apoyo de {fore_affected}. "
                        + (
                            "Patrón compatible con descarga compensatoria anterior secundaria."
                            if is_comp
                            else (
                                "Supera umbral veterinario >15%; indica descarga significativa de miembro anterior."
                                if anterior_asymmetry_pct > 15.0
                                else "Supera el umbral leve (>10%); monitorear simetría en superficie firme."
                            )
                        )
                    ),
                }
            )
            if primary_affected_limb is None or anterior_asymmetry_pct > posterior_asymmetry_pct:
                primary_affected_limb = fore_affected

        if not findings:
            findings.append(
                {
                    "id": "symmetric_trot",
                    "region": "Cinemática Global (4 Extremidades)",
                    "affected_limb": None,
                    "affected_limb_name": "Sin extremidad afectada",
                    "asymmetry_pct": round(max_pair_asym, 1),
                    "si_pct": round(min(anterior_si_pct, posterior_si_pct), 1),
                    "metric_name": "Head Nod / Pelvic Symmetry",
                    "metric_value_mm": round(max(head_nod_mm, pelvic_asym_mm), 1),
                    "severity": "optimal",
                    "badge_color": "#10B981",
                    "title": "Trote Simétrico dentro de Rango Fisiológico",
                    "description": (
                        f"Simetría anterior del {anterior_si_pct:.1f}% (Head Nod Δ {head_nod_mm:.1f} mm) y "
                        f"simetría posterior del {posterior_si_pct:.1f}% (Pelvic Hike Δ {pelvic_asym_mm:.1f} mm). "
                        "Ambas diagonales mantienen tiempos de apoyo y ángulos articulares consistentes (≤10% umbral)."
                    ),
                }
            )

        timestamps_s = [round(i / max(fps, 1e-6), 4) for i in range(n_frames)]
        time_series = {
            "timestamps_s": timestamps_s,
            "poll_y_mm": [round(float(v), 2) for v in poll_mm],
            "withers_y_mm": [round(float(v), 2) for v in withers_mm],
            "croup_y_mm": [round(float(v), 2) for v in croup_mm],
            "hoof_velocities": kinematics["hoof_velocities"],
            "stance_intervals": {
                limb: limb_phases[limb]["stance_intervals"] for limb in ("LF", "RF", "LH", "RH")
            },
        }

        symmetry_report = {
            "global_score": global_score,
            "status": g_status,
            "badge_color": g_color,
            "badge_label": g_label,
            "anterior_si_pct": round(anterior_si_pct, 1),
            "anterior_asymmetry_pct": round(anterior_asymmetry_pct, 1),
            "posterior_si_pct": round(posterior_si_pct, 1),
            "posterior_asymmetry_pct": round(posterior_asymmetry_pct, 1),
            "head_nod_mm": round(head_nod_mm, 1),
            "withers_drop_diff_mm": round(withers_min_diff_mm, 1),
            "pelvic_hike_mm": round(pelvic_hike_diff_mm, 1),
            "pelvic_drop_mm": round(pelvic_drop_diff_mm, 1),
            "pelvic_asymmetry_mm": round(pelvic_asym_mm, 1),
            "fore_impact_asym_mm": round(poll_min_diff_mm, 1),
            "fore_pushoff_asym_mm": round(poll_max_diff_mm, 1),
            "hind_impact_asym_mm": round(pelvic_drop_diff_mm, 1),
            "hind_pushoff_asym_mm": round(pelvic_hike_diff_mm, 1),
            "limb_vertical_excursion_mm": {
                "LF": round(poll_lf["mean_range_mm"], 1),
                "RF": round(poll_rf["mean_range_mm"], 1),
                "LH": round(croup_lh["mean_range_mm"], 1),
                "RH": round(croup_rh["mean_range_mm"], 1),
            },
            "affected_limb": primary_affected_limb,
            "thresholds": {"mild_pct": 10.0, "alert_pct": 15.0},
            "findings": findings,
        }

        return {
            "limbs": limbs_report,
            "symmetry_report": symmetry_report,
            "time_series": time_series,
        }
