"""
Unit & Integration Tests for the HorseVision 4-Stage Biomechanical Pipeline.
"""

from __future__ import annotations

import math
from pathlib import Path
import sys

import cv2
import numpy as np

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import DEMO_VIDEOS, run_full_pipeline
from pipeline.kinematics_dlc import DLCKinematicsEngine, compute_internal_angle_deg
from pipeline.pose_extractor import DLC_KEYPOINT_NAMES, EquinePoseExtractor
from pipeline.quality_gate import RHDAQualityGate


def test_internal_angle_trigonometry():
    assert math.isclose(compute_internal_angle_deg((1.0, 0.0), (0.0, 0.0), (0.0, 1.0)), 90.0, abs_tol=1e-4)
    assert math.isclose(compute_internal_angle_deg((-1.0, 0.0), (0.0, 0.0), (1.0, 0.0)), 180.0, abs_tol=1e-4)
    assert math.isclose(compute_internal_angle_deg((1.0, 0.0), (0.0, 0.0), (0.5, math.sqrt(3) / 2.0)), 60.0, abs_tol=1e-4)


def test_quality_gate_lateral_and_rejection():
    gate = RHDAQualityGate()

    # Frame with tall portrait vertical box (width < height) should fail lateral aspect ratio check
    portrait_frame = np.full((720, 1280, 3), 210, dtype=np.uint8)
    cv2.rectangle(portrait_frame, (580, 120), (680, 560), (25, 35, 70), -1)  # 100x440 -> AR ~ 0.23

    # Blank empty frame should fail detection
    empty_frame = np.full((720, 1280, 3), 210, dtype=np.uint8)

    records, summary = gate.process_frames([portrait_frame, empty_frame], fps=30.0)
    assert len(records) == 2
    assert records[0].passed is False
    assert records[0].rejection_reason == "non_lateral_aspect_ratio"
    assert records[1].passed is False
    assert summary["valid_frames"] == 0
    assert summary["rejected_frames"] == 2


def test_savgol_pose_extraction_and_smoothing():
    cap = cv2.VideoCapture(str(DEMO_VIDEOS["symmetric"]))
    frames = []
    for _ in range(30):
        ok, frame = cap.read()
        if not ok:
            break
        frames.append(frame)
    cap.release()

    gate = RHDAQualityGate()
    qrecs, qsum = gate.process_frames(frames, fps=30.0)
    assert qsum["valid_frames"] == 30
    assert qsum["lateral_view_confirmed"] is True

    extractor = EquinePoseExtractor(savgol_window=7, savgol_polyorder=3)
    poses, psum = extractor.extract_poses(frames, qrecs)
    assert len(poses) == 30
    assert psum["jitter_reduction_pct"] > 0.0
    for pose in poses:
        assert set(pose["keypoints_norm"].keys()) == set(DLC_KEYPOINT_NAMES)
        for x, y in pose["keypoints_norm"].values():
            assert 0.0 <= x <= 1.0
            assert 0.0 <= y <= 1.0


def test_full_pipeline_symmetric_trot():
    res = run_full_pipeline(DEMO_VIDEOS["symmetric"], "/api/videos/demo_horse_trot.mp4", "demo_horse_trot.mp4")
    assert res["quality_gate"]["lateral_view_confirmed"] is True
    assert res["quality_gate"]["pass_rate_pct"] >= 95.0
    assert res["kinematics_summary"]["stride_length_normalized"] > 0.8
    assert res["kinematics_summary"]["savgol_window"] == 7
    assert res["kinematics_summary"]["savgol_polyorder"] == 3

    for limb in ("LF", "RF", "LH", "RH"):
        assert res["limbs"][limb]["stance_ms"] > 200.0
        assert res["limbs"][limb]["swing_ms"] > 200.0
        assert res["limbs"][limb]["rom_deg"] > 35.0

    sym = res["symmetry_report"]
    assert sym["global_score"] >= 88
    assert sym["status"] == "optimal"
    assert sym["badge_color"] == "#10B981"
    assert sym["anterior_asymmetry_pct"] <= 10.0
    assert sym["posterior_asymmetry_pct"] <= 10.0
    assert sym["affected_limb"] is None


def test_full_pipeline_asymmetric_lh_lameness():
    res = run_full_pipeline(DEMO_VIDEOS["asymmetry"], "/api/videos/demo_horse_asymmetry.mp4", "demo_horse_asymmetry.mp4")
    sym = res["symmetry_report"]
    assert sym["status"] == "alert"
    assert sym["badge_color"] == "#EF4444"
    assert sym["posterior_asymmetry_pct"] > 15.0
    assert sym["affected_limb"] == "LH"
    assert any(f["affected_limb"] == "LH" for f in sym["findings"])
