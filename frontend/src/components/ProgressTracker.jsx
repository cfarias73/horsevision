import React, { useState } from 'react';
import {
  TrendingUp,
  BookmarkCheck,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

/**
 * ProgressTracker ("Follow the Progress" RealHorse feature):
 * Allows establishing a baseline analysis and tracks week-over-week
 * rehabilitation progression with delta indicators (% improvement / regression).
 */
export default function ProgressTracker({ analysisData, horseName = 'Tornado' }) {
  const sym = analysisData?.symmetry_report || {};
  const kin = analysisData?.kinematics_summary || {};

  const currentScore = sym.global_score ?? 74;
  const currentHindAsym = sym.hind_impact_asym_mm ?? sym.pelvic_drop_mm ?? 12.4;
  const currentForeAsym = sym.fore_impact_asym_mm ?? sym.head_nod_mm ?? 4.2;
  const currentRom = kin.back_rom_deg ?? kin.rom_deg ?? 4.4;

  const storageKey = `horsevision_baseline_${horseName.toLowerCase().trim()}`;

  // Default simulated baseline (21 days prior) so demo is immediately rewarding
  const defaultBaseline = {
    date: '24 Oct 2024 · 10:30',
    horseName: horseName,
    score: 64,
    hindAsym: 16.8,
    foreAsym: 6.5,
    rom: 3.2,
    sessionLabel: 'Sesión Inicial (Pre-Rehabilitación)',
  };

  const [baseline, setBaseline] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultBaseline;
  });

  const [hasCustomBaseline, setHasCustomBaseline] = useState(false);

  // Compute Deltas
  const scoreDelta = currentScore - baseline.score;
  const hindDelta = baseline.hindAsym - currentHindAsym; // positive means reduction in asymmetry (good)
  const hindImprovementPct = Math.round((hindDelta / Math.max(1, baseline.hindAsym)) * 100);

  const romDelta = +(currentRom - baseline.rom).toFixed(1); // positive means more flexible back
  const romImprovementPct = Math.round((romDelta / Math.max(1, baseline.rom)) * 100);

  const handleSetAsBaseline = () => {
    const newBaseline = {
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      horseName: horseName,
      score: currentScore,
      hindAsym: currentHindAsym,
      foreAsym: currentForeAsym,
      rom: currentRom,
      sessionLabel: 'Línea Base Actualizada',
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(newBaseline));
    } catch {
      // ignore
    }
    setBaseline(newBaseline);
    setHasCustomBaseline(true);
  };

  const handleResetToDemo = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setBaseline(defaultBaseline);
    setHasCustomBaseline(false);
  };

  return (
    <div className="rounded-[24px] card-3d p-4 flex flex-col gap-3.5 shadow-md">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#26262A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full card-3d-interactive flex items-center justify-center text-[#0D3F2E] dark:text-emerald-400 shadow-sm">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">
              Seguimiento Evolutivo
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSetAsBaseline}
          title="Fijar esta evaluación como nueva línea base de referencia"
          className="px-2.5 py-1.5 rounded-xl card-3d-interactive text-[11px] font-mono text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <BookmarkCheck className="w-3.5 h-3.5 text-[#0D3F2E] dark:text-emerald-400" />
          <span>Fijar Base</span>
        </button>
      </div>

      {/* Baseline vs Current Session Comparison Bar */}
      <div className="rounded-[18px] card-3d-recessed p-3 flex items-center justify-between gap-2 shadow-inner">
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-semibold uppercase">
            Línea Base
          </span>
          <span className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 truncate">
            {baseline.date}
          </span>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />

        <div className="flex flex-col items-end min-w-0">
          <span className="font-mono text-[10px] text-[#0D3F2E] dark:text-emerald-400 font-semibold uppercase">
            Sesión Actual
          </span>
          <span className="font-mono text-[11px] text-slate-900 dark:text-white font-bold truncate">
            Hoy
          </span>
        </div>
      </div>

      {/* Progress Cards: The RealHorse format */}
      <div className="grid grid-cols-3 gap-2">
        {/* Metric 1: Score Global */}
        <div className="rounded-[16px] card-3d-interactive p-2.5 flex flex-col items-center text-center shadow-sm">
          <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
            Score Global
          </span>
          <span className="font-mono text-[16px] font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
            {currentScore}/100
          </span>
          <span
            className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 tabular-nums ${
              scoreDelta >= 0
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'
            }`}
          >
            {scoreDelta >= 0 ? `+${scoreDelta} pts` : `${scoreDelta} pts`}
          </span>
        </div>

        {/* Metric 2: Pata Izquierda (LH) Asymmetry Reduction */}
        <div className="rounded-[16px] card-3d-interactive p-2.5 flex flex-col items-center text-center shadow-sm">
          <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
            Posterior LH
          </span>
          <span className="font-mono text-[16px] font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
            {currentHindAsym} mm
          </span>
          <span
            className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 tabular-nums ${
              hindImprovementPct >= 0
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'
            }`}
          >
            {hindImprovementPct >= 0
              ? `${hindImprovementPct}% mejora`
              : `${Math.abs(hindImprovementPct)}% retroceso`}
          </span>
        </div>

        {/* Metric 3: Dorso Toracolumbar (ROM) */}
        <div className="rounded-[16px] card-3d-interactive p-2.5 flex flex-col items-center text-center shadow-sm">
          <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
            ROM Dorso
          </span>
          <span className="font-mono text-[16px] font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
            {currentRom}°
          </span>
          <span
            className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 tabular-nums ${
              romImprovementPct >= 0
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'
            }`}
          >
            {romImprovementPct >= 0
              ? `+${romDelta}° flex.`
              : `${romDelta}° rigidez`}
          </span>
        </div>
      </div>

      {/* Clinical Interpretation of Evolution */}
      <div className="rounded-[16px] bg-emerald-50/60 dark:bg-[#17171C] border border-emerald-200/80 dark:border-[#2D2D33] p-3 flex items-start gap-2.5 shadow-sm">
        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-800 dark:text-zinc-300 leading-relaxed">
          <strong className="text-slate-900 dark:text-white font-mono">Evolución: </strong>
          Reducción del <span className="text-[#0D3F2E] dark:text-emerald-400 font-bold">{hindImprovementPct}%</span> en asimetría posterior respecto a la línea base. Incremento en basculación dorsal ({baseline.rom}° ➔ {currentRom}°).
        </div>
      </div>

      {/* Quick Reset back to Demo baseline if customized */}
      {hasCustomBaseline && (
        <button
          type="button"
          onClick={handleResetToDemo}
          className="text-[10px] font-mono text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300 self-center flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" />
          Restablecer Línea Base de demostración
        </button>
      )}
    </div>
  );
}
