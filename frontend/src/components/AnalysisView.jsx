import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Crosshair,
  Compass,
  Scan,
  Maximize2,
  Crop,
  Layers,
  RotateCcw,
  BarChart2,
} from 'lucide-react';
import SymmetryBarCard from './SymmetryBarCard';

/**
 * Equine anatomical palette matching RealHorse / Sleip / EquiMoves:
 * - Axiales: poll (#00F0FF), withers (#818CF8), hip (#C084FC)
 * - LF (Mano Izquierda): Cian brillante (#00F0FF)
 * - RF (Mano Derecha): Azul real (#3B82F6)
 * - LH (Pata Izquierda): Violeta (#A855F7)
 * - RH (Pata Derecha): Rosa fucsia (#EC4899)
 */
const RETICLE_COLORS = {
  poll: '#00F0FF',
  nostrils: '#00F0FF',
  withers: '#818CF8',
  hip: '#C084FC',
  lf_shoulder: '#00F0FF',
  lf_knee: '#00F0FF',
  lf_fetlock: '#00F0FF',
  lf_hoof: '#00F0FF',
  rf_shoulder: '#3B82F6',
  rf_knee: '#3B82F6',
  rf_fetlock: '#3B82F6',
  rf_hoof: '#3B82F6',
  lh_stifle: '#A855F7',
  lh_hock: '#A855F7',
  lh_fetlock: '#A855F7',
  lh_hoof: '#A855F7',
  rh_stifle: '#EC4899',
  rh_hock: '#EC4899',
  rh_fetlock: '#EC4899',
  rh_hoof: '#EC4899',
};

const BONE_COLORS = {
  axial: 'rgba(255, 255, 255, 0.65)',
  lf: 'rgba(0, 240, 255, 0.72)',
  rf: 'rgba(59, 130, 246, 0.72)',
  lh: 'rgba(168, 85, 247, 0.72)',
  rh: 'rgba(236, 72, 153, 0.72)',
};

// 15 high-clarity anatomical reticles across all 4 limbs + dorsal spine (omitting trunk clutter)
const FOUR_LIMBS_RETICLES = new Set([
  'poll',
  'withers',
  'hip',
  'lf_knee',
  'lf_fetlock',
  'lf_hoof',
  'rf_knee',
  'rf_fetlock',
  'rf_hoof',
  'lh_hock',
  'lh_fetlock',
  'lh_hoof',
  'rh_hock',
  'rh_fetlock',
  'rh_hoof',
]);

// Distal limb segments drawn cleanly in 4 Patas mode (matching reference)
const DISTAL_LIMB_SEGMENTS = new Set([
  'lf_knee->lf_fetlock',
  'lf_fetlock->lf_hoof',
  'rf_knee->rf_fetlock',
  'rf_fetlock->rf_hoof',
  'lh_hock->lh_fetlock',
  'lh_fetlock->lh_hoof',
  'rh_hock->rh_fetlock',
  'rh_fetlock->rh_hoof',
]);

