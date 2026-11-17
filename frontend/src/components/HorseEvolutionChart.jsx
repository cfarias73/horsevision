import React, { useState, useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, CheckCircle2 } from 'lucide-react';

export default function HorseEvolutionChart({
  horseName = 'Dakota',
  sessions = [],
  onSelectSession
}) {
  const [metricMode, setMetricMode] = useState('score'); // 'score' (0-100) | 'asymmetry' (mm)
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Filter and sort sessions chronologically for this horse
  const horseSessions = useMemo(() => {
    const list = sessions
      .filter((s) => s.horse?.toLowerCase() === horseName.toLowerCase())
      .map((s, idx) => ({
        ...s,
        idx,
        scoreVal: s.score || 80,
        asymVal: parseFloat(s.asymmetryMm) || (s.score >= 80 ? 3.2 : 12.4),
      }));

    // If less than 2 sessions in mock, provide rich historical timeline points
    if (list.length < 2) {
      if (horseName.toLowerCase() === 'tornado') {
        return [
          { id: 'T-1', date: '12 Sep', fullDate: '12 Sep 2024', scoreVal: 62, asymVal: 18.5, statusLabel: 'Cojera / Asimétrico' },
          { id: 'T-2', date: '08 Oct', fullDate: '08 Oct 2024', scoreVal: 68, asymVal: 15.0, statusLabel: 'Asimetría' },
          { id: 'T-3', date: '02 Nov', fullDate: '02 Nov 2024', scoreVal: 74, asymVal: 12.4, statusLabel: 'Asimetría Leve' },
        ];
      }
      if (horseName.toLowerCase() === 'eclipse') {
        return [
          { id: 'E-1', date: '20 Jul', fullDate: '20 Jul 2024', scoreVal: 86, asymVal: 4.2, statusLabel: 'Simétrico' },
          { id: 'E-2', date: '25 Ago', fullDate: '25 Ago 2024', scoreVal: 89, asymVal: 2.8, statusLabel: 'Excelente' },
          { id: 'E-3', date: '18 Oct', fullDate: '18 Oct 2024', scoreVal: 92, asymVal: 1.8, statusLabel: 'Excelente' },
        ];
      }
      // Dakota default curve
      return [
        { id: 'D-1', date: '15 Ago', fullDate: '15 Ago 2024', scoreVal: 70, asymVal: 14.2, statusLabel: 'Pre-Rehabilitación' },
        { id: 'D-2', date: '05 Sep', fullDate: '05 Sep 2024', scoreVal: 76, asymVal: 8.9, statusLabel: 'En Progreso' },
        { id: 'D-3', date: '28 Sep', fullDate: '28 Sep 2024', scoreVal: 82, asymVal: 5.1, statusLabel: 'Simétrico' },
        { id: 'D-4', date: '24 Oct', fullDate: '24 Oct 2024', scoreVal: 85, asymVal: 4.0, statusLabel: 'Óptimo' },
        { id: 'D-5', date: '17 Nov', fullDate: '17 Nov 2024', scoreVal: 88, asymVal: 3.2, statusLabel: 'Simétrico' },
      ];
    }
    return list;
  }, [sessions, horseName]);

  const firstSession = horseSessions[0] || {};
  const lastSession = horseSessions[horseSessions.length - 1] || {};

  const scoreDiff = (lastSession.scoreVal || 0) - (firstSession.scoreVal || 0);
  const asymDiff = (firstSession.asymVal || 0) - (lastSession.asymVal || 0); // positive is good (reduction)

  // Chart Geometry
  const width = 360;
  const height = 140;
  const paddingX = 28;
  const paddingTop = 22;
  const paddingBottom = 28;

  const isScore = metricMode === 'score';

  const chartData = useMemo(() => {
    if (!horseSessions.length) return null;

    const values = horseSessions.map((s) => (isScore ? s.scoreVal : s.asymVal));
    const minVal = isScore ? 50 : 0;
    const maxVal = isScore ? 100 : Math.max(20, ...values) + 2;

    const points = horseSessions.map((s, i) => {
      const val = isScore ? s.scoreVal : s.asymVal;
      const x = paddingX + (i / Math.max(1, horseSessions.length - 1)) * (width - paddingX * 2);
      const y = height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * (height - paddingTop - paddingBottom);
      return { x, y, val, session: s, date: s.date || s.fullDate };
    });

    const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`, '');

    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${height - paddingBottom} L ${points[0].x.toFixed(1)},${height - paddingBottom} Z`;

    return { points, pathD, areaD, minVal, maxVal };
  }, [horseSessions, isScore, width, height, paddingX, paddingTop, paddingBottom]);

  if (!chartData || horseSessions.length < 2) return null;

  return (
    <div className="rounded-[24px] card-3d p-4 flex flex-col gap-3 shadow-md border border-[#0D3F2E]/15 dark:border-[#10B981]/20 view-enter">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#26262A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full card-3d-racing-green flex items-center justify-center text-white shadow-sm">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-[14px] font-extrabold text-slate-900 dark:text-white">
              Evolución Temporal de {horseName}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              {horseSessions.length} evaluaciones registradas
            </p>
          </div>
        </div>

        {/* Toggle between Score (0-100) vs Asymmetry (mm) */}
        <div className="grid grid-cols-2 p-1 rounded-xl card-3d-recessed font-mono text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setMetricMode('score')}
            className={`px-2 py-1 rounded-lg transition-all ${
              isScore
                ? 'card-3d-racing-green text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Score
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('asymmetry')}
            className={`px-2 py-1 rounded-lg transition-all ${
              !isScore
                ? 'card-3d-racing-green text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Asimetría
          </button>
        </div>
      </div>

      {/* KPI Cards: Net Improvement */}
      <div className="grid grid-cols-3 gap-2 font-mono">
        <div className="p-2.5 rounded-xl card-3d-interactive flex flex-col items-center text-center shadow-sm">
          <span className="text-[9px] text-slate-500 dark:text-zinc-400">Estado Actual</span>
          <span className="text-[15px] font-extrabold text-slate-900 dark:text-white mt-0.5">
            {isScore ? `${lastSession.scoreVal}/100` : `${lastSession.asymVal} mm`}
          </span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
            {lastSession.statusLabel || 'Evaluado'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl card-3d-interactive flex flex-col items-center text-center shadow-sm">
          <span className="text-[9px] text-slate-500 dark:text-zinc-400">Progreso Score</span>
          <span className="text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-0.5">
            {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} pts
          </span>
          <span className="text-[9px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {scoreDiff >= 0 ? 'Recuperación' : 'Variación'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl card-3d-interactive flex flex-col items-center text-center shadow-sm">
          <span className="text-[9px] text-slate-500 dark:text-zinc-400">Reducción Asim.</span>
          <span className="text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {asymDiff >= 0 ? `-${asymDiff.toFixed(1)}` : `+${Math.abs(asymDiff).toFixed(1)}`} mm
          </span>
          <span className="text-[9px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {asymDiff >= 0 ? 'Mayor Simetría' : 'Seguimiento'}
          </span>
        </div>
      </div>

      {/* SVG Line & Area Chart */}
      <div className="rounded-[18px] card-3d-recessed p-2 pt-3 shadow-inner relative overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[140px] overflow-visible"
        >
          <defs>
            <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="asymAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Optimal Threshold Benchmark line at Score 80 or Asymmetry 6mm */}
          {isScore ? (
            <line
              x1={paddingX}
              y1={height - paddingBottom - ((80 - chartData.minVal) / (chartData.maxVal - chartData.minVal)) * (height - paddingTop - paddingBottom)}
              x2={width - paddingX}
              y2={height - paddingBottom - ((80 - chartData.minVal) / (chartData.maxVal - chartData.minVal)) * (height - paddingTop - paddingBottom)}
              stroke="#10B981"
              strokeDasharray="3 3"
              strokeOpacity="0.4"
            />
          ) : (
            <line
              x1={paddingX}
              y1={height - paddingBottom - ((6 - chartData.minVal) / (chartData.maxVal - chartData.minVal)) * (height - paddingTop - paddingBottom)}
              x2={width - paddingX}
              y2={height - paddingBottom - ((6 - chartData.minVal) / (chartData.maxVal - chartData.minVal)) * (height - paddingTop - paddingBottom)}
              stroke="#10B981"
              strokeDasharray="3 3"
              strokeOpacity="0.4"
            />
          )}

          {/* Area Fill under line */}
          <path
            d={chartData.areaD}
            fill={isScore ? 'url(#scoreAreaGrad)' : 'url(#asymAreaGrad)'}
          />

          {/* Main Trend Line */}
          <path
            d={chartData.pathD}
            fill="none"
            stroke={isScore ? '#10B981' : '#F59E0B'}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points */}
          {chartData.points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectSession?.(pt.session)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={isScore ? '#10B981' : '#F59E0B'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* Point Value Tooltip / Label */}
                <text
                  x={pt.x}
                  y={pt.y - 8}
                  textAnchor="middle"
                  className="font-mono text-[9px] font-extrabold fill-slate-800 dark:fill-white"
                >
                  {isScore ? pt.val : `${pt.val}mm`}
                </text>

                {/* Date Label on X Axis */}
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  className="font-mono text-[8px] fill-slate-500 dark:fill-zinc-400 font-semibold"
                >
                  {pt.date}
                </text>
              </g>
            );
          })}
        </svg>

        <span className="absolute bottom-1 right-3 font-mono text-[8px] text-slate-400 dark:text-zinc-500">
          Toca cualquier punto para abrir sesión
        </span>
      </div>
    </div>
  );
}
