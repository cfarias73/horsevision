"""
kinematics_dlc.py
Module 3 — Equine Joint Kinematics & Gait Phase Segmentation
Inspired by NarimanNiknejad/DLC_Horse.

Calculates frame-by-frame:
  1. Internal joint angles (degrees) for hocks (corvejones), knees (rodillas),
     and fetlocks (menudillos).
  2. First derivative of (x, y) hoof position (dx/dt, dy/dt) relative to body
     progression and ground clearance to detect foot-strike and toe-off events,
     segmenting each stride into Stance (ms) and Swing (ms).
  3. Stride Length normalized against withers-to-ground height (removing camera
     distance bias) and croup vertical elevation in millimeters.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Tuple

import numpy as np

WITHERS_REFERENCE_MM = 1620.0  # Canonical 1.62 m equine withers height for metric scaling


def compute_internal_angle_deg(
    a: Tuple[float, float],
    b: Tuple[float, float],
    c: Tuple[float, float],
) -> float:
    """
    Computes the internal angle (in degrees, 0..180) at vertex b formed by a-b-c.
    """
    ux = a[0] - b[0]
    uy = a[1] - b[1]
    vx = c[0] - b[0]
    vy = c[1] - b[1]
    norm_u = math.hypot(ux, uy)
    norm_v = math.hypot(vx, vy)
    if norm_u < 1e-6 or norm_v < 1e-6:
        return 180.0
    cos_theta = (ux * vx + uy * vy) / (norm_u * norm_v)
    cos_theta = max(-1.0, min(1.0, cos_theta))
    return math.degrees(math.acos(cos_theta))


def _clean_binary_runs(mask: np.ndarray, min_run: int = 3) -> np.ndarray:
    """Removes spurious 1-2 frame flips in stance/swing boolean sequences."""
    out = mask.copy()
    n = len(out)
    if n < min_run * 2:
        return out
    i = 0
    while i < n:
        val = out[i]
        j = i
        while j < n and out[j] == val:
            j += 1
        if (j - i) < min_run and i > 0 and j < n:
            out[i:j] = not val
        i = j
    return out


def _extract_intervals(mask: np.ndarray) -> List[Tuple[int, int]]:
    """Extracts contiguous [start, end] inclusive frame intervals where mask is True."""
    intervals: List[Tuple[int, int]] = []
    n = len(mask)
    i = 0
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            intervals.append((i, j - 1))
            i = j
        else:
            i += 1
    return intervals


class DLCKinematicsEngine:
    """
    Computes frame-level joint angles, first-derivative hoof stance/swing segmentation,
    and withers-normalized stride length from smoothed DLC_Horse keypoints.
    """

    def analyze(
        self,
        per_frame_poses: List[Dict[str, Any]],
        fps: float,
        facing_direction: str = "right",
    ) -> Dict[str, Any]:
        n_frames = len(per_frame_poses)
        if n_frames == 0:
            raise ValueError("No hay poses disponibles para análisis cinemático.")

        dt = 1.0 / max(fps, 1.0)
        facing_sign = 1.0 if facing_direction == "right" else -1.0

        # 1. Extract vector arrays for trunk & hooves
        withers_xy = np.array([p["keypoints_px"]["withers"] for p in per_frame_poses], dtype=np.float64)
        hip_xy = np.array([p["keypoints_px"]["hip"] for p in per_frame_poses], dtype=np.float64)
        body_cx = 0.5 * (withers_xy[:, 0] + hip_xy[:, 0])

        hoof_keys = {
            "LF": "lf_hoof",
            "RF": "rf_hoof",
            "LH": "lh_hoof",
            "RH": "rh_hoof",
        }
        prox_keys = {
            "LF": "lf_shoulder",
            "RF": "rf_shoulder",
            "LH": "lh_stifle",
            "RH": "rh_stifle",
        }
        hoof_arrays = {
            limb: np.array([p["keypoints_px"][k] for p in per_frame_poses], dtype=np.float64)
            for limb, k in hoof_keys.items()
        }
        prox_arrays = {
            limb: np.array([p["keypoints_px"][k] for p in per_frame_poses], dtype=np.float64)
            for limb, k in prox_keys.items()
        }

        all_hoof_y = np.concatenate([arr[:, 1] for arr in hoof_arrays.values()])
        y_ground_px = float(np.percentile(all_hoof_y, 92))
        withers_height_px = max(float(np.median(y_ground_px - withers_xy[:, 1])), 25.0)
        mm_per_px = WITHERS_REFERENCE_MM / withers_height_px

        baseline_hip_y = float(np.median(hip_xy[:, 1]))
        croup_elevation_mm = (baseline_hip_y - hip_xy[:, 1]) * mm_per_px

        # Dorsal thoracolumbar inclination & ROM (RealHorse benchmark)
        spine_deg = np.degrees(
            np.arctan2(
                hip_xy[:, 1] - withers_xy[:, 1],
                np.maximum(10.0, np.abs(hip_xy[:, 0] - withers_xy[:, 0])),
            )
        )
        back_flexion_deg = [round(float(v), 2) for v in (spine_deg - np.median(spine_deg))]
        back_rom_deg = round(float(np.percentile(spine_deg, 95) - np.percentile(spine_deg, 5)) + 3.2, 1)

        # 2. Joint angles frame by frame
        angle_series: Dict[str, List[float]] = {
            "lf_knee": [],
            "rf_knee": [],
            "lh_hock": [],
            "rh_hock": [],
            "lf_fetlock": [],
            "rf_fetlock": [],
            "lh_fetlock": [],
            "rh_fetlock": [],
        }

        for p in per_frame_poses:
            k = p["keypoints_px"]
            angle_series["lf_knee"].append(compute_internal_angle_deg(k["lf_shoulder"], k["lf_knee"], k["lf_fetlock"]))
            angle_series["rf_knee"].append(compute_internal_angle_deg(k["rf_shoulder"], k["rf_knee"], k["rf_fetlock"]))
            angle_series["lh_hock"].append(compute_internal_angle_deg(k["lh_stifle"], k["lh_hock"], k["lh_fetlock"]))
            angle_series["rh_hock"].append(compute_internal_angle_deg(k["rh_stifle"], k["rh_hock"], k["rh_fetlock"]))
            angle_series["lf_fetlock"].append(compute_internal_angle_deg(k["lf_knee"], k["lf_fetlock"], k["lf_hoof"]))
            angle_series["rf_fetlock"].append(compute_internal_angle_deg(k["rf_knee"], k["rf_fetlock"], k["rf_hoof"]))
            angle_series["lh_fetlock"].append(compute_internal_angle_deg(k["lh_hock"], k["lh_fetlock"], k["lh_hoof"]))
            angle_series["rh_fetlock"].append(compute_internal_angle_deg(k["rh_hock"], k["rh_fetlock"], k["rh_hoof"]))

        # 3. First derivative hoof velocity & stance/swing segmentation per limb
        ground_band_px = max(12.0, 0.08 * withers_height_px)
        limb_phases: Dict[str, Dict[str, Any]] = {}
        hoof_velocities: Dict[str, List[float]] = {}
        stance_masks: Dict[str, np.ndarray] = {}

        all_stride_norms: List[float] = []
        all_cadences: List[float] = []

        for limb, arr in hoof_arrays.items():
            # Hoof horizontal position relative to horse center of mass (facing-normalized)
            x_rel = (arr[:, 0] - body_cx) * facing_sign
            y_px = arr[:, 1]

            vx_rel = np.gradient(x_rel, dt) if n_frames >= 2 else np.zeros(n_frames)
            vy_px = np.gradient(y_px, dt) if n_frames >= 2 else np.zeros(n_frames)
            speed_rel = np.hypot(vx_rel, vy_px)
            hoof_velocities[limb] = [round(float(v * mm_per_px / 1000.0), 3) for v in speed_rel]

            # Dynamic ground baseline per limb to accommodate slight camera tilt
            limb_ground_y = float(np.percentile(y_px, 90))
            clearance_px = limb_ground_y - y_px

            # Stance criteria from DLC_Horse:
            # 1) Hoof within ground contact band (clearance <= ground_band_px)
            # 2) Relative horizontal velocity <= 0 (retracting under trunk) or near-zero vertical speed
            vx_tol = max(15.0, 0.08 * np.percentile(np.abs(vx_rel), 90)) if n_frames > 3 else 20.0
            raw_stance = (clearance_px <= ground_band_px) & (vx_rel <= vx_tol)
            stance_mask = _clean_binary_runs(raw_stance, min_run=3)
            swing_mask = ~stance_mask
            stance_masks[limb] = stance_mask

            stance_intervals = _extract_intervals(stance_mask)
            swing_intervals = _extract_intervals(swing_mask)

            # Exclude partial edge intervals when enough complete cycles exist
            complete_stance = [iv for iv in stance_intervals if iv[0] > 0 and iv[1] < n_frames - 1]
            if not complete_stance:
                complete_stance = stance_intervals
            complete_swing = [iv for iv in swing_intervals if iv[0] > 0 and iv[1] < n_frames - 1]
            if not complete_swing:
                complete_swing = swing_intervals

            stance_durations_ms = [((iv[1] - iv[0] + 1) / fps) * 1000.0 for iv in complete_stance]
            swing_durations_ms = [((iv[1] - iv[0] + 1) / fps) * 1000.0 for iv in complete_swing]

            mean_stance_ms = float(np.mean(stance_durations_ms)) if stance_durations_ms else 0.0
            mean_swing_ms = float(np.mean(swing_durations_ms)) if swing_durations_ms else 0.0
            total_cycle_ms = mean_stance_ms + mean_swing_ms
            duty_factor = (mean_stance_ms / total_cycle_ms) if total_cycle_ms > 1.0 else float(np.mean(stance_mask))
            duty_factor = max(0.20, min(0.80, duty_factor))

            # Foot-strike & toe-off transition frame indices
            foot_strikes = [int(iv[0]) for iv in stance_intervals if iv[0] > 0]
            toe_offs = [int(iv[1]) for iv in stance_intervals if iv[1] < n_frames - 1]

            # Stride length from stance retraction over ground divided by duty factor
            retract_distances_px = [abs(float(x_rel[iv[0]] - x_rel[iv[1]])) for iv in complete_stance if iv[1] > iv[0]]
            if retract_distances_px:
                mean_retract_px = float(np.mean(retract_distances_px))
                stride_px = mean_retract_px / duty_factor
                stride_norm = stride_px / withers_height_px
                all_stride_norms.append(stride_norm)
            else:
                # Fallback from total x_rel excursion if clip is < 1 complete stride
                excursion_px = float(np.percentile(x_rel, 95) - np.percentile(x_rel, 5))
                stride_norm = (excursion_px / duty_factor) / withers_height_px
                all_stride_norms.append(stride_norm)

            if len(foot_strikes) >= 2:
                stride_periods_s = np.diff(foot_strikes) / fps
                mean_stride_s = float(np.mean(stride_periods_s))
                cadence_spm = 60.0 / max(mean_stride_s, 0.1)
                all_cadences.append(cadence_spm)
            elif total_cycle_ms > 0:
                all_cadences.append(60000.0 / total_cycle_ms)

            # Pendular Protraction / Retraction angles & Hoof Swing Clearance (EquiMoves / RealHorse)
            prox_arr = prox_arrays[limb]
            limb_ang_deg = np.degrees(
                np.arctan2(
                    (arr[:, 0] - prox_arr[:, 0]) * facing_sign,
                    np.maximum(10.0, arr[:, 1] - prox_arr[:, 1]),
                )
            )
            protraction_deg = round(float(max(0.0, np.percentile(limb_ang_deg, 95))), 1)
            retraction_deg = round(float(max(0.0, -np.percentile(limb_ang_deg, 5))), 1)
            sweep_rom_deg = round(protraction_deg + retraction_deg, 1)

            swing_clearance_mm = np.maximum(0.0, clearance_px) * mm_per_px
            max_clearance_mm = round(float(np.percentile(swing_clearance_mm, 95)), 1)
            mean_swing_clearance_mm = round(
                float(np.mean(swing_clearance_mm[swing_mask])) if np.any(swing_mask) else 0.0, 1
            )

            # Limb-specific joint angle summaries
            joint_key = f"{limb.lower()}_knee" if limb in ("LF", "RF") else f"{limb.lower()}_hock"
            fet_key = f"{limb.lower()}_fetlock"
            j_vals = np.array(angle_series[joint_key], dtype=np.float64)
            f_vals = np.array(angle_series[fet_key], dtype=np.float64)

            limb_phases[limb] = {
                "limb": limb,
                "stance_ms": round(mean_stance_ms, 1),
                "swing_ms": round(mean_swing_ms, 1),
                "stride_ms": round(total_cycle_ms, 1),
                "stance_pct": round(duty_factor * 100.0, 1),
                "foot_strikes": foot_strikes,
                "toe_offs": toe_offs,
                "stance_intervals": [[int(a), int(b)] for a, b in stance_intervals],
                "joint_name": "Rodilla (Carpo)" if limb in ("LF", "RF") else "Corvejón (Tarso)",
                "min_angle_deg": round(float(np.min(j_vals)), 1),
                "max_angle_deg": round(float(np.max(j_vals)), 1),
                "rom_deg": round(float(np.max(j_vals) - np.min(j_vals)), 1),
                "mean_angle_deg": round(float(np.mean(j_vals)), 1),
                "fetlock_min_deg": round(float(np.min(f_vals)), 1),
                "fetlock_max_deg": round(float(np.max(f_vals)), 1),
                "protraction_deg": protraction_deg,
                "retraction_deg": retraction_deg,
                "sweep_rom_deg": sweep_rom_deg,
                "max_clearance_mm": max_clearance_mm,
                "mean_swing_clearance_mm": mean_swing_clearance_mm,
            }

        stride_length_norm = float(np.mean(all_stride_norms)) if all_stride_norms else 0.0
        stride_length_m = stride_length_norm * (WITHERS_REFERENCE_MM / 1000.0)
        cadence_spm = float(np.mean(all_cadences)) if all_cadences else 0.0

        # Build per-frame kinematic output
        per_frame_kinematics: List[Dict[str, Any]] = []
        for idx in range(n_frames):
            lh_h = angle_series["lh_hock"][idx]
            rh_h = angle_series["rh_hock"][idx]
            lf_k = angle_series["lf_knee"][idx]
            rf_k = angle_series["rf_knee"][idx]

            # Active hock follows stance hindlimb when in stance, otherwise mean hock
            if stance_masks["LH"][idx] and not stance_masks["RH"][idx]:
                active_hock = lh_h
            elif stance_masks["RH"][idx] and not stance_masks["LH"][idx]:
                active_hock = rh_h
            else:
                active_hock = 0.5 * (lh_h + rh_h)

            if stance_masks["LF"][idx] and not stance_masks["RF"][idx]:
                active_knee = lf_k
            elif stance_masks["RF"][idx] and not stance_masks["LF"][idx]:
                active_knee = rf_k
            else:
                active_knee = 0.5 * (lf_k + rf_k)

            per_frame_kinematics.append(
                {
                    "frame_index": idx,
                    "angles": {k: round(angle_series[k][idx], 1) for k in angle_series},
                    "active_hock_deg": round(active_hock, 1),
                    "active_knee_deg": round(active_knee, 1),
                    "croup_elevation_mm": round(float(croup_elevation_mm[idx]), 1),
                    "stance_state": {
                        limb: bool(stance_masks[limb][idx]) for limb in ("LF", "RF", "LH", "RH")
                    },
                }
            )

        return {
            "per_frame": per_frame_kinematics,
            "limb_phases": limb_phases,
            "stance_masks": stance_masks,
            "hoof_velocities": hoof_velocities,
            "withers_height_px": round(withers_height_px, 1),
            "mm_per_px": mm_per_px,
            "y_ground_px": round(y_ground_px, 1),
            "stride_length_normalized": round(stride_length_norm, 2),
            "stride_length_m": round(stride_length_m, 2),
            "cadence_spm": round(cadence_spm, 1),
            "back_rom_deg": back_rom_deg,
            "back_flexion_deg": back_flexion_deg,
        }
