import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Play,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Lock,
  X,
  Check,
  ArrowRight,
  Bot,
  ChevronRight,
  RotateCcw,
  Activity,
} from 'lucide-react';

const FALLBACK_HORSE_PHOTO =
  'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=900&q=80';

/**
 * Screen 1: UploadView (Tu Pista Hoy)
 * 100% Native Mobile Experience:
 * - Editorial canvas header + Horizontal scrollable horse selector pills
 * - Full-bleed photographic Hero Showcase Card with 1-tap camera trigger
 * - Clean video preview + vibrant Analyze CTA ONLY when a video is ready
 * - Circular SVG Progress Ring ("Estado Biomecánico") inspired by top fitness apps
 * - Thumb-zone primary camera CTA & 2-column quick action tiles
 * - Native iOS Bottom Sheet Horse Picker with grabber bar & 1/5/50 plan quota lock
 */
export default function UploadView({
  selectedFile,
  onSelectFile,
  onAnalyzeFile,
  horses = [],
  selectedHorse,
  onSelectHorse,
  maxHorses = 1,
  sessions = [],
  onSelectNav,
  onSelectSession,
  onOpenNewHorseModal,
  onOpenPricing,
  onOpenCamera,
  isAnalyzing,
  analysisStepLabel,
  errorMsg,
  onClearError,
}) {
  const fileInputRef = useRef(null);
  const [isHorsePickerOpen, setIsHorsePickerOpen] = useState(false);

  const handleOpenCam = onOpenCamera || (() => {});

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onClearError?.();
      onSelectFile(file);
    }
    e.target.value = '';
  };

  // Require an active selected horse before recording, uploading, or analyzing
  const requireHorseThen = (actionCallback) => {
    if (!selectedHorse) {
      if (horses.length === 0) {
        onOpenNewHorseModal?.();
      } else {
        setIsHorsePickerOpen(true);
      }
      return false;
    }
    actionCallback?.();
    return true;
  };

  const isQuotaReached = horses.length >= maxHorses;

  const latestHorseSession = useMemo(() => {
    if (!selectedHorse?.name) return null;
    return (
      sessions.find(
        (s) => s.horse?.toLowerCase() === selectedHorse.name.toLowerCase()
      ) || null
    );
  }, [sessions, selectedHorse]);

  const hasEvaluations = Boolean(latestHorseSession || selectedHorse?.lastScore);
  const heroScore = hasEvaluations
    ? Math.round(latestHorseSession?.score ?? selectedHorse?.lastScore ?? 80)
    : null;
  const isOptimal = heroScore !== null ? heroScore >= 80 : true;
  const statusLabel =
    latestHorseSession?.statusLabel || (isOptimal ? 'Simétrico' : 'Atención');
  const asymLabel = latestHorseSession?.asymmetryMm || null;

  // Ring geometry for "Estado Biomecánico"
  const ringRadius = 30;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = heroScore !== null ? ringCircumference * (1 - heroScore / 100) : ringCircumference;

  return (
    <div className="flex flex-col gap-4 pt-1">
      {/* Hidden native gallery file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. Editorial Header directly on the canvas */}
      <div className="px-0.5 flex items-end justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-[#0F3D44]/75 dark:text-[#00D1C2] tracking-tight">
            Laboratorio Biomecánico
          </p>
          <h1 className="text-[26px] font-extrabold text-[#071B24] dark:text-white tracking-tight leading-tight">
            Tu Pista Hoy
          </h1>
        </div>

        {selectedHorse && (
          <button
            type="button"
            onClick={() => setIsHorsePickerOpen(true)}
            className="text-[11px] font-bold text-[#0F3D44] dark:text-[#00D1C2] bg-white dark:bg-[#141C20] border border-slate-200/70 dark:border-white/10 px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition shrink-0"
          >
            {horses.length}/{maxHorses} cupo
          </button>
        )}
      </div>

      {/* 2. Horizontal Pill Selector (Velocis / Pet Adoption style) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {horses.map((horse) => {
          const active = selectedHorse?.id === horse.id;
          return (
            <button
              key={horse.id}
              type="button"
              onClick={() => onSelectHorse?.(horse)}
              className={`rounded-full p-1 pr-3.5 flex items-center gap-2 transition-all active:scale-95 shrink-0 ${
                active
                  ? 'bg-[#0F3D44] dark:bg-[#14545E] text-white shadow-md'
                  : 'bg-white dark:bg-[#141C20] text-[#071B24] dark:text-zinc-200 border border-slate-200/70 dark:border-white/10 shadow-sm'
              }`}
            >
              <img
                src={horse.photoUrl || FALLBACK_HORSE_PHOTO}
                alt={horse.name}
                className="w-7 h-7 rounded-full object-cover border border-white/40 shrink-0"
              />
              <span className="text-[12.5px] font-bold whitespace-nowrap">
                {horse.name}
              </span>
            </button>
          );
        })}

        {horses.length === 0 ? (
          <button
            type="button"
            onClick={() => onOpenNewHorseModal?.()}
            className="rounded-full px-4 py-2 bg-[#0F3D44] text-white text-[12.5px] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir caballo</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsHorsePickerOpen(true)}
            className="rounded-full px-3.5 py-2 bg-white dark:bg-[#141C20] border border-slate-200/70 dark:border-white/10 text-[#0F3D44] dark:text-[#00D1C2] text-[12px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition shrink-0"
          >
            <span>Cambiar / + Nuevo</span>
          </button>
        )}
      </div>

      {/* 3. Hero Showcase Card / Active Video Preview */}
      {previewUrl && selectedFile ? (
        <section className="flex flex-col gap-3 view-enter">
          <div className="rounded-[28px] overflow-hidden bg-white dark:bg-[#141C20] border border-slate-200/70 dark:border-white/10 shadow-[0_14px_36px_-6px_rgba(7,27,36,0.10)]">
            <video
              src={previewUrl}
              className="w-full aspect-[16/10] object-cover bg-black"
              controls
              playsInline
              muted
            />
            <div className="px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-[#00D1C2] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#071B24] dark:text-white truncate">
                    {selectedHorse?.name ? `Video para ${selectedHorse.name}` : selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums truncate">
                    {selectedFile.name} · {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => {
                  onClearError?.();
                  onSelectFile?.(null);
                }}
                className="px-3 py-1.5 rounded-full bg-[#F4F7F6] dark:bg-[#0F1619] text-[#0F3D44] dark:text-zinc-200 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Cambiar</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => requireHorseThen(onAnalyzeFile)}
            className="w-full min-h-[60px] rounded-[24px] card-3d-racing-green px-5 py-3.5 flex items-center justify-between gap-3 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg"
          >
            <div className="text-left">
              <span className="block text-[15px] font-extrabold text-white">
                {isAnalyzing ? 'Analizando Biomecánica...' : 'Iniciar Análisis Biomecánico'}
              </span>
              <span className="block text-[11px] text-white/75 mt-0.5">
                {isAnalyzing
                  ? analysisStepLabel || 'Procesando puntos articulares'
                  : 'Detección de simetría, zancada y dorso IA'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#D9F99D] text-[#071B24] flex items-center justify-center shrink-0 shadow">
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>
          </button>

          {!isAnalyzing && (
            <button
              type="button"
              onClick={() => {
                onClearError?.();
                onSelectFile?.(null);
              }}
              className="w-full py-2 text-center text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition active:scale-95"
            >
              Descartar video y volver a Tu Pista
            </button>
          )}
        </section>
      ) : !selectedHorse ? (
        /* Empty Stable Onboarding Hero Card */
        <button
          type="button"
          onClick={() =>
            horses.length === 0 ? onOpenNewHorseModal?.() : setIsHorsePickerOpen(true)
          }
          className="relative w-full rounded-[28px] overflow-hidden min-h-[210px] flex flex-col justify-between p-5 text-left active:scale-[0.985] transition-all shadow-[0_18px_40px_-8px_rgba(7,27,36,0.22)]"
        >
          <img
            src={FALLBACK_HORSE_PHOTO}
            alt="Registrar primer caballo"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071B24] via-[#071B24]/55 to-black/20" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white">
              Tu Cuadra · Paso 1
            </span>
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            <div>
              <h2 className="text-[22px] font-extrabold text-white tracking-tight leading-tight">
                {horses.length === 0
                  ? 'Registra tu primer caballo'
                  : 'Selecciona un ejemplar'}
              </h2>
              <p className="text-[12px] text-white/80 mt-1">
                Necesario para guardar su evolución clínica y comparar simetría.
              </p>
            </div>
            <span className="self-start px-4 py-2 rounded-full bg-[#D9F99D] text-[#071B24] text-[12.5px] font-extrabold inline-flex items-center gap-1.5 shadow-md">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {horses.length === 0
                  ? 'Dar de alta mi primer caballo'
                  : 'Elegir caballo'}
              </span>
            </span>
          </div>
        </button>
      ) : (
        /* Active Horse Photographic Hero Showcase Card (Velocis + Horse Riding Club style) */
        <section className="relative rounded-[28px] overflow-hidden min-h-[215px] shadow-[0_18px_40px_-8px_rgba(7,27,36,0.22)] flex flex-col justify-between p-4">
          <img
            src={selectedHorse.photoUrl || FALLBACK_HORSE_PHOTO}
            alt={selectedHorse.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071B24]/95 via-[#071B24]/35 to-black/15" />

          {/* Top badges */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white truncate">
              {selectedHorse.discipline}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white flex items-center gap-1.5 shrink-0 tabular-nums">
              {hasEvaluations ? (
                <>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOptimal ? 'bg-[#D9F99D]' : 'bg-amber-400'
                    }`}
                  />
                  Score {heroScore} · {statusLabel}
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#00D1C2]" />
                  Sin evaluar aún
                </>
              )}
            </span>
          </div>

          {/* Bottom horse identity + Floating Camera Trigger */}
          <div className="relative z-10 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[24px] font-extrabold text-white tracking-tight leading-none truncate">
                {selectedHorse.name}
              </h2>
              <p className="text-[12px] text-white/80 mt-1.5 truncate">
                {selectedHorse.breed}
                {selectedHorse.age ? ` · ${selectedHorse.age} años` : ''}
              </p>
            </div>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => requireHorseThen(handleOpenCam)}
              aria-label="Abrir cámara guiada de 20s"
              className="w-[52px] h-[52px] rounded-full bg-[#D9F99D] text-[#071B24] flex items-center justify-center shadow-[0_8px_22px_rgba(0,0,0,0.35)] hover:scale-105 active:scale-95 transition shrink-0"
            >
              <Camera className="w-6 h-6 stroke-[2.2]" />
            </button>
          </div>
        </section>
      )}

      {/* 4. "Estado Biomecánico" - ONLY shown when no video is currently staged */}
      {!selectedFile && selectedHorse && (
        hasEvaluations ? (
          <section className="rounded-[26px] card-3d p-4 flex items-center justify-between gap-4">
            <div className="relative w-[78px] h-[78px] shrink-0 flex items-center justify-center">
              <svg width="78" height="78" viewBox="0 0 78 78" className="-rotate-90">
                <circle
                  cx="39"
                  cy="39"
                  r={ringRadius}
                  className="stroke-[#E9EFEF] dark:stroke-white/10"
                  strokeWidth="7"
                  fill="none"
                />
                <circle
                  cx="39"
                  cy="39"
                  r={ringRadius}
                  stroke={isOptimal ? '#0F3D44' : '#F59E0B'}
                  className={isOptimal ? 'dark:stroke-[#00D1C2]' : ''}
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[20px] font-extrabold text-[#071B24] dark:text-white tabular-nums leading-none">
                  {heroScore}%
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[14px] font-extrabold text-[#071B24] dark:text-white truncate">
                  Estado Biomecánico
                </h3>
                {latestHorseSession && onSelectSession && (
                  <button
                    type="button"
                    onClick={() => onSelectSession(latestHorseSession)}
                    className="text-[11px] font-bold text-[#0F3D44] dark:text-[#00D1C2] flex items-center gap-0.5 shrink-0 hover:underline"
                  >
                    <span>Informe</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1 text-[12px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOptimal ? 'bg-[#00D1C2]' : 'bg-amber-400'
                      }`}
                    />
                    Simetría
                  </span>
                  <span className="font-bold text-[#071B24] dark:text-white truncate">
                    {statusLabel}
                  </span>
                </div>
                {asymLabel && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-[#0F3D44] dark:bg-emerald-400" />
                      Asimetría
                    </span>
                    <span className="font-bold text-[#071B24] dark:text-white tabular-nums">
                      {asymLabel}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-[#D9F99D] ring-1 ring-slate-300 dark:ring-0" />
                    Disciplina
                  </span>
                  <span className="font-bold text-[#071B24] dark:text-white truncate">
                    {selectedHorse.discipline}
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[26px] card-3d p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0F3D44]/10 dark:bg-[#00D1C2]/15 text-[#0F3D44] dark:text-[#00D1C2] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13.5px] font-extrabold text-[#071B24] dark:text-white">
                Estado Biomecánico · Primer Análisis
              </h3>
              <p className="text-[11.5px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                {selectedHorse.name} aún no tiene evaluaciones previas. Graba 20s de trote lateral para calcular su simetría.
              </p>
            </div>
          </section>
        )
      )}

      {/* 5. Thumb-Zone Primary Action & 2-Column Quick Actions - ONLY shown when no video is staged */}
      {!selectedFile && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => requireHorseThen(handleOpenCam)}
            className="w-full rounded-[22px] min-h-[60px] card-3d-racing-green px-4 py-3 flex items-center justify-between gap-3 disabled:opacity-55"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-[#D9F99D] shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[15px] font-extrabold text-white leading-tight truncate">
                  Grabar Trote en Pista
                </span>
                <span className="block text-[11px] text-white/75 mt-0.5 truncate">
                  Secuencia guiada de 20s · Lateral 90°
                </span>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-[#D9F99D] text-[#071B24] flex items-center justify-center shrink-0 shadow">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => requireHorseThen(() => fileInputRef.current?.click())}
              className="rounded-[22px] card-3d-interactive p-3.5 flex items-center gap-3 text-left disabled:opacity-55"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#EEF4F2] dark:bg-[#0F1619] flex items-center justify-center text-[#0F3D44] dark:text-[#00D1C2] shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[13px] font-extrabold text-[#071B24] dark:text-white leading-tight truncate">
                  Importar Video
                </span>
                <span className="block text-[10.5px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                  Desde carrete
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectNav?.('ia')}
              className="rounded-[22px] card-3d-interactive p-3.5 flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#F2F7E4] dark:bg-[#192416] flex items-center justify-center text-[#3D5A09] dark:text-[#D9F99D] shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[13px] font-extrabold text-[#071B24] dark:text-white leading-tight truncate">
                  Agente IA
                </span>
                <span className="block text-[10.5px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                  Veterinario 24/7
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Active Pipeline Execution Progress Card */}
      {isAnalyzing && (
        <section
          aria-live="polite"
          className="rounded-[24px] bg-emerald-50/90 dark:bg-[#112224] border border-[#0F3D44]/20 dark:border-[#00D1C2]/30 p-4 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-[#0F3D44]/10 dark:bg-[#00D1C2]/15 flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 text-[#0F3D44] dark:text-[#00D1C2] animate-spin" />
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-extrabold text-[#071B24] dark:text-white">
              Procesando Video...
            </p>
            <p className="text-[12px] text-slate-600 dark:text-zinc-300 mt-0.5 leading-snug">
              {analysisStepLabel || 'Analizando zancadas y simetría'}
            </p>
          </div>
        </section>
      )}

      {/* Explicit Error Recovery Card */}
      {errorMsg && !isAnalyzing && (
        <section
          role="alert"
          className="rounded-[24px] bg-red-50 dark:bg-[#1E1215] border border-[#EF4444]/30 p-4 flex items-start gap-3 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#EF4444]">
              No se pudo procesar el video
            </p>
            <p className="text-[12px] text-slate-700 dark:text-zinc-300 mt-0.5 leading-snug">
              {errorMsg}
            </p>
          </div>
        </section>
      )}

      <div className="h-1" />

      {/* ================================================================ */}
      {/* BOTTOM SHEET SELECCIONADOR DE CABALLO (Teapot Glass Sheet style) */}
      {/* ================================================================ */}
      {isHorsePickerOpen && (
        <div
          className="fixed inset-0 z-[180] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 view-enter"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHorsePickerOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-[430px] max-h-[85vh] bg-[#F2F5F4] dark:bg-[#11191D] border border-slate-200/80 dark:border-white/10 flex flex-col rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Native iOS Grabber Pill */}
            <div className="pt-2.5 pb-1 bg-white dark:bg-[#141C20] flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-600" />
            </div>

            {/* Header */}
            <div className="px-5 pt-2 pb-4 bg-white dark:bg-[#141C20] border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-[16px] font-extrabold text-[#071B24] dark:text-white tracking-tight">
                  Selecciona el Caballo a Evaluar
                </h3>
                <p className="text-[11.5px] text-slate-500 dark:text-zinc-400">
                  El análisis se guardará en su historial clínico
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHorsePickerOpen(false)}
                className="w-9 h-9 rounded-full bg-[#F4F7F6] dark:bg-[#0F1619] flex items-center justify-center text-slate-500 dark:text-zinc-400 active:scale-90 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Horse List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 no-scrollbar">
              {horses.map((horse) => {
                const isSelected = selectedHorse?.id === horse.id;
                return (
                  <button
                    key={horse.id}
                    type="button"
                    onClick={() => {
                      onSelectHorse?.(horse);
                      setIsHorsePickerOpen(false);
                    }}
                    className={`w-full p-3 rounded-[22px] flex items-center justify-between gap-3 text-left transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-[#141C20] ring-2 ring-[#0F3D44] dark:ring-[#00D1C2] shadow-md'
                        : 'bg-white dark:bg-[#141C20] border border-slate-200/70 dark:border-white/10 hover:border-[#0F3D44]/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={horse.photoUrl || FALLBACK_HORSE_PHOTO}
                        alt={horse.name}
                        className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-sm"
                      />
                      <div className="min-w-0">
                        <p className="text-[14px] font-extrabold text-[#071B24] dark:text-white truncate">
                          {horse.name}
                        </p>
                        <p className="text-[11.5px] text-slate-500 dark:text-zinc-400 truncate">
                          {horse.breed} · {horse.discipline}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-7 h-7 rounded-full bg-[#0F3D44] dark:bg-[#00D1C2] text-white dark:text-[#071B24] flex items-center justify-center shrink-0 shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Quota + Add / Upgrade Button */}
            <div className="p-4 bg-white dark:bg-[#141C20] border-t border-slate-200/70 dark:border-white/10 flex flex-col gap-2.5 shrink-0">
              <div className="flex items-center justify-between text-[11.5px] text-slate-500 dark:text-zinc-400 px-1">
                <span>Cupo utilizado</span>
                <strong className="text-[#071B24] dark:text-zinc-200">
                  {horses.length} de {maxHorses}{' '}
                  {maxHorses === 1 ? 'caballo en tu plan' : 'caballos en tu plan'}
                </strong>
              </div>

              {isQuotaReached ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsHorsePickerOpen(false);
                    onOpenPricing?.();
                  }}
                  className="w-full min-h-[48px] px-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[12.5px] font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Dar de alta otro caballo · Requiere Upgrade de Plan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsHorsePickerOpen(false);
                    onOpenNewHorseModal?.();
                  }}
                  className="w-full min-h-[48px] px-4 rounded-full card-3d-racing-green text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar nuevo caballo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
