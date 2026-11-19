import React, { useState, useEffect } from 'react';
import {
  Home,
  Activity,
  History,
  User,
  ChevronLeft,
  ChevronRight,
  Video,
  Crown,
  Sun,
  Moon,
  Bot,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import PricingModal from './PricingModal';

const PLAN_BADGES = {
  '1-horse': 'Plan 1 Caballo',
  '3-horses': 'Plan 5 Caballos',
  '5-horses': 'Plan 5 Caballos',
  '50-horses': 'Plan 50 Caballos',
};

function HorseIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 19l2-8 3-7 4 1 1 3 4-1 2 4-2 3 2 4-3 1-3-3-2 6H4z" />
    </svg>
  );
}

/**
 * Native mobile application viewport shell:
 * - Centered 430px device bezel on desktop, full-bleed 100dvh on mobile
 * - Organic sage/porcelain Light Mode & deep petroleum Obsidian Dark Mode
 * - Native header with circular buttons + full-height Right Side Drawer
 * - Floating Pill Bottom Navigation Dock (Home, Análisis, Cuadra, Agente IA)
 */
const NativeShell = React.memo(function NativeShell({
  activeNav,
  onSelectNav,
  subTab,
  onSelectSubTab,
  hasAnalysis,
  healthState,
  onReset,
  children,
  splash,
  isPricingOpen,
  onOpenPricing,
  onClosePricing,
  onPlanActivated,
  hideBottomNav = false,
  currentUser = null,
  horsesCount = 0,
  maxHorses = 1,
  activePlanId = '1-horse',
  isAppStore = false,
  onSignOut,
  onBackToLanding,
}) {
  const [internalPricing, setInternalPricing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pricingOpen = isPricingOpen !== undefined ? isPricingOpen : internalPricing;
  const handleOpenPricing = onOpenPricing || (() => setInternalPricing(true));
  const handleClosePricing = onClosePricing || (() => setInternalPricing(false));

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hv_theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('hv_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const showBack = activeNav !== 'home';

  const handleBack = () => {
    if (activeNav === 'analisis') {
      if (subTab === 'report') {
        onSelectSubTab?.('visor');
      } else {
        onSelectNav('home');
      }
    } else {
      onSelectNav('home');
    }
  };

  const isDark = theme === 'dark';
  const userEmail = currentUser?.email || '';
  const userName = userEmail ? userEmail.split('@')[0] : 'Invitado';
  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'HV';
  const planLabel = PLAN_BADGES[activePlanId] || PLAN_BADGES['1-horse'];

  const closeAndRun = (fn) => {
    setIsMenuOpen(false);
    fn?.();
  };

  return (
    <div
      className={`min-h-[100dvh] w-full ${
        isDark ? 'bg-[#060A0C]' : 'bg-[#E6ECEA]'
      } flex items-center justify-center sm:p-4 overflow-x-hidden transition-colors duration-300`}
    >
      <div
        className={`relative w-full max-w-[430px] h-[100dvh] sm:h-[min(896px,94dvh)] ${
          isDark
            ? 'dark bg-[#0B1114] border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.9)]'
            : 'bg-[#F2F5F4] border-slate-200/80 shadow-[0_32px_80px_rgba(7,27,36,0.12)]'
        } bg-racing-radial flex flex-col overflow-hidden sm:rounded-[42px] sm:border transition-all duration-300`}
      >
        {splash}
        {/* Simulated status bar is only used in the browser PWA. iOS supplies its own. */}
        {!isAppStore && (
          <div
            className={`flex items-center justify-between px-6 pt-[max(10px,env(safe-area-inset-top))] pb-1.5 select-none shrink-0 ${
              isDark ? 'text-white/90' : 'text-slate-800'
            }`}
            aria-hidden="true"
          >
          <span className="text-[12px] font-semibold tracking-tight tabular-nums">
            9:41
          </span>
          <div className="flex items-center gap-1.5">
            <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
              <rect x="0" y="7" width="2.5" height="4" rx="0.8" />
              <rect x="4" y="5" width="2.5" height="6" rx="0.8" />
              <rect x="8" y="3" width="2.5" height="8" rx="0.8" />
              <rect x="12" y="0.5" width="2.5" height="10.5" rx="0.8" />
            </svg>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1.5 3.8C5 0.8 10 0.8 13.5 3.8" strokeLinecap="round" />
              <path d="M3.8 6.4C6 4.4 9 4.4 11.2 6.4" strokeLinecap="round" />
              <circle cx="7.5" cy="9.2" r="1.1" fill="currentColor" stroke="none" />
            </svg>
            <div
              className={`w-[22px] h-[11px] rounded-[3.5px] border ${
                isDark ? 'border-white/50' : 'border-slate-800/50'
              } p-[1.5px] flex items-center`}
            >
              <div
                className={`w-full h-full ${
                  isDark ? 'bg-white' : 'bg-slate-800'
                } rounded-[1.5px]`}
              />
            </div>
          </div>
          </div>
        )}

        {/* Native Top App Navigation Bar */}
        <header className={`relative z-40 px-4 ${isAppStore ? 'pt-[max(10px,env(safe-area-inset-top))]' : 'pt-1'} pb-2 flex items-center justify-between gap-2 shrink-0`}>
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Volver"
              className="w-10 h-10 rounded-full bg-white dark:bg-[#151E22] border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-[#071B24] dark:text-white/90 active:scale-90 transition-all shadow-sm shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div
              className="w-10 h-10 rounded-full p-1.5 shadow-sm shrink-0 bg-white dark:bg-[#151E22] border border-slate-200/70 dark:border-white/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <img
                src="/logos/icono2.png"
                alt="HorseVision Icon"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[16px] font-extrabold tracking-tight text-[#071B24] dark:text-white truncate">
              HorseVision
            </span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                healthState?.status === 'ready'
                  ? 'bg-[#00D1C2]'
                  : healthState?.status === 'checking'
                  ? 'bg-[#F59E0B] animate-pulse'
                  : 'bg-[#EF4444]'
              }`}
              title={healthState?.status === 'ready' ? 'En línea' : 'Sin conexión'}
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={isMenuOpen}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#151E22] border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-[#071B24] dark:text-zinc-200 active:scale-90 transition-all shadow-sm"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Optional Analysis Sub-switcher (Only displayed in Análisis when video is active) */}
        {activeNav === 'analisis' && hasAnalysis && (
          <nav
            aria-label="Sub-navegación de análisis"
            className="px-4 pb-2.5 shrink-0"
          >
            <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-white/80 dark:bg-[#141C20]/85 backdrop-blur-md border border-slate-200/70 dark:border-white/10 shadow-sm">
              {[
                { id: 'report', label: 'Diagnóstico IA' },
                { id: 'visor', label: 'Telemetría & Video' },
              ].map((tab) => {
                const active = subTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectSubTab?.(tab.id)}
                    className={`min-h-[38px] rounded-full text-[12px] font-bold transition-all duration-200 ${
                      active
                        ? 'bg-[#0F3D44] dark:bg-[#14545E] text-white shadow-sm'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-[#071B24] dark:hover:text-white active:scale-[0.97]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Scrollable Screen Body */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-5">
          {children}
        </main>

        {/* Native Floating Pill Bottom Navigation Dock (Home, Análisis, Cuadra, Agente IA) */}
        {!hideBottomNav && (
          <nav
            aria-label="Menú principal inferior"
            className="shrink-0 px-3.5 pt-1 pb-[max(12px,env(safe-area-inset-bottom))] z-30 pointer-events-none"
          >
            <div
              className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-xl border shadow-[0_14px_34px_rgba(7,27,36,0.12)] grid grid-cols-4 gap-1 ${
                isDark
                  ? 'bg-[#141D21]/92 border-white/10 text-zinc-400'
                  : 'bg-white/92 border-slate-200/70 text-slate-500'
              }`}
            >
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'analisis', label: 'Análisis', icon: Activity },
                { id: 'cuadra', label: 'Cuadra', icon: HorseIcon },
                { id: 'ia', label: 'Agente IA', icon: Bot },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectNav(item.id)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-200 active:scale-95 ${
                      active
                        ? 'bg-[#0F3D44] dark:bg-[#14545E] text-white font-bold shadow-md'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-[#0F3D44] dark:hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] transition-transform duration-200 ${
                        active ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                      }`}
                    />
                    <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* SaaS Pricing Modal with 3 Plans (1 horse, 5 horses, 50 horses) */}
        <PricingModal
          isOpen={pricingOpen}
          onClose={handleClosePricing}
          onPlanActivated={onPlanActivated}
        />

        {/* ================================================================ */}
        {/* FULL-HEIGHT NATIVE RIGHT SIDE DRAWER                             */}
        {/* ================================================================ */}
        {isMenuOpen && (
          <div className="absolute inset-0 z-[110] flex justify-end" role="dialog" aria-modal="true" aria-label="Menú principal">
            {/* Scrim Backdrop inside phone frame */}
            <div
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Full-Height Slide-Over Panel */}
            <aside className="relative z-10 h-full w-[82%] max-w-[320px] bg-[#F2F5F4] dark:bg-[#0E1518] shadow-2xl flex flex-col justify-between drawer-slide-in rounded-l-[32px] overflow-hidden border-l border-white/40 dark:border-white/10">
              {/* 1. Cabecera de Cuenta (Arriba) */}
              <div className="px-5 pt-[max(20px,env(safe-area-inset-top))] pb-4 bg-white dark:bg-[#141C20] border-b border-slate-200/70 dark:border-white/10 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#0F3D44] text-[#D9F99D] font-extrabold text-[15px] flex items-center justify-center shadow-sm shrink-0">
                      {userInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-extrabold text-[#071B24] dark:text-white truncate">
                        {userName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                        {userEmail || 'Cuenta HorseVision'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Cerrar menú"
                    className="w-9 h-9 rounded-full bg-[#F4F7F6] dark:bg-[#0B1114] flex items-center justify-center text-slate-600 dark:text-zinc-300 active:scale-90 transition shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Active Plan + Quota Badges */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full bg-[#0F3D44] text-white text-[10.5px] font-bold">
                    {planLabel}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#EEF4F2] dark:bg-[#0F1619] text-[#0F3D44] dark:text-[#00D1C2] text-[10.5px] font-bold tabular-nums">
                    {horsesCount}/{maxHorses} caballos
                  </span>
                </div>
              </div>

              {/* 2. Scrollable Categorized Navigation Lists */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-5">
                {!hideBottomNav && (
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-2 mb-2">
                      Evaluación y Clínica
                    </p>
                    <div className="rounded-[22px] bg-white dark:bg-[#141C20] border border-slate-200/60 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => closeAndRun(() => onReset?.())}
                        className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#0F3D44] text-[#D9F99D] flex items-center justify-center shrink-0">
                            <Video className="w-4 h-4" />
                          </div>
                          <span className="text-[13px] font-bold text-[#071B24] dark:text-white truncate">
                            Nueva Evaluación en Pista
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => closeAndRun(() => onSelectNav('historial'))}
                        className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#EEF4F2] dark:bg-[#0F1619] text-[#0F3D44] dark:text-[#00D1C2] flex items-center justify-center shrink-0">
                            <History className="w-4 h-4" />
                          </div>
                          <span className="text-[13px] font-bold text-[#071B24] dark:text-white truncate">
                            Historial de Evaluaciones
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => closeAndRun(() => onSelectNav('cuadra'))}
                        className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#EEF4F2] dark:bg-[#0F1619] text-[#0F3D44] dark:text-[#00D1C2] flex items-center justify-center shrink-0">
                            <HorseIcon className="w-4 h-4" />
                          </div>
                          <span className="text-[13px] font-bold text-[#071B24] dark:text-white truncate">
                            Mi Cuadra de Caballos
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#F4F7F6] dark:bg-[#0B1114] text-[#0F3D44] dark:text-[#00D1C2] text-[10.5px] font-bold tabular-nums shrink-0">
                          {horsesCount}/{maxHorses}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => closeAndRun(() => onSelectNav('ia'))}
                        className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#F2F7E4] dark:bg-[#192416] text-[#3D5A09] dark:text-[#D9F99D] flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4" />
                          </div>
                          <span className="text-[13px] font-bold text-[#071B24] dark:text-white truncate">
                            Agente Veterinario IA
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-2 mb-2">
                    Mi Cuenta y Suscripción
                  </p>
                  <div className="rounded-[22px] bg-white dark:bg-[#141C20] border border-slate-200/60 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden shadow-sm">
                    {!hideBottomNav && (
                      <button
                        type="button"
                        onClick={() => closeAndRun(() => onSelectNav('perfil'))}
                        className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#EEF4F2] dark:bg-[#0F1619] text-[#0F3D44] dark:text-[#00D1C2] flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-[13px] font-bold text-[#071B24] dark:text-white truncate">
                            Mi Perfil y Cuenta
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => closeAndRun(() => handleOpenPricing())}
                      className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left hover:bg-amber-50/70 dark:hover:bg-amber-950/20 active:bg-amber-100/60 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                          <Crown className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-extrabold text-amber-800 dark:text-amber-300 truncate">
                          Planes y Suscripción
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold shrink-0">
                        5 / 50
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Pie Fijo del Drawer (Selector Visual de Tema + Sesión) */}
              <div className="p-4 bg-white dark:bg-[#141C20] border-t border-slate-200/70 dark:border-white/10 flex flex-col gap-3 shrink-0 pb-[max(18px,env(safe-area-inset-bottom))]">
                <div>
                  <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5 px-1">
                    Apariencia
                  </span>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#F4F7F6] dark:bg-[#0B1114] border border-slate-200/60 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`py-2 px-3 rounded-full text-[12px] font-bold flex items-center justify-center gap-1.5 transition ${
                        !isDark
                          ? 'bg-white text-[#071B24] shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Claro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`py-2 px-3 rounded-full text-[12px] font-bold flex items-center justify-center gap-1.5 transition ${
                        isDark
                          ? 'bg-[#0F3D44] text-white shadow-sm'
                          : 'text-slate-500 hover:text-[#071B24]'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-[#00D1C2]" />
                      <span>Oscuro</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  {onBackToLanding && (
                    <button
                      type="button"
                      onClick={() => closeAndRun(() => onBackToLanding())}
                      className="w-full py-2.5 px-3 rounded-2xl bg-[#F4F7F6] dark:bg-[#0B1114] text-slate-700 dark:text-zinc-300 text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-slate-200/70 dark:hover:bg-white/10 active:scale-[0.98] transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Volver a la Página Web</span>
                    </button>
                  )}

                  {currentUser && onSignOut && (
                    <button
                      type="button"
                      onClick={() => closeAndRun(() => onSignOut())}
                      className="w-full py-2.5 px-3 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/50 active:scale-[0.98] transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
});

export default NativeShell;
