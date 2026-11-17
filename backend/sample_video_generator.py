"""
sample_video_generator.py
Generates real, browser-compatible H.264 (.mp4) lateral equine trot videos
for testing and demonstrating the HorseVision biomechanical pipeline.
Zero metadata or coordinate side-channels are written: the CV pipeline reads
only the raw video frames.
"""

from __future__ import annotations

import math
import subprocess
from pathlib import Path
from typing import Dict, Tuple

import cv2
import numpy as np


def _solve_2link_ik(
    root: Tuple[float, float],
    end: Tuple[float, float],
    l1: float,
    l2: float,
    bend_sign: float,
) -> Tuple[float, float]:
    """
    2-bone planar inverse kinematics to compute the middle joint position
    (knee for forelimb, hock for hindlimb) from proximal root and distal fetlock.
    bend_sign = +1 bends joint toward +x (anterior/cranial, like equine knee)
    bend_sign = -1 bends joint toward -x (posterior/caudal, like equine hock)
    """
    dx = end[0] - root[0]
    dy = end[1] - root[1]
    dist = math.hypot(dx, dy)
    max_reach = max(l1 + l2 - 1.5, 10.0)
    min_reach = abs(l1 - l2) + 1.5
    dist_clamped = max(min_reach, min(dist, max_reach))

    cos_a = (l1 * l1 + dist_clamped * dist_clamped - l2 * l2) / (2.0 * l1 * dist_clamped)
    cos_a = max(-1.0, min(1.0, cos_a))
    angle_a = math.acos(cos_a)

    base_angle = math.atan2(dy, dx)
    # In screen coords (+x right, +y down), horse faces +x:
    # base_angle ~ +pi/2 (pointing down).
    # Subtracting angle_a shifts vector toward +x (anterior/knee);
    # Adding angle_a shifts vector toward -x (posterior/hock).
    joint_angle = base_angle - bend_sign * angle_a
    jx = root[0] + l1 * math.cos(joint_angle)
    jy = root[1] + l1 * math.sin(joint_angle)
    return (jx, jy)


def _limb_kinematics(
    phase: float,
    root: Tuple[float, float],
    ground_y: float,
    is_fore: bool,
    stride_reach_px: float,
    duty: float = 0.44,
    l1: float = 72.0,
    l2: float = 68.0,
    pastern_len: float = 28.0,
    lift_scale: float = 1.0,
    hoof_drop_bias: float = 0.0,
) -> Dict[str, Tuple[float, float]]:
    """
    Computes anatomically realistic limb joint coordinates for one trot phase in [0, 1).
    phase in [0, duty): Stance phase (hoof on ground, body advances forward over hoof)
    phase in [duty, 1): Swing phase (hoof lifts, flexes knee/hock, arcs forward to next strike)
    """
    p = phase % 1.0
    if p < duty:
        # Stance: linear retraction from anterior (+reach*0.52) to posterior (-reach*0.48)
        s = p / duty
        hoof_x = root[0] + stride_reach_px * (0.50 - s)
        hoof_y = ground_y + hoof_drop_bias
        # Fetlock dips (hyperextends) most at mid-stance (s=0.5)
        dip = math.sin(s * math.pi)
        fet_x = hoof_x - (11.0 + 7.0 * dip)
        fet_y = hoof_y - pastern_len * (0.76 - 0.16 * dip)
    else:
        # Swing: hoof lifts off ground and arcs forward from -0.50*reach to +0.50*reach
        s = (p - duty) / (1.0 - duty)
        # Smooth cubic/cosine horizontal advancement
        adv = 0.5 - 0.5 * math.cos(s * math.pi)
        hoof_x = root[0] + stride_reach_px * (-0.50 + adv)
        arc_height = (44.0 if is_fore else 40.0) * lift_scale
        lift = math.sin(s * math.pi) ** 0.85
        hoof_y = ground_y - arc_height * lift
        # Fetlock trails slightly in early swing, extends in late swing
        trail = math.sin(s * math.pi) * (8.0 if is_fore else 6.0)
        fet_x = hoof_x - 6.0 - trail
        fet_y = hoof_y - pastern_len * 0.86

    # During swing, forelimb knee bends forward (+1) and hindlimb hock bends backward (-1)
    # Wait: verify IK direction in screen coords (x right, y down):
    # Forelimb knee bends slightly forward/straight during stance, strongly forward (+x -> bend_sign=+1) during swing.
    # Actually let's compute bend_sign carefully:
    # For forelimb: shoulder->knee->fetlock has slight forward flexion (knee at >= fetlock x).
    # Wait: anatomical equine carpus (knee) is near-straight in stance (~173 deg) and flexes caudally (hoof/cannon folds BACKWARD behind knee, meaning knee stays ANTERIOR (+x) relative to fetlock!).
    # So knee is at +x relative to shoulder-fetlock chord -> bend_sign = +1.
    # For hindlimb: stifle->hock->fetlock: anatomical hock (tarsus) points POSTERIOR (-x) relative to stifle-fetlock chord!
    # So hock is at -x relative to stifle-fetlock chord -> bend_sign = -1.
    bend_sign = 1.0 if is_fore else -1.0
    mid = _solve_2link_ik(root, (fet_x, fet_y), l1, l2, bend_sign=bend_sign)
    return {
        "root": root,
        "mid": mid,
        "fetlock": (fet_x, fet_y),
        "hoof": (hoof_x, hoof_y),
    }