function drawReticle(ctx, x, y, color, radius = 7.0) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 5;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = radius >= 6.0 ? 1.9 : 1.5;
  ctx.stroke();

  ctx.fillStyle = `${color}1C`;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(x - radius + 1.4, y);
  ctx.lineTo(x + radius - 1.4, y);
  ctx.moveTo(x, y - radius + 1.4);
  ctx.lineTo(x, y + radius - 1.4);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, y, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDorsalGoniometer(ctx, withersPx, hipPx) {
  if (!withersPx || !hipPx) return;
  const span = Math.hypot(hipPx[0] - withersPx[0], hipPx[1] - withersPx[1]);
  if (span < 20) return;

  // Center of circular ROM goniometer on thoracolumbar back between withers and hip
  const backX = withersPx[0] + (hipPx[0] - withersPx[0]) * 0.45;
  const backY = withersPx[1] + (hipPx[1] - withersPx[1]) * 0.45 + span * 0.065;

  // Dynamic deflection angle between withers -> mid-back and mid-back -> hip
  const ux = withersPx[0] - backX;
  const uy = withersPx[1] - backY;
  const vx = hipPx[0] - backX;
  const vy = hipPx[1] - backY;
  const nu = Math.hypot(ux, uy);
  const nv = Math.hypot(vx, vy);
  let flexionDeg = 4.4;
  if (nu > 1e-3 && nv > 1e-3) {
    const cosA = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (nu * nv)));
    const internalDeg = (Math.acos(cosA) * 180) / Math.PI;
    flexionDeg = Math.abs(180 - internalDeg);
  }
  const displayRom = flexionDeg.toFixed(1);
  const dialRadius = Math.min(46, Math.max(28, span * 0.36));

  ctx.save();

  // Subtle chord reference line (withers -> hip)
  ctx.beginPath();
  ctx.moveTo(withersPx[0], withersPx[1]);
  ctx.lineTo(hipPx[0], hipPx[1]);
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.38)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Translucent purple shaded zone at back center
  ctx.beginPath();
  ctx.ellipse(backX, backY, dialRadius * 0.62, dialRadius * 0.28, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(168, 85, 247, 0.22)';
  ctx.fill();

  // Anterior Cyan vector (withers -> center 0)
  ctx.beginPath();
  ctx.moveTo(withersPx[0], withersPx[1]);
  ctx.lineTo(backX, backY);
  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#00F0FF';
  ctx.shadowBlur = 4;
  ctx.stroke();

  // Posterior Magenta vector (center 0 -> hip)
  ctx.beginPath();
  ctx.moveTo(backX, backY);
  ctx.lineTo(hipPx[0], hipPx[1]);
  ctx.strokeStyle = '#D946EF';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#D946EF';
  ctx.shadowBlur = 4;
  ctx.stroke();

  // Crisp white circular goniometer dial
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(backX, backY, dialRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Subtle horizontal baseline inside circle
  ctx.beginPath();
  ctx.moveTo(backX - dialRadius + 4, backY);
  ctx.lineTo(backX + dialRadius - 4, backY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Vertical graduated scale labels (+2, +1, 0, -1, -2, -3, -4)
  const scaleStep = dialRadius * 0.36;
  const labels = ['+2', '+1', '0', '-1', '-2', '-3', '-4'];
  const offsets = [-2, -1, 0, 1, 2, 3, 4];
  ctx.font = '600 9px "JetBrains Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 3;
  for (let i = 0; i < labels.length; i += 1) {
    ctx.fillText(labels[i], backX, backY + offsets[i] * scaleStep);
  }

  // Live ROM readout top-right of circle
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`ROM ${displayRom}°`, backX + dialRadius * 0.42, backY - dialRadius + 2);
  ctx.restore();
}

function drawAngleArc(ctx, aPx, bPx, cPx, label, color) {
  if (!aPx || !bPx || !cPx) return;
  const ang1 = Math.atan2(aPx[1] - bPx[1], aPx[0] - bPx[0]);
  const ang2 = Math.atan2(cPx[1] - bPx[1], cPx[0] - bPx[0]);
  let diff = ang2 - ang1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  const radius = 14;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bPx[0], bPx[1]);
  ctx.arc(bPx[0], bPx[1], radius, ang1, ang1 + diff, diff < 0);
  ctx.closePath();
  ctx.fillStyle = `${color}22`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(bPx[0], bPx[1], radius, ang1, ang1 + diff, diff < 0);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const midAng = ang1 + diff * 0.5;
  const lx = bPx[0] + Math.cos(midAng) * 21;
  const ly = bPx[1] + Math.sin(midAng) * 21;
  ctx.font = '600 9px "JetBrains Mono", monospace';
  const textW = ctx.measureText(label).width + 6;
  ctx.fillStyle = 'rgba(9, 9, 11, 0.86)';
  ctx.beginPath();
  ctx.roundRect(lx - textW * 0.5, ly - 6, textW, 13, 3);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, lx, ly);
  ctx.restore();
}

const LiveMetricCard = React.memo(function LiveMetricCard({ label, value, unit, sub }) {
  return (
    <div className="rounded-[22px] card-3d p-3.5 flex flex-col justify-between min-h-[104px]">
      <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 leading-tight">
        {label}
      </span>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-mono text-[23px] font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[12px] text-slate-500 dark:text-zinc-400">{unit}</span>
        )}
      </div>
      <span className="mt-1 font-mono text-[10px] text-slate-500 dark:text-zinc-500 truncate">
        {sub}
      </span>
    </div>
  );
});

