"""
HorseVision Biomechanical & Computer Vision Pipeline.
Integrates:
1. RHDA Quality Gate (quality_gate.py)
2. SuperAnimal-Quadruped / DLC_Horse Pose Extractor + Savitzky-Golay AJC (pose_extractor.py)
3. DLC_Horse Kinematics & Gait Phase Segmentation (kinematics_dlc.py)
4. ElectrifAi Equine Symmetry & Lameness Engine (symmetry_engine.py)
"""

from .quality_gate import RHDAQualityGate
from .pose_extractor import EquinePoseExtractor
from .kinematics_dlc import DLCKinematicsEngine
from .symmetry_engine import EquineSymmetryEngine

__all__ = [
    "RHDAQualityGate",
    "EquinePoseExtractor",
    "DLCKinematicsEngine",
    "EquineSymmetryEngine",
]
