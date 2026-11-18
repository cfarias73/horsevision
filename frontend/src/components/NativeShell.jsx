import React, { useState, useEffect } from 'react';
import {
  Home,
  Activity,
  History,
  User,
  ChevronLeft,
  RotateCcw,
  Crown,
  Sun,
  Moon,
  Bot,
  Menu,
  X,
} from 'lucide-react';
import PricingModal from './PricingModal';

/**
 * Native mobile application viewport shell:
 * - Centered 430px device bezel on desktop, full-bleed 100dvh on mobile
 * - Light Mode by default (#F8FAFC luxury porcelain) with British Racing Green (#0D3F2E)
 * - Dark Mode switchable (☀️ / 🌙) with persistent preference
 * - Native iOS status bar, header controls with Hamburger Menu, optional sub-view switcher,
 *   and 4-tab bottom navigation bar (Home, Análisis, Cuadra, Agente IA).
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
        {/* Native Top Status Bar */}
        <div
          className={`flex items-center justify-between px-6 pt-[max(10px,env(safe-area-inset-top))] pb-1.5 select-none shrink-0 ${
            isDark ? 'text-white/90' : 'text-slate-800'
          }`}
          aria-hidden="true"
        >
          <span className="font-mono text-[12px] font-semibold tracking-tight tabular-nums">
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

        {/* Native Top App Navigation Bar */}
        <header className="relative z-40 px-4 pt-1 pb-2 flex items-center justify-between gap-2 shrink-0">
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
                src="/logos/hv-mark-2026.png?v=20261118" 
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
            {/* Single Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMenuOpen}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#151E22] border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-[#071B24] dark:text-zinc-200 active:scale-90 transition-all shadow-sm"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Floating Hamburger Drawer Menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[1px]"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                role="menu"
                className="absolute top-full right-4 mt-1.5 z-50 w-64 rounded-[22px] card-3d p-2 shadow-2xl border border-slate-200 dark:border-[#2D2D35] view-enter flex flex-col divide-y divide-slate-100 dark:divide-white/10 font-mono text-[12px]"
              >
                <div className="flex flex-col gap-0.5 pb-1">
                  {!hideBottomNav && (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onSelectNav('historial');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-left transition ${
                          activeNav === 'historial'
                            ? 'bg-[#0D3F2E]/10 dark:bg-emerald-500/15 text-[#0D3F2E] dark:text-emerald-300 font-bold'
                            : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <History className="w-4 h-4 shrink-0" />
                        <span>Historial de Evaluaciones</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onSelectNav('perfil');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-left transition ${
                          activeNav === 'perfil'
                            ? 'bg-[#0D3F2E]/10 dark:bg-emerald-500/15 text-[#0D3F2E] dark:text-emerald-300 font-bold'
                            : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <User className="w-4 h-4 shrink-0" />
                        <span>Mi Perfil y Cuenta</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleOpenPricing();
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-left text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                  >
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Planes y Suscripción</span>
                  </button>
                </div>

                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      toggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDark ? (
                        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Moon className="w-4 h-4 text-[#0D3F2E] shrink-0" />
                      )}
                      <span>{isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}</span>
                    </div>
                  </button>

                  {!hideBottomNav && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onReset?.();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-left text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>Nueva Evaluación / Reiniciar</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
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
                {
                  id: 'cuadra',
                  label: 'Cuadra',
                  icon: ({ className }) => (
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
                  ),
                },
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
      </div>
    </div>
  );
});

export default NativeShell;