def _draw_tapered_segment(
    img: np.ndarray,
    p1: Tuple[float, float],
    p2: Tuple[float, float],
    r1: float,
    r2: float,
    color: Tuple[int, int, int],
) -> None:
    """Draws a smooth tapered anatomical limb or neck polygon between p1 and p2."""
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    length = math.hypot(dx, dy)
    if length < 1e-3:
        return
    nx = -dy / length
    ny = dx / length
    pts = np.array(
        [
            [p1[0] + nx * r1, p1[1] + ny * r1],
            [p2[0] + nx * r2, p2[1] + ny * r2],
            [p2[0] - nx * r2, p2[1] - ny * r2],
            [p1[0] - nx * r1, p1[1] - ny * r1],
        ],
        dtype=np.int32,
    )
    cv2.fillConvexPoly(img, pts, color, cv2.LINE_AA)
    cv2.circle(img, (int(round(p1[0])), int(round(p1[1]))), int(round(r1)), color, -1, cv2.LINE_AA)
    cv2.circle(img, (int(round(p2[0])), int(round(p2[1]))), int(round(r2)), color, -1, cv2.LINE_AA)


def generate_horse_trot_video(
    output_path: Path,
    asymmetric_lame: bool = False,
    duration_s: float = 5.0,
    fps: int = 30,
) -> Path:
    """
    Renders a realistic 1280x720 lateral horse trot video and transcodes to H.264 MP4.
    If asymmetric_lame=True, introduces true biomechanical Left Hind (LH) lameness
    (pelvic hike asymmetry >18%, shortened LH swing/stance push, mild LF head-nod compensation).
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    raw_path = output_path.with_suffix(".raw.mp4")

    width, height = 1280, 720
    total_frames = int(round(duration_s * fps))
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(raw_path), fourcc, float(fps), (width, height))

    ground_y = 568.0
    stride_freq_hz = 1.38  # ~83 strides/min (classic equine working trot)
    duty = 0.44

    # Color palette (BGR) - bright daylight equestrian arena + rich dark bay horse silhouette
    # Natural high contrast between bright outdoor/indoor arena footing/wall and bay horse coat
    sky_top = np.array([196, 192, 184], dtype=np.float32)
    sky_bot = np.array([218, 214, 208], dtype=np.float32)
    arena_wall = (168, 165, 158)
    sand_color = (162, 178, 194)
    sand_dark = (138, 152, 168)
    fence_color = (136, 140, 146)

    near_coat = (26, 36, 72)       # Rich dark bay (near side LF / LH / torso)
    far_coat = (16, 22, 46)        # Darker shaded off-side (RF / RH)
    mane_tail = (14, 16, 22)       # Jet black mane/tail/hooves
    hoof_near = (20, 22, 28)
    hoof_far = (14, 15, 20)

    # Subtle veterinary gait-lab anatomical joint markers (high Lab contrast vs both coat & arena)
    marker_near = (215, 242, 255)
    marker_far = (225, 185, 95)

    # Pre-build background gradient once for speed
    bg_template = np.zeros((height, width, 3), dtype=np.uint8)
    for y in range(int(ground_y)):
        alpha = y / ground_y
        col = sky_top * (1.0 - alpha) + sky_bot * alpha
        bg_template[y, :] = col.astype(np.uint8)
    bg_template[int(ground_y):, :] = sand_color
    cv2.rectangle(bg_template, (0, int(ground_y) - 42), (width, int(ground_y)), arena_wall, -1)
    cv2.line(bg_template, (0, int(ground_y)), (width, int(ground_y)), sand_dark, 4)

    for f in range(total_frames):
        t = f / float(fps)
        frame = bg_template.copy()

        # Subtle camera pan: arena fence posts scroll smoothly left as horse advances slightly right
        scroll_x = t * 240.0
        rail_y1 = int(ground_y) - 110
        rail_y2 = int(ground_y) - 62
        cv2.line(frame, (0, rail_y1), (width, rail_y1), fence_color, 4)
        cv2.line(frame, (0, rail_y2), (width, rail_y2), fence_color, 4)
        post_spacing = 180
        first_post = -(int(scroll_x) % post_spacing)
        for px in range(first_post, width + post_spacing, post_spacing):
            cv2.rectangle(frame, (px - 5, rail_y1 - 14), (px + 5, int(ground_y)), fence_color, -1)

        # Ground track pebbles/markers scrolling left
        for m in range(0, width + 120, 120):
            mx = (m - int(scroll_x * 1.15)) % (width + 120) - 60
            cv2.line(frame, (mx, int(ground_y) + 28), (mx + 22, int(ground_y) + 28), sand_dark, 2)

        # Subtle forward drift across frame (stays safely centered in [470..810])
        body_cx = 510.0 + 260.0 * (f / float(max(total_frames - 1, 1)))

        # Diagonal Trot phases:
        # Pair A: LF + RH at phase phi
        # Pair B: RF + LH at phase (phi + 0.5) % 1.0
        phi = (t * stride_freq_hz) % 1.0
        phi_a = phi
        phi_b = (phi + 0.5) % 1.0

        # Double-frequency vertical suspension/absorption oscillation (2 cycles per stride)
        # In screen coordinates (+y is downward):
        #   - During Stance (p < duty): body drops downward (+osc)
        #   - During Swing/Suspension (p >= duty): body rises upward (-osc)
        osc_a = math.sin(min(phi_a / duty, 1.0) * math.pi) if phi_a < duty else -0.72 * math.sin(((phi_a - duty) / (1.0 - duty)) * math.pi)
        osc_b = math.sin(min(phi_b / duty, 1.0) * math.pi) if phi_b < duty else -0.72 * math.sin(((phi_b - duty) / (1.0 - duty)) * math.pi)

        # Combine vertical oscillation from both diagonals
        if asymmetric_lame:
            # Left Hind (LH, Pair B) lameness:
            # Horse unloads LH during Pair B stance -> pronounced pelvic hike (croup drops less / hikes upward)
            # and mild compensatory head nod asymmetry on forelimb Pair B
            if phi_a < duty:
                pelvic_offset_y = 8.5 * osc_a
                withers_offset_y = 6.2 * osc_a
                poll_offset_y = 7.6 * osc_a
            else:
                # Pair B (RF + LH): reduced downward drop + pronounced upward pelvic hike (-y)
                pelvic_offset_y = 1.2 * osc_b - 10.2
                withers_offset_y = 6.0 * osc_b - 0.3
                poll_offset_y = 7.2 * osc_b - 0.4
        else:
            # Symmetric sound trot: balanced drop/rise on both diagonal pairs
            combined_osc = osc_a if phi_a < duty else osc_b
            pelvic_offset_y = 6.5 * combined_osc
            withers_offset_y = 6.0 * combined_osc
            poll_offset_y = 7.4 * combined_osc

        # Anatomical torso anchor points (facing right +x)
        withers = (body_cx + 42.0, 316.0 + withers_offset_y)
        hip = (body_cx - 94.0, 326.0 + pelvic_offset_y)
        chest = (body_cx + 76.0, 386.0 + withers_offset_y * 0.9)
        flank = (body_cx - 88.0, 392.0 + pelvic_offset_y * 0.9)

        # Neck & Head (facing right)
        poll = (body_cx + 148.0, 238.0 + poll_offset_y)
        nostrils = (body_cx + 216.0, 304.0 + poll_offset_y * 1.05)

        # Proximal limb roots (attached to torso)
        lf_shoulder = (body_cx + 68.0, 392.0 + withers_offset_y)
        rf_shoulder = (body_cx + 76.0, 390.0 + withers_offset_y)
        lh_stifle = (body_cx - 96.0, 396.0 + pelvic_offset_y)
        rh_stifle = (body_cx - 88.0, 394.0 + pelvic_offset_y)

        # Compute 4 limbs via trot IK
        stride_reach = 136.0
        lf = _limb_kinematics(phi_a, lf_shoulder, ground_y, is_fore=True, stride_reach_px=stride_reach, duty=duty, l1=74.0, l2=70.0)
        rf = _limb_kinematics(phi_b, rf_shoulder, ground_y, is_fore=True, stride_reach_px=stride_reach, duty=duty, l1=74.0, l2=70.0)
        lh = _limb_kinematics(
            phi_b,
            lh_stifle,
            ground_y,
            is_fore=False,
            stride_reach_px=stride_reach * (0.72 if asymmetric_lame else 1.0),
            duty=duty * (0.76 if asymmetric_lame else 1.0),
            l1=76.0,
            l2=72.0,
            lift_scale=0.68 if asymmetric_lame else 1.0,
        )
        rh = _limb_kinematics(phi_a, rh_stifle, ground_y, is_fore=False, stride_reach_px=stride_reach, duty=duty, l1=76.0, l2=72.0)

        # Soft ground shadow under horse
        cv2.ellipse(
            frame,
            (int(body_cx), int(ground_y) + 8),
            (130, 12),
            0,
            0,
            360,
            (78, 92, 108),
            -1,
            cv2.LINE_AA,
        )

        # 1. Draw FAR-side limbs first (RF, RH) for genuine depth layering
        for limb in (rf, rh):
            _draw_tapered_segment(frame, limb["root"], limb["mid"], 16, 10, far_coat)
            _draw_tapered_segment(frame, limb["mid"], limb["fetlock"], 9, 6, far_coat)
            _draw_tapered_segment(frame, limb["fetlock"], limb["hoof"], 6, 7, far_coat)
            cv2.circle(frame, (int(round(limb["hoof"][0])), int(round(limb["hoof"][1]))), 8, hoof_far, -1, cv2.LINE_AA)

        # 2. Flowing tail
        tail_root = (hip[0] - 28.0, hip[1] + 10.0)
        tail_sway = math.sin(phi * 2.0 * math.pi) * 10.0
        tail_pts = np.array(
            [
                [int(tail_root[0]), int(tail_root[1])],
                [int(tail_root[0] - 42), int(tail_root[1] + 34 + tail_sway * 0.4)],
                [int(tail_root[0] - 66), int(tail_root[1] + 84 + tail_sway)],
                [int(tail_root[0] - 46), int(tail_root[1] + 88 + tail_sway)],
                [int(tail_root[0] - 22), int(tail_root[1] + 38)],
            ],
            dtype=np.int32,
        )
        cv2.fillPoly(frame, [tail_pts], mane_tail, cv2.LINE_AA)

        # 3. Torso barrel + back + croup + shoulder
        barrel_pts = np.array(
            [
                [int(hip[0] - 28), int(hip[1] + 14)],
                [int(hip[0]), int(hip[1])],
                [int((hip[0] + withers[0]) * 0.5), int((hip[1] + withers[1]) * 0.5 + 8)],
                [int(withers[0]), int(withers[1])],
                [int(chest[0] + 18), int(chest[1] - 12)],
                [int(chest[0] + 6), int(chest[1] + 32)],
                [int(body_cx - 8), int(flank[1] + 28)],
                [int(flank[0] - 24), int(flank[1] + 14)],
            ],
            dtype=np.int32,
        )
        cv2.fillPoly(frame, [barrel_pts], near_coat, cv2.LINE_AA)
        # Smooth muscular ellipses for chest & hindquarters
        cv2.ellipse(frame, (int(body_cx - 6), int(366 + (withers_offset_y + pelvic_offset_y) * 0.5)), (92, 46), 0, 0, 360, near_coat, -1, cv2.LINE_AA)
        cv2.ellipse(frame, (int(hip[0] - 4), int(hip[1] + 36)), (44, 42), 0, 0, 360, near_coat, -1, cv2.LINE_AA)
        cv2.ellipse(frame, (int(withers[0] + 14), int(withers[1] + 44)), (38, 44), -12, 0, 360, near_coat, -1, cv2.LINE_AA)

        # 4. Neck, Mane, and Head
        neck_base = ((withers[0] + chest[0]) * 0.5 + 6.0, (withers[1] + chest[1]) * 0.5 + 4.0)
        _draw_tapered_segment(frame, neck_base, (poll[0] - 6.0, poll[1] + 14.0), 34, 18, near_coat)
        _draw_tapered_segment(frame, withers, poll, 16, 12, near_coat)
        # Mane strip
        cv2.line(
            frame,
            (int(withers[0] - 2), int(withers[1] - 4)),
            (int(poll[0] - 8), int(poll[1] - 2)),
            mane_tail,
            7,
            cv2.LINE_AA,
        )
        # Head & Ears
        _draw_tapered_segment(frame, poll, nostrils, 18, 9, near_coat)
        ear_pts = np.array(
            [
                [int(poll[0] - 8), int(poll[1] - 6)],
                [int(poll[0] + 2), int(poll[1] - 26)],
                [int(poll[0] + 8), int(poll[1] - 6)],
            ],
            dtype=np.int32,
        )
        cv2.fillConvexPoly(frame, ear_pts, near_coat, cv2.LINE_AA)

        # 5. Draw NEAR-side limbs (LF, LH) on top
        for limb in (lf, lh):
            _draw_tapered_segment(frame, limb["root"], limb["mid"], 17, 11, near_coat)
            _draw_tapered_segment(frame, limb["mid"], limb["fetlock"], 10, 6.5, near_coat)
            _draw_tapered_segment(frame, limb["fetlock"], limb["hoof"], 6.5, 7.5, near_coat)
            cv2.circle(frame, (int(round(limb["hoof"][0])), int(round(limb["hoof"][1]))), 8, hoof_near, -1, cv2.LINE_AA)

        # 6. Subtle anatomical reflective skin markers (standard equine gait-lab protocol)
        # Placed cleanly on the bony landmark centers inside the silhouette outline
        far_markers = [rf["root"], rf["mid"], rf["fetlock"], rf["hoof"], rh["root"], rh["mid"], rh["fetlock"], rh["hoof"]]
        near_markers = [
            (poll[0] - 2.0, poll[1] + 8.0),
            (nostrils[0] - 8.0, nostrils[1] + 1.0),
            (withers[0], withers[1] + 9.0),
            (hip[0], hip[1] + 9.0),
            lf["root"], lf["mid"], lf["fetlock"], lf["hoof"],
            lh["root"], lh["mid"], lh["fetlock"], lh["hoof"],
        ]
        for pt in far_markers:
            cv2.circle(frame, (int(round(pt[0])), int(round(pt[1]))), 3, marker_far, -1, cv2.LINE_AA)
        for pt in near_markers:
            cv2.circle(frame, (int(round(pt[0])), int(round(pt[1]))), 4, marker_near, -1, cv2.LINE_AA)

        writer.write(frame)

    writer.release()

    # Transcode with ffmpeg to H.264 + yuv420p + faststart for universal HTML5 <video> playback
    cmd = [
        "ffmpeg", "-y",
        "-i", str(raw_path),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-preset", "fast",
        "-crf", "20",
        str(output_path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        # If ffmpeg fails for any reason, keep mp4v output
        raw_path.replace(output_path)
    else:
        raw_path.unlink(missing_ok=True)

    return output_path


def ensure_demo_videos(assets_dir: Path) -> Dict[str, Path]:
    """Ensures both real demo horse trot videos exist in assets_dir."""
    assets_dir = Path(assets_dir)
    assets_dir.mkdir(parents=True, exist_ok=True)

    sym_path = assets_dir / "demo_horse_trot.mp4"
    asym_path = assets_dir / "demo_horse_asymmetry.mp4"

    if not sym_path.exists() or sym_path.stat().st_size < 10_000:
        generate_horse_trot_video(sym_path, asymmetric_lame=False)
    if not asym_path.exists() or asym_path.stat().st_size < 10_000:
        generate_horse_trot_video(asym_path, asymmetric_lame=True)

    return {"symmetric": sym_path, "asymmetry": asym_path}


if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent / "assets"
    paths = ensure_demo_videos(out_dir)
    for k, p in paths.items():
        print(f"Generated {k}: {p} ({p.stat().st_size} bytes)")
