import React, { useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Footprints,
  MoveHorizontal,
} from 'lucide-react';
import AIClinicalReport from './AIClinicalReport';
import SymmetryBarCard from './SymmetryBarCard';
import ProgressTracker from './ProgressTracker';
import HorseEvolutionChart from './HorseEvolutionChart';

const LIMB_ACCENTS = {
  LF: '#00F0FF',
  RF: '#3B82F6',
  LH: '#A855F7',
  RH: '#EC4899',
};

const LimbBreakdownCard = React.memo(function LimbBreakdownCard({ code, limb }) {
  const item = limb || {};
  const accent = LIMB_ACCENTS[code] || item.badge_color || '#10B981';
  return (
    <div className="rounded-[22px] card-3d-interactive p-3.5 flex flex-col justify-between gap-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border shrink-0"
            style={{
              borderColor: accent,
              backgroundColor: `${accent}20`,
              color: accent,
            }}
          >
            {code}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[12px] font-bold text-slate-900 dark:text-white truncate">
              {item.label_es || code}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
              {item.joint_name || 'Articulación'}
            </p>
          </div>
        </div>
        <span
          className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums shrink-0"
          style={{
            backgroundColor: `${item.badge_color || '#10B981'}22`,
            color: item.badge_color || '#10B981',
          }}
        >
          SI {item.si_pct ?? 100}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200 dark:border-[#26262A]/80">
        <div>
          <span className="block text-[10px] text-slate-500 dark:text-zinc-500">Apoyo / Vuelo</span>
          <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-white tabular-nums">
            {Math.round(item.stance_ms ?? 0)} / {Math.round(item.swing_ms ?? 0)} ms
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] text-slate-500 dark:text-zinc-500">Duty Factor</span>
          <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
            {item.stance_pct ?? 50}%
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 dark:text-zinc-500">Protr. / Retr.</span>
          <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
            +{item.protraction_deg ?? 0}° / -{item.retraction_deg ?? 0}°
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] text-slate-500 dark:text-zinc-500">Elev. Casco</span>
          <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
            {item.max_clearance_mm ?? 0} mm
          </span>
        </div>
      </div>

      <div className="pt-1 border-t border-slate-200 dark:border-[#26262A]/60 flex items-center justify-between text-[10px]">
        <span className="text-slate-500 dark:text-zinc-500">ROM Articular</span>
        <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300 tabular-nums">
          {item.min_angle_deg ?? 0}°–{item.max_angle_deg ?? 0}° ({item.rom_deg ?? 0}°)
        </span>
      </div>
    </div>
  );
});

/**
 * Screen 3: ReportView (Diagnóstico Biomecánico)
 * - Global Score (0-100) SVG ring + veterinary traffic-light badge
 * - Vertical Oscillation Waveforms (Head Nod & Pelvic Hike/Drop)
 * - Section A: Hildebrand Footfall Gait Sequence Diagram
 * - Section B: Pendular Protraction vs Retraction & Hoof Clearance Bars
 * - Section C: RealHorse Front vs Hind Asymmetry Comparative Bar Card
 * - Section D: Follow the Progress Longitudinal Baseline Tracker
 * - Section E: AI Sports Veterinary Clinical Report & Rehabilitation Plan (DeepSeek V3)
 */