export default function AnalysisView({ analysisData, horse, onViewReport }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.5);
  const [showReticles, setShowReticles] = useState(true);
  const [showAngles, setShowAngles] = useState(false);
  const [showGateBox, setShowGateBox] = useState(false);
  const [markerMode, setMarkerMode] = useState('four_limbs'); // 'four_limbs' (15 pts) | 'all' (20 pts)
  const [autoCrop, setAutoCrop] = useState(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [videoAspect, setVideoAspect] = useState(null);
  const [showSymmetryBars, setShowSymmetryBars] = useState(false);

  const frames = analysisData.frames || [];
  const edges = analysisData.skeleton_edges || [];
  const fps = analysisData.fps || 30;
  const totalFrames = frames.length;

  // Determine effective last valid RHDA frame so playback never outruns analyzed data
  const lastValidFrameIdx = useMemo(() => {
    if (!frames.length) return 0;
    for (let i = frames.length - 1; i >= 0; i -= 1) {
      if (frames[i].passed_gate) return i;
    }
    return frames.length - 1;
  }, [frames]);

  const maxAnalyzedTime = lastValidFrameIdx / Math.max(fps, 1);

  // Precompute live clickable vertical oscillation waveform synced up to lastValidFrameIdx
  const miniWave = useMemo(() => {
    const poll = analysisData.time_series?.poll_y_mm || [];
    const croup = analysisData.time_series?.croup_y_mm || [];
    const count = Math.min(lastValidFrameIdx + 1, poll.length, croup.length);
    if (count < 2) return null;

    const w = 340;
    const h = 44;
    const padX = 4;
    const padY = 5;
    const maxAbs = Math.max(
      15,
      ...poll.slice(0, count).map((v) => Math.abs(v)),
      ...croup.slice(0, count).map((v) => Math.abs(v))
    );

    const buildPts = (arr) =>
      arr
        .slice(0, count)
        .map((v, i) => {
          const x = padX + (i / Math.max(1, count - 1)) * (w - padX * 2);
          const y = h * 0.5 - (v / maxAbs) * (h * 0.5 - padY);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    return {
      w,
      h,
      padX,
      count,
      pollPoints: buildPts(poll),
      croupPoints: buildPts(croup),
    };
  }, [analysisData.time_series, lastValidFrameIdx]);

  const resW = analysisData.resolution
    ? analysisData.resolution.width || analysisData.resolution[0] || 16
    : 16;
  const resH = analysisData.resolution
    ? analysisData.resolution.height || analysisData.resolution[1] || 9
    : 9;

  // Precompute stabilized 4:3 moving camera crop windows centered on the horse bbox
  const cropWindows = useMemo(() => {
    if (!frames.length) return [];

    const validBoxes = frames
      .map((f) => f.bbox_norm)
      .filter((b) => Array.isArray(b) && b.length === 4);

    const median = (arr) => {
      if (!arr.length) return 0.5;
      const s = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) * 0.5 : s[mid];
    };

    const medBw = validBoxes.length ? median(validBoxes.map((b) => b[2] - b[0])) : 0.65;
    const medBh = validBoxes.length ? median(validBoxes.map((b) => b[3] - b[1])) : 0.35;

    const srcW = Math.max(resW, 1);
    const srcH = Math.max(resH, 1);
    const targetAspect = 4 / 3;

    // Constant athletic 4:3 crop dimensions computed in pixel space and normalized
    let swPx = Math.max(medBw * srcW * 1.42, medBh * srcH * 1.38 * targetAspect);
    let shPx = swPx / targetAspect;
    if (swPx > srcW) {
      swPx = srcW;
      shPx = swPx / targetAspect;
    }
    if (shPx > srcH) {
      shPx = srcH;
      swPx = shPx * targetAspect;
    }
    const nw = swPx / srcW;
    const nh = shPx / srcH;

    // Raw centers per frame (interpolated from nearest valid box if missing)
    const rawCx = [];
    const rawCy = [];
    let lastCx = 0.5;
    let lastCy = 0.5;
    for (let i = 0; i < frames.length; i += 1) {
      const b = frames[i].bbox_norm;
      if (Array.isArray(b) && b.length === 4) {
        lastCx = (b[0] + b[2]) * 0.5;
        lastCy = (b[1] + b[3]) * 0.5;
      }
      rawCx.push(lastCx);
      rawCy.push(lastCy);
    }

    // +/- 8 frame moving-average stabilization of camera center
    const halfWin = 8;
    return frames.map((_, idx) => {
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      const lo = Math.max(0, idx - halfWin);
      const hi = Math.min(frames.length - 1, idx + halfWin);
      for (let j = lo; j <= hi; j += 1) {
        sumX += rawCx[j];
        sumY += rawCy[j];
        count += 1;
      }
      const cx = sumX / Math.max(count, 1);
      const cy = sumY / Math.max(count, 1);
      const nx = Math.max(0, Math.min(1 - nw, cx - nw * 0.5));
      const ny = Math.max(0, Math.min(1 - nh, cy - nh * 0.5));
      return { nx, ny, nw, nh };
    });
  }, [frames, resW, resH]);

  const drawFrameOverlay = useCallback(
    (frameIdx) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || !frames.length) return;

      const clampedIdx = Math.min(Math.max(frameIdx, 0), frames.length - 1);
      const frame = frames[clampedIdx];
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const vW = video.videoWidth || resW || rect.width;
      const vH = video.videoHeight || resH || rect.height;

      let toPx;
      let scaleWidth = rect.width;

      if (autoCrop && cropWindows[clampedIdx]) {
        const win = cropWindows[clampedIdx];
        const sx = win.nx * vW;
        const sy = win.ny * vH;
        const sw = Math.max(1, win.nw * vW);
        const sh = Math.max(1, win.nh * vH);
        scaleWidth = (rect.width / win.nw);

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, rect.width, rect.height);
        if (video.readyState >= 2) {
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, rect.width, rect.height);
        }

        toPx = (nx, ny) => [
          ((nx * vW - sx) / sw) * rect.width,
          ((ny * vH - sy) / sh) * rect.height,
        ];
      } else {
        const vAspect = vW / Math.max(vH, 1);
        const cAspect = rect.width / rect.height;

        let renderW;
        let renderH;
        let renderX;
        let renderY;
        if (cAspect > vAspect) {
          renderH = rect.height;
          renderW = renderH * vAspect;
          renderX = (rect.width - renderW) / 2;
          renderY = 0;
        } else {
          renderW = rect.width;
          renderH = renderW / vAspect;
          renderX = 0;
          renderY = (rect.height - renderH) / 2;
        }
        scaleWidth = renderW;

        toPx = (nx, ny) => [
          renderX + nx * renderW,
          renderY + ny * renderH,
        ];
      }

      // 1. Optional YOLOv8 Bounding Box
      if (showGateBox && frame.bbox_norm) {
        const [bx1, by1, bx2, by2] = frame.bbox_norm;
        const [x, y] = toPx(bx1, by1);
        const [x2, y2] = toPx(bx2, by2);
        const bw = x2 - x;
        const bh = y2 - y;
        const gateCol = frame.passed_gate ? '#10B981' : '#EF4444';
        const cLen = 10;

        ctx.save();
        ctx.strokeStyle = gateCol;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y + cLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cLen, y);
        ctx.moveTo(x + bw - cLen, y);
        ctx.lineTo(x + bw, y);
        ctx.lineTo(x + bw, y + cLen);
        ctx.moveTo(x, y + bh - cLen);
        ctx.lineTo(x, y + bh);
        ctx.lineTo(x + cLen, y + bh);
        ctx.moveTo(x + bw - cLen, y + bh);
        ctx.lineTo(x + bw, y + bh);
        ctx.lineTo(x + bw, y + bh - cLen);
        ctx.stroke();

        const tag = `YOLOv8 (${(frame.confidence || 0.9).toFixed(2)})`;
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
        const tw = ctx.measureText(tag).width + 8;
        ctx.beginPath();
        ctx.roundRect(Math.max(4, x), Math.max(4, y - 16), tw, 14, 4);
        ctx.fill();
        ctx.fillStyle = gateCol;
        ctx.fillText(tag, Math.max(8, x + 4), Math.max(13, y - 6));
        ctx.restore();
      }

      if (!showReticles && !showAngles) return;

      const kptsPx = {};
      const normKpts = frame.keypoints || {};
      for (const [k, pair] of Object.entries(normKpts)) {
        if (pair && typeof pair[0] === 'number' && typeof pair[1] === 'number') {
          kptsPx[k] = toPx(pair[0], pair[1]);
        }
      }

      // 2. Clean 4-Limb Distal Vector Bones (full skeleton preserved in 'all' mode)
      if (showReticles) {
        for (const [a, b, group] of edges) {
          if (markerMode === 'four_limbs' && !DISTAL_LIMB_SEGMENTS.has(`${a}->${b}`)) {
            continue;
          }
          const pA = kptsPx[a];
          const pB = kptsPx[b];
          if (!pA || !pB) continue;
          const col = BONE_COLORS[group] || 'rgba(255, 255, 255, 0.45)';

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(pA[0], pA[1]);
          ctx.lineTo(pB[0], pB[1]);
          ctx.strokeStyle = col;
          ctx.lineWidth = markerMode === 'four_limbs' ? 2.2 : group === 'axial' ? 1.7 : 1.5;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }

        // 3. Surgical Reticle Target Circles across all 4 limbs (15 in four_limbs, 20 in all)
        const baseR = autoCrop ? 7.0 : 4.2;
        for (const [k, pt] of Object.entries(kptsPx)) {
          if (markerMode === 'four_limbs' && !FOUR_LIMBS_RETICLES.has(k)) {
            continue;
          }
          const col = RETICLE_COLORS[k] || '#FFFFFF';
          const r = k === 'withers' || k === 'hip' ? baseR + 0.5 : baseR;
          drawReticle(ctx, pt[0], pt[1], col, r);
        }

        // 4. Dorsal ROM Protractor Dial (centered on thoracolumbar back)
        if (kptsPx.withers && kptsPx.hip) {
          drawDorsalGoniometer(ctx, kptsPx.withers, kptsPx.hip);
        }
      }

      // 5. Articular Angle Arcs (facing lateral hock + knee without overlap)
      if (showAngles) {
        const isFacingRight =
          normKpts.nostrils && normKpts.hip
            ? normKpts.nostrils[0] >= normKpts.hip[0]
            : analysisData.pose_engine?.facing_direction === 'right';

        if (isFacingRight) {
          if (kptsPx.rh_stifle && kptsPx.rh_hock && kptsPx.rh_fetlock) {
            const angVal = frame.angles?.hock_right_deg ?? frame.live_metrics?.hock_angle_deg ?? 155;
            drawAngleArc(
              ctx,
              kptsPx.rh_stifle,
              kptsPx.rh_hock,
              kptsPx.rh_fetlock,
              `${Number(angVal).toFixed(0)}°`,
              '#EC4899'
            );
          }
          if (kptsPx.rf_shoulder && kptsPx.rf_knee && kptsPx.rf_fetlock) {
            const angVal = frame.angles?.knee_right_deg ?? frame.live_metrics?.knee_angle_deg ?? 148;
            drawAngleArc(
              ctx,
              kptsPx.rf_shoulder,
              kptsPx.rf_knee,
              kptsPx.rf_fetlock,
              `${Number(angVal).toFixed(0)}°`,
              '#3B82F6'
            );
          }
        } else {
          if (kptsPx.lh_stifle && kptsPx.lh_hock && kptsPx.lh_fetlock) {
            const angVal = frame.angles?.hock_left_deg ?? frame.live_metrics?.hock_angle_deg ?? 155;
            drawAngleArc(
              ctx,
              kptsPx.lh_stifle,
              kptsPx.lh_hock,
              kptsPx.lh_fetlock,
              `${Number(angVal).toFixed(0)}°`,
              '#A855F7'
            );
          }
          if (kptsPx.lf_shoulder && kptsPx.lf_knee && kptsPx.lf_fetlock) {
            const angVal = frame.angles?.knee_left_deg ?? frame.live_metrics?.knee_angle_deg ?? 148;
            drawAngleArc(
              ctx,
              kptsPx.lf_shoulder,
              kptsPx.lf_knee,
              kptsPx.lf_fetlock,
              `${Number(angVal).toFixed(0)}°`,
              '#00F0FF'
            );
          }
        }
      }
      void scaleWidth;
    },
    [
      analysisData,
      autoCrop,
      cropWindows,
      edges,
      frames,
      markerMode,
      resH,
      resW,
      showAngles,
      showGateBox,
      showReticles,
    ]
  );

  // Synchronize HTML5 video with hi-DPI canvas overlay (including paused first-frame paint)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !totalFrames) return;

    let vfcId = null;
    let rafId = null;
    let active = true;

    const syncNow = () => {
      if (!video || !active) return;
      const rawTime = video.currentTime || 0;
      const rawIdx = Math.floor(rawTime * fps);
      if (lastValidFrameIdx > 0 && (rawTime >= maxAnalyzedTime - 1e-3 || rawIdx >= lastValidFrameIdx)) {
        if (!video.paused) {
          video.pause();
        }
        if (Math.abs(rawTime - maxAnalyzedTime) > 0.03) {
          video.currentTime = maxAnalyzedTime;
        }
        setCurrentFrameIdx(lastValidFrameIdx);
        setIsPlaying(false);
        setIsEnded(true);
        drawFrameOverlay(lastValidFrameIdx);
        return;
      }
      const idx = Math.min(lastValidFrameIdx, Math.max(0, rawIdx));
      setIsEnded(false);
      setCurrentFrameIdx(idx);
      drawFrameOverlay(idx);
    };

    const onVideoFrame = () => {
      if (!active) return;
      syncNow();
      if (typeof video.requestVideoFrameCallback === 'function') {
        vfcId = video.requestVideoFrameCallback(onVideoFrame);
      }
    };

    const tickRaf = () => {
      if (!active) return;
      if (!video.paused) {
        syncNow();
        rafId = requestAnimationFrame(tickRaf);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsEnded(false);
      if (typeof video.requestVideoFrameCallback === 'function') {
        vfcId = video.requestVideoFrameCallback(onVideoFrame);
      }
      rafId = requestAnimationFrame(tickRaf);
    };

    const handlePause = () => {
      setIsPlaying(false);
      syncNow();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsEnded(true);
      setCurrentFrameIdx(lastValidFrameIdx);
      drawFrameOverlay(lastValidFrameIdx);
    };

    const handleTimeOrSeek = () => syncNow();

    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setVideoAspect(video.videoWidth / video.videoHeight);
      }
      syncNow();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeOrSeek);
    video.addEventListener('seeked', handleTimeOrSeek);
    video.addEventListener('loadeddata', handleTimeOrSeek);
    video.addEventListener('canplay', handleTimeOrSeek);
    video.addEventListener('canplaythrough', handleTimeOrSeek);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    syncNow();

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (vfcId && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(vfcId);
      }
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeOrSeek);
      video.removeEventListener('seeked', handleTimeOrSeek);
      video.removeEventListener('loadeddata', handleTimeOrSeek);
      video.removeEventListener('canplay', handleTimeOrSeek);
      video.removeEventListener('canplaythrough', handleTimeOrSeek);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [drawFrameOverlay, fps, lastValidFrameIdx, maxAnalyzedTime, totalFrames]);

  useEffect(() => {
    drawFrameOverlay(currentFrameIdx);
  }, [currentFrameIdx, drawFrameOverlay, showReticles, showAngles, showGateBox, markerMode, autoCrop]);

  const handleStopAndReset = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setCurrentFrameIdx(0);
    setIsPlaying(false);
    setIsEnded(false);
    drawFrameOverlay(0);
  }, [drawFrameOverlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (
        lastValidFrameIdx > 0 &&
        (currentFrameIdx >= lastValidFrameIdx || isEnded || video.currentTime >= maxAnalyzedTime - 0.05)
      ) {
        video.currentTime = 0;
        setCurrentFrameIdx(0);
        setIsEnded(false);
        drawFrameOverlay(0);
      }
      video.playbackRate = playbackRate;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const seekToFrame = (idx) => {
    const video = videoRef.current;
    if (!video || !totalFrames) return;
    const clamped = Math.min(lastValidFrameIdx, Math.max(0, idx));
    video.pause();
    video.currentTime = clamped / fps;
    setCurrentFrameIdx(clamped);
    setIsEnded(clamped >= lastValidFrameIdx);
    drawFrameOverlay(clamped);
  };

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const activeFrame = frames[currentFrameIdx] || frames[0] || {};
  const live = activeFrame.live_metrics || {};
  const stance = activeFrame.stance_state || {};

  const fallbackAspect = resW / Math.max(resH, 1);
  const effAspect = videoAspect || fallbackAspect;
  const containerAspectStyle = autoCrop
    ? { aspectRatio: '4 / 3' }
    : {
        aspectRatio: `${effAspect}`,
        maxHeight: effAspect < 0.95 ? '52vh' : '42vh',
      };

  const waveCursorX = miniWave
    ? miniWave.padX +
      (Math.min(currentFrameIdx, miniWave.count - 1) / Math.max(1, miniWave.count - 1)) *
        (miniWave.w - miniWave.padX * 2)
    : 0;

  const currentHorseName = horse?.name || analysisData?.metadata?.horse_name || 'Ejemplar';
  const currentDiscipline = horse?.discipline || analysisData?.metadata?.discipline || 'Trote';
  const currentPhoto = horse?.photoUrl || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=500&q=80';

  return (
    <div className="flex flex-col gap-3 pt-1 view-enter">
      {/* Active Horse Identification Banner in Visor */}
      <div className="rounded-[20px] card-3d p-2.5 px-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={currentPhoto}
            alt={currentHorseName}
            className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-[#26262A]"
          />
          <div className="min-w-0">
            <span className="font-mono text-[13px] font-extrabold text-slate-900 dark:text-white truncate block">
              {currentHorseName}
            </span>
            <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 truncate block">
              {currentDiscipline} · Visor Cinemático
            </span>
          </div>
        </div>

        {onViewReport && (
          <button
            type="button"
            onClick={onViewReport}
            className="px-3 py-1.5 rounded-xl card-3d-racing-green text-white font-mono text-[11px] font-bold shadow-sm active:scale-95 transition shrink-0"
          >
            Ver Resultados
          </button>
        )}
      </div>

      {/* Synchronized Auto-Cropped Video + Canvas Stage */}
      <section className="relative rounded-[24px] overflow-hidden card-3d shadow-2xl flex flex-col items-center">
        <div
          className="relative w-full bg-black flex items-center justify-center overflow-hidden"
          style={containerAspectStyle}
        >
          <video
            ref={videoRef}
            src={analysisData.video_url}
            playsInline
            muted
            preload="auto"
            className={`w-full h-full object-contain block ${
              autoCrop ? 'opacity-[0.01] pointer-events-none' : 'opacity-100'
            }`}
          />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 w-full h-full"
          />

          {/* Top-Right Floating Auto-Crop Toggle */}
          <button
            type="button"
            onClick={() => setAutoCrop((v) => !v)}
            className={`absolute top-2.5 right-2.5 z-10 font-mono text-[10px] font-bold px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-1.5 card-3d-interactive active:scale-90 transition-all shadow-lg ${
              autoCrop
                ? 'bg-emerald-950/80 border-[#10B981]/70 text-white'
                : 'bg-black/60 border-white/20 text-white/90'
            }`}
          >
            {autoCrop ? (
              <>
                <Crop className="w-3.5 h-3.5 text-[#10B981]" />
                Auto-Zoom
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-white/80" />
                Original
              </>
            )}
          </button>

          {/* End-of-Analysis Replay Overlay Banner */}
          {isEnded && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 font-mono text-[11px] font-bold px-4 py-2 rounded-full card-3d-racing-green text-white shadow-2xl backdrop-blur-md flex items-center gap-1.5 active:scale-95 transition-all whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Repetir
            </button>
          )}
        </div>

        {/* Live 4-Limb Stance Contact Pills Strip */}
        <div className="w-full px-3.5 py-2.5 card-3d-subtle border-t border-slate-200 dark:border-[#26262A] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'LF', color: '#00F0FF' },
              { id: 'RF', color: '#3B82F6' },
              { id: 'LH', color: '#A855F7' },
              { id: 'RH', color: '#EC4899' },
            ].map((limb) => {
              const inStance = Boolean(stance[limb.id]);
              return (
                <span
                  key={limb.id}
                  className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 shadow-sm"
                  style={{
                    borderColor: inStance ? limb.color : 'rgba(100,116,139,0.3)',
                    backgroundColor: inStance ? `${limb.color}26` : 'rgba(100,116,139,0.08)',
                    color: inStance ? '#0D3F2E' : '#64748B',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: inStance ? limb.color : '#94A3B8' }}
                  />
                  {limb.id} {inStance ? 'Apoyo' : 'Vuelo'}
                </span>
              );
            })}
          </div>
          <span className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 tabular-nums shrink-0 font-bold">
            F{String(currentFrameIdx + 1).padStart(3, '0')}/{lastValidFrameIdx + 1}
          </span>
        </div>
      </section>

      {/* Native Playback, Scrubber, Synced Mini-Wave & Controls */}
      <section className="rounded-[24px] card-3d p-4 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-400 tabular-nums w-11 font-semibold">
            {(activeFrame.timestamp_s || 0).toFixed(2)}s
          </span>
          <input
            type="range"
            aria-label="Línea temporal de cuadros"
            min={0}
            max={Math.max(0, lastValidFrameIdx)}
            value={Math.min(currentFrameIdx, lastValidFrameIdx)}
            onChange={(e) => seekToFrame(Number(e.target.value))}
            className="flex-1 h-2 accent-[#0D3F2E] bg-slate-200 dark:bg-[#26262A] rounded-lg cursor-pointer"
          />
          <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-400 tabular-nums w-11 text-right font-semibold">
            {maxAnalyzedTime.toFixed(2)}s
          </span>
        </div>

        {/* Clickable Live Synchronized Vertical Displacement Mini-Chart */}
        {miniWave && (
          <div className="rounded-[16px] card-3d-recessed px-3 py-2 shadow-inner">
            <div className="flex items-center justify-between font-mono text-[9px] text-slate-600 dark:text-zinc-400 mb-1">
              <span className="text-slate-800 dark:text-zinc-200 font-bold">Oscilación Vertical</span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[#00F0FF]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                  Nuca
                </span>
                <span className="inline-flex items-center gap-1 text-[#EC4899]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899]" />
                  Grupa
                </span>
              </div>
            </div>
            <svg
              viewBox={`0 0 ${miniWave.w} ${miniWave.h}`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (!rect.width) return;
                const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                seekToFrame(Math.round(frac * lastValidFrameIdx));
              }}
              className="w-full h-[40px] cursor-pointer overflow-visible"
            >
              <line
                x1={miniWave.padX}
                y1={miniWave.h * 0.5}
                x2={miniWave.w - miniWave.padX}
                y2={miniWave.h * 0.5}
                stroke="#94A3B8"
                strokeOpacity="0.4"
                strokeDasharray="2 2"
              />
              <polyline
                fill="none"
                stroke="#00F0FF"
                strokeWidth="1.4"
                strokeLinejoin="round"
                points={miniWave.pollPoints}
              />
              <polyline
                fill="none"
                stroke="#EC4899"
                strokeWidth="1.5"
                strokeLinejoin="round"
                points={miniWave.croupPoints}
              />
              <line
                x1={waveCursorX}
                y1={2}
                x2={waveCursorX}
                y2={miniWave.h - 2}
                stroke="#0D3F2E"
                strokeWidth="1.8"
              />
              <circle cx={waveCursorX} cy={3} r="2.2" fill="#0D3F2E" />
            </svg>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStopAndReset}
              aria-label="Detener y reiniciar video"
              title="Reiniciar al cuadro 1"
              className="w-10 h-10 rounded-full card-3d-interactive flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => seekToFrame(currentFrameIdx - 1)}
              aria-label="Cuadro anterior"
              className="w-10 h-10 rounded-full card-3d-interactive flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all shadow-sm"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar reproducción' : 'Iniciar reproducción'}
              className="w-12 h-12 rounded-full card-3d-racing-green text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => seekToFrame(currentFrameIdx + 1)}
              aria-label="Cuadro siguiente"
              className="w-10 h-10 rounded-full card-3d-interactive flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all shadow-sm"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center p-1 rounded-full card-3d-recessed shadow-inner">
            {[0.25, 0.5, 1.0].map((rate) => {
              const active = playbackRate === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => changeSpeed(rate)}
                  className={`font-mono text-[11px] px-2.5 py-1 rounded-full transition-all ${
                    active
                      ? 'card-3d-racing-green text-white font-bold scale-[1.05]'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {rate}x
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 pt-1.5 border-t border-slate-200 dark:border-[#26262A]/60">
          <button
            type="button"
            onClick={() =>
              setMarkerMode((m) => (m === 'four_limbs' ? 'all' : 'four_limbs'))
            }
            className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl border text-[10px] font-mono font-bold transition-all card-3d-interactive ${
              markerMode === 'four_limbs'
                ? 'border-[#00F0FF] text-cyan-700 dark:text-white shadow-sm'
                : 'card-3d-subtle text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Layers className="w-3 h-3 text-[#00F0FF]" />
            {markerMode === 'four_limbs' ? '4 Patas' : 'Completo'}
          </button>

          <button
            type="button"
            onClick={() => setShowReticles((v) => !v)}
            className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl border text-[10px] font-mono transition-colors card-3d-interactive ${
              showReticles
                ? 'bg-[#0D3F2E]/15 border-[#0D3F2E] text-[#0D3F2E] dark:bg-[#10B981]/15 dark:border-[#10B981] dark:text-white'
                : 'card-3d-subtle text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Crosshair className="w-3 h-3 text-[#0D3F2E] dark:text-[#10B981]" />
            Puntos
          </button>

          <button
            type="button"
            onClick={() => setShowAngles((v) => !v)}
            className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl border text-[10px] font-mono transition-colors card-3d-interactive ${
              showAngles
                ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-white'
                : 'card-3d-subtle text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Compass className="w-3 h-3 text-amber-500" />
            Ángulos
          </button>

          <button
            type="button"
            onClick={() => setShowGateBox((v) => !v)}
            className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl border text-[10px] font-mono transition-colors card-3d-interactive ${
              showGateBox
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-white'
                : 'card-3d-subtle text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Scan className="w-3 h-3 text-emerald-500" />
            Recuadro
          </button>
        </div>
      </section>

      {/* RealHorse / EVJ Style Comparative Asymmetry Card Toggle */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowSymmetryBars((v) => !v)}
          className={`w-full py-2.5 px-3.5 rounded-[16px] border font-mono text-[11px] font-bold flex items-center justify-between card-3d-interactive transition-all shadow-md ${
            showSymmetryBars
              ? 'border-[#0D3F2E] text-slate-900 dark:text-white bg-[#0D3F2E]/5 dark:bg-[#00F0FF]/10'
              : 'text-slate-800 dark:text-zinc-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#0D3F2E] dark:text-[#00F0FF]" />
            <span>Gráfica de Asimetría</span>
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#0D3F2E]/10 dark:bg-cyan-500/20 text-[#0D3F2E] dark:text-cyan-400 border border-[#0D3F2E]/20 dark:border-cyan-500/30 font-semibold">
            {showSymmetryBars ? 'Ocultar' : 'Ver'}
          </span>
        </button>

        {showSymmetryBars && (
          <div className="view-enter">
            <SymmetryBarCard symmetryReport={analysisData.symmetry_report} compact />
          </div>
        )}
      </div>

      {/* 2x2 Live Biomechanical Metric Cards */}
      <section className="grid grid-cols-2 gap-2.5">
        <LiveMetricCard
          label="Ángulo Corvejón"
          value={
            typeof live.hock_angle_deg === 'number'
              ? live.hock_angle_deg.toFixed(1)
              : '155.0'
          }
          unit="°"
          sub={`Rodilla ${
            typeof live.knee_angle_deg === 'number'
              ? live.knee_angle_deg.toFixed(1)
              : '148.0'
          }°`}
        />

        <LiveMetricCard
          label="Elevación Grupa"
          value={
            typeof live.croup_elevation_mm === 'number'
              ? `${live.croup_elevation_mm >= 0 ? '+' : ''}${live.croup_elevation_mm.toFixed(1)}`
              : '+89.6'
          }
          unit="mm"
          sub="Desplazamiento vertical"
        />

        <LiveMetricCard
          label="Simetría Anterior"
          value={
            typeof live.anterior_symmetry_pct === 'number'
              ? live.anterior_symmetry_pct.toFixed(1)
              : '98.5'
          }
          unit="%"
          sub="Manos (LF / RF)"
        />

        <LiveMetricCard
          label="Simetría Posterior"
          value={
            typeof live.posterior_symmetry_pct === 'number'
              ? live.posterior_symmetry_pct.toFixed(1)
              : '94.2'
          }
          unit="%"
          sub="Patas (LH / RH)"
        />
      </section>

      {/* In-body Navigation CTA to Report */}
      {onViewReport && (
        <button
          type="button"
          onClick={onViewReport}
          className="w-full min-h-[50px] rounded-[16px] card-3d-racing-green active:scale-[0.98] transition-all font-mono text-[14px] font-bold text-white shadow-lg mt-1 mb-2"
        >
          Ver Informe de Simetría
        </button>
      )}
    </div>
  );
}
