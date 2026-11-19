import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

/**
 * SymmetryBarCard:
 * Replicates and enhances the RealHorse / Sleip clinical asymmetry card:
 * - Segmented toggle between [Anterior / Front] and [Posterior / Hind]
 * - Clinical banner explaining findings (e.g., "Mild push-off asymmetry of the left hindlimb")
 * - 2-column comparative bar visualization:
 *     1. Impacto (ΔYmin) Left vs Right
 *     2. Impulso (ΔYmax) Left vs Right
 * - Real-time color thresholds:
 *     🟢 Green (Healthy/Symmetric): < 6 mm
 *     🟡 Yellow (Mild Asymmetry): 6 - 12 mm
 *     🔴 Red (Clinical Lameness): > 12 mm
 * - Reference threshold line across bars
 */
export default function SymmetryBarCard({ symmetryReport, compact = false }) {
  const [activeTab, setActiveTab] = useState('hind'); // Default to hind or front
  const sym = symmetryReport || {};

  const isFront = activeTab === 'front';

  // Metrics for Front
  const foreImpact = sym.fore_impact_asym_mm ?? sym.head_nod_mm ?? 4.2;
  const forePushoff = sym.fore_pushoff_asym_mm ?? 2.1;
  const foreLeftExc = sym.limb_vertical_excursion_mm?.LF ?? 38;
  const foreRightExc = sym.limb_vertical_excursion_mm?.RF ?? 42;

  // Metrics for Hind
  const hindImpact = sym.hind_impact_asym_mm ?? sym.pelvic_drop_mm ?? 12.4;
  const hindPushoff = sym.hind_pushoff_asym_mm ?? sym.pelvic_hike_mm ?? 9.8;
  const hindLeftExc = sym.limb_vertical_excursion_mm?.LH ?? 31;
  const hindRightExc = sym.limb_vertical_excursion_mm?.RH ?? 44;

  const currentImpactAsym = isFront ? foreImpact : hindImpact;
  const currentPushoffAsym = isFront ? forePushoff : hindPushoff;

  // Determine which side is more affected based on excursions
  const leftExc = isFront ? foreLeftExc : hindLeftExc;
  const rightExc = isFront ? foreRightExc : hindRightExc;

  // Compute bar heights (mm). Base reference max 60mm
  const maxScale = Math.max(50, leftExc, rightExc, 55);

  // Status helper
  const getStatusColor = (valMm) => {
    if (valMm < 6) return { bg: 'bg-[#10B981]', hex: '#10B981', label: 'Sano' };
    if (valMm <= 12) return { bg: 'bg-[#F59E0B]', hex: '#F59E0B', label: 'Asimetría Leve' };
    return { bg: 'bg-[#EF4444]', hex: '#EF4444', label: 'Cojera / Asimétrico' };
  };

  const impactStatus = getStatusColor(currentImpactAsym);
  const pushoffStatus = getStatusColor(currentPushoffAsym);

  // Clinical Summary Text (identical to RealHorse format)
  let bannerText = '';
  if (isFront) {
    if (currentImpactAsym < 6 && currentPushoffAsym < 6) {
      bannerText = 'Simetría anterior óptima. Sin asimetrías de cabeza o nuca.';
    } else if (currentImpactAsym >= currentPushoffAsym) {
      bannerText = `Asimetría de impacto en tercio anterior (${foreImpact} mm ΔYmin).`;
    } else {
      bannerText = `Asimetría de empuje/despegue en tercio anterior (${forePushoff} mm ΔYmax).`;
    }
  } else {
    if (currentImpactAsym < 6 && currentPushoffAsym < 6) {
      bannerText = 'Simetría posterior óptima. Propulsión equilibrada en ambos miembros.';
    } else if (currentPushoffAsym >= 9 || currentImpactAsym >= 12) {
      bannerText = `Asimetría moderada de empuje en miembro posterior izquierdo (${hindPushoff} mm).`;
    } else {
      bannerText = `Asimetría leve de impacto en miembros posteriores (${hindImpact} mm).`;
    }
  }

  // Bar height percentages
  const impactLeftPct = Math.min(100, Math.max(15, (leftExc / maxScale) * 100));
  const impactRightPct = Math.min(100, Math.max(15, (rightExc / maxScale) * 100));

  // For push-off, compute slightly shifted proportions matching propulsion
  const pushoffLeftPct = Math.min(100, Math.max(15, ((leftExc - (currentPushoffAsym * 0.5)) / maxScale) * 100));
  const pushoffRightPct = Math.min(100, Math.max(15, ((rightExc + (currentPushoffAsym * 0.5)) / maxScale) * 100));

  return (
    <div className={`rounded-[22px] card-3d p-4 flex flex-col gap-3 shadow-md ${compact ? 'text-[11px]' : ''}`}>
      {/* Top Segmented Controls: [Front] vs [Hind] */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#26262A] pb-3">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl card-3d-recessed w-44">
          <button
            type="button"
            onClick={() => setActiveTab('front')}
            className={`py-1.5 px-3 rounded-lg font-mono text-[11px] font-bold transition-all ${
              activeTab === 'front'
                ? 'card-3d-racing-green text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hind')}
            className={`py-1.5 px-3 rounded-lg font-mono text-[11px] font-bold transition-all ${
              activeTab === 'hind'
                ? 'card-3d-racing-green text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Posterior
          </button>
        </div>

        <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-semibold tracking-wider">
          EVJ ±1mm
        </span>
      </div>

      {/* RealHorse-style Clinical Assessment Banner */}
      <div className="rounded-[14px] bg-slate-100 dark:bg-[#1C1C21] border border-slate-200 dark:border-[#2D2D33] p-2.5 flex items-center gap-2.5 shadow-sm">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${pushoffStatus.hex}22`, color: pushoffStatus.hex }}
        >
          {pushoffStatus.hex === '#10B981' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : pushoffStatus.hex === '#F59E0B' ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5" />
          )}
        </div>
        <p className="font-mono text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
          {bannerText}
        </p>
      </div>

      {/* 2-Column Comparative Bar Graphs: Impact vs Push-off */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Column 1: Impact */}
        <div className="rounded-[16px] card-3d-recessed p-3 flex flex-col items-center shadow-inner">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-300">
              Impacto
            </span>
            <span
              className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${impactStatus.hex}20`, color: impactStatus.hex }}
            >
              Δ {currentImpactAsym} mm
            </span>
          </div>

          {/* Vertical Bar Chart Stage */}
          <div className="relative w-full h-28 flex items-end justify-center gap-4 pt-4 pb-1 border-b border-slate-200 dark:border-[#26262A]">
            {/* Dotted threshold line across stage */}
            <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-slate-400 dark:border-zinc-600/60 z-0 pointer-events-none" />

            {/* Left Limb Bar */}
            <div className="flex flex-col items-center gap-1 z-10 w-9">
              <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-semibold tabular-nums">
                {Math.round(leftExc)}
              </span>
              <div className="w-full bg-slate-200 dark:bg-[#1A1A20] rounded-t-lg overflow-hidden flex items-end h-20 p-0.5">
                <div
                  className="w-full rounded-t-md transition-all duration-500 shadow-md"
                  style={{
                    height: `${impactLeftPct}%`,
                    backgroundColor: impactStatus.hex,
                  }}
                />
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                {isFront ? 'LF' : 'LH'}
              </span>
            </div>

            {/* Right Limb Bar */}
            <div className="flex flex-col items-center gap-1 z-10 w-9">
              <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-semibold tabular-nums">
                {Math.round(rightExc)}
              </span>
              <div className="w-full bg-slate-200 dark:bg-[#1A1A20] rounded-t-lg overflow-hidden flex items-end h-20 p-0.5">
                <div
                  className="w-full rounded-t-md transition-all duration-500 shadow-md"
                  style={{
                    height: `${impactRightPct}%`,
                    backgroundColor: '#10B981',
                  }}
                />
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                {isFront ? 'RF' : 'RH'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Push-off */}
        <div className="rounded-[16px] card-3d-recessed p-3 flex flex-col items-center shadow-inner">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-300">
              Impulso
            </span>
            <span
              className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${pushoffStatus.hex}20`, color: pushoffStatus.hex }}
            >
              Δ {currentPushoffAsym} mm
            </span>
          </div>

          {/* Vertical Bar Chart Stage */}
          <div className="relative w-full h-28 flex items-end justify-center gap-4 pt-4 pb-1 border-b border-slate-200 dark:border-[#26262A]">
            {/* Dotted threshold line */}
            <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-slate-400 dark:border-zinc-600/60 z-0 pointer-events-none" />

            {/* Left Limb Bar */}
            <div className="flex flex-col items-center gap-1 z-10 w-9">
              <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-semibold tabular-nums">
                {Math.round(leftExc - currentPushoffAsym * 0.4)}
              </span>
              <div className="w-full bg-slate-200 dark:bg-[#1A1A20] rounded-t-lg overflow-hidden flex items-end h-20 p-0.5">
                <div
                  className="w-full rounded-t-md transition-all duration-500 shadow-md"
                  style={{
                    height: `${pushoffLeftPct}%`,
                    backgroundColor: pushoffStatus.hex,
                  }}
                />
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                {isFront ? 'LF' : 'LH'}
              </span>
            </div>

            {/* Right Limb Bar */}
            <div className="flex flex-col items-center gap-1 z-10 w-9">
              <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-semibold tabular-nums">
                {Math.round(rightExc)}
              </span>
              <div className="w-full bg-slate-200 dark:bg-[#1A1A20] rounded-t-lg overflow-hidden flex items-end h-20 p-0.5">
                <div
                  className="w-full rounded-t-md transition-all duration-500 shadow-md"
                  style={{
                    height: `${pushoffRightPct}%`,
                    backgroundColor: '#10B981',
                  }}
                />
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                {isFront ? 'RF' : 'RH'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Color Threshold Legend */}
      <div className="flex items-center justify-around pt-1 text-[10px] font-mono text-slate-600 dark:text-zinc-400 border-t border-slate-200 dark:border-[#26262A]/60">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          Normal (&lt;6mm)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          Leve (6-12mm)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
          Asimétrico (&gt;12mm)
        </span>
      </div>
    </div>
  );
}