export default function ReportView({
  analysisData,
  horse,
  sessions = [],
  onSelectSession,
  onBackToVisor,
  onRequireAuth,
}) {
  const sym = analysisData?.symmetry_report || {};
  const kin = analysisData?.kinematics_summary || {};
  const gate = analysisData?.quality_gate || {};
  const limbs = analysisData?.limbs || analysisData?.limb_kinematics || {};
  const ts = analysisData?.time_series || {};
  const meta = analysisData?.metadata || {};

  const currentHorseName = horse?.name || meta.horse_name || 'Ejemplar';
  const currentDiscipline = horse?.discipline || meta.discipline || 'Salto / Deporte';
  const currentBreed = horse?.breed || 'Raza registrada';
  const currentDate = meta.date || meta.evaluation_timestamp || 'Sesión de Evaluación';
  const currentPhoto = horse?.photoUrl || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=500&q=80';

  const score = Math.round(sym.global_score ?? sym.symmetry_score ?? 88);
  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - score / 100);
  const badgeColor = sym.badge_color || '#10B981';

  // Vertical oscillation geometry for SVG polyline
  const waveGeometry = useMemo(() => {
    const pollDisp = ts?.poll_disp_mm || [];
    const croupDisp = ts?.croup_disp_mm || [];
    const len = Math.max(pollDisp.length, croupDisp.length);
    if (!len) return null;

    const w = 340;
    const h = 100;
    const pad = 8;
    const midY = h / 2;

    const allVals = [...pollDisp, ...croupDisp];
    const maxAbs = Math.max(20, ...allVals.map((v) => Math.abs(v || 0)));
    const scaleY = (h / 2 - pad) / maxAbs;

    const toPoints = (arr) =>
      arr
        .map((val, idx) => {
          const x = pad + (idx / (len - 1 || 1)) * (w - pad * 2);
          const y = midY - (val || 0) * scaleY;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    return {
      w,
      h,
      pollPoints: toPoints(pollDisp),
      croupPoints: toPoints(croupDisp),
      maxAbs: Math.round(maxAbs),
    };
  }, [ts]);

  const totalFrames = ts?.timestamps_s?.length || 1;

  // Maximum pendular excursion across limbs for proportional bidirectional bars
  const maxPendularAngle = useMemo(() => {
    const vals = ['LF', 'RF', 'LH', 'RH'].flatMap((c) => [
      limbs?.[c]?.protraction_deg ?? 0,
      limbs?.[c]?.retraction_deg ?? 0,
    ]);
    return Math.max(25, ...vals);
  }, [limbs]);

  const StatusIcon =
    sym.status === 'optimal'
      ? CheckCircle2
      : sym.status === 'mild'
      ? AlertCircle
      : ShieldAlert;

  return (
    <div className="flex flex-col gap-3.5 pt-1 view-enter">
      {/* Active Horse Identification Banner */}
      <section className="rounded-[26px] card-3d p-3.5 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={currentPhoto}
            alt={currentHorseName}
            className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-extrabold text-[#071B24] dark:text-white truncate">
                {currentHorseName}
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EEF4F2] dark:bg-[#0F1619] text-[#0F3D44] dark:text-[#00D1C2] font-bold shrink-0">
                {currentDiscipline}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
              {currentBreed} · {currentDate}
            </p>
          </div>
        </div>

        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}
        >
          {sym.badge_label || 'Evaluado'}
        </span>
      </section>

      {/* Clinical Symmetry Ring Summary */}
      <section className="rounded-[26px] card-3d p-4 flex items-center gap-4">
        <div className="relative w-[84px] h-[84px] shrink-0 flex items-center justify-center">
          <svg width="84" height="84" viewBox="0 0 88 88" className="-rotate-90">
            <circle
              cx="44"
              cy="44"
              r={ringRadius}
              className="stroke-[#E9EFEF] dark:stroke-white/10"
              strokeWidth="7"
              fill="none"
            />
            <circle
              cx="44"
              cy="44"
              r={ringRadius}
              stroke={badgeColor}
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringDashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-extrabold text-[#071B24] dark:text-white leading-none tabular-nums">
              {score}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">/ 100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <StatusIcon className="w-4 h-4 shrink-0" style={{ color: badgeColor }} />
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full truncate"
              style={{
                backgroundColor: `${badgeColor}18`,
                color: badgeColor,
              }}
            >
              {sym.badge_label || 'Evaluación'}
            </span>
          </div>
          <h2 className="text-[16px] font-extrabold text-[#071B24] dark:text-white mt-1.5 leading-snug">
            {sym.affected_limb
              ? `Hallazgo en ${sym.affected_limb}`
              : 'Biomecánica Simétrica'}
          </h2>
          <p className="text-[12px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-snug tabular-nums">
            Ant. SI {sym.anterior_si_pct ?? 100}% · Post. SI {sym.posterior_si_pct ?? 100}%
          </p>
        </div>
      </section>

      {/* Bento Grid 2x2 Big Number Tiles (Biometric Bento style) */}
      <section className="grid grid-cols-2 gap-2.5">
        {/* Tile 1: Score Global Highlighted in Deep Teal + Lime */}
        <div className="rounded-[24px] bg-[#0F3D44] dark:bg-[#14545E] p-4 text-white shadow-[0_12px_28px_-6px_rgba(15,61,68,0.4)] flex flex-col justify-between min-h-[112px]">
          <span className="text-[11px] font-semibold text-white/75">
            Score Global
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-[32px] font-extrabold text-[#D9F99D] leading-none tabular-nums">
              {score}
            </span>
            <span className="text-[13px] font-bold text-white/70 tabular-nums">
              /100
            </span>
          </div>
          <span className="text-[11px] font-semibold text-white/90 truncate">
            {sym.badge_label || 'Simétrico'}
          </span>
        </div>

        {/* Tile 2: Zancada */}
        <div className="rounded-[24px] card-3d p-4 flex flex-col justify-between min-h-[112px]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
            Zancada
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-[30px] font-extrabold text-[#071B24] dark:text-white leading-none tabular-nums">
              {Number(kin.stride_length_m ?? 2.38).toFixed(2)}
            </span>
            <span className="text-[13px] font-bold text-slate-500 dark:text-zinc-400">
              m
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#0F3D44] dark:text-[#00D1C2] tabular-nums truncate">
            {Math.round(kin.cadence_spm ?? 84)} pasos/min
          </span>
        </div>

        {/* Tile 3: Flexión Dorso */}
        <div className="rounded-[24px] card-3d p-4 flex flex-col justify-between min-h-[112px]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
            Flexión Dorso
          </span>
          <div className="flex items-baseline gap-0.5 my-1">
            <span className="text-[30px] font-extrabold text-[#071B24] dark:text-white leading-none tabular-nums">
              {Number(kin.back_rom_deg ?? 4.4).toFixed(1)}°
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
            ROM Toracolumbar
          </span>
        </div>

        {/* Tile 4: Calidad IA */}
        <div className="rounded-[24px] card-3d p-4 flex flex-col justify-between min-h-[112px]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
            Calidad IA
          </span>
          <div className="flex items-baseline gap-0.5 my-1">
            <span className="text-[30px] font-extrabold text-[#071B24] dark:text-white leading-none tabular-nums">
              {Math.round(gate.pass_rate_pct ?? 100)}%
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
            Captura lateral 90°
          </span>
        </div>
      </section>

      {/* AI Sports Veterinary Clinical Report & Rehabilitation Plan (DeepSeek V3) */}
      <section>
        <AIClinicalReport analysisData={analysisData} onRequireAuth={onRequireAuth} />
      </section>

      {/* Vertical Oscillation Time-Series Chart */}
      {waveGeometry && (
        <section className="rounded-[26px] card-3d p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h3 className="text-[14px] font-extrabold text-[#071B24] dark:text-white">
              Oscilación Vertical
            </h3>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="inline-flex items-center gap-1 text-[#00F0FF]">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
                Nuca
              </span>
              <span className="inline-flex items-center gap-1 text-[#EC4899]">
                <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
                Grupa
              </span>
            </div>
          </div>

          <div className="rounded-[14px] bg-slate-900 dark:bg-[#09090B] border border-slate-700 dark:border-[#26262A] p-2">
            <svg
              viewBox={`0 0 ${waveGeometry.w} ${waveGeometry.h}`}
              className="w-full h-[108px] overflow-visible"
            >
              <line
                x1="8"
                y1={waveGeometry.h * 0.5}
                x2={waveGeometry.w - 8}
                y2={waveGeometry.h * 0.5}
                stroke="#334155"
                strokeDasharray="3 3"
              />
              <polyline
                fill="none"
                stroke="#00F0FF"
                strokeWidth="1.8"
                strokeLinejoin="round"
                points={waveGeometry.pollPoints}
              />
              <polyline
                fill="none"
                stroke="#EC4899"
                strokeWidth="2.0"
                strokeLinejoin="round"
                points={waveGeometry.croupPoints}
              />
            </svg>
            <div className="flex justify-between font-mono text-[9px] text-slate-400 dark:text-zinc-500 px-1">
              <span>0.0s</span>
              <span>±{waveGeometry.maxAbs} mm</span>
              <span>{(analysisData?.duration_s || 0).toFixed(1)}s</span>
            </div>
          </div>
        </section>
      )}

      {/* Section A: Hildebrand Footfall Gait Sequence Diagram */}
      <section className="rounded-[26px] card-3d p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Footprints className="w-4 h-4 text-[#0F3D44] dark:text-[#00D1C2]" />
          <h3 className="text-[14px] font-extrabold text-[#071B24] dark:text-white">
            Secuencia de Pisada
          </h3>
        </div>

        <div className="rounded-[18px] card-3d-recessed p-3 flex flex-col gap-2 shadow-inner">
          {['LF', 'RH', 'RF', 'LH'].map((code) => {
            const intervals = ts?.stance_intervals?.[code] || [];
            const col = LIMB_ACCENTS[code];
            const duty = limbs?.[code]?.stance_pct ?? 0;
            return (
              <div key={code} className="flex items-center gap-2">
                <span
                  className="font-mono text-[10px] font-bold w-6 shrink-0"
                  style={{ color: col }}
                >
                  {code}
                </span>
                <div className="relative flex-1 h-4 rounded-md bg-slate-200 dark:bg-[#141417] border border-slate-300 dark:border-[#26262A]/80 overflow-hidden">
                  {intervals.map(([start, end], i) => {
                    const leftPct = (start / totalFrames) * 100;
                    const widthPct = Math.max(1.2, ((end - start + 1) / totalFrames) * 100);
                    return (
                      <div
                        key={i}
                        className="absolute top-0.5 bottom-0.5 rounded-[3px]"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          backgroundColor: col,
                          opacity: 0.85,
                        }}
                      />
                    );
                  })}
                </div>
                <span className="font-mono text-[10px] text-slate-700 dark:text-zinc-300 tabular-nums w-10 text-right shrink-0">
                  {duty}%
                </span>
              </div>
            );
          })}
          <div className="flex justify-between font-mono text-[9px] text-slate-500 dark:text-zinc-500 pt-0.5 px-8">
            <span>0.0s</span>
            <span>{(analysisData?.duration_s || 0).toFixed(1)}s</span>
          </div>
        </div>
      </section>

      {/* Section B: Bidirectional Protraction vs Retraction & Hoof Clearance */}
      <section className="rounded-[26px] card-3d p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <MoveHorizontal className="w-4 h-4 text-[#A855F7]" />
          <h3 className="text-[14px] font-extrabold text-[#071B24] dark:text-white">
            Arco de Vuelo
          </h3>
        </div>

        <div className="rounded-[18px] card-3d-recessed p-3 flex flex-col gap-2.5 shadow-inner">
          {['LF', 'RF', 'LH', 'RH'].map((code) => {
            const limb = limbs?.[code] || {};
            const col = LIMB_ACCENTS[code];
            const pro = limb.protraction_deg ?? 0;
            const ret = limb.retraction_deg ?? 0;
            const sweep = limb.sweep_rom_deg ?? (pro + ret).toFixed(1);
            const clearMm = limb.max_clearance_mm ?? 0;
            const retWidth = Math.min(48, (ret / maxPendularAngle) * 48);
            const proWidth = Math.min(48, (pro / maxPendularAngle) * 48);

            return (
              <div key={code} className="flex flex-col gap-1">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="font-bold" style={{ color: col }}>
                    {code} · Arco {sweep}°
                  </span>
                  <span className="text-slate-600 dark:text-zinc-400 tabular-nums">
                    -{ret}° | +{pro}° · Vuelo {clearMm} mm
                  </span>
                </div>
                <div className="relative h-3.5 rounded-full bg-slate-200 dark:bg-[#141417] border border-slate-300 dark:border-[#26262A] overflow-hidden">
                  {/* Center 0° neutral axis */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400 dark:bg-zinc-500/70 z-10" />
                  {/* Retraction (left from center) */}
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-l-full"
                    style={{
                      right: '50%',
                      width: `${retWidth}%`,
                      backgroundColor: col,
                      opacity: 0.55,
                    }}
                  />
                  {/* Protraction (right from center) */}
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-r-full"
                    style={{
                      left: '50%',
                      width: `${proWidth}%`,
                      backgroundColor: col,
                      opacity: 0.9,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Follow the Progress: Longitudinal Evolution & Baseline Tracker */}
      <section className="flex flex-col gap-3">
        <HorseEvolutionChart
          horseName={currentHorseName}
          sessions={sessions}
          onSelectSession={onSelectSession}
        />
        <ProgressTracker
          analysisData={analysisData}
          horseName={currentHorseName}
        />
      </section>

      {/* Section C: RealHorse / EVJ Validated Symmetry Bars (Front vs Hind) */}
      <section>
        <SymmetryBarCard symmetryReport={sym} />
      </section>

      {/* 2x2 Limb Breakdown Grid (LF, RF, LH, RH) */}
      <section className="relative rounded-[24px]">
        <div className="grid grid-cols-2 gap-2.5">
          {['LF', 'RF', 'LH', 'RH'].map((code) => (
            <LimbBreakdownCard key={code} code={code} limb={limbs?.[code]} />
          ))}
        </div>
      </section>

      {/* Diagnostic Clinical Findings Card */}
      <section className="rounded-[26px] card-3d p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#0F3D44] dark:text-[#00D1C2]" />
          <h3 className="text-[14px] font-extrabold text-[#071B24] dark:text-white">
            Hallazgos Biomecánicos
          </h3>
        </div>

        {(sym.findings || []).map((item) => (
          <div
            key={item.id}
            className="rounded-[18px] card-3d-interactive p-3.5 shadow-sm"
            style={{ borderColor: `${item.badge_color || '#10B981'}55` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[12px] font-bold text-slate-900 dark:text-white">
                {item.title}
              </span>
              <span
                className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums"
                style={{
                  backgroundColor: `${item.badge_color || '#10B981'}22`,
                  color: item.badge_color || '#10B981',
                }}
              >
                {item.asymmetry_pct}%
              </span>
            </div>
            <p className="text-[12px] text-slate-700 dark:text-zinc-300 mt-1.5 leading-relaxed">
              {item.description}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-[#26262A] flex items-center justify-between font-mono text-[10px] text-slate-500 dark:text-zinc-400">
              <span>{item.region}</span>
              <span>
                {item.metric_name}: {item.metric_value_mm} mm
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* In-body Navigation back to Visor */}
      {onBackToVisor && (
        <button
          type="button"
          onClick={onBackToVisor}
          className="w-full min-h-[50px] rounded-[16px] card-3d-interactive active:scale-[0.98] transition-all font-mono text-[13px] font-bold text-slate-800 dark:text-zinc-200 shadow-md mt-1 mb-2"
        >
          Volver al Visor Cinemático
        </button>
      )}
    </div>
  );
}
