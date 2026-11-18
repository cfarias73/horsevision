import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Video,
  AlertCircle,
  Search,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Crown,
} from 'lucide-react';
import HorseEvolutionChart from './HorseEvolutionChart';

const FALLBACK_HORSE_PHOTO =
  'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=500&q=80';

/**
 * HorsesView (Mi Cuadra):
 * Editorial native mobile horse cards inspired by Pet Adoption & Horse Riding Club.
 * Preserves 1/5/50 plan quota bar, upgrade trigger, filters, and inline evolution chart.
 */
export default function HorsesView({
  horses = [],
  sessions = [],
  maxHorses = 1,
  onOpenPricing,
  onOpenNewHorseModal,
  onOpenEditHorseModal,
  onSelectHorseForEvaluation,
  onSelectSession,
  onDeleteSession,
  onDeleteAllSessions,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todos');
  const [expandedEvolutionHorseId, setExpandedEvolutionHorseId] = useState(null);

  const disciplines = ['Todos', 'Salto Clásico', 'Doma Clásica', 'Carrera', 'Polo'];

  const isQuotaReached = horses.length >= maxHorses;
  const quotaPct = Math.min(100, Math.round((horses.length / Math.max(1, maxHorses)) * 100));

  const filteredHorses = horses.filter((horse) => {
    const matchesSearch =
      horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      horse.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiscipline =
      selectedDiscipline === 'Todos' || horse.discipline === selectedDiscipline;
    return matchesSearch && matchesDiscipline;
  });

  const toggleEvolution = (horseId) => {
    setExpandedEvolutionHorseId((prev) => (prev === horseId ? null : horseId));
  };

  return (
    <div className="flex flex-col gap-3.5 pt-1 view-enter">
      {/* 1. Editorial Header directly on the canvas */}
      <div className="px-0.5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#0F3D44]/75 dark:text-[#00D1C2]">
            {horses.length} de {maxHorses}{' '}
            {maxHorses === 1 ? 'caballo en tu plan' : 'caballos en tu plan'}
          </p>
          <h2 className="text-[25px] font-extrabold text-[#071B24] dark:text-white tracking-tight leading-tight">
            Mi Cuadra
          </h2>
        </div>

        {isQuotaReached ? (
          <button
            type="button"
            onClick={onOpenPricing}
            className="min-h-[40px] px-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition shrink-0"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Ampliar Plan</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenNewHorseModal}
            className="min-h-[40px] px-4 rounded-full card-3d-racing-green text-white text-[12.5px] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar</span>
          </button>
        )}
      </div>

      {/* Subtle Quota Progress Track */}
      <div className="px-0.5 flex flex-col gap-2">
        <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isQuotaReached ? 'bg-amber-500' : 'bg-[#0F3D44] dark:bg-[#00D1C2]'
            }`}
            style={{ width: `${quotaPct}%` }}
          />
        </div>

        {isQuotaReached && (
          <div className="rounded-[20px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 p-3 flex items-start gap-2.5 text-[11.5px] text-amber-900 dark:text-amber-200 leading-snug">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              Alcanzaste el límite de <strong>{maxHorses}</strong>{' '}
              {maxHorses === 1 ? 'ejemplar' : 'ejemplares'} de tu plan. Edita la ficha actual o amplía tu plan a{' '}
              <strong>5</strong> o <strong>50</strong> caballos.
            </span>
          </div>
        )}
      </div>

      {/* 2. Pill Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o raza..."
          className="w-full bg-white dark:bg-[#141C20] border border-slate-200/70 dark:border-white/10 rounded-full pl-11 pr-4 py-2.5 text-[13px] text-[#071B24] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F3D44]/25 shadow-sm"
        />
      </div>

      {/* 3. Pill Discipline Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {disciplines.map((d) => {
          const active = selectedDiscipline === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDiscipline(d)}
              className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap active:scale-95 ${
                active
                  ? 'bg-[#0F3D44] dark:bg-[#14545E] text-white shadow-sm'
                  : 'bg-white dark:bg-[#141C20] text-slate-600 dark:text-zinc-300 border border-slate-200/70 dark:border-white/10 shadow-sm'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* 4. Editorial Horse Cards */}
      <div className="flex flex-col gap-3">
        {filteredHorses.map((horse) => {
          const score = horse.lastScore || 85;
          const isOptimal = score >= 80;
          const scoreColor = isOptimal ? '#0F3D44' : '#D97706';

          return (
            <div
              key={horse.id}
              className="rounded-[26px] card-3d overflow-hidden p-4 flex flex-col gap-3.5 transition-all"
            >
              <div className="flex items-center gap-3.5">
                {/* Large Rounded Horse Photo (Pet Adoption style) */}
                <img
                  src={horse.photoUrl || FALLBACK_HORSE_PHOTO}
                  alt={horse.name}
                  className="w-24 h-24 rounded-[22px] object-cover shrink-0 shadow-md"
                />

                {/* Editorial Horse Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[18px] font-extrabold text-[#071B24] dark:text-white tracking-tight truncate">
                      {horse.name}
                    </h3>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums shrink-0 dark:bg-emerald-500/20 dark:text-emerald-300"
                      style={{
                        backgroundColor: isOptimal ? '#E7F3F1' : '#FEF3C7',
                        color: scoreColor,
                      }}
                    >
                      {score}/100
                    </span>
                  </div>

                  <p className="text-[12.5px] font-semibold text-slate-600 dark:text-zinc-300 mt-0.5 truncate">
                    {horse.breed}
                  </p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-[#EEF4F2] dark:bg-[#0F1619] text-[#0F3D44] dark:text-[#00D1C2] font-bold">
                      {horse.discipline}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {horse.age} años · {horse.sex} · {horse.height}m
                    </span>
                  </div>
                </div>
              </div>

              {horse.notes && (
                <p className="text-[11.5px] text-slate-600 dark:text-zinc-300 bg-[#F4F7F6] dark:bg-[#0F1619] rounded-2xl px-3 py-2 leading-snug italic">
                  "{horse.notes}"
                </p>
              )}

              {/* 3 Pill Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenEditHorseModal(horse)}
                  className="min-h-[40px] px-2.5 rounded-full bg-[#F4F7F6] dark:bg-[#0F1619] text-[#071B24] dark:text-zinc-200 text-[11.5px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
                  title="Editar Ficha"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="truncate">Ficha</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleEvolution(horse.id)}
                  className={`min-h-[40px] px-2.5 rounded-full text-[11.5px] font-bold flex items-center justify-center gap-1 active:scale-95 transition ${
                    expandedEvolutionHorseId === horse.id
                      ? 'bg-[#0F3D44] text-white shadow-sm'
                      : 'bg-[#EEF4F2] dark:bg-[#0F2428] text-[#0F3D44] dark:text-[#00D1C2]'
                  }`}
                  title="Ver Evolución en el Tiempo"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="truncate">Evolución</span>
                  {expandedEvolutionHorseId === horse.id ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectHorseForEvaluation(horse)}
                  className="min-h-[40px] px-2.5 rounded-full card-3d-racing-green text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
                  title="Evaluar Trote"
                >
                  <Video className="w-3.5 h-3.5 text-[#D9F99D]" />
                  <span className="truncate">Evaluar</span>
                </button>
              </div>

              {/* Inline Longitudinal Evolution Chart */}
              {expandedEvolutionHorseId === horse.id && (
                <div className="mt-1 pt-3 border-t border-slate-100 dark:border-white/10 view-enter">
                  <HorseEvolutionChart
                    horseName={horse.name}
                    sessions={sessions}
                    onSelectSession={onSelectSession}
                    onDeleteSession={onDeleteSession}
                    onDeleteAllSessions={onDeleteAllSessions}
                  />
                </div>
              )}
            </div>
          );
        })}

        {filteredHorses.length === 0 && (
          <div className="rounded-[26px] card-3d p-8 text-center flex flex-col items-center gap-3">
            <p className="text-[13px] font-semibold text-slate-500 dark:text-zinc-400">
              {horses.length === 0
                ? 'Aún no tienes ejemplares registrados en tu cuadra.'
                : 'No se encontraron ejemplares con ese filtro.'}
            </p>
            {horses.length === 0 && (
              <button
                type="button"
                onClick={onOpenNewHorseModal}
                className="px-5 py-2.5 rounded-full card-3d-racing-green text-white text-[12.5px] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Dar de alta mi primer caballo</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
