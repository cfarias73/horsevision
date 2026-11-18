import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function HorseEvolutionChart({
  horseName = 'Dakota',
  sessions = [],
  onSelectSession,
  onDeleteSession,
  onDeleteAllSessions,
}) {
  const [metricMode, setMetricMode] = useState('score'); // 'score' (0-100) | 'asymmetry' (mm)
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [showSessionsList, setShowSessionsList] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const isDemoHorse = ['dakota', 'tornado', 'eclipse'].includes(horseName.toLowerCase());

  // Filter and sort sessions chronologically for this horse
  const horseSessions = useMemo(() => {
    const list = sessions
      .filter((s) => s.horse?.toLowerCase() === horseName.toLowerCase())
      .map((s, idx) => ({
        ...s,
        idx,
        scoreVal: s.score ?? 80,
        asymVal: parseFloat(s.asymmetryMm) || (s.score >= 80 ? 3.2 : 12.4),
      }));

    // If less than 2 sessions in mock demo horses, provide historical timeline
    if (list.length < 2 && isDemoHorse) {
      if (horseName.toLowerCase() === 'tornado') {
        return [
          { id: 'T-1', date: '12 Sep', fullDate: '12 Sep 2024', scoreVal: 62, asymVal: 18.5, statusLabel: 'Cojera / Asimétrico', isDemo: true },
          { id: 'T-2', date: '08 Oct', fullDate: '08 Oct 2024', scoreVal: 68, asymVal: 15.0, statusLabel: 'Asimetría', isDemo: true },
          { id: 'T-3', date: '02 Nov', fullDate: '02 Nov 2024', scoreVal: 74, asymVal: 12.4, statusLabel: 'Asimetría Leve', isDemo: true },
        ];
      }
      if (horseName.toLowerCase() === 'eclipse') {
        return [
          { id: 'E-1', date: '20 Jul', fullDate: '20 Jul 2024', scoreVal: 86, asymVal: 4.2, statusLabel: 'Simétrico', isDemo: true },
          { id: 'E-2', date: '25 Ago', fullDate: '25 Ago 2024', scoreVal: 89, asymVal: 2.8, statusLabel: 'Excelente', isDemo: true },
          { id: 'E-3', date: '18 Oct', fullDate: '18 Oct 2024', scoreVal: 92, asymVal: 1.8, statusLabel: 'Excelente', isDemo: true },
        ];
      }
      return [
        { id: 'D-1', date: '15 Ago', fullDate: '15 Ago 2024', scoreVal: 70, asymVal: 14.2, statusLabel: 'Pre-Rehabilitación', isDemo: true },
        { id: 'D-2', date: '05 Sep', fullDate: '05 Sep 2024', scoreVal: 76, asymVal: 8.9, statusLabel: 'En Progreso', isDemo: true },
        { id: 'D-3', date: '28 Sep', fullDate: '28 Sep 2024', scoreVal: 82, asymVal: 5.1, statusLabel: 'Simétrico', isDemo: true },
        { id: 'D-4', date: '24 Oct', fullDate: '24 Oct 2024', scoreVal: 85, asymVal: 4.0, statusLabel: 'Óptimo', isDemo: true },
        { id: 'D-5', date: '17 Nov', fullDate: '17 Nov 2024', scoreVal: 88, asymVal: 3.2, statusLabel: 'Simétrico', isDemo: true },
      ];
    }
    return list;
  }, [sessions, horseName, isDemoHorse]);

  if (!horseSessions.length) {
    return (
      <div className="rounded-[24px] card-3d p-5 text-center flex flex-col items-center gap-2 view-enter">
        <TrendingUp className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
        <h4 className="font-mono text-[13px] font-bold text-slate-800 dark:text-white">
          Sin evaluaciones registradas
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
          Aún no hay análisis biomecánicos grabados para {horseName}.
        </p>
      </div>
    );
  }

  const firstSession = horseSessions[0] || {};
  const lastSession = horseSessions[horseSessions.length - 1] || {};

  const scoreDiff = (lastSession.scoreVal || 0) - (firstSession.scoreVal || 0);
  const asymDiff = (firstSession.asymVal || 0) - (lastSession.asymVal || 0);

  // Chart Geometry
  const width = 360;
  const height = 140;
  const paddingX = 28;
  const paddingTop = 22;
  const paddingBottom = 28;

  const isScore = metricMode === 'score';

  const chartData = useMemo(() => {
    if (horseSessions.length < 2) return null;

    const values = horseSessions.map((s) => (isScore ? s.scoreVal : s.asymVal));
    const minVal = 0;
    const maxVal = isScore ? 100 : Math.max(20, ...values) + 2;

    const points = horseSessions.map((s, i) => {
      const rawVal = typeof (isScore ? s.scoreVal : s.asymVal) === 'number'
        ? (isScore ? s.scoreVal : s.asymVal)
        : 0;
      const val = Math.max(minVal, Math.min(maxVal, rawVal));
      const x = paddingX + (i / Math.max(1, horseSessions.length - 1)) * (width - paddingX * 2);
      const y =
        height -
        paddingBottom -
        ((val - minVal) / Math.max(1, maxVal - minVal)) * (height - paddingTop - paddingBottom);
      return { x, y, val: rawVal, session: s, date: s.date || s.fullDate };
    });

    const pathD = points.reduce(
      (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`,
      ''
    );

    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${height - paddingBottom} L ${points[0].x.toFixed(1)},${height - paddingBottom} Z`;

    return { points, pathD, areaD, minVal, maxVal };
  }, [horseSessions, isScore, width, height, paddingX, paddingTop, paddingBottom]);

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
              {horseSessions.length} {horseSessions.length === 1 ? 'evaluación registrada' : 'evaluaciones registradas'}
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
          <span className="text-[9px] text-[#10B981] font-semibold mt-0.5">
            {lastSession.statusLabel || (lastSession.scoreVal >= 80 ? 'Simétrico' : 'Asimetría')}
          </span>
        </div>

        <div className="p-2.5 rounded-xl card-3d-interactive flex flex-col items-center text-center shadow-sm">
          <span className="text-[9px] text-slate-500 dark:text-zinc-400">Progreso Score</span>
          <div className="flex items-center gap-0.5 mt-0.5">
            {scoreDiff >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-[#10B981]" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span
              className={`text-[15px] font-extrabold ${
                scoreDiff >= 0 ? 'text-[#10B981]' : 'text-amber-500'
              }`}
            >
              {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} pts
            </span>
          </div>
          <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">Variación</span>
        </div>

        <div className="p-2.5 rounded-xl card-3d-interactive flex flex-col items-center text-center shadow-sm">
          <span className="text-[9px] text-slate-500 dark:text-zinc-400">Reducción Asim.</span>
          <div className="flex items-center gap-0.5 mt-0.5">
            <ArrowDownRight className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[15px] font-extrabold text-[#10B981]">
              {asymDiff >= 0 ? `-${asymDiff.toFixed(1)}` : `+${Math.abs(asymDiff).toFixed(1)}`} mm
            </span>
          </div>
          <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">Seguimiento</span>
        </div>
      </div>

      {/* SVG Line Chart if 2 or more sessions */}
      {chartData ? (
        <div className="relative rounded-2xl card-3d-recessed p-2 pt-1 border border-slate-200/60 dark:border-white/5 overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none overflow-visible"
          >
            <defs>
              <linearGradient id="scoreAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="asymAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Optimal Benchmark line */}
            <line
              x1={paddingX}
              y1={
                height -
                paddingBottom -
                (((isScore ? 80 : 6) - chartData.minVal) / (chartData.maxVal - chartData.minVal)) *
                  (height - paddingTop - paddingBottom)
              }
              x2={width - paddingX}
              y2={
                height -
                paddingBottom -
                (((isScore ? 80 : 6) - chartData.minVal) / (chartData.maxVal - chartData.minVal)) *
                  (height - paddingTop - paddingBottom)
              }
              stroke="#10B981"
              strokeDasharray="3 3"
              strokeOpacity="0.4"
            />

            {/* Area Fill */}
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
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    className="font-mono text-[9px] font-extrabold fill-slate-800 dark:fill-white"
                  >
                    {isScore ? pt.val : `${pt.val}mm`}
                  </text>
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
      ) : (
        <div className="rounded-2xl card-3d-recessed p-3 text-center font-mono text-[11px] text-slate-500 dark:text-zinc-400">
          Registra una segunda evaluación para trazar la curva de evolución temporal.
        </div>
      )}

      {/* Evaluaciones Registradas & Management (Delete false/faulty sessions) */}
      <div className="border-t border-slate-200/70 dark:border-white/10 pt-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowSessionsList(!showSessionsList)}
            className="flex items-center gap-1.5 font-mono text-[11.5px] font-bold text-slate-800 dark:text-white hover:text-[#10B981] transition"
          >
            <span>Sesiones registradas ({horseSessions.length})</span>
            {showSessionsList ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {onDeleteAllSessions && horseSessions.length > 0 && (
            <div>
              {confirmDeleteAll ? (
                <div className="flex items-center gap-1.5 animate-fadeIn">
                  <span className="font-mono text-[10px] text-red-500 font-bold">¿Borrar todas?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAllSessions(horseName);
                      setConfirmDeleteAll(false);
                    }}
                    className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[9.5px] font-extrabold hover:bg-red-600 transition"
                  >
                    Sí, borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAll(false)}
                    className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-300 font-mono text-[9.5px] font-semibold"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAll(true)}
                  className="font-mono text-[10px] text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition"
                >
                  Eliminar todas
                </button>
              )}
            </div>
          )}
        </div>

        {showSessionsList && (
          <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto no-scrollbar pt-1">
            {horseSessions
              .slice()
              .reverse()
              .map((session) => {
                const isOptimal = session.scoreVal >= 80;
                const scoreColor = isOptimal ? '#10B981' : '#F59E0B';
                const isDeleting = deletingId === session.id;

                return (
                  <div
                    key={session.id}
                    className="rounded-xl card-3d-interactive p-2.5 flex items-center justify-between gap-2 text-[11px] font-mono shadow-xs transition"
                  >
                    <div
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                      onClick={() => onSelectSession?.(session)}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: scoreColor }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-800 dark:text-white">
                            {session.scoreVal}/100
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                            · {session.asymVal} mm
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-500 dark:text-zinc-400 block truncate">
                          {session.date || session.fullDate || 'Sesión'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons: Abrir / Eliminar */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDeleting ? (
                        <div className="flex items-center gap-1 animate-fadeIn bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-lg p-1">
                          <span className="text-[9px] text-red-600 dark:text-red-400 font-bold px-1">
                            ¿Eliminar?
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession?.(session.id);
                              setDeletingId(null);
                            }}
                            className="px-2 py-0.5 rounded bg-red-500 text-white text-[9px] font-extrabold hover:bg-red-600 transition"
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(null);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-300 text-[9px] font-semibold"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onSelectSession?.(session)}
                            className="px-2 py-1 rounded-lg card-3d-subtle text-[10px] font-bold text-slate-700 dark:text-zinc-300 hover:text-[#10B981] transition"
                            title="Ver análisis completo"
                          >
                            Ver
                          </button>
                          {onDeleteSession && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(session.id);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                              title="Eliminar análisis erróneo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
