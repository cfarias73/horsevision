import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle, Smartphone } from 'lucide-react';

export default function PWAInstallModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone app
    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standaloneCheck);

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent || '';
    const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isAppleMobile);

    // Listen for Android / Chrome install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen || isStandalone) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User installed HorseVision PWA');
      }
      setDeferredPrompt(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-[28px] bg-[#141417] border border-white/10 p-6 text-white shadow-2xl overflow-hidden font-sans">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#0D3F2E]/40 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* App Icon & Header */}
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="relative w-16 h-16 rounded-2xl bg-[#0D3F2E] p-1 border border-[#FED492]/40 shadow-xl overflow-hidden flex items-center justify-center">
            <img src="/icon-192.png" alt="HorseVision Logo" className="w-full h-full object-cover rounded-xl" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0D3F2E] border border-emerald-500/30 text-emerald-300 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Experiencia Móvil PWA
            </div>
            <h3 className="text-[18px] font-bold text-white tracking-tight">
              Instala HorseVision en tu Teléfono
            </h3>
            <p className="text-[12px] text-zinc-400 mt-1 leading-snug">
              Diseñada específicamente para usarse en pista sin barras de navegación y con pantalla completa.
            </p>
          </div>
        </div>

        {/* Benefits List */}
        <div className="my-5 flex flex-col gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/5 font-mono text-[11px] text-zinc-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Grabación guiada 16:9 con giroscopio</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Carga instantánea sin escribir URL</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Consultas de caballos y reportes sin lag</span>
          </div>
        </div>

        {/* Installation Instructions by Platform */}
        {isIOS ? (
          <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#0D3F2E]/30 border border-emerald-500/20 text-zinc-200">
            <div className="flex items-center gap-2 text-emerald-300 font-mono text-[11px] font-bold">
              <Smartphone className="w-4 h-4" />
              <span>Instrucciones para iPhone / iPad (Safari)</span>
            </div>
            <ol className="text-[12px] space-y-1.5 text-zinc-300 list-decimal list-inside leading-relaxed">
              <li>
                Toca el botón <span className="inline-flex items-center gap-0.5 font-bold text-white bg-white/10 px-1.5 py-0.5 rounded"><Share2 className="w-3 h-3 inline" /> Compartir</span> en Safari.
              </li>
              <li>
                Desplaza la lista y toca <span className="inline-flex items-center gap-0.5 font-bold text-white bg-white/10 px-1.5 py-0.5 rounded"><PlusSquare className="w-3 h-3 inline" /> Agregar al Inicio</span>.
              </li>
              <li>
                Toca <span className="font-bold text-emerald-300">"Agregar"</span> arriba a la derecha. ¡Listo!
              </li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0D3F2E] to-[#145740] hover:from-[#114b37] hover:to-[#1a6b4f] border border-emerald-500/30 text-white font-mono text-[13px] font-bold flex items-center justify-center gap-2 shadow-xl active:scale-98 transition"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>Instalar App en este Dispositivo</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/[0.04] text-[12px] text-zinc-300 text-center">
            <p>
              Para instalar, abre el menú de tu navegador (<span className="font-bold text-white">⋮</span>) y selecciona <span className="font-bold text-emerald-300">"Instalar aplicación"</span> o <span className="font-bold text-emerald-300">"Agregar a la pantalla principal"</span>.
            </p>
          </div>
        )}

        {/* Secondary Dismiss Action */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-2 text-center font-mono text-[11px] text-zinc-500 hover:text-zinc-300 transition"
        >
          Continuar en navegador por ahora
        </button>
      </div>
    </div>
  );
}
