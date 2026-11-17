import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Video,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import HorseEvolutionChart from './HorseEvolutionChart';

export default function HorsesView({
  horses,
  sessions = [],
  onOpenNewHorseModal,
  onOpenEditHorseModal,
  onSelectHorseForEvaluation,
  onSelectSession
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todos');
  const [expandedEvolutionHorseId, setExpandedEvolutionHorseId] = useState(null);

  const disciplines = ['Todos', 'Salto Clásico', 'Doma Clásica', 'Carrera', 'Polo'];

  const filteredHorses = horses.filter((horse) => {
    const matchesSearch = horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      horse.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiscipline = selectedDiscipline === 'Todos' || horse.discipline === selectedDiscipline;
    return matchesSearch && matchesDiscipline;
  });

  const toggleEvolution = (horseId) => {
    setExpandedEvolutionHorseId((prev) => (prev === horseId ? null : horseId));
  };

  return (
    <div className="flex flex-col gap-3.5 pt-1 view-enter">
      {/* Top Header Card */}
      <div className="rounded-[24px] card-3d p-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="font-mono text-[16px] font-extrabold text-slate-900 dark:text-white">
            Cuadra de Ejemplares
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            {horses.length} caballos registrados
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewHorseModal}
          className="min-h-[42px] px-3.5 rounded-xl card-3d-racing-green text-white font-mono text-[12px] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o raza..."
          className="w-full bg-white dark:bg-[#16161B] border border-slate-300 dark:border-[#2D2D33] rounded-2xl pl-10 pr-3.5 py-2.5 text-[12px] font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0D3F2E] shadow-sm"
        />
      </div>

      {/* Discipline Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {disciplines.map((d) => {
          const active = selectedDiscipline === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDiscipline(d)}
              className={`font-mono text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap card-3d-interactive ${
                active
                  ? 'card-3d-racing-green text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Horses Cards List */}
      <div className="flex flex-col gap-3">
        {filteredHorses.map((horse) => {
          const isOptimal = (horse.lastScore || 85) >= 80;
          const scoreColor = isOptimal ? '#10B981' : '#F59E0B';

          return (
            <div
              key={horse.id}
              className="rounded-[22px] card-3d overflow-hidden p-3.5 flex flex-col gap-3 shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Horse Photo */}
                <img
                  src={horse.photoUrl || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=500&q=80'}
                  alt={horse.name}
                  className="w-20 h-20 rounded-[18px] object-cover shrink-0 border border-slate-200 dark:border-[#26262A] shadow-sm"
                />

                {/* Horse Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-mono text-[16px] font-extrabold text-slate-900 dark:text-white truncate">
                      {horse.name}
                    </h3>
                    <div
                      className="px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono text-[11px] font-extrabold border shrink-0"
                      style={{
                        backgroundColor: `${scoreColor}18`,
                        color: scoreColor,
                        borderColor: `${scoreColor}35`,
                      }}
                    >
                      <span>{horse.lastScore || 85}/100</span>
                    </div>
                  </div>

                  <p className="font-mono text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">
                    {horse.breed}
                  </p>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full card-3d-subtle text-[#0D3F2E] dark:text-[#10B981] font-bold border border-[#0D3F2E]/20 dark:border-emerald-500/30">
                      {horse.discipline}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                      {horse.age} años · {horse.sex} · {horse.height}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes snippet if exists */}
              {horse.notes && (
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 bg-slate-100/70 dark:bg-[#16161B] rounded-xl px-2.5 py-1.5 leading-snug font-sans italic border border-slate-200/60 dark:border-[#26262A]">
                  "{horse.notes}"
                </p>
              )}

              {/* Actions Footer */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-200 dark:border-[#26262A]">
                <button
                  type="button"
                  onClick={() => onOpenEditHorseModal(horse)}
                  className="min-h-[38px] px-2 rounded-xl card-3d-interactive text-slate-700 dark:text-zinc-300 font-mono text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition shadow-sm"
                  title="Editar Ficha"
                >
                  <Pencil className="w-3 h-3" />
                  <span className="truncate">Ficha</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleEvolution(horse.id)}
                  className={`min-h-[38px] px-2 rounded-xl font-mono text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition shadow-sm ${
                    expandedEvolutionHorseId === horse.id
                      ? 'card-3d-racing-green text-white ring-2 ring-[#0D3F2E]/30'
                      : 'card-3d-interactive text-[#0D3F2E] dark:text-[#10B981]'
                  }`}
                  title="Ver Evolución en el Tiempo"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span className="truncate">Evolución</span>
                  {expandedEvolutionHorseId === horse.id ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectHorseForEvaluation(horse)}
                  className="min-h-[38px] px-2 rounded-xl card-3d-racing-green text-white font-mono text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition shadow-md"
                  title="Evaluar Trote"
                >
                  <Video className="w-3 h-3 text-white" />
                  <span className="truncate">Evaluar</span>
                </button>
              </div>

              {/* Inline Longitudinal Evolution Chart */}
              {expandedEvolutionHorseId === horse.id && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-[#26262A] view-enter">
                  <HorseEvolutionChart
                    horseName={horse.name}
                    sessions={sessions}
                    onSelectSession={onSelectSession}
                  />
                </div>
              )}
            </div>
          );
        })}

        {filteredHorses.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-mono text-[12px]">
            No se encontraron ejemplares con ese filtro.
          </div>
        )}
      </div>
    </div>
  );
}
