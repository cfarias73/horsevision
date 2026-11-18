import React, { useMemo, useState } from 'react';
import {
  History,
  Calendar,
  ChevronRight,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowUpRight,
  Trash2,
  Sparkles,
} from 'lucide-react';
import HorseEvolutionChart from './HorseEvolutionChart';

export const DEFAULT_SESSIONS = [
  {
    id: 'SES-9481',
    horse: 'Dakota',
    breed: 'Silla Francés',
    discipline: 'Salto Clásico',
    date: '17 Nov 2024 · 10:30',
    score: 88,
    status: 'optimal',
    statusLabel: 'Simétrico',
    stride: '1.42×',
    asymmetryMm: '3.2 mm',
    affectedLimb: 'Ninguno',
    isDemo: true,
  },
  {
    id: 'SES-8820',
    horse: 'Tornado',
    breed: 'Warmblood Holandés',
    discipline: 'Doma Clásica',
    date: '02 Nov 2024 · 16:15',
    score: 74,
    status: 'mild',
    statusLabel: 'Asimetría Leve',
    stride: '1.35×',
    asymmetryMm: '12.4 mm',
    affectedLimb: 'Posterior Izq (LH)',
    isDemo: true,
  },
  {
    id: 'SES-7612',
    horse: 'Eclipse',
    breed: 'Pura Sangre',
    discipline: 'Carrera',
    date: '18 Oct 2024 · 09:40',
    score: 92,
    status: 'optimal',
    statusLabel: 'Excelente',
    stride: '1.58×',
    asymmetryMm: '1.8 mm',
    affectedLimb: 'Ninguno',
    isDemo: true,
  },
  {
    id: 'SES-6940',
    horse: 'Dakota',
    breed: 'Silla Francés',
    discipline: 'Salto Clásico',
    date: '28 Sep 2024 · 11:00',
    score: 82,
    status: 'optimal',
    statusLabel: 'Simétrico',
    stride: '1.38×',
    asymmetryMm: '5.1 mm',
    affectedLimb: 'Mano Der (RF)',
    isDemo: true,
  },
];

export default function HistoryView({
  sessions = DEFAULT_SESSIONS,
  horses = [],
  onSelectSession,
  onClearDemoSessions,
  onSelectNav,
}) {
  const [filter, setFilter] = useState('Todos');

  // Dynamic filter chips derived from both registered horses and session records
  const horseFilterOptions = useMemo(() => {
    const names = new Set();
    (horses || []).forEach((h) => {
      if (h?.name) names.add(h.name);
    });
    (sessions || []).forEach((s) => {
      if (s?.horse) names.add(s.horse);
    });
    return ['Todos', ...Array.from(names)];
  }, [horses, sessions]);

  const filteredSessions = filter === 'Todos'
    ? sessions
    : sessions.filter((s) => s.horse?.toLowerCase() === filter.toLowerCase());

  const chartHorseName = useMemo(() => {
    if (filter !== 'Todos') return filter;
    if (horses.length > 0 && horses[0]?.name) return horses[0].name;
    if (sessions.length > 0 && sessions[0]?.horse) return sessions[0].horse;
    return 'Equino';
  }, [filter, horses, sessions]);

  const hasDemoSessions = useMemo(() => {
    return sessions.some(
      (s) => s.isDemo || ['dakota', 'tornado', 'eclipse'].includes((s.horse || '').toLowerCase())
    );
  }, [sessions]);

  return (
    <div className="flex flex-col gap-3.5 pt-1 view-enter">
      {/* Header Card */}
      <div className="rounded-[24px] card-3d p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-[14px] card-3d-subtle flex items-center justify-center text-[#0D3F2E] dark:text-[#10B981] shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-mono text-[16px] font-extrabold text-slate-900 dark:text-white truncate">
              Historial de Evaluaciones
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'sesión' : 'sesiones'} · {filter}
            </p>
          </div>
        </div>

        {hasDemoSessions && onClearDemoSessions && (
          <button
            type="button"
            onClick={onClearDemoSessions}
            className="text-[10.5px] font-bold text-slate-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 transition shrink-0 active:scale-95"
          >
            Limpiar demos
          </button>
        )}
      </div>

      {/* Dynamic Horse Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {horseFilterOptions.map((name) => {
          const active = filter === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className={`font-mono text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap card-3d-interactive shrink-0 ${
                active
                  ? 'card-3d-racing-green text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Longitudinal Evolution Trend Chart */}
      <HorseEvolutionChart
        horseName={chartHorseName}
        sessions={sessions}
        onSelectSession={onSelectSession}
      />

      {/* Session Cards Title */}
      <div className="flex items-center justify-between px-1 pt-1">
        <h3 className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">
          Sesiones Individuales {filter !== 'Todos' ? `· ${filter}` : ''}
        </h3>
        <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
          Toca para abrir análisis
        </span>
      </div>

      {/* Session Cards List or Clean Empty State */}
      {filteredSessions.length === 0 ? (
        <div className="rounded-[24px] card-3d p-6 text-center flex flex-col items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF4F2] dark:bg-[#0F1619] text-[#0F3D44] dark:text-[#00D1C2] flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-mono text-[14px] font-bold text-slate-900 dark:text-white">
              Sin evaluaciones registradas
            </h4>
            <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-1 max-w-[280px]">
              {filter !== 'Todos'
                ? `Aún no hay análisis biomecánicos para ${filter}.`
                : 'Aún no has evaluado ningún video en tu cuadra.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectNav?.('home')}
            className="mt-1 px-4 py-2 rounded-full card-3d-racing-green text-white font-mono text-[11px] font-bold shadow-md active:scale-95 transition"
          >
            Evaluar en Tu Pista
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredSessions.map((session) => {
            const isOptimal = session.status === 'optimal';
            const scoreColor = isOptimal ? '#10B981' : '#F59E0B';

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession?.(session)}
                className="rounded-[20px] card-3d-interactive p-3.5 flex flex-col gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.985]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-[14px] font-bold text-slate-900 dark:text-white">
                        {session.horse}
                      </h3>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full card-3d-subtle text-slate-600 dark:text-zinc-400 font-semibold">
                        {session.discipline}
                      </span>
                      {session.isDemo && (
                        <span className="font-mono text-[8.5px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 font-medium">
                          Demo
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {session.date}
                    </span>
                  </div>

                  {/* Score Badge */}
                  <div
                    className="px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-mono text-[12px] font-extrabold border"
                    style={{
                      backgroundColor: `${scoreColor}18`,
                      color: scoreColor,
                      borderColor: `${scoreColor}35`,
                    }}
                  >
                    {isOptimal ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{session.score}%</span>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-white/5 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[9px] block">Estado</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">
                      {session.statusLabel}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block">Zancada</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">
                      {session.stride}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block">Asimetría</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">
                      {session.asymmetryMm}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
