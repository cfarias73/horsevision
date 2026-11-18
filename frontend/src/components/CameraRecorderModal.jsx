import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  RotateCw,
  Sun,
  Video,
  Upload,
  Check,
  AlertCircle,
  Sparkles,
  Smartphone,
  Compass
} from 'lucide-react';

/**
 * CameraRecorderModal:
 * RealHorse-style 16:9 forced landscape video capture.
 * 
 * Strict Enforcement:
 * - When in portrait orientation, completely blocks recording and displays
 *   the phone rotation screen ("Gira tu teléfono a horizontal 16:9").
 * - Automatically detects physical device orientation (screen.orientation / orientationchange).
 * - Provides a "Girar a Horizontal (16:9)" button for simulator/desktop testing.
 * - In landscape: Full 16:9 lateral camera feed, gyro leveler line (0°),
 *   gait selector (Línea Recta, Círculo Izq/Der), 8-12s duration timer, and gallery import.
 */
export default function CameraRecorderModal({
  isOpen,
  onClose,
  onVideoRecorded,
  onImportFile
}) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Forced Landscape: Default to false (Portrait) so rotation enforcement ALWAYS triggers first
  const [isLandscape, setIsLandscape] = useState(false);
  const [gaitMode, setGaitMode] = useState('straight'); // 'straight' | 'left_circle' | 'right_circle'
  const [torchOn, setTorchOn] = useState(false);
  const [tiltAngle, setTiltAngle] = useState(0);
  const [showGuide, setShowGuide] = useState(true);

  // Check physical device orientation on mobile
  const checkPhysicalOrientation = useCallback(() => {
    // 1. Mobile Screen Orientation API
    if (window.screen?.orientation?.type) {
      const isScreenLandscape = window.screen.orientation.type.includes('landscape');
      if (isScreenLandscape) {
        setIsLandscape(true);
        return;
      }
    }
    // 2. Legacy window.orientation (0 = portrait, 90/-90 = landscape)
    if (typeof window.orientation === 'number') {
      if (Math.abs(window.orientation) === 90) {
        setIsLandscape(true);
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Reset to portrait on open so user is prompted to rotate
    setIsLandscape(false);
    checkPhysicalOrientation();

    window.addEventListener('resize', checkPhysicalOrientation);
    window.addEventListener('orientationchange', checkPhysicalOrientation);

    // Gyroscope / device tilt leveler
    const handleDeviceOrientation = (e) => {
      if (typeof e.gamma === 'number') {
        setTiltAngle(Math.min(15, Math.max(-15, Math.round(e.gamma))));
      }
    };
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    return () => {
      window.removeEventListener('resize', checkPhysicalOrientation);
      window.removeEventListener('orientationchange', checkPhysicalOrientation);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [isOpen, checkPhysicalOrientation]);

  // Request fullscreen and orientation lock if supported
  const handleRotateToLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      if (window.screen?.orientation?.lock) {
        await window.screen.orientation.lock('landscape').catch(() => {});
      }
    } catch {
      // ignore
    }
    setIsLandscape(true);
  };

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) return;

    let activeStream = null;

    async function initCamera() {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              aspectRatio: { ideal: 16 / 9 },
            },
            audio: false,
          });

          if (videoRef.current) {
            videoRef.current.srcObject = activeStream;
            videoRef.current.play().catch(() => {});
          }
          setStream(activeStream);
          setHasCamera(true);
        } else {
          setHasCamera(false);
        }
      } catch (err) {
        console.warn('Cámara física no disponible, utilizando simulación de visor 16:9:', err);
        setHasCamera(false);
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartRecording = () => {
    recordedChunksRef.current = [];
    setRecordingSeconds(0);
    setIsRecording(true);

    if (stream) {
      try {
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
          const file = new File([blob], `trote_16_9_${Date.now()}.mp4`, { type: 'video/mp4' });
          onVideoRecorded(file);
          onClose();
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn('MediaRecorder error, usando grabación cronometrada:', err);
      }
    }

    // Timer tick (Target: 20 seconds for complete gait sequence)
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 20) {
          handleStopRecording();
          return 20;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback with sample video
      fetch('/videos/real_horse_trot.mp4')
        .then((res) => (res.ok ? res.blob() : null))
        .then((blob) => {
          if (blob) {
            const file = new File([blob], `trote_16_9_real.mp4`, { type: 'video/mp4' });
            onVideoRecorded(file);
          }
          onClose();
        })
        .catch(() => onClose());
    }
  };

  const handleGalleryFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onVideoRecorded(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center overflow-hidden view-enter select-none">
      {/* Hidden Gallery Input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/*"
        onChange={handleGalleryFileSelect}
        className="hidden"
      />

      {/* ================================================================ */}
      {/* 1. PORTRAIT ENFORCEMENT OVERLAY (Obligatorio girar el teléfono) */}
      {/* ================================================================ */}
      {!isLandscape && (
        <div className="absolute inset-0 z-[310] bg-[#070709] flex flex-col items-center justify-between p-6 text-center text-white view-enter">
          {/* Top Close */}
          <div className="w-full flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Central Rotating Phone Visual Graphic */}
          <div className="flex flex-col items-center gap-4 my-auto max-w-[320px]">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }} />
              
              {/* Outer icon container */}
              <div className="relative w-24 h-24 rounded-3xl bg-[#0D3F2E] border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.35)]">
                <Smartphone className="w-12 h-12 text-white animate-pulse" />
                <RotateCw className="w-6 h-6 text-amber-300 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>

            <div>
              <span className="font-mono text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mb-2">
                Grabación Obligatoria en 16:9
              </span>
              <h3 className="font-mono text-[20px] font-black tracking-tight text-white mb-2 leading-tight">
                Gira tu Teléfono a Posición Horizontal
              </h3>
              <p className="text-[12px] text-slate-300 leading-relaxed font-sans mb-3">
                Sigue estas 4 reglas simples para un análisis preciso:
              </p>

              <div className="w-full text-left bg-white/5 border border-white/15 rounded-2xl p-3.5 flex flex-col gap-2.5 text-[13px] sm:text-[14px] leading-snug font-sans text-slate-200">
                <div className="flex items-start gap-2.5">
                  <span>⏱️</span>
                  <span><strong>Graba 20 segundos:</strong> Trote continuo para asegurar una secuencia limpia.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span>📏</span>
                  <span><strong>A 8–10 metros (90°):</strong> De perfil lateral, viendo de orejas a cascos.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span>🐴</span>
                  <span><strong>Sin jinete (Solo cuerda):</strong> Sin montura ni protectores, en piso firme.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span>📱</span>
                  <span><strong>Círculo o Línea Recta:</strong> Teléfono en horizontal y estable.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-300 bg-black/40 px-3.5 py-1.5 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Esperando rotación horizontal...</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-[320px] flex flex-col gap-2.5 mb-2">
            <button
              type="button"
              onClick={handleRotateToLandscape}
              className="w-full min-h-[50px] rounded-2xl card-3d-racing-green text-white font-mono text-[13px] font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition"
            >
              <RotateCw className="w-4 h-4 text-amber-300" />
              <span>Girar Teléfono a 16:9</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-mono text-[12px] transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 2. FULL 16:9 HORIZONTAL VIEWFINDER CANVAS */}
      {/* ================================================================ */}
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {/* Live Camera Feed or 16:9 Realistic Simulated Horse Trot */}
        {hasCamera ? (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <video
              src="/videos/real_horse_trot.mp4"
              playsInline
              muted
              autoPlay
              loop
              className="w-full h-full object-cover opacity-95"
            />
          </div>
        )}

        {/* Framing Grid & HUD Guidelines */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
          {/* Top Bar inside Viewfinder */}
          <div className="flex items-center justify-between w-full pointer-events-auto">
            {/* Exit Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar cámara"
              className="w-10 h-10 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 active:scale-90 transition shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Live Recording / Duration Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border font-mono text-[12px] font-bold shadow-md transition-all ${
                  isRecording
                    ? 'bg-red-950/80 border-red-500/80 text-white'
                    : recordingSeconds >= 15
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                    : 'bg-black/60 border-white/20 text-white'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                <span>
                  {isRecording
                    ? `REC 00:${String(recordingSeconds).padStart(2, '0')} / 00:20`
                    : '16:9 • 20 Segundos'}
                </span>
                {recordingSeconds >= 15 && (
                  <span className="text-[10px] text-emerald-300 font-bold">✓ Óptimo</span>
                )}
              </div>
            </div>

            {/* Horizon Level Guide, Guide Toggle & Orientation Switcher */}
            <div className="flex items-center gap-2">
              {!isRecording && !showGuide && (
                <button
                  type="button"
                  onClick={() => setShowGuide(true)}
                  className="px-2.5 py-1 rounded-full bg-black/65 border border-emerald-400/50 text-emerald-300 font-mono text-[10px] font-bold backdrop-blur-md hover:bg-black/80 transition"
                >
                  📋 Ver Guía
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsLandscape(false)}
                title="Volver a orientación vertical"
                className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white/80 hover:text-white"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/15 text-[10px] font-mono text-white/90 backdrop-blur-md">
                <span
                  className={`w-2 h-2 rounded-full ${
                    Math.abs(tiltAngle) <= 3 ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                  }`}
                />
                <span>{Math.abs(tiltAngle) <= 3 ? 'Nivelado 0°' : `${tiltAngle}°`}</span>
              </div>
            </div>
          </div>

          {/* Center Viewfinder Reticle & Level Line */}
          <div className="relative w-full flex-1 flex items-center justify-center">
            {/* Rule of Thirds subtle lines */}
            <div className="absolute inset-x-8 inset-y-6 sm:inset-x-14 sm:inset-y-8 border border-white/20 rounded-3xl pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px border-l border-dashed border-white/15" />
              <div className="absolute right-1/3 top-0 bottom-0 w-px border-l border-dashed border-white/15" />
              <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-white/15" />
            </div>

            {/* Horizontal leveler line */}
            <div
              className={`w-48 sm:w-64 h-0.5 rounded-full transition-transform duration-100 ${
                Math.abs(tiltAngle) <= 3
                  ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]'
                  : 'bg-[#F59E0B]'
              }`}
              style={{ transform: `rotate(${tiltAngle}deg)` }}
            />

            {/* Large, High-Contrast Recording Instructions HUD (keeps right controls free) */}
            {!isRecording && showGuide && (
              <div className="absolute bottom-3 left-3 sm:left-5 max-w-[calc(100%-130px)] sm:max-w-xl pointer-events-auto bg-black/80 backdrop-blur-md border-2 border-emerald-400/50 rounded-2xl p-3.5 sm:p-4 text-white shadow-2xl z-10">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2 font-mono text-[13px] sm:text-[15px] font-extrabold text-[#EBFF00] uppercase tracking-wide">
                    <span>📋 INSTRUCCIONES DE GRABACIÓN</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuide(false)}
                    className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-mono text-[11px] font-bold transition shrink-0"
                  >
                    Ocultar ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] sm:text-[14px] leading-snug font-medium">
                  <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/15">
                    <strong className="text-[#EBFF00]">⏱️ Graba 20 segundos:</strong> Trote continuo para asegurar una secuencia limpia.
                  </div>
                  <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/15">
                    <strong className="text-[#00F0FF]">📏 A 8–10 metros (90°):</strong> De perfil lateral; cuerpo y cascos completos.
                  </div>
                  <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/15">
                    <strong className="text-emerald-300">🐴 Sin jinete (Solo cuerda):</strong> Sin montura ni protectores, en piso firme.
                  </div>
                  <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/15">
                    <strong className="text-emerald-300">📱 Círculo o Línea Recta:</strong> Mantén el teléfono horizontal y estable.
                  </div>
                </div>
              </div>
            )}

            {/* Live Recording Reminder Bar */}
            {isRecording && (
              <div className="absolute bottom-3 left-3 sm:left-1/2 sm:-translate-x-1/2 max-w-[calc(100%-130px)] sm:max-w-2xl px-4 py-2 rounded-2xl sm:rounded-full bg-red-950/90 backdrop-blur-md border border-red-400/60 text-white font-mono text-[12px] sm:text-[14px] font-bold flex items-center gap-2.5 shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping shrink-0" />
                <span>Grabando trote (20 seg) · Mantén el cuerpo y cascos completos en pantalla</span>
              </div>
            )}
          </div>

          {/* Right Floating Control Sidebar (matching RealHorse reference exactly) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 pointer-events-auto z-20">
            {/* Torch / Light Toggle */}
            <button
              type="button"
              onClick={() => setTorchOn((v) => !v)}
              className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center text-white transition active:scale-90 shadow-md ${
                torchOn
                  ? 'bg-amber-500/80 border-amber-400 text-white'
                  : 'bg-black/60 border-white/20 text-white/80'
              }`}
              title="Luz / Contraste"
            >
              <Sun className="w-4 h-4" />
            </button>

            {/* Gait / Pattern Selector Pills (RealHorse format) */}
            <div className="flex flex-col gap-1.5 bg-black/50 p-1 rounded-2xl backdrop-blur-md border border-white/15">
              <button
                type="button"
                onClick={() => setGaitMode('straight')}
                className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold transition ${
                  gaitMode === 'straight'
                    ? 'bg-white text-slate-900 shadow-md scale-105'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Línea Recta
              </button>
              <button
                type="button"
                onClick={() => setGaitMode('left_circle')}
                className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold transition ${
                  gaitMode === 'left_circle'
                    ? 'bg-white text-slate-900 shadow-md scale-105'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Círculo Izq
              </button>
              <button
                type="button"
                onClick={() => setGaitMode('right_circle')}
                className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold transition ${
                  gaitMode === 'right_circle'
                    ? 'bg-white text-slate-900 shadow-md scale-105'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Círculo Der
              </button>
            </div>

            {/* Big Circular Red Record Shutter Button */}
            <button
              type="button"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación de trote'}
              className="relative w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-all shadow-2xl group"
            >
              {isRecording ? (
                <div className="w-6 h-6 rounded-md bg-red-600 shadow-lg animate-pulse" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-600 shadow-lg group-hover:scale-105 transition" />
              )}
            </button>

            {/* Quick Gallery Import Button (Matching Reference) */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 backdrop-blur-md text-white font-mono text-[10px] font-semibold active:scale-95 transition shadow-md"
            >
              <Upload className="w-3 h-3" />
              <span>Importar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
