import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  UploadCloud,
  Video,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Plus,
  Lock,
  X,
  Check,
} from 'lucide-react';

/**
 * Screen 1: UploadView (Evaluación de Trote)
 * Minimalist equestrian interface with mandatory Horse Selection step:
 * - Step 1: Select an existing horse (modal picker) or register the first horse
 * - Enforces plan upgrade when trying to register beyond maxHorses (1 / 5 / 50)
 * - Clear 3-pill recording quick reminder + direct camera/upload/analyze actions
 */
export default function UploadView({
  selectedFile,
  onSelectFile,
  onAnalyzeFile,
  horses = [],
  selectedHorse,
  onSelectHorse,
  maxHorses = 1,
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

  return (
    <div className="flex flex-col gap-3.5 pt-1">
      {/* Hidden native gallery file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Video Capture Card */}
      <section className="relative overflow-hidden rounded-[24px] card-3d p-4 shadow-sm">
        {/* Subtle British Racing Green ambient glow */}
        <div
          className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(13,63,46,0.18) 0%, rgba(248,250,252,0) 70%)',
          }}
        />

        {/* Brand Header */}
        <div className="relative flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-[14px] card-3d-subtle flex items-center justify-center shadow-sm shrink-0">
              <Video className="w-5 h-5 text-[#0D3F2E] dark:text-[#10B981]" />
            </div>
            <h1 className="font-mono text-[17px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white drop-shadow-sm truncate">
              Evaluación de Trote
            </h1>
          </div>
        </div>

        {/* Paso 1: Selector Obligatorio de Caballo */}
        <div className="mb-3.5">
          <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
            1. Caballo a Evaluar
          </span>

          {horses.length === 0 ? (
            <button
              type="button"
              onClick={() => onOpenNewHorseModal?.()}
              className="w-full p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-dashed border-amber-400/70 dark:border-amber-500/50 text-left flex items-center justify-between gap-2.5 hover:bg-amber-100/70 dark:hover:bg-amber-950/40 active:scale-[0.98] transition shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl card-3d-racing-green flex items-center justify-center text-white shrink-0 shadow">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[12px] font-extrabold text-amber-950 dark:text-amber-200 truncate">
                    + Dar de alta mi primer caballo
                  </p>
                  <p className="text-[10px] text-amber-800/90 dark:text-amber-300/80">
                    Requerido antes de grabar o analizar
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsHorsePickerOpen(true)}
              className={`w-full p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 active:scale-[0.98] transition shadow-sm ${
                selectedHorse
                  ? 'card-3d-subtle border-[#0D3F2E]/25 dark:border-emerald-500/30'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-400/70 dark:border-amber-500/50'
              }`}
            >
              {selectedHorse ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={
                      selectedHorse.photoUrl ||
                      'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={selectedHorse.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                  />
                  <div className="text-left min-w-0">
                    <p className="font-mono text-[13px] font-extrabold text-slate-900 dark:text-white truncate">
                      {selectedHorse.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                      {selectedHorse.breed} · {selectedHorse.discipline}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-left min-w-0 px-1">
                  <p className="font-mono text-[12px] font-extrabold text-amber-900 dark:text-amber-200">
                    Seleccionar caballo...
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-300/80">
                    Elige un ejemplar antes de grabar
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl card-3d-interactive text-[#0D3F2E] dark:text-[#10B981] font-mono text-[10px] font-bold shrink-0">
                <span>Cambiar / Seleccionar</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </button>
          )}
        </div>

        {/* Visual Touch Capture Stage */}
        {previewUrl && selectedFile ? (
          <div className="relative rounded-[20px] overflow-hidden card-3d-recessed mb-3.5 shadow-md">
            <video
              src={previewUrl}
              className="w-full aspect-[16/10] object-cover bg-black"
              controls
              playsInline
              muted
            />
            <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-[#09090B]/95 border-t border-slate-200 dark:border-[#26262A] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="font-mono text-[12px] text-slate-800 dark:text-white font-semibold truncate">
                  {selectedFile.name}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 shrink-0 tabular-nums font-semibold">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => requireHorseThen(handleOpenCam)}
            className="w-full group relative rounded-[20px] overflow-hidden border border-dashed border-slate-300 dark:border-[#26262A] hover:border-[#0D3F2E] dark:hover:border-[#10B981] card-3d-recessed px-4 py-8 mb-3.5 flex flex-col items-center justify-center text-center active:scale-[0.985] transition-all cursor-pointer"
          >
            <div className="relative mb-3">
              <div className="w-14 h-14 rounded-[20px] card-3d-interactive flex items-center justify-center shadow-sm group-hover:scale-105 transition-all">
                <UploadCloud className="w-7 h-7 text-[#0D3F2E] dark:text-[#10B981]" />
              </div>
            </div>

            <span className="font-mono text-[14px] font-extrabold text-slate-900 dark:text-white tracking-tight">
              Grabar / Seleccionar Video
            </span>
            {!selectedHorse && (
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                {horses.length === 0
                  ? 'Registra primero a tu caballo arriba'
                  : 'Selecciona un caballo para comenzar'}
              </span>
            )}
          </button>
        )}

        {/* Dual Native Capture & Gallery Touch Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => requireHorseThen(handleOpenCam)}
            className="min-h-[48px] px-3 rounded-[16px] card-3d-interactive flex items-center justify-center gap-2 text-slate-800 dark:text-white font-mono font-bold text-[13px] active:scale-[0.96] transition-all disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-[#0D3F2E] dark:text-[#10B981]" />
            <span>Grabar 16:9</span>
          </button>
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => requireHorseThen(() => fileInputRef.current?.click())}
            className="min-h-[48px] px-3 rounded-[16px] card-3d-interactive flex items-center justify-center gap-2 text-slate-800 dark:text-white font-mono font-bold text-[13px] active:scale-[0.96] transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
            <span>Subir Archivo</span>
          </button>
        </div>

        {/* Primary Action Button directly in the body */}
        <button
          type="button"
          disabled={!selectedFile || isAnalyzing}
          onClick={() => requireHorseThen(onAnalyzeFile)}
          className="w-full min-h-[52px] rounded-[16px] card-3d-racing-green active:scale-[0.98] transition-all font-mono text-[15px] font-bold text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Analizando...</span>
            </>
          ) : (
            <span>Analizar Video</span>
          )}
        </button>
      </section>

      {/* Active Pipeline Execution Progress Card */}
      {isAnalyzing && (
        <section
          aria-live="polite"
          className="rounded-[22px] bg-emerald-50/70 dark:bg-[#141417] border border-[#0D3F2E]/30 dark:border-[#10B981]/40 p-4 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-[#0D3F2E]/10 dark:bg-[#10B981]/15 border border-[#0D3F2E]/20 dark:border-[#10B981]/40 flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 text-[#0D3F2E] dark:text-[#10B981] animate-spin" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">
              Procesando Video...
            </p>
            <p className="text-[12px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-snug">
              {analysisStepLabel || 'Analizando zancadas y simetría'}
            </p>
          </div>
        </section>
      )}

      {/* Explicit Error Recovery Card */}
      {errorMsg && !isAnalyzing && (
        <section
          role="alert"
          className="rounded-[22px] bg-red-50 dark:bg-[#1A1113] border border-[#EF4444]/40 p-3.5 flex items-start gap-3 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[12px] font-bold text-[#EF4444]">
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
      {/* MODAL SELECCIONADOR DE CABALLO                                   */}
      {/* ================================================================ */}
      {isHorsePickerOpen && (
        <div
          className="fixed inset-0 z-[180] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 view-enter"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHorsePickerOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-[430px] max-h-[85vh] bg-[#F8FAFC] dark:bg-[#121217] border border-slate-300 dark:border-[#2D2D35] flex flex-col rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-white dark:bg-[#16161C] border-b border-slate-200 dark:border-[#26262A] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-mono text-[15px] font-extrabold text-slate-900 dark:text-white">
                  Selecciona el Caballo a Evaluar
                </h3>
                <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  El análisis se guardará en su historial clínico
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHorsePickerOpen(false)}
                className="w-8 h-8 rounded-full card-3d-interactive flex items-center justify-center text-slate-500 dark:text-zinc-400"
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
                    className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all ${
                      isSelected
                        ? 'card-3d border-2 border-[#0D3F2E] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md'
                        : 'card-3d border border-slate-200 dark:border-zinc-800 hover:border-[#0D3F2E]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          horse.photoUrl ||
                          'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=200&q=80'
                        }
                        alt={horse.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-mono text-[14px] font-extrabold text-slate-900 dark:text-white truncate">
                          {horse.name}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {horse.breed} · {horse.discipline}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full card-3d-racing-green text-white flex items-center justify-center shrink-0 shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Quota + Add / Upgrade Button */}
            <div className="p-4 bg-white dark:bg-[#16161C] border-t border-slate-200 dark:border-[#26262A] flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 dark:text-zinc-400 px-1">
                <span>Cupo utilizado</span>
                <strong className="text-slate-800 dark:text-zinc-200">
                  {horses.length} de {maxHorses} {maxHorses === 1 ? 'caballo en tu plan' : 'caballos en tu plan'}
                </strong>
              </div>

              {isQuotaReached ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsHorsePickerOpen(false);
                    onOpenPricing?.();
                  }}
                  className="w-full min-h-[46px] px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-mono text-[12px] font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
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
                  className="w-full min-h-[46px] px-4 rounded-2xl card-3d-racing-green text-white font-mono text-[12px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
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
