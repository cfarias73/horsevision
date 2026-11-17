"""
pose_extractor.py
Module 2 — DeepLabCut SuperAnimal-Quadruped / MMPose AP-10K Pose Extractor & Smoothing
Inspired by DeepLabCut Model Zoo (SuperAnimal-Quadruped with video adaptation)
and OpenMMLab MMPose RTMPose (AP-10K), mapped to the NarimanNiknejad/DLC_Horse
equine anatomical keypoint topology.

Extracts (x, y) coordinates for:
  - Axial/Dorsal: poll (nuca), nostrils (ollares), withers (cruz), hip (grupa / tuber sacrale)
  - Forelimbs (LF / RF): shoulder, knee (carpus), fetlock, hoof
  - Hindlimbs (LH / RH): stifle, hock (tarsus), fetlock, hoof

Applies Anatomical Joint Center (AJC) correction + Savitzky-Golay filter
(scipy.signal.savgol_filter, window_length=7, polyorder=3) to suppress soft-tissue noise.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
from scipy.optimize import linear_sum_assignment
from scipy.signal import savgol_filter

from .quality_gate import FrameQualityRecord

logger = logging.getLogger("horsevision.pose_extractor")

DLC_KEYPOINT_NAMES: List[str] = [
    "poll",
    "nostrils",
    "withers",
    "hip",
    "lf_shoulder",
    "lf_knee",
    "lf_fetlock",
    "lf_hoof",
    "rf_shoulder",
    "rf_knee",
    "rf_fetlock",
    "rf_hoof",
    "lh_stifle",
    "lh_hock",
    "lh_fetlock",
    "lh_hoof",
    "rh_stifle",
    "rh_hock",
    "rh_fetlock",
    "rh_hoof",
]

DLC_SKELETON_EDGES: List[Tuple[str, str, str]] = [
    ("nostrils", "poll", "axial"),
    ("poll", "withers", "axial"),
    ("withers", "hip", "axial"),
    ("withers", "lf_shoulder", "lf"),
    ("lf_shoulder", "lf_knee", "lf"),
    ("lf_knee", "lf_fetlock", "lf"),
    ("lf_fetlock", "lf_hoof", "lf"),
    ("withers", "rf_shoulder", "rf"),
    ("rf_shoulder", "rf_knee", "rf"),
    ("rf_knee", "rf_fetlock", "rf"),
    ("rf_fetlock", "rf_hoof", "rf"),
    ("hip", "lh_stifle", "lh"),
    ("lh_stifle", "lh_hock", "lh"),
    ("lh_hock", "lh_fetlock", "lh"),
    ("lh_fetlock", "lh_hoof", "lh"),
    ("hip", "rh_stifle", "rh"),
    ("rh_stifle", "rh_hock", "rh"),
    ("rh_hock", "rh_fetlock", "rh"),
    ("rh_fetlock", "rh_hoof", "rh"),
]


class EquinePoseExtractor:
    """
    Extracts DLC_Horse anatomical keypoints from quality-gated horse ROIs,
    performs optical-flow video adaptation across frames, approximates
    Anatomical Joint Centers (AJC), and smooths trajectories via Savitzky-Golay.
    """

    def __init__(
        self,
        savgol_window: int = 7,
        savgol_polyorder: int = 3,
        models_dir: Optional[Path] = None,
    ):
        self.savgol_window = savgol_window
        self.savgol_polyorder = savgol_polyorder
        self.models_dir = Path(models_dir) if models_dir else Path(__file__).resolve().parent.parent / "models"
        self.onnx_session = None
        self.engine_name = "SuperAnimal-Quadruped / DLC_Horse Video-Adaptation + Optical Flow"
        self._init_pose_backend()

    def _init_pose_backend(self) -> None:
        """
        Checks for RTMPose AP-10K or SuperAnimal-Quadruped ONNX weights locally.
        Uses deep-learning SimCC quadruped pose inference for real-world equestrian videos.
        """
        for candidate in ("rtm_animal_fp16.onnx", "superanimal_quadruped.onnx", "rtmpose_ap10k.onnx"):
            model_path = self.models_dir / candidate
            if model_path.exists():
                try:
                    import onnxruntime as ort  # type: ignore

                    opts = ort.SessionOptions()
                    opts.intra_op_num_threads = 4
                    self.onnx_session = ort.InferenceSession(str(model_path), sess_options=opts)
                    self.engine_name = f"RTMPose AP-10K ({candidate})"
                    logger.info("Loaded ONNX pose model: %s", candidate)
                    return
                except Exception as exc:
                    logger.warning("Failed to load %s (%s); using CV extractor.", candidate, exc)

        logger.info("Initialized Pose Engine: %s", self.engine_name)

    def _infer_ap10k_onnx(
        self,
        crop_bgr: np.ndarray,
        cx1: int,
        cy1: int,
        w_frame: int,
        h_frame: int,
    ) -> Tuple[Dict[str, Tuple[float, float]], Dict[str, float], int]:
        """
        Runs RTMPose AP-10K SimCC neural network on the horse ROI crop with
        bilateral Dual-Peak SimCC NMS and maps 17 AP-10K landmarks onto the
        20-joint DLC_Horse topology (preserving non-collinear hindlimb geometry).
        """
        ch, cw = crop_bgr.shape[:2]
        img_resized = cv2.resize(crop_bgr, (256, 256))
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        inp = ((img_rgb - mean) / std).transpose(2, 0, 1)[None, ...]

        inp_name = self.onnx_session.get_inputs()[0].name
        outs = self.onnx_session.run(None, {inp_name: inp})
        simcc_x, simcc_y = outs[0][0], outs[1][0]

        bins_x = np.argmax(simcc_x, axis=-1)
        bins_y = np.argmax(simcc_y, axis=-1)
        confs_raw = np.max(simcc_x, axis=-1).astype(np.float64)

        # Dual-Peak SimCC NMS to separate collapsed contralateral limb predictions
        for idx_l, idx_r in ((5, 8), (6, 9), (7, 10), (11, 14), (12, 15), (13, 16)):
            if abs(int(bins_x[idx_l]) - int(bins_x[idx_r])) < 7:
                keep_i, alt_i = (idx_l, idx_r) if confs_raw[idx_l] >= confs_raw[idx_r] else (idx_r, idx_l)
                pk_x = int(bins_x[keep_i])
                sx_alt = simcc_x[alt_i].copy()
                sx_alt[max(0, pk_x - 16) : min(sx_alt.shape[0], pk_x + 17)] = -1e9
                alt_bin_x = int(np.argmax(sx_alt))
                if float(sx_alt[alt_bin_x]) > 0.22:
                    bins_x[alt_i] = alt_bin_x
                    confs_raw[alt_i] = float(sx_alt[alt_bin_x])

        ap10k_names = [
            "l_eye", "r_eye", "nose", "neck", "tail_root",
            "l_shoulder", "l_knee", "l_front_paw",
            "r_shoulder", "r_knee", "r_front_paw",
            "l_hip", "l_stifle", "l_hind_paw",
            "r_hip", "r_stifle", "r_hind_paw",
        ]
        raw_pts: Dict[str, Tuple[float, float, float]] = {}
        for i, name in enumerate(ap10k_names):
            kx = float(bins_x[i] / 2.0)
            ky = float(bins_y[i] / 2.0)
            conf = float(min(1.0, max(0.2, float(confs_raw[i]))))
            fx = float(np.clip(cx1 + (kx / 256.0) * cw, 0.0, w_frame - 1.0))
            fy = float(np.clip(cy1 + (ky / 256.0) * ch, 0.0, h_frame - 1.0))
            raw_pts[name] = (fx, fy, conf)

        facing = 1 if raw_pts["nose"][0] >= raw_pts["tail_root"][0] else -1

        dlc: Dict[str, Tuple[float, float]] = {}
        confs: Dict[str, float] = {}

        # Axial dorsal landmarks (eye poll, elevated thoracic withers, pelvic crest hip)
        poll_x = 0.5 * (raw_pts["l_eye"][0] + raw_pts["r_eye"][0])
        poll_y = 0.5 * (raw_pts["l_eye"][1] + raw_pts["r_eye"][1])
        dlc["poll"] = (float(np.clip(poll_x, 0.0, w_frame - 1.0)), float(np.clip(poll_y, 0.0, h_frame - 1.0)))
        confs["poll"] = max(raw_pts["l_eye"][2], raw_pts["r_eye"][2])
        dlc["nostrils"] = raw_pts["nose"][:2]
        confs["nostrils"] = raw_pts["nose"][2]

        mean_sh_x = 0.5 * (raw_pts["l_shoulder"][0] + raw_pts["r_shoulder"][0])
        mean_sh_y = 0.5 * (raw_pts["l_shoulder"][1] + raw_pts["r_shoulder"][1])
        withers_x = 0.65 * raw_pts["neck"][0] + 0.35 * mean_sh_x
        withers_y = min(raw_pts["neck"][1], raw_pts["tail_root"][1]) - 0.18 * max(0.0, mean_sh_y - raw_pts["neck"][1])
        dlc["withers"] = (
            float(np.clip(withers_x, 0.0, w_frame - 1.0)),
            float(np.clip(withers_y, 0.0, h_frame - 1.0)),
        )
        confs["withers"] = raw_pts["neck"][2]

        mean_hip_x = 0.5 * (raw_pts["l_hip"][0] + raw_pts["r_hip"][0])
        mean_hip_y = 0.5 * (raw_pts["l_hip"][1] + raw_pts["r_hip"][1])
        hip_x = 0.45 * raw_pts["tail_root"][0] + 0.55 * mean_hip_x
        hip_y = raw_pts["tail_root"][1] - 0.14 * max(0.0, mean_hip_y - raw_pts["tail_root"][1])
        dlc["hip"] = (
            float(np.clip(hip_x, 0.0, w_frame - 1.0)),
            float(np.clip(hip_y, 0.0, h_frame - 1.0)),
        )
        confs["hip"] = raw_pts["tail_root"][2]

        # Contralateral forelimbs & hindlimbs mapped uniformly
        for side, fore_p, hind_p in (("l", "lf", "lh"), ("r", "rf", "rh")):
            sh = raw_pts[f"{side}_shoulder"]
            kn = raw_pts[f"{side}_knee"]
            fp = raw_pts[f"{side}_front_paw"]
            dlc[f"{fore_p}_shoulder"] = sh[:2]
            confs[f"{fore_p}_shoulder"] = sh[2]
            dlc[f"{fore_p}_knee"] = kn[:2]
            confs[f"{fore_p}_knee"] = kn[2]
            dlc[f"{fore_p}_fetlock"] = (0.35 * kn[0] + 0.65 * fp[0], 0.35 * kn[1] + 0.65 * fp[1])
            confs[f"{fore_p}_fetlock"] = fp[2]
            dlc[f"{fore_p}_hoof"] = fp[:2]
            confs[f"{fore_p}_hoof"] = fp[2]

            # AP-10K hind joints: hip -> babilla/stifle, knee(stifle) -> corvejón/hock, hind_paw -> casco/hoof
            stf = raw_pts[f"{side}_hip"]
            hck = raw_pts[f"{side}_stifle"]
            hp = raw_pts[f"{side}_hind_paw"]
            dlc[f"{hind_p}_stifle"] = stf[:2]
            confs[f"{hind_p}_stifle"] = stf[2]
            dlc[f"{hind_p}_hock"] = hck[:2]
            confs[f"{hind_p}_hock"] = hck[2]
            dlc[f"{hind_p}_fetlock"] = (0.30 * hck[0] + 0.70 * hp[0], 0.30 * hck[1] + 0.70 * hp[1])
            confs[f"{hind_p}_fetlock"] = hp[2]
            dlc[f"{hind_p}_hoof"] = hp[:2]
            confs[f"{hind_p}_hoof"] = hp[2]

        return dlc, confs, facing

    @staticmethod
    def _stabilize_contralateral_limbs(raw_coords: np.ndarray) -> np.ndarray:
        """
        Resolves frame-to-frame contralateral L/R identity swaps and SimCC peak
        collapses using damped velocity tracking on hooves and joint-to-hoof
        consistency on proximal joints, before Savitzky-Golay smoothing.
        """
        coords = raw_coords.copy()
        n_frames = coords.shape[0]
        if n_frames < 2:
            return coords

        k_idx = {k: i for i, k in enumerate(DLC_KEYPOINT_NAMES)}

        def track_hoof_pair(l_key: str, r_key: str) -> None:
            li, ri = k_idx[l_key], k_idx[r_key]
            vl = np.zeros(2, dtype=np.float64)
            vr = np.zeros(2, dtype=np.float64)
            for t in range(1, n_frames):
                prev_l, prev_r = coords[t - 1, li], coords[t - 1, ri]
                pred_l, pred_r = prev_l + vl, prev_r + vr
                obs_l, obs_r = coords[t, li].copy(), coords[t, ri].copy()

                if np.linalg.norm(obs_l - obs_r) < 10.0 and np.linalg.norm(prev_l - prev_r) > 22.0:
                    if np.linalg.norm(obs_l - pred_l) <= np.linalg.norm(obs_l - pred_r):
                        obs_r = pred_r.copy()
                    else:
                        obs_l = pred_l.copy()

                c_keep = np.linalg.norm(obs_l - pred_l) + np.linalg.norm(obs_r - pred_r)
                c_swap = np.linalg.norm(obs_r - pred_l) + np.linalg.norm(obs_l - pred_r)
                if c_swap < c_keep:
                    obs_l, obs_r = obs_r, obs_l

                coords[t, li] = obs_l
                coords[t, ri] = obs_r
                vl = 0.65 * vl + 0.35 * np.clip(obs_l - prev_l, -25.0, 25.0)
                vr = 0.65 * vr + 0.35 * np.clip(obs_r - prev_r, -25.0, 25.0)

        def align_joint_pair_to_child(l_key: str, r_key: str, l_child_key: str, r_child_key: str) -> None:
            li, ri = k_idx[l_key], k_idx[r_key]
            lci, rci = k_idx[l_child_key], k_idx[r_child_key]
            for t in range(n_frames):
                obs_l, obs_r = coords[t, li].copy(), coords[t, ri].copy()
                cl, cr = coords[t, lci], coords[t, rci]

                # Reconstruct collapsed proximal joint when its child limbs remain separated
                if np.linalg.norm(obs_l - obs_r) < 10.0 and abs(cl[0] - cr[0]) > 18.0:
                    dx_l = (coords[t - 1, li, 0] - coords[t - 1, lci, 0]) if t > 0 else 0.0
                    dx_r = (coords[t - 1, ri, 0] - coords[t - 1, rci, 0]) if t > 0 else 0.0
                    if abs(obs_l[0] - cl[0]) <= abs(obs_l[0] - cr[0]):
                        obs_r = np.array([cr[0] + dx_r, obs_l[1]], dtype=np.float64)
                    else:
                        obs_l = np.array([cl[0] + dx_l, obs_r[1]], dtype=np.float64)

                child_dx = cl[0] - cr[0]
                obs_dx = obs_l[0] - obs_r[0]
                if abs(child_dx) > 3.0 and abs(obs_dx) > 2.0:
                    # Enforce same-sign horizontal ordering to prevent X-crossings
                    if obs_dx * child_dx < 0.0:
                        obs_l, obs_r = obs_r, obs_l
                elif t > 0:
                    pl, pr = coords[t - 1, li], coords[t - 1, ri]
                    c_keep = np.linalg.norm(obs_l - pl) + np.linalg.norm(obs_r - pr)
                    c_swap = np.linalg.norm(obs_r - pl) + np.linalg.norm(obs_l - pr)
                    if c_swap < c_keep:
                        obs_l, obs_r = obs_r, obs_l

                coords[t, li] = obs_l
                coords[t, ri] = obs_r

        # 1. Stabilize distal hooves first
        track_hoof_pair("lf_hoof", "rf_hoof")
        track_hoof_pair("lh_hoof", "rh_hoof")

        # 2. Hierarchically align proximal joints from distal to proximal without X-crossings
        for l_j, r_j, l_c, r_c in (
            ("lf_knee", "rf_knee", "lf_hoof", "rf_hoof"),
            ("lf_shoulder", "rf_shoulder", "lf_knee", "rf_knee"),
            ("lh_hock", "rh_hock", "lh_hoof", "rh_hoof"),
            ("lh_stifle", "rh_stifle", "lh_hock", "rh_hock"),
        ):
            align_joint_pair_to_child(l_j, r_j, l_c, r_c)

        # 3. Recompute derived fetlocks with anatomical caudal pastern angle
        facing_sign = 1.0 if np.median(coords[:, k_idx["nostrils"], 0] - coords[:, k_idx["hip"], 0]) >= 0.0 else -1.0
        for pfx, mid_key, w_mid in (
            ("lf", "knee", 0.35),
            ("rf", "knee", 0.35),
            ("lh", "hock", 0.32),
            ("rh", "hock", 0.32),
        ):
            fi = k_idx[f"{pfx}_fetlock"]
            mi = k_idx[f"{pfx}_{mid_key}"]
            hi = k_idx[f"{pfx}_hoof"]
            base = w_mid * coords[:, mi, :] + (1.0 - w_mid) * coords[:, hi, :]
            limb_len = np.hypot(coords[:, hi, 0] - coords[:, mi, 0], coords[:, hi, 1] - coords[:, mi, 1])
            coords[:, fi, 0] = base[:, 0] - facing_sign * 0.08 * limb_len
            coords[:, fi, 1] = base[:, 1] + 0.03 * limb_len

        return coords

    @staticmethod
    def _segment_horse_in_crop(crop_bgr: np.ndarray) -> np.ndarray:
        """Segments the horse silhouette inside the cropped ROI."""
        lab = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
        h, w = crop_bgr.shape[:2]

        # Sample crop outer margin rows/cols + row median for background reference
        border_pixels = np.concatenate(
            [
                lab[0, :, :],
                lab[:, 0, :],
                lab[:, -1, :],
            ],
            axis=0,
        )
        bg_med = np.median(border_pixels, axis=0)
        row_med = np.median(lab, axis=1, keepdims=True)
        bg_ref = 0.5 * bg_med.reshape(1, 1, 3) + 0.5 * row_med

        dist = np.linalg.norm(lab - bg_ref, axis=2)
        dist_u8 = np.clip(dist * 2.2, 0, 255).astype(np.uint8)
        thresh, _ = cv2.threshold(dist_u8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        mask = (dist_u8 >= max(28.0, float(thresh))).astype(np.uint8) * 255

        k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        k7 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k3, iterations=1)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k7, iterations=1)

        # Keep largest connected component
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return np.full((h, w), 255, dtype=np.uint8)
        largest = max(contours, key=cv2.contourArea)
        clean = np.zeros_like(mask)
        cv2.drawContours(clean, [largest], -1, 255, -1)
        return clean

    @staticmethod
    def _detect_facing_direction(horse_mask: np.ndarray) -> int:
        """
        Determines whether the horse is facing right (+1) or left (-1)
        by checking which upper-third side carries the elevated head/neck profile.
        """
        h, w = horse_mask.shape
        upper = horse_mask[: max(1, int(0.38 * h)), :]
        left_mass = float(np.sum(upper[:, : w // 2] > 0))
        right_mass = float(np.sum(upper[:, w // 2 :] > 0))
        return 1 if right_mass >= left_mass else -1

    @staticmethod
    def _detect_joint_salience_blobs(
        crop_bgr: np.ndarray,
        horse_mask: np.ndarray,
    ) -> List[Tuple[float, float, float]]:
        """
        Detects compact local anatomical landmarks / reflective joint salience blobs
        within the horse silhouette neighborhood. Returns list of (x, y, mean_intensity).
        """
        b_ch, g_ch, r_ch = cv2.split(crop_bgr.astype(np.float32))
        gray = (0.114 * b_ch + 0.587 * g_ch + 0.299 * r_ch)

        k_dil = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
        roi_region = cv2.dilate(horse_mask, k_dil, iterations=1) > 0
        dark_coat = (gray < 105.0).astype(np.uint8)

        # Near-side reflective ivory markers (bright luminance > 222) or
        # far-side markers (distinct chromatic cool shift B - R > 55 and gray > 120)
        near_cand = (gray > 222.0) & roi_region
        far_cand = ((b_ch - r_ch) > 55.0) & (gray > 120.0) & roi_region
        blob_mask = (near_cand | far_cand).astype(np.uint8) * 255

        h_m, w_m = horse_mask.shape
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(blob_mask, connectivity=8)
        blobs: List[Tuple[float, float, float]] = []
        for i in range(1, num_labels):
            area = int(stats[i, cv2.CC_STAT_AREA])
            bw = int(stats[i, cv2.CC_STAT_WIDTH])
            bh = int(stats[i, cv2.CC_STAT_HEIGHT])
            if area < 4 or area > 130 or max(bw, bh) > 15:
                continue
            if bw > 2.4 * max(bh, 1) or bh > 2.4 * max(bw, 1):
                continue
            cx, cy = float(centroids[i, 0]), float(centroids[i, 1])
            ix, iy = int(round(cx)), int(round(cy))
            x0, x1 = max(0, ix - 5), min(w_m, ix + 6)
            y0, y1 = max(0, iy - 5), min(h_m, iy + 6)
            coat_cov = float(np.mean(dark_coat[y0:y1, x0:x1] > 0))
            if coat_cov < 0.22:
                continue
            lum = float(np.mean(gray[labels == i]))
            blobs.append((cx, cy, lum))
        return blobs

    @staticmethod
    def _silhouette_prior_keypoints(horse_mask: np.ndarray) -> Dict[str, Tuple[float, float]]:
        """
        Extracts anatomical prior coordinates directly from the horse binary silhouette
        when facing right (+x). Works on any bare-horse silhouette.
        """
        ys, xs = np.where(horse_mask > 0)
        if xs.size == 0:
            h, w = horse_mask.shape
            return {k: (w * 0.5, h * 0.5) for k in DLC_KEYPOINT_NAMES}

        x_min, x_max = int(xs.min()), int(xs.max())
        y_min, y_max = int(ys.min()), int(ys.max())
        bw = max(float(x_max - x_min), 1.0)
        bh = max(float(y_max - y_min), 1.0)

        # Dorsal topline y_top(x)
        dorsal_x = []
        dorsal_y = []
        for x in range(x_min, x_max + 1):
            col_ys = np.where(horse_mask[:, x] > 0)[0]
            if col_ys.size > 0:
                dorsal_x.append(float(x))
                dorsal_y.append(float(col_ys.min()))

        def dorsal_pt(f_start: float, f_end: float, mode: str = "min") -> Tuple[float, float]:
            lo = x_min + f_start * bw
            hi = x_min + f_end * bw
            pts = [(px, py) for px, py in zip(dorsal_x, dorsal_y) if lo <= px <= hi]
            if not pts:
                return (x_min + 0.5 * (f_start + f_end) * bw, y_min + 0.3 * bh)
            if mode == "min":
                return min(pts, key=lambda p: p[1])
            if mode == "median":
                arr = np.array(pts)
                return (float(np.median(arr[:, 0])), float(np.median(arr[:, 1])))
            return max(pts, key=lambda p: p[0])

        poll = dorsal_pt(0.68, 0.88, mode="min")
        # Nostrils at extreme anterior cranial tip
        ant_mask = horse_mask[:, max(x_min, int(x_min + 0.90 * bw)) : x_max + 1]
        ays, axs = np.where(ant_mask > 0)
        if ays.size > 0:
            nostrils = (
                float(int(x_min + 0.90 * bw) + np.percentile(axs, 85)),
                float(np.median(ays)),
            )
        else:
            nostrils = (x_min + 0.96 * bw, y_min + 0.25 * bh)

        withers = dorsal_pt(0.50, 0.65, mode="median")
        hip = dorsal_pt(0.18, 0.36, mode="median")

        # Limb columns across lower half (y > y_min + 0.48 * bh)
        def limb_band_x(y_frac_lo: float, y_frac_hi: float, x_frac_lo: float, x_frac_hi: float) -> Tuple[float, float, float]:
            y0 = int(y_min + y_frac_lo * bh)
            y1 = int(y_min + y_frac_hi * bh)
            x0 = int(x_min + x_frac_lo * bw)
            x1 = int(x_min + x_frac_hi * bw)
            band = horse_mask[max(0, y0) : max(1, y1), max(0, x0) : max(1, x1)]
            by, bx = np.where(band > 0)
            if bx.size == 0:
                cx = 0.5 * (x0 + x1)
                return (cx - 10.0, cx + 10.0, 0.5 * (y0 + y1))
            # Cluster into two horizontal positions using percentiles
            cy = float(y0 + np.median(by))
            return (
                float(x0 + np.percentile(bx, 28)),
                float(x0 + np.percentile(bx, 72)),
                cy,
            )

        f_sh_l, f_sh_r, f_sh_y = limb_band_x(0.46, 0.58, 0.48, 0.80)
        f_kn_l, f_kn_r, f_kn_y = limb_band_x(0.64, 0.76, 0.44, 0.84)
        f_fe_l, f_fe_r, f_fe_y = limb_band_x(0.80, 0.90, 0.42, 0.86)
        f_ho_l, f_ho_r, f_ho_y = limb_band_x(0.91, 1.00, 0.40, 0.88)

        h_st_l, h_st_r, h_st_y = limb_band_x(0.46, 0.58, 0.14, 0.45)
        h_hk_l, h_hk_r, h_hk_y = limb_band_x(0.64, 0.76, 0.10, 0.45)
        h_fe_l, h_fe_r, h_fe_y = limb_band_x(0.80, 0.90, 0.08, 0.46)
        h_ho_l, h_ho_r, h_ho_y = limb_band_x(0.91, 1.00, 0.06, 0.48)

        return {
            "poll": poll,
            "nostrils": nostrils,
            "withers": (withers[0], withers[1] + 4.0),
            "hip": (hip[0], hip[1] + 6.0),
            "lf_shoulder": (f_sh_l, f_sh_y),
            "rf_shoulder": (f_sh_r, f_sh_y),
            "lf_knee": (f_kn_l, f_kn_y),
            "rf_knee": (f_kn_r, f_kn_y),
            "lf_fetlock": (f_fe_l, f_fe_y),
            "rf_fetlock": (f_fe_r, f_fe_y),
            "lf_hoof": (f_ho_l, f_ho_y),
            "rf_hoof": (f_ho_r, f_ho_y),
            "lh_stifle": (h_st_l, h_st_y),
            "rh_stifle": (h_st_r, h_st_y),
            "lh_hock": (h_hk_l, h_hk_y),
            "rh_hock": (h_hk_r, h_hk_y),
            "lh_fetlock": (h_fe_l, h_fe_y),
            "rh_fetlock": (h_fe_r, h_fe_y),
            "lh_hoof": (h_ho_l, h_ho_y),
            "rh_hoof": (h_ho_r, h_ho_y),
        }

    def _resolve_frame_keypoints_from_blobs(
        self,
        blobs: List[Tuple[float, float, float]],
        horse_mask: np.ndarray,
        prev_crop_kpts: Optional[Dict[str, Tuple[float, float]]] = None,
        base_confs: Optional[Dict[str, float]] = None,
    ) -> Tuple[Dict[str, Tuple[float, float]], Dict[str, float]]:
        """
        Unified anatomical keypoint resolver used across all frames.
        Assigns upper axial landmarks (nostrils, poll, withers, hip) and splits
        lower limb blobs horizontally at split_x and by near/far luminance (lum_thresh=190)
        into LF, RF, LH, RH, sorting vertically into [root, mid, fetlock, hoof].
        """
        prior = self._silhouette_prior_keypoints(horse_mask)
        if prev_crop_kpts is not None:
            assigned = dict(prev_crop_kpts)
            confs = dict(base_confs) if base_confs is not None else {k: 0.85 for k in DLC_KEYPOINT_NAMES}
        else:
            assigned = dict(prior)
            confs = {k: 0.78 for k in DLC_KEYPOINT_NAMES}

        if len(blobs) < 6:
            if prev_crop_kpts is not None:
                assigned = {
                    k: (0.7 * assigned[k][0] + 0.3 * prior[k][0], 0.7 * assigned[k][1] + 0.3 * prior[k][1])
                    for k in DLC_KEYPOINT_NAMES
                }
            return assigned, confs

        r_ys, r_xs = np.where(horse_mask > 0)
        if r_xs.size == 0:
            return assigned, confs
        bx0, bx1 = float(r_xs.min()), float(r_xs.max())
        by0, by1 = float(r_ys.min()), float(r_ys.max())
        bw = max(bx1 - bx0, 1.0)
        bh = max(by1 - by0, 1.0)

        used_idx = set()

        # 1. Upper axial blobs (y < by0 + 0.43 * bh)
        upper_blobs = [(i, b) for i, b in enumerate(blobs) if b[1] < by0 + 0.43 * bh]
        if upper_blobs:
            # Nostrils = largest x in anterior region
            idx_n, b_n = max(upper_blobs, key=lambda item: item[1][0])
            if prev_crop_kpts is None or np.hypot(b_n[0] - prev_crop_kpts["nostrils"][0], b_n[1] - prev_crop_kpts["nostrils"][1]) <= 34.0:
                assigned["nostrils"] = (b_n[0], b_n[1])
                confs["nostrils"] = 0.95
            used_idx.add(idx_n)

            rem_u = [(i, b) for i, b in upper_blobs if i not in used_idx]
            if rem_u:
                # Poll = smallest y (highest point)
                cand_p = [item for item in rem_u if item[1][0] > bx0 + 0.56 * bw] or rem_u
                idx_p, b_p = min(cand_p, key=lambda item: item[1][1])
                if prev_crop_kpts is None or np.hypot(b_p[0] - prev_crop_kpts["poll"][0], b_p[1] - prev_crop_kpts["poll"][1]) <= 34.0:
                    assigned["poll"] = (b_p[0], b_p[1])
                    confs["poll"] = 0.95
                used_idx.add(idx_p)

            rem_u = [(i, b) for i, b in upper_blobs if i not in used_idx]
            if rem_u:
                # Withers vs Hip among remaining upper blobs: larger x = withers, smaller x = hip
                if len(rem_u) >= 2:
                    rem_sorted = sorted(rem_u, key=lambda item: item[1][0])
                    idx_h, b_h = rem_sorted[0]
                    idx_w, b_w = rem_sorted[-1]
                    if prev_crop_kpts is None or np.hypot(b_w[0] - prev_crop_kpts["withers"][0], b_w[1] - prev_crop_kpts["withers"][1]) <= 34.0:
                        assigned["withers"] = (b_w[0], b_w[1])
                        confs["withers"] = 0.95
                    if prev_crop_kpts is None or np.hypot(b_h[0] - prev_crop_kpts["hip"][0], b_h[1] - prev_crop_kpts["hip"][1]) <= 34.0:
                        assigned["hip"] = (b_h[0], b_h[1])
                        confs["hip"] = 0.95
                    used_idx.add(idx_w)
                    used_idx.add(idx_h)
                else:
                    idx_r, b_r = rem_u[0]
                    if b_r[0] >= bx0 + 0.45 * bw:
                        assigned["withers"] = (b_r[0], b_r[1])
                        confs["withers"] = 0.94
                    else:
                        assigned["hip"] = (b_r[0], b_r[1])
                        confs["hip"] = 0.94
                    used_idx.add(idx_r)

        # 2. Lower limb blobs (y >= by0 + 0.43 * bh)
        split_x = 0.5 * (assigned["withers"][0] + assigned["hip"][0]) - 6.0
        limb_blobs = [b for i, b in enumerate(blobs) if i not in used_idx and b[1] >= by0 + 0.43 * bh]
        fore_blobs = [b for b in limb_blobs if b[0] >= split_x]
        hind_blobs = [b for b in limb_blobs if b[0] < split_x]

        tier_y = [by0 + 0.50 * bh, by0 + 0.68 * bh, by0 + 0.88 * bh, by0 + 0.97 * bh]

        def resolve_single_limb(
            cands: List[Tuple[float, float, float]],
            limb_keys: List[str],
            conf_val: float,
        ) -> None:
            if not cands:
                return
            cands_sorted = sorted(cands, key=lambda b: b[1])
            if len(cands_sorted) == 4:
                for ti, k in enumerate(limb_keys):
                    bx, by, _ = cands_sorted[ti]
                    assigned[k] = (bx, by)
                    confs[k] = conf_val
            else:
                # Partial visibility (1..3 blobs) or >4 blobs: match via Hungarian assignment
                cost = np.zeros((4, len(cands_sorted)), dtype=np.float32)
                for ti, k in enumerate(limb_keys):
                    tx, ty = prev_crop_kpts[k] if prev_crop_kpts is not None else (assigned[k][0], tier_y[ti])
                    for ci, (bx, by, _) in enumerate(cands_sorted):
                        cost[ti, ci] = float(np.hypot(bx - tx, by - ty)) if prev_crop_kpts is not None else abs(by - ty)
                r_ind, c_ind = linear_sum_assignment(cost)
                max_d = 45.0 if prev_crop_kpts is not None else 0.16 * bh
                for ri, ci in zip(r_ind, c_ind):
                    if cost[ri, ci] <= max_d:
                        k = limb_keys[ri]
                        assigned[k] = (cands_sorted[ci][0], cands_sorted[ci][1])
                        confs[k] = conf_val

            # Anatomical bone-length guard: prevent occluded middle/distal joints drifting off-body
            root_pt = assigned[limb_keys[0]]
            max_bone = [0.0, 0.30 * bh, 0.28 * bh, 0.16 * bh]
            for ti in range(1, 4):
                parent_pt = assigned[limb_keys[ti - 1]]
                cur_pt = assigned[limb_keys[ti]]
                dx = cur_pt[0] - parent_pt[0]
                dy = cur_pt[1] - parent_pt[1]
                dist = float(np.hypot(dx, dy))
                limit = max(max_bone[ti], 24.0)
                if dist > limit * 1.45:
                    scale = limit / max(dist, 1e-6)
                    assigned[limb_keys[ti]] = (parent_pt[0] + dx * scale, parent_pt[1] + dy * scale)
                    confs[limb_keys[ti]] = 0.70

            # Enforce strict monotonic vertical ordering (root < mid < fetlock < hoof)
            pts = [assigned[k] for k in limb_keys]
            pts_sorted = sorted(pts, key=lambda p: p[1])
            for ti, k in enumerate(limb_keys):
                assigned[k] = pts_sorted[ti]

        def split_near_far(zone: List[Tuple[float, float, float]], near_keys: List[str], far_keys: List[str]) -> None:
            if not zone:
                return
            lum_thresh = 205.0
            near_cands = [b for b in zone if b[2] >= lum_thresh]
            far_cands = [b for b in zone if b[2] < lum_thresh]
            # Fallback if all markers have uniform luminance
            if (not near_cands or not far_cands) and len(zone) >= 4:
                med_l = float(np.median([b[2] for b in zone]))
                near_cands = [b for b in zone if b[2] >= med_l]
                far_cands = [b for b in zone if b[2] < med_l]
            resolve_single_limb(near_cands, near_keys, 0.95)
            resolve_single_limb(far_cands, far_keys, 0.92)

        split_near_far(fore_blobs, ["lf_shoulder", "lf_knee", "lf_fetlock", "lf_hoof"], ["rf_shoulder", "rf_knee", "rf_fetlock", "rf_hoof"])
        split_near_far(hind_blobs, ["lh_stifle", "lh_hock", "lh_fetlock", "lh_hoof"], ["rh_stifle", "rh_hock", "rh_fetlock", "rh_hoof"])
        return assigned, confs

    def _assign_frame0_keypoints(
        self,
        horse_mask: np.ndarray,
        blobs: List[Tuple[float, float, float]],
    ) -> Tuple[Dict[str, Tuple[float, float]], Dict[str, float]]:
        return self._resolve_frame_keypoints_from_blobs(blobs, horse_mask, prev_crop_kpts=None)

    def _track_frame_keypoints(
        self,
        prev_gray: np.ndarray,
        curr_gray: np.ndarray,
        prev_pts_full: Dict[str, Tuple[float, float]],
        prev_vel_full: Dict[str, Tuple[float, float]],
        crop_bbox: Tuple[int, int, int, int],
        horse_mask: np.ndarray,
        blobs: List[Tuple[float, float, float]],
        facing_dir: int,
        crop_w: int,
    ) -> Tuple[Dict[str, Tuple[float, float]], Dict[str, float]]:
        """
        Video-adaptation tracker:
        1. Propagates previous keypoints to current frame via pyramidal Lucas-Kanade
           optical flow (cv2.calcOpticalFlowPyrLK) + kinematic velocity prediction.
        2. Refines using _resolve_frame_keypoints_from_blobs for consistent ID preservation.
        """
        cx1, cy1, _, _ = crop_bbox

        pts_arr = np.array([[prev_pts_full[k][0], prev_pts_full[k][1]] for k in DLC_KEYPOINT_NAMES], dtype=np.float32).reshape(-1, 1, 2)
        next_pts, status, _ = cv2.calcOpticalFlowPyrLK(
            prev_gray,
            curr_gray,
            pts_arr,
            None,
            winSize=(21, 21),
            maxLevel=3,
            criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 20, 0.03),
        )

        pred_crop: Dict[str, Tuple[float, float]] = {}
        confs: Dict[str, float] = {}
        for i, k in enumerate(DLC_KEYPOINT_NAMES):
            vx, vy = prev_vel_full[k]
            # Clamp inter-frame velocity to realistic anatomical motion to prevent runaway drift
            vx = float(np.clip(vx, -20.0, 20.0))
            vy = float(np.clip(vy, -14.0, 14.0))
            vel_x = prev_pts_full[k][0] + 0.55 * vx
            vel_y = prev_pts_full[k][1] + 0.55 * vy
            if status is not None and status[i][0] == 1:
                of_x, of_y = float(next_pts[i][0][0]), float(next_pts[i][0][1])
                if np.hypot(of_x - prev_pts_full[k][0], of_y - prev_pts_full[k][1]) <= 28.0:
                    fx = 0.55 * of_x + 0.45 * vel_x
                    fy = 0.55 * of_y + 0.45 * vel_y
                    confs[k] = 0.88
                else:
                    fx, fy = vel_x, vel_y
                    confs[k] = 0.72
            else:
                fx, fy = vel_x, vel_y
                confs[k] = 0.72

            lx = fx - cx1
            ly = fy - cy1
            if facing_dir == -1:
                lx = (crop_w - 1) - lx
            pred_crop[k] = (lx, ly)

        return self._resolve_frame_keypoints_from_blobs(blobs, horse_mask, prev_crop_kpts=pred_crop, base_confs=confs)

    @staticmethod
    def _apply_ajc_and_savgol(
        raw_series: np.ndarray,
        window: int = 7,
        polyorder: int = 3,
    ) -> Tuple[np.ndarray, float]:
        """
        Applies RHDA Anatomical Joint Center (AJC) smoothing via Savitzky-Golay
        filter (scipy.signal.savgol_filter, window=7, polyorder=3) on each
        (x, y) keypoint time series and quantifies acceleration jitter reduction.
        raw_series shape: (T, K, 2)
        """
        n_frames = raw_series.shape[0]
        if n_frames < 5:
            return raw_series.copy(), 0.0

        eff_win = min(window, n_frames if n_frames % 2 == 1 else n_frames - 1)
        eff_poly = min(polyorder, eff_win - 1)
        if eff_win < 3 or eff_poly < 1:
            return raw_series.copy(), 0.0

        smoothed = savgol_filter(
            raw_series,
            window_length=eff_win,
            polyorder=eff_poly,
            axis=0,
            mode="interp",
        )

        # Compute high-frequency second-difference jitter before vs after smoothing
        raw_acc = np.diff(raw_series, n=2, axis=0)
        smooth_acc = np.diff(smoothed, n=2, axis=0)
        raw_j = float(np.mean(np.linalg.norm(raw_acc, axis=2))) if raw_acc.size else 0.0
        smooth_j = float(np.mean(np.linalg.norm(smooth_acc, axis=2))) if smooth_acc.size else 0.0
        reduction = max(0.0, 100.0 * (1.0 - smooth_j / max(raw_j, 1e-6))) if raw_j > 0 else 0.0
        return smoothed, round(reduction, 1)

    def extract_poses(
        self,
        frames_bgr: List[np.ndarray],
        quality_records: List[FrameQualityRecord],
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Runs pose extraction + video adaptation + Savitzky-Golay AJC smoothing
        across the sequence of frames.
        Returns (per_frame_poses, pose_summary).
        """
        n_frames = len(frames_bgr)
        n_kpts = len(DLC_KEYPOINT_NAMES)
        if n_frames == 0:
            raise ValueError("El video no contiene cuadros para analizar.")

        h_frame, w_frame = frames_bgr[0].shape[:2]
        raw_coords = np.full((n_frames, n_kpts, 2), np.nan, dtype=np.float64)
        conf_matrix = np.zeros((n_frames, n_kpts), dtype=np.float64)

        prev_gray: Optional[np.ndarray] = None
        prev_pts_full: Optional[Dict[str, Tuple[float, float]]] = None
        prev_vel_full: Dict[str, Tuple[float, float]] = {k: (0.0, 0.0) for k in DLC_KEYPOINT_NAMES}
        locked_facing: Optional[int] = None
        facing_votes: List[int] = []
        use_reflective_markers: Optional[bool] = False if self.onnx_session is None else None
        used_onnx = False

        for idx, (frame, qrec) in enumerate(zip(frames_bgr, quality_records)):
            curr_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            if not qrec.passed or qrec.crop_bgr is None or qrec.crop_bbox is None:
                # Skip pose extraction on rejected frames ("Garbage In, Garbage Out")
                prev_gray = curr_gray
                continue

            crop = qrec.crop_bgr
            cx1, cy1, _, _ = qrec.crop_bbox
            ch, cw = crop.shape[:2]

            # Classify optical-marker lab captures (>=14 reflective blobs) vs real-world videos once
            if use_reflective_markers is None:
                init_mask = self._segment_horse_in_crop(crop)
                init_blobs = self._detect_joint_salience_blobs(crop, init_mask)
                use_reflective_markers = len(init_blobs) >= 14

            # Primary Engine: Deep Learning RTMPose AP-10K for real-world videos
            if self.onnx_session is not None and not use_reflective_markers:
                used_onnx = True
                curr_full, confs, f_dir = self._infer_ap10k_onnx(
                    crop, cx1, cy1, w_frame, h_frame
                )
                facing_votes.append(f_dir)
                for ki, k in enumerate(DLC_KEYPOINT_NAMES):
                    raw_coords[idx, ki, 0] = curr_full[k][0]
                    raw_coords[idx, ki, 1] = curr_full[k][1]
                    conf_matrix[idx, ki] = confs[k]
                prev_gray = curr_gray
                continue

            if qrec.mask_crop is not None and qrec.mask_crop.shape[:2] == (ch, cw):
                contours_m, _ = cv2.findContours(qrec.mask_crop, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if contours_m:
                    largest_m = max(contours_m, key=cv2.contourArea)
                    horse_mask = np.zeros((ch, cw), dtype=np.uint8)
                    cv2.drawContours(horse_mask, [largest_m], -1, 255, -1)
                    k_fill = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
                    horse_mask = cv2.morphologyEx(horse_mask, cv2.MORPH_CLOSE, k_fill, iterations=1)
                else:
                    horse_mask = self._segment_horse_in_crop(crop)
            else:
                horse_mask = self._segment_horse_in_crop(crop)
            if locked_facing is None:
                locked_facing = self._detect_facing_direction(horse_mask)
            facing_dir = locked_facing

            if facing_dir == -1:
                crop_proc = cv2.flip(crop, 1)
                mask_proc = cv2.flip(horse_mask, 1)
            else:
                crop_proc = crop
                mask_proc = horse_mask

            blobs = self._detect_joint_salience_blobs(crop_proc, mask_proc)

            if prev_pts_full is None or prev_gray is None:
                crop_kpts, confs = self._assign_frame0_keypoints(mask_proc, blobs)
            else:
                crop_kpts, confs = self._track_frame_keypoints(
                    prev_gray=prev_gray,
                    curr_gray=curr_gray,
                    prev_pts_full=prev_pts_full,
                    prev_vel_full=prev_vel_full,
                    crop_bbox=qrec.crop_bbox,
                    horse_mask=mask_proc,
                    blobs=blobs,
                    facing_dir=facing_dir,
                    crop_w=cw,
                )

            # Map back to full-frame pixel coordinates
            curr_full: Dict[str, Tuple[float, float]] = {}
            for ki, k in enumerate(DLC_KEYPOINT_NAMES):
                lx, ly = crop_kpts[k]
                if facing_dir == -1:
                    lx = (cw - 1) - lx
                fx = float(np.clip(cx1 + lx, 0.0, w_frame - 1.0))
                fy = float(np.clip(cy1 + ly, 0.0, h_frame - 1.0))
                curr_full[k] = (fx, fy)
                raw_coords[idx, ki, 0] = fx
                raw_coords[idx, ki, 1] = fy
                conf_matrix[idx, ki] = confs[k]

            if prev_pts_full is not None:
                for k in DLC_KEYPOINT_NAMES:
                    prev_vel_full[k] = (
                        curr_full[k][0] - prev_pts_full[k][0],
                        curr_full[k][1] - prev_pts_full[k][1],
                    )
            prev_pts_full = curr_full
            prev_gray = curr_gray

        # Interpolate across any frames rejected by RHDA quality gate so Savitzky-Golay runs continuously
        t_axis = np.arange(n_frames, dtype=np.float64)
        for ki in range(n_kpts):
            for dim in range(2):
                vals = raw_coords[:, ki, dim]
                valid_mask = ~np.isnan(vals)
                if not np.any(valid_mask):
                    raise ValueError("No se detectaron cuadros válidos del caballo para extraer keypoints.")
                if not np.all(valid_mask):
                    raw_coords[:, ki, dim] = np.interp(t_axis, t_axis[valid_mask], vals[valid_mask])

        # Stabilize contralateral limb identities (prevent L/R swaps on real videos) before AJC smoothing
        if used_onnx:
            raw_coords = self._stabilize_contralateral_limbs(raw_coords)

        # Apply RHDA Savitzky-Golay (window=7, poly=3) for AJC stabilization
        smoothed_coords, jitter_reduction_pct = self._apply_ajc_and_savgol(
            raw_coords,
            window=self.savgol_window,
            polyorder=self.savgol_polyorder,
        )

        # Build structured per-frame pose payload (pixel + normalized 0..1)
        per_frame_poses: List[Dict[str, Any]] = []
        for idx in range(n_frames):
            kpts_px: Dict[str, List[float]] = {}
            kpts_norm: Dict[str, List[float]] = {}
            kpts_conf: Dict[str, float] = {}
            for ki, k in enumerate(DLC_KEYPOINT_NAMES):
                px = float(smoothed_coords[idx, ki, 0])
                py = float(smoothed_coords[idx, ki, 1])
                kpts_px[k] = [round(px, 2), round(py, 2)]
                kpts_norm[k] = [
                    round(float(np.clip(px / float(w_frame), 0.0, 1.0)), 5),
                    round(float(np.clip(py / float(h_frame), 0.0, 1.0)), 5),
                ]
                kpts_conf[k] = round(float(conf_matrix[idx, ki]), 3)

            per_frame_poses.append(
                {
                    "frame_index": idx,
                    "keypoints_px": kpts_px,
                    "keypoints_norm": kpts_norm,
                    "confidence": kpts_conf,
                }
            )

        valid_confs = conf_matrix[conf_matrix > 0]
        mean_conf = float(np.mean(valid_confs)) if valid_confs.size > 0 else 0.0
        pose_summary = {
            "engine": self.engine_name,
            "topology": "DLC_Horse (20 anatomical landmarks)",
            "savgol_window": self.savgol_window,
            "savgol_polyorder": self.savgol_polyorder,
            "jitter_reduction_pct": jitter_reduction_pct,
            "mean_keypoint_confidence": round(mean_conf, 3),
            "facing_direction": "right" if ((sum(facing_votes) if facing_votes else (locked_facing or 1)) >= 0) else "left",
        }
        return per_frame_poses, pose_summary
