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
} from 'lucide-react';
import PricingModal from './PricingModal';

/**
 * Native mobile application viewport shell:
 * - Centered 430px device bezel on desktop, full-bleed 100dvh on mobile
 * - Light Mode by default (#F8FAFC luxury porcelain) with British Racing Green (#0D3F2E)
 * - Dark Mode switchable (☀️ / 🌙) with persistent preference
 * - Native iOS status bar, header controls, optional sub-view switcher,
 *   and bottom navigation bar (Home, Análisis, Historial, Perfil).
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
  hideBottomNav = false,
}) {
  const [internalPricing, setInternalPricing] = useState(false);
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
        isDark ? 'bg-[#050507]' : 'bg-[#E5E9F0]'
      } flex items-center justify-center sm:p-4 overflow-x-hidden transition-colors duration-300`}
    >
      <div
        className={`relative w-full max-w-[430px] h-[100dvh] sm:h-[min(896px,94dvh)] ${
          isDark
            ? 'dark bg-[#09090B] border-[#26262A] shadow-[0_32px_100px_rgba(0,0,0,0.9)]'
            : 'bg-[#F8FAFC] border-slate-300 shadow-[0_32px_80px_rgba(15,23,42,0.14)]'
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
        <header className="px-4 pt-1 pb-2.5 flex items-center justify-between gap-2 shrink-0">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Volver"
              className="w-10 h-10 rounded-full card-3d-interactive flex items-center justify-center text-slate-800 dark:text-white/90 active:scale-90 transition-all shadow-md shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div
              className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shrink-0 border border-emerald-500/20 bg-[#0D3F2E]"
              aria-hidden="true"
            >
              <img 
                src="/logos/horsevision-icon.png" 
                alt="HorseVision Icon" 
                className="w-full h-full object-cover" 
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[16px] font-extrabold tracking-tight text-slate-900 dark:text-white truncate drop-shadow-sm">
              HorseVision
            </span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                healthState?.status === 'ready'
                  ? 'bg-[#10B981]'
                  : healthState?.status === 'checking'
                  ? 'bg-[#F59E0B] animate-pulse'
                  : 'bg-[#EF4444]'
              }`}
              title={healthState?.status === 'ready' ? 'En línea' : 'Sin conexión'}
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Theme Toggle Button (Light/Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-9 h-9 rounded-full card-3d-interactive flex items-center justify-center text-slate-700 dark:text-zinc-300 active:scale-90 transition-all shadow-sm"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#0D3F2E]" />
              )}
            </button>

            {!hideBottomNav && (
              <>
                {/* Subscription & Free Trial Button */}
                <button
                  type="button"
                  onClick={handleOpenPricing}
                  title="Planes de suscripción"
                  className={`h-9 px-2.5 rounded-full card-3d-interactive border ${
                    isDark
                      ? 'border-amber-500/40 text-amber-300'
                      : 'border-amber-600/40 bg-amber-50 text-amber-900'
                  } font-mono text-[10px] font-extrabold flex items-center gap-1 shadow-sm active:scale-90 transition-all`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="hidden xs:inline">Planes</span>
                </button>

                {/* Reset Session Button */}
                <button
                  type="button"
                  onClick={onReset}
                  aria-label="Reiniciar sesión"
                  title="Reiniciar aplicación"
                  className="w-9 h-9 rounded-full card-3d-interactive flex items-center justify-center text-slate-600 dark:text-zinc-300 active:scale-90 transition-all shadow-md shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Optional Analysis Sub-switcher (Only displayed in Análisis when video is active) */}
        {activeNav === 'analisis' && hasAnalysis && (
          <nav
            aria-label="Sub-navegación de análisis"
            className="px-4 pb-2.5 shrink-0"
          >
            <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-[18px] card-3d-recessed shadow-inner">
              {[
                { id: 'report', label: 'Resultados' },
                { id: 'visor', label: 'Visor de Video' },
              ].map((tab) => {
                const active = subTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectSubTab?.(tab.id)}
                    className={`min-h-[40px] rounded-[13px] font-mono text-[12px] font-bold transition-all duration-200 ${
                      active
                        ? 'card-3d-racing-green text-white scale-[1.02]'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.96]'
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
        <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
          {children}
        </main>

        {/* Native Fixed Bottom Navigation Menu (Home, Análisis, Cuadra, Historial, Perfil) */}
        {!hideBottomNav && (
          <nav
            aria-label="Menú principal inferior"
            className={`shrink-0 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] ${
              isDark
                ? 'bg-[#0E0E12]/95 border-[#26262A] text-zinc-400'
                : 'bg-white/95 border-slate-200 text-slate-500'
            } backdrop-blur-lg border-t flex flex-col z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]`}
          >
            <div className="grid grid-cols-5 gap-0.5">
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
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={className}
                    >
                      <path d="M4 19l2-8 3-7 4 1 1 3 4-1 2 4-2 3 2 4-3 1-3-3-2 6H4z" />
                    </svg>
                  ),
                },
                { id: 'historial', label: 'Historial', icon: History },
                { id: 'perfil', label: 'Perfil', icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectNav(item.id)}
                    className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all duration-200 active:scale-95 ${
                      active
                        ? 'text-[#0D3F2E] dark:text-[#10B981] font-bold'
                        : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <div className="relative">
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 ${
                          active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                        }`}
                      />
                      {active && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0D3F2E] dark:bg-[#10B981]" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono mt-1 tracking-tight truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Native iOS Home Bar Indicator */}
            <div className="mt-2 flex justify-center" aria-hidden="true">
              <div
                className={`w-32 h-1 rounded-full ${
                  isDark ? 'bg-white/20' : 'bg-slate-300'
                }`}
              />
            </div>
          </nav>
        )}

        {/* SaaS Pricing Modal with 3 Plans (1 horse, 3 horses, 50 horses) */}
        <PricingModal
          isOpen={pricingOpen}
          onClose={handleClosePricing}
        />
      </div>
    </div>
  );
});

export default NativeShell;
