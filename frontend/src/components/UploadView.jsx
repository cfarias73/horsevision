import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  UploadCloud,
  Video,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import CameraRecorderModal from './CameraRecorderModal';

/**
 * Screen 1: UploadView (Captura / Subida)
 * Minimalist, elegant equestrian interface focused strictly on action:
 * - Direct video upload / live camera recording
 * - Instant demo analysis buttons
 * - Clean visual hierarchy without redundant technical text
 */
export default function UploadView({
  selectedFile,
  onSelectFile,
  onAnalyzeFile,
  selectedHorse,
  onGoToCuadra,
  onOpenCamera,
  isAnalyzing,
  analysisStepLabel,
  errorMsg,
  onClearError,
}) {
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
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

  return (
    <div className="flex flex-col gap-3.5 pt-1">
      {/* Hidden native camera & gallery file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
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
          style={{ background: 'radial-gradient(circle, rgba(13,63,46,0.18) 0%, rgba(248,250,252,0) 70%)' }}
        />

        {/* Brand Header */}
        <div className="relative flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-[14px] card-3d-subtle flex items-center justify-center shadow-sm shrink-0">
              <Video className="w-5 h-5 text-[#0D3F2E] dark:text-[#10B981]" />
            </div>
            <h1 className="font-mono text-[17px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white drop-shadow-sm truncate">
              Evaluación de Trote
            </h1>
          </div>

          {selectedHorse && (
            <button
              type="button"
              onClick={onGoToCuadra}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl card-3d-interactive border border-[#0D3F2E]/20 text-[#0D3F2E] dark:text-[#10B981] font-mono text-[11px] font-bold shadow-sm shrink-0"
              title="Cambiar ejemplar en la Cuadra"
            >
              <span>{selectedHorse.name}</span>
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
            onClick={handleOpenCam}
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
          </button>
        )}

        {/* Dual Native Capture & Gallery Touch Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleOpenCam}
            className="min-h-[48px] px-3 rounded-[16px] card-3d-interactive flex items-center justify-center gap-2 text-slate-800 dark:text-white font-mono font-bold text-[13px] active:scale-[0.96] transition-all disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-[#0D3F2E] dark:text-[#10B981]" />
            <span>Grabar 16:9</span>
          </button>
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => fileInputRef.current?.click()}
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
          onClick={onAnalyzeFile}
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

      {/* File input for gallery fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onClearError?.();
            onSelectFile(file);
          }
        }}
        className="hidden"
      />

      <div className="h-1" />
    </div>
  );
}
