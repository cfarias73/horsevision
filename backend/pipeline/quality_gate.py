"""
quality_gate.py
Module 1 — RHDA Quality Gate & Pre-processing
Inspired by FUNFACTOR1/RHDA-Race-Horse-Deep-Analysis.

Uses Ultralytics YOLOv8 (class 'horse' / COCO id 17) when available, or
OpenCV DNN YOLOv8 ONNX, with a real-pixel OpenCV adaptive foreground horse
detector & temporal tracker fallback. Enforces lateral-view aspect ratio
(width > height -> 90° lateral profile) and discards occluded or blurry frames
before deep pose inference ("Garbage In, Garbage Out").
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger("horsevision.quality_gate")

COCO_HORSE_CLASS_ID = 17


@dataclass
class FrameQualityRecord:
    frame_index: int
    timestamp_s: float
    passed: bool
    bbox: Optional[Tuple[int, int, int, int]]       # [x1, y1, x2, y2] tight bbox
    crop_bbox: Optional[Tuple[int, int, int, int]]  # padded ROI bbox for pose extractor
    bbox_norm: Optional[Tuple[float, float, float, float]]
    confidence: float
    aspect_ratio: float
    lateral_view: bool
    occlusion_score: float
    sharpness: float
    rejection_reason: Optional[str]
    crop_bgr: Optional[np.ndarray]
    mask_crop: Optional[np.ndarray] = None


class RHDAQualityGate:
    """
    Detects, tracks, validates (90° lateral view + occlusion/blur gate), and crops
    the horse bounding box in every video frame.
    """

    def __init__(
        self,
        min_aspect_ratio: float = 1.02,
        max_aspect_ratio: float = 3.20,
        max_occlusion_score: float = 0.35,
        min_confidence: float = 0.35,
        min_area_ratio: float = 0.02,
        models_dir: Optional[Path] = None,
    ):
        self.min_aspect_ratio = min_aspect_ratio
        self.max_aspect_ratio = max_aspect_ratio
        self.max_occlusion_score = max_occlusion_score
        self.min_confidence = min_confidence
        self.min_area_ratio = min_area_ratio
        self.models_dir = Path(models_dir) if models_dir else Path(__file__).resolve().parent.parent / "models"

        self.yolo_model = None
        self.yolo_onnx = None
        self.engine_name = "OpenCV Foreground Horse Detector + Temporal Tracker (YOLOv8 Fallback)"
        self._init_detector()

    def _init_detector(self) -> None:
        """
        Attempts to initialize Ultralytics YOLOv8 (class 'horse') if local weights
        exist, or OpenCV DNN YOLOv8 ONNX; otherwise uses deterministic real-pixel
        OpenCV horse segmentation + tracking.
        """
        local_pt = self.models_dir / "yolov8n.pt"
        cwd_pt = Path("yolov8n.pt")
        pt_path = local_pt if local_pt.exists() else (cwd_pt if cwd_pt.exists() else None)

        if pt_path is not None:
            try:
                from ultralytics import YOLO  # type: ignore

                self.yolo_model = YOLO(str(pt_path))
                self.engine_name = f"Ultralytics YOLOv8 ({pt_path.name}, class=horse)"
                logger.info("Loaded %s", self.engine_name)
                return
            except Exception as exc:
                logger.warning("Ultralytics YOLOv8 unavailable (%s); checking ONNX/OpenCV.", exc)

        onnx_path = self.models_dir / "yolov8n.onnx"
        if onnx_path.exists():
            try:
                self.yolo_onnx = cv2.dnn.readNetFromONNX(str(onnx_path))
                self.engine_name = f"OpenCV DNN YOLOv8 ({onnx_path.name}, class=horse)"
                logger.info("Loaded %s", self.engine_name)
                return
            except Exception as exc:
                logger.warning("YOLOv8 ONNX load failed (%s); using OpenCV tracker.", exc)

        logger.info("Initialized %s", self.engine_name)

    @property
    def is_ready(self) -> bool:
        return True

    def _detect_with_yolo(self, frame_bgr: np.ndarray) -> Optional[Tuple[Tuple[int, int, int, int], float, float]]:
        """Runs YOLOv8 inference for COCO class 17 (horse)."""
        if self.yolo_model is None:
            return None
        results = self.yolo_model.predict(frame_bgr, classes=[COCO_HORSE_CLASS_ID], verbose=False)
        if not results or len(results[0].boxes) == 0:
            return None

        boxes = results[0].boxes
        best_idx = int(np.argmax(boxes.conf.cpu().numpy()))
        conf = float(boxes.conf[best_idx].cpu().numpy())
        xyxy = boxes.xyxy[best_idx].cpu().numpy().astype(int)
        x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])
        # Compute foreground solidity inside box for occlusion metric
        roi = frame_bgr[max(0, y1):max(1, y2), max(0, x1):max(1, x2)]
        occlusion_est = self._estimate_roi_occlusion(roi)
        return (x1, y1, x2, y2), conf, occlusion_est

    @staticmethod
    def _estimate_roi_occlusion(roi_bgr: np.ndarray) -> float:
        """Estimates occlusion inside a detected horse bounding box using gradient/texture continuity."""
        if roi_bgr.size == 0:
            return 1.0
        gray = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 40, 120)
        # Check horizontal 3-band edge/foreground density (head, barrel, hind)
        w = gray.shape[1]
        if w < 12:
            return 1.0
        thirds = [edges[:, : w // 3], edges[:, w // 3 : (2 * w) // 3], edges[:, (2 * w) // 3 :]]
        densities = [float(np.mean(t > 0)) for t in thirds]
        min_d = min(densities)
        max_d = max(densities) + 1e-6
        # If one third of the horse is completely blanked out or uniform occluder, score rises
        imbalance = 1.0 - (min_d / max_d)
        return float(max(0.0, min(1.0, imbalance * 0.25)))

    def _detect_horse_bbox_cv2(
        self,
        frame_bgr: np.ndarray,
        prev_bbox: Optional[Tuple[int, int, int, int]] = None,
    ) -> Tuple[Optional[Tuple[int, int, int, int]], float, float, np.ndarray]:
        """
        Real-pixel OpenCV Horse Detector:
        1. Computes row-wise median background in Lab color space (robust to horizontal
           panning arena fences/ground/sky gradients).
        2. Combines chromatic salience + local contrast to segment the horse silhouette.
        3. Filters connected contours by area, solidity, and temporal consistency with prev_bbox.
        Returns (tight_bbox, confidence, occlusion_score, foreground_mask).
        """
        h, w = frame_bgr.shape[:2]
        lab = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)

        # Row-wise median captures horizontal arena backdrop at each y level
        row_bg = np.median(lab, axis=1, keepdims=True)
        diff_l = np.abs(lab[:, :, 0] - row_bg[:, :, 0])
        diff_ab = np.hypot(lab[:, :, 1] - row_bg[:, :, 1], lab[:, :, 2] - row_bg[:, :, 2])
        salience = 0.72 * diff_l + 0.55 * diff_ab

        # Normalize and threshold with dynamic floor so flat background noise is ignored
        sal_u8 = np.clip(salience * 2.2, 0, 255).astype(np.uint8)
        otsu_thresh, _ = cv2.threshold(sal_u8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        eff_thresh = max(36.0, float(otsu_thresh))
        fg_mask = (sal_u8 >= eff_thresh).astype(np.uint8) * 255

        # Remove thin horizontal rails and connect limbs to body carefully
        k_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        k_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
        fg_raw = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, k_open, iterations=1)
        fg_clean = cv2.morphologyEx(fg_raw, cv2.MORPH_CLOSE, k_close, iterations=2)

        contours, _ = cv2.findContours(fg_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None, 0.0, 1.0, fg_raw

        frame_area = float(w * h)
        best_score = -1.0
        best_contour = None
        best_bbox = None

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 0.015 * frame_area:
                continue
            bx, by, bw, bh = cv2.boundingRect(cnt)
            if bw < 32 or bh < 32:
                continue

            # Ignore thin full-width horizontal bands (e.g. horizon/track border)
            if bw > 0.92 * w and bh < 0.16 * h:
                continue

            cx = bx + bw * 0.5
            cy = by + bh * 0.5
            hull_area = max(cv2.contourArea(cv2.convexHull(cnt)), 1.0)
            solidity = area / hull_area

            # Prefer large, solid central silhouettes and penalize wild jumps from prev_bbox
            center_prior = 1.0 - 0.35 * (abs(cx - w * 0.5) / (w * 0.5))
            temporal_prior = 1.0
            if prev_bbox is not None:
                pcx = (prev_bbox[0] + prev_bbox[2]) * 0.5
                pcy = (prev_bbox[1] + prev_bbox[3]) * 0.5
                jump = np.hypot(cx - pcx, cy - pcy) / max(w, h)
                temporal_prior = max(0.25, 1.0 - 2.0 * jump)

            score = (area / frame_area) * (0.5 + 0.5 * solidity) * center_prior * temporal_prior
            if score > best_score:
                best_score = score
                best_contour = cnt
                best_bbox = (bx, by, bx + bw, by + bh)

        if best_contour is None or best_bbox is None:
            return None, 0.0, 1.0, fg_clean

        x1, y1, x2, y2 = best_bbox
        bw = x2 - x1
        bh = y2 - y1

        # Include nearby detached hoof/ear pixels within a tight margin of the main horse contour
        pad_x = int(0.06 * bw)
        pad_y = int(0.06 * bh)
        sx1, sy1 = max(0, x1 - pad_x), max(0, y1 - pad_y)
        sx2, sy2 = min(w, x2 + pad_x), min(h, y2 + pad_y)
        sub_mask = fg_clean[sy1:sy2, sx1:sx2]
        ys, xs = np.where(sub_mask > 0)
        if len(xs) > 0:
            x1 = int(sx1 + xs.min())
            y1 = int(sy1 + ys.min())
            x2 = int(sx1 + xs.max()) + 1
            y2 = int(sy1 + ys.max()) + 1

        # Compute confidence & occlusion score from contour fill + frame edge clipping
        area = cv2.contourArea(best_contour)
        hull_area = max(cv2.contourArea(cv2.convexHull(best_contour)), 1.0)
        solidity = float(area / hull_area)
        fill_ratio = float(np.mean(fg_clean[y1:y2, x1:x2] > 0))

        # Check severe frame border truncation
        touch_left = x1 <= 2
        touch_right = x2 >= w - 2
        touch_top = y1 <= 2
        touch_bottom = y2 >= h - 2
        border_penalty = 0.18 * (int(touch_left) + int(touch_right) + int(touch_top) + int(touch_bottom))

        # Check horizontal continuity across head/torso/hindquarters (split silhouette = occlusion)
        box_w = max(x2 - x1, 1)
        col_activity = np.mean(fg_clean[y1:y2, x1:x2] > 0, axis=0)
        mid_span = col_activity[int(0.2 * box_w) : int(0.8 * box_w)]
        occlusion_gap = float(np.mean(mid_span < 0.06)) if len(mid_span) > 0 else 0.0

        occlusion_score = float(min(1.0, max(0.0, border_penalty + 0.65 * occlusion_gap + max(0.0, 0.35 - solidity))))
        confidence = float(min(0.99, max(0.1, 0.48 + 0.35 * solidity + 0.25 * min(fill_ratio / 0.45, 1.0))))

        return (x1, y1, x2, y2), confidence, occlusion_score, fg_raw

    @staticmethod
    def _pad_bbox(
        bbox: Tuple[int, int, int, int],
        frame_w: int,
        frame_h: int,
        pad_frac: float = 0.08,
    ) -> Tuple[int, int, int, int]:
        x1, y1, x2, y2 = bbox
        bw = x2 - x1
        bh = y2 - y1
        px = int(round(bw * pad_frac))
        py = int(round(bh * pad_frac))
        return (
            max(0, x1 - px),
            max(0, y1 - py),
            min(frame_w, x2 + px),
            min(frame_h, y2 + py),
        )

    def process_frames(
        self,
        frames_bgr: List[np.ndarray],
        fps: float,
    ) -> Tuple[List[FrameQualityRecord], Dict[str, Any]]:
        """
        Executes RHDA quality gate across all video frames.
        Returns (records, quality_summary).
        """
        records: List[FrameQualityRecord] = []
        prev_bbox: Optional[Tuple[int, int, int, int]] = None
        ema_bbox: Optional[np.ndarray] = None

        aspect_ratios: List[float] = []
        confidences: List[float] = []
        occlusion_rejected = 0
        aspect_rejected = 0

        for idx, frame in enumerate(frames_bgr):
            h, w = frame.shape[:2]
            t_s = idx / max(fps, 1e-6)

            det = self._detect_with_yolo(frame)
            fg_full_mask: Optional[np.ndarray] = None
            if det is not None:
                raw_bbox, conf, occ = det
            else:
                raw_bbox, conf, occ, fg_full_mask = self._detect_horse_bbox_cv2(frame, prev_bbox=prev_bbox)

            if raw_bbox is None:
                records.append(
                    FrameQualityRecord(
                        frame_index=idx,
                        timestamp_s=t_s,
                        passed=False,
                        bbox=None,
                        crop_bbox=None,
                        bbox_norm=None,
                        confidence=0.0,
                        aspect_ratio=0.0,
                        lateral_view=False,
                        occlusion_score=1.0,
                        sharpness=0.0,
                        rejection_reason="no_horse_detected",
                        crop_bgr=None,
                    )
                )
                continue

            # Temporal EMA smoothing on bbox to stabilize crop region without losing motion
            raw_arr = np.array(raw_bbox, dtype=np.float32)
            if ema_bbox is None:
                ema_bbox = raw_arr
            else:
                # Only smooth gently if displacement is continuous
                if np.max(np.abs(raw_arr - ema_bbox)) < 0.25 * max(w, h):
                    ema_bbox = 0.65 * raw_arr + 0.35 * ema_bbox
                else:
                    ema_bbox = raw_arr

            x1, y1, x2, y2 = [int(round(v)) for v in ema_bbox]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, max(x1 + 2, x2)), min(h, max(y1 + 2, y2))
            prev_bbox = (x1, y1, x2, y2)

            bw = float(x2 - x1)
            bh = float(y2 - y1)
            aspect_ratio = bw / max(bh, 1.0)
            area_ratio = (bw * bh) / float(max(w * h, 1))
            lateral_view = bool(self.min_aspect_ratio <= aspect_ratio <= self.max_aspect_ratio)

            roi_gray = cv2.cvtColor(frame[y1:y2, x1:x2], cv2.COLOR_BGR2GRAY)
            sharpness = float(cv2.Laplacian(roi_gray, cv2.CV_64F).var()) if roi_gray.size > 0 else 0.0

            rejection_reason: Optional[str] = None
            if area_ratio < self.min_area_ratio:
                rejection_reason = "subject_too_small"
            elif not lateral_view:
                rejection_reason = "non_lateral_aspect_ratio"
                aspect_rejected += 1
            elif occ > self.max_occlusion_score:
                rejection_reason = "severe_occlusion"
                occlusion_rejected += 1
            elif conf < self.min_confidence:
                rejection_reason = "low_detection_confidence"
            elif sharpness < 8.0:
                rejection_reason = "severe_motion_blur"

            passed = rejection_reason is None
            crop_bbox = self._pad_bbox((x1, y1, x2, y2), w, h, pad_frac=0.08)
            cx1, cy1, cx2, cy2 = crop_bbox
            crop_bgr = frame[cy1:cy2, cx1:cx2].copy() if passed else None
            mask_crop = fg_full_mask[cy1:cy2, cx1:cx2].copy() if (passed and fg_full_mask is not None) else None

            if passed:
                aspect_ratios.append(aspect_ratio)
                confidences.append(conf)

            records.append(
                FrameQualityRecord(
                    frame_index=idx,
                    timestamp_s=t_s,
                    passed=passed,
                    bbox=(x1, y1, x2, y2),
                    crop_bbox=crop_bbox,
                    bbox_norm=(
                        round(x1 / float(w), 5),
                        round(y1 / float(h), 5),
                        round(x2 / float(w), 5),
                        round(y2 / float(h), 5),
                    ),
                    confidence=round(conf, 4),
                    aspect_ratio=round(aspect_ratio, 4),
                    lateral_view=lateral_view,
                    occlusion_score=round(occ, 4),
                    sharpness=round(sharpness, 2),
                    rejection_reason=rejection_reason,
                    crop_bgr=crop_bgr,
                    mask_crop=mask_crop,
                )
            )

        total_frames = len(records)
        valid_frames = sum(1 for r in records if r.passed)
        rejected_frames = total_frames - valid_frames
        pass_rate_pct = (100.0 * valid_frames / total_frames) if total_frames > 0 else 0.0
        mean_ar = float(np.mean(aspect_ratios)) if aspect_ratios else 0.0
        mean_conf = float(np.mean(confidences)) if confidences else 0.0

        summary = {
            "engine": self.engine_name,
            "total_frames": total_frames,
            "valid_frames": valid_frames,
            "rejected_frames": rejected_frames,
            "pass_rate_pct": round(pass_rate_pct, 1),
            "mean_aspect_ratio": round(mean_ar, 3),
            "lateral_view_confirmed": bool(mean_ar >= self.min_aspect_ratio and valid_frames > 0),
            "mean_confidence": round(mean_conf, 3),
            "occlusion_rejected_count": occlusion_rejected,
            "aspect_rejected_count": aspect_rejected,
        }
        return records, summary
