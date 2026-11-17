import React, { useState } from 'react';
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
  ArrowUpRight
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
  },
];

export default function HistoryView({
  sessions = DEFAULT_SESSIONS,
  onSelectSession
}) {
  const [filter, setFilter] = useState('Todos');
  const horses = ['Todos', 'Dakota', 'Tornado', 'Eclipse'];

  const filteredSessions = filter === 'Todos'
    ? sessions
    : sessions.filter((s) => s.horse?.toLowerCase() === filter.toLowerCase());

  const chartHorseName = filter === 'Todos' ? 'Dakota' : filter;

  return (
    <div className="flex flex-col gap-3.5 pt-1 view-enter">
      {/* Header Card */}
      <div className="rounded-[24px] card-3d p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[14px] card-3d-subtle flex items-center justify-center text-[#0D3F2E] dark:text-[#10B981]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono text-[16px] font-extrabold text-slate-900 dark:text-white">
              Historial de Evaluaciones
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {filteredSessions.length} sesiones registradas
            </p>
          </div>
        </div>
      </div>

      {/* Horse Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {horses.map((name) => {
          const active = filter === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className={`font-mono text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap card-3d-interactive ${
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

      {/* Session Cards List */}
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
                  <span>{session.score}/100</span>
                </div>
              </div>

              {/* Metric Row */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-[#26262A] font-mono text-[10px]">
                <div>
                  <span className="text-slate-500 dark:text-zinc-500 block">Zancada</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-bold">{session.stride}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-zinc-500 block">Asimetría</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-bold">{session.asymmetryMm}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-zinc-500 block">Hallazgo</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-bold truncate block">{session.affectedLimb}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
