import React, { useState } from 'react';

/**
 * OnboardingFlow:
 * Exact implementation of the 4-step onboarding flow from @stitch_equine_biomechanics_onboarding_flow:
 * - Step 1: Precisión Cinemática en la Palma de tu Mano
 * - Step 2: Captura Fácil en 10 Segundos
 * - Step 3: Sigue la Evolución de tu Ejemplar
 * - Step 4: Comienza tu Prueba Gratuita (Registro de primer caballo y disciplina)
 *
 * Persisted in localStorage ('hv_onboarding_completed') so it displays strictly ONCE on first launch.
 */
export default function OnboardingFlow({ isOpen, onComplete, onSaveInitialHorse }) {
  const [step, setStep] = useState(1);
  const [horseName, setHorseName] = useState('Valegro');
  const [selectedDiscipline, setSelectedDiscipline] = useState('Salto Olímpico');

  if (!isOpen) return null;

  const handleFinish = () => {
    try {
      localStorage.setItem('hv_onboarding_completed', 'true');
    } catch {
      // ignore
    }
    if (onSaveInitialHorse && horseName.trim()) {
      onSaveInitialHorse(horseName.trim(), selectedDiscipline);
    }
    onComplete();
  };

  const disciplines = ['Salto Olímpico', 'Doma Clásica', 'Polo / Campo'];

  return (
    <div className="fixed inset-0 z-[500] bg-[#030b08] flex items-center justify-center overflow-hidden view-enter select-none font-sans">
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[844px] overflow-hidden flex flex-col justify-between bg-[#030b08] sm:rounded-[42px] sm:border sm:border-emerald-950/40 shadow-2xl">
        
        {/* ========================================================================= */}
        {/* STEP 1: PRECISIÓN CINEMÁTICA EN LA PALMA DE TU MANO */}
        {/* ========================================================================= */}
        {step === 1 && (
          <main className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-black view-enter">
            {/* Full-screen Background Image */}
            <img
              alt="Dressage horse with biomechanical tracking lines in daylight arena"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHotRxsSY-nj7P2xrjnAqT8BOV12WDd2A48kW_ZQu_AtS_64aHfiS5kLBX81ZQEWBn-VWpK0VUBmsAIagGQGdoRtfK369iWSRYBBl75omPTch2mTrD8DkrSVVZS72Kn8mUGqEbE1bX468XkMCSHH1arEsv_A-0b3NBp-4zMRi7DfSSl4bdYuhuVyCQkX0aNUtBHh9ZxhH49HowDheqTX0BrPo3Nvhey2yKAiGab-g"
            />
            {/* Sophisticated Cinematic Gradients Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#072318]/40 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030b08] via-[#072318]/80 to-transparent pointer-events-none" />

            {/* Floating Biomechanical Telemetry Tag near horse anatomy */}
            <div className="absolute top-[28%] left-6 z-20 pointer-events-none animate-pulse">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/60 border border-cyan-400/40 backdrop-blur-md shadow-lg shadow-cyan-950/40">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-mono text-[10px] tracking-wider text-cyan-200 font-medium uppercase">
                  17 Puntos Keypoints • ROM 15.4°
                </span>
              </div>
            </div>

            {/* Top Navigation Header */}
            <header className="relative z-30 flex flex-col w-full pt-6 px-6">
              <div className="flex items-center justify-between py-2">
                {/* Brand identity */}
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fece57] shadow-[0_0_8px_#fece57]" />
                  <span className="text-xs font-bold tracking-[0.28em] text-white uppercase drop-shadow-md">
                    HORSEVISION
                  </span>
                </div>
                {/* Skip action */}
                <button
                  onClick={handleFinish}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md text-xs font-medium text-emerald-100 transition-all border border-white/10"
                  type="button"
                >
                  Saltar
                </button>
              </div>
              {/* Live telemetry status row */}
              <div className="mt-1 inline-flex items-center space-x-1.5">
                <span className="font-mono text-[10px] tracking-widest text-[#a0d1b9]/80 uppercase">
                  • OPTIC-SYNC: 99.4% // TOLERANCIA ±1mm
                </span>
              </div>
            </header>

            {/* Bottom Content Overlay */}
            <footer className="relative z-30 flex flex-col w-full px-6 pb-6 pt-8 mt-auto">
              <div className="flex flex-col space-y-4">
                {/* Minimal FEI gold badge */}
                <div className="inline-flex items-center self-start px-3 py-1 rounded-full bg-[#fece57]/15 border border-[#fece57]/35 backdrop-blur-md">
                  <span className="text-[#fece57] text-[11px] mr-1.5 leading-none">★</span>
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-[#ffdf98] uppercase">
                    ESTÁNDAR FEI &amp; CINEMÁTICA VET
                  </span>
                </div>

                {/* Headline & Subtitle */}
                <div className="space-y-2">
                  <h1 className="text-[30px] leading-[36px] font-extrabold tracking-tight text-white drop-shadow-md font-sans">
                    Precisión <span className="text-[#fece57]">Cinemática</span> en la Palma de tu Mano
                  </h1>
                  <p className="text-[13.5px] leading-[20px] text-emerald-100/80 font-normal">
                    Medición de asimetría validada a 1 milímetro. Detecta desbalances en el trote antes de que afecten el rendimiento.
                  </p>
                </div>

                {/* Spec pills */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md font-mono text-[11px] text-emerald-200">
                    ±1 mm Precisión
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md font-mono text-[11px] text-emerald-200">
                    17 Keypoints IA
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md font-mono text-[11px] text-emerald-200">
                    Sin Sensores
                  </div>
                </div>

                {/* Pagination dots (1st elongated / active) */}
                <div aria-label="Progreso de inducción" className="flex items-center space-x-2 pt-2">
                  <div className="h-1.5 w-7 rounded-full bg-[#fece57] shadow-[0_0_8px_rgba(254,206,87,0.5)] transition-all" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                </div>

                {/* Primary Call to Action Button */}
                <button
                  onClick={() => setStep(2)}
                  className="group relative flex items-center justify-between w-full h-14 px-6 rounded-2xl bg-gradient-to-r from-[#0d3f2e] to-[#125740] hover:from-[#114b37] hover:to-[#176a4e] border border-emerald-500/30 text-white shadow-xl shadow-black/50 active:scale-[0.98] transition-all overflow-hidden"
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="font-sans text-[16px] font-semibold tracking-wide text-white drop-shadow">
                    Continuar
                  </span>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 text-white group-hover:translate-x-1 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </div>
                </button>

                {/* Compliance micro-footer */}
                <div className="flex items-center justify-center space-x-1.5 pt-0.5 text-white/40">
                  <span className="material-symbols-outlined text-[12px]">verified_user</span>
                  <span className="font-sans text-[10.5px] tracking-wide">Protocolo Biomecánico FEI Compliant</span>
                </div>
              </div>
            </footer>
          </main>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CAPTURA FÁCIL EN 10 SEGUNDOS */}
        {/* ========================================================================= */}
        {step === 2 && (
          <main className="flex flex-col flex-1 w-full h-full relative bg-primary view-enter select-none overflow-hidden">
            <div className="relative w-full h-full overflow-hidden flex flex-col justify-between pb-6 pt-6">
              <img
                alt="Cinematic equestrian dressage tracking shot"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4-dJWEo4rvbq9Eih-CR179MTpc7vbTVNw3jbkycKQzY9QelJdV7YedmgwvgvUJCVKXUv29E_c6G3gsFlh8mjELGv69yWFutpewP3ieLNrIBxOBhRr-tCdox8eHLH-EoJQmdwb02aED-BUTo3VpppTsqeSESontDchP5jKAIIZ0jM4CFmUm9MfaP-_2VMbWiMyjHc8eXIXaOObNA6NRRQSzWWw_kfny1IBKUqsUA4"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-transparent via-40% to-primary/95 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-primary via-primary/80 to-transparent pointer-events-none" />

              {/* Viewfinder Framing Lines */}
              <div className="absolute inset-0 pointer-events-none p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start pt-12">
                  <svg className="w-7 h-7 text-secondary-container/80 filter drop-shadow" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M2 9V2h7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg className="w-7 h-7 text-secondary-container/80 filter drop-shadow" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M22 9V2h-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="w-full flex items-center justify-center my-auto opacity-75">
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-px bg-tertiary-fixed-dim/40" />
                    <div className="mx-3 px-2 py-0.5 rounded-full bg-primary/40 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim animate-pulse" />
                      <span className="font-telemetry-unit text-telemetry-unit text-tertiary-fixed tracking-wider">
                        AI TRACKING LOCK
                      </span>
                    </div>
                    <div className="w-16 h-px bg-tertiary-fixed-dim/40" />
                  </div>
                </div>

                <div className="flex justify-between items-end pb-72">
                  <svg className="w-7 h-7 text-secondary-container/80 filter drop-shadow" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M2 15v7h7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg className="w-7 h-7 text-secondary-container/80 filter drop-shadow" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M22 15v7h-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Header */}
              <header className="relative z-10 flex items-center justify-between px-6 pt-2 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[13px] tracking-[0.28em] text-on-primary font-bold uppercase drop-shadow-md">
                    HORSEVISION
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest/15 backdrop-blur-md font-telemetry-unit text-telemetry-unit text-primary-fixed uppercase tracking-wider">
                    v2.4
                  </span>
                </div>
                <button
                  onClick={handleFinish}
                  className="group flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-lowest/10 backdrop-blur-md transition-all active:scale-95 hover:bg-surface-container-lowest/20"
                  type="button"
                >
                  <span className="font-sans text-[12px] text-on-primary/90 font-medium tracking-wide">Saltar</span>
                  <span className="material-symbols-outlined text-on-primary/70 text-sm group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </button>
              </header>

              {/* Bottom Section */}
              <section className="relative z-10 w-full px-6 pb-6 pt-4 flex flex-col justify-end mt-auto">
                <div className="flex items-center mb-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/80 backdrop-blur-md shadow-lg shadow-primary-container/40">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-fixed" />
                    </span>
                    <span className="font-telemetry-data text-[13px] text-primary-fixed uppercase tracking-wider font-semibold">
                      Quality Gate 02
                    </span>
                    <span className="font-telemetry-unit text-[10px] text-on-primary-container">
                      ISO·VERIFIED
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <h1 className="text-[30px] leading-[36px] text-on-primary font-bold tracking-tight drop-shadow-md font-sans">
                    Captura Fácil en 10&nbsp;Segundos
                  </h1>
                  <p className="text-[14px] text-primary-fixed/90 max-w-sm drop-shadow-sm font-normal leading-relaxed">
                    Solo necesitas tu smartphone y una pasada de tu caballo al trote recto en superficie nivelada.
                  </p>
                </div>

                {/* 3 Grid cards */}
                <div className="grid grid-cols-3 gap-2.5 mb-6">
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-container-lowest/10 backdrop-blur-md hover:bg-surface-container-lowest/15 transition-all">
                    <span className="material-symbols-outlined text-secondary-fixed text-xl mb-1">
                      stay_current_landscape
                    </span>
                    <span className="text-[12px] text-on-primary font-semibold text-center whitespace-nowrap">
                      90° Lateral
                    </span>
                    <span className="font-telemetry-unit text-[10px] text-primary-fixed/70 uppercase">
                      Plano Óptimo
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-container-lowest/10 backdrop-blur-md hover:bg-surface-container-lowest/15 transition-all">
                    <span className="material-symbols-outlined text-tertiary-fixed text-xl mb-1">
                      straighten
                    </span>
                    <span className="text-[12px] text-on-primary font-semibold text-center whitespace-nowrap">
                      5 - 8 Metros
                    </span>
                    <span className="font-telemetry-unit text-[10px] text-primary-fixed/70 uppercase">
                      Distancia
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-container-lowest/10 backdrop-blur-md hover:bg-surface-container-lowest/15 transition-all">
                    <span className="material-symbols-outlined text-primary-fixed text-xl mb-1">
                      timelapse
                    </span>
                    <span className="text-[12px] text-on-primary font-semibold text-center whitespace-nowrap">
                      8 - 12 Seg
                    </span>
                    <span className="font-telemetry-unit text-[10px] text-primary-fixed/70 uppercase">
                      Duración
                    </span>
                  </div>
                </div>

                {/* Step indicator (Step 2 active) */}
                <div aria-label="Progreso de paso 2 de 4" className="flex items-center justify-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full bg-surface-container-lowest/30 transition-all duration-300" />
                  <div className="w-7 h-2 rounded-full bg-primary-fixed flex items-center justify-start px-0.5 shadow-sm shadow-primary-fixed/50 transition-all duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="w-2 h-2 rounded-full bg-surface-container-lowest/30 transition-all duration-300" />
                  <span className="w-2 h-2 rounded-full bg-surface-container-lowest/30 transition-all duration-300" />
                </div>

                {/* Button */}
                <button
                  onClick={() => setStep(3)}
                  className="w-full h-14 rounded-2xl bg-primary-container text-on-primary text-[14px] flex items-center justify-center gap-3 shadow-xl shadow-primary/60 transition-all active:scale-[0.98] hover:bg-primary-container/90 relative overflow-hidden group"
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-container-lowest/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="tracking-wide font-semibold text-white">Continuar</span>
                  <span className="material-symbols-outlined text-secondary-fixed text-xl transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>

                <div className="mt-3 text-center">
                  <p className="font-telemetry-unit text-[10px] text-primary-fixed/60 uppercase tracking-widest">
                    Autocalibración de paso sin marcadores físicos
                  </p>
                </div>
              </section>
            </div>
          </main>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SIGUE LA EVOLUCIÓN DE TU EJEMPLAR */}
        {/* ========================================================================= */}
        {step === 3 && (
          <main className="flex flex-col flex-1 w-full h-full relative overflow-hidden bg-primary pt-6 pb-6 justify-between view-enter select-none">
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <img
                alt="Equine biomechanical analysis"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5g-eqyZ04xwQ_mezUvEX_UfrWPXI4Zm8UQBpMYOI3cUuNYRKI82UgPzXu2AC3YDgDkg6BzhPKrIT0PL1nYJqqp1u2EYUbKM5EyidaYsc_R9Pk5FFvNA7kkDzON6Sv_cyFhRIUIjRPHY4VovztIa0Afy8RyNvY-6lbo8MSWqKi_kz1r7gYRJqUhPXH3H03ea1m1Jn4U7nttWJnn8D6nK56uYsguW3q1nUuYyfPWFw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/30 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/85 to-transparent pointer-events-none" />

              <div className="absolute inset-0 pointer-events-none opacity-40">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <circle className="animate-pulse" cx="68%" cy="36%" fill="none" r="22" stroke="#4cd6fb" strokeDasharray="3 3" strokeWidth="1" />
                  <circle cx="68%" cy="36%" fill="#4cd6fb" r="4" />
                  <line stroke="#4cd6fb" strokeDasharray="2 2" strokeWidth="1" x1="68%" x2="88%" y1="36%" y2="42%" />
                  <circle cx="58%" cy="55%" fill="none" r="6" stroke="#b3ebff" strokeWidth="1.5" />
                </svg>
                <div className="absolute top-[38%] right-4 bg-tertiary-container/80 backdrop-blur-md px-2 py-1 rounded text-on-tertiary-container font-telemetry-data text-[10px] tracking-widest uppercase">
                  V-ANG 142.4°
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col justify-between flex-1">
              <header className="flex items-center justify-between px-6 pt-2 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_10px_#fece57]" />
                  <span className="font-sans text-surface tracking-[0.28em] text-[13px] uppercase font-bold drop-shadow-sm">
                    HORSEVISION
                  </span>
                </div>
                <button
                  onClick={handleFinish}
                  className="text-surface-variant/80 hover:text-surface transition-colors text-[12px] px-3 py-1.5 rounded-full bg-surface-container-highest/20 backdrop-blur-md active:scale-95"
                  type="button"
                >
                  Saltar
                </button>
              </header>

              <div className="px-6 pt-8 flex flex-col items-start">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/15 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary-container shadow-[0_0_12px_#fece57]">
                    <span className="material-symbols-outlined text-on-secondary-container text-[14px]">
                      north_east
                    </span>
                  </div>
                  <span className="font-telemetry-data text-surface text-[13px] font-semibold tracking-wider">
                    +15% EMPUJE
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim animate-ping" />
                </div>
              </div>

              <div className="px-6 pt-6 flex flex-col">
                <h1 className="text-[30px] text-surface font-light tracking-tight leading-[1.15] mb-3 font-sans">
                  Sigue la Evolución<br />
                  <span className="font-semibold text-secondary-fixed">de tu Ejemplar</span>
                </h1>
                <p className="text-[14px] text-surface-variant font-normal leading-relaxed mb-5 max-w-sm">
                  Monitorea semana a semana cómo responde su pisada y empuje a cada ajuste de entrenamiento y herraje.
                </p>

                <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container-lowest/10 backdrop-blur-md shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed" />
                    <span className="text-[10px] text-surface tracking-wide font-medium">Detección temprana</span>
                  </div>
                  <span className="text-surface-variant/40 text-[10px]">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" />
                    <span className="text-[10px] text-surface tracking-wide font-medium">Reportes FEI</span>
                  </div>
                  <span className="text-surface-variant/40 text-[10px]">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim" />
                    <span className="text-[10px] text-surface tracking-wide font-medium">Telemetría</span>
                  </div>
                </div>
              </div>

              <div className="w-full px-6 pt-5 pb-6 flex flex-col items-center gap-5">
                {/* Step indicator (Step 3 active) */}
                <div aria-label="Progreso de inducción" className="flex items-center justify-center gap-2" role="tablist">
                  <span className="w-2 h-2 rounded-full bg-surface-variant/60 transition-all duration-300" />
                  <span className="w-2 h-2 rounded-full bg-surface-variant/60 transition-all duration-300" />
                  <div className="flex items-center w-7 h-2 rounded-full bg-surface-container-highest/40 relative overflow-hidden transition-all duration-300">
                    <span className="absolute left-0.5 w-1.5 h-1.5 rounded-full bg-secondary-container" />
                  </div>
                  <span className="w-2 h-2 rounded-full bg-surface-variant/60 transition-all duration-300" />
                </div>

                <button
                  onClick={() => setStep(4)}
                  className="w-full h-14 bg-primary-container text-on-primary hover:bg-primary active:scale-[0.98] transition-all duration-200 rounded-2xl flex items-center justify-between px-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)] group"
                  type="button"
                >
                  <span className="tracking-wider font-semibold text-surface text-[14px]">Continuar</span>
                  <div className="w-8 h-8 rounded-full bg-surface/10 flex items-center justify-center text-surface transition-transform duration-200 group-hover:translate-x-1">
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </div>
                </button>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: COMIENZA TU PRUEBA GRATUITA */}
        {/* ========================================================================= */}
        {step === 4 && (
          <main className="flex flex-col flex-1 w-full h-full relative bg-primary overflow-hidden view-enter select-none">
            <div className="relative w-full h-full overflow-hidden flex flex-col justify-between shadow-2xl">
              <div
                className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDvKTnnht-ZTKjqOk44DgbzpaK33sq2_xFTPMecuqY_e9akz-sCRU_xcRd19TmakZqXo1fUxGrvJ39hFXx-LLqbB3v9DC4bAbt-pJ_-urrJCXoS6Y8i3X1A3zfF-AJeLa-r8XV7szqGv0cyx3TU8DcElZ8-5PqP-ohjhoN3OhHpsR6ZOmzLZZNe7nqMwTb17CykT8GtA2qPQYNVI4MM4frQtu52D-LF8bEyzkGBx-M')`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/20 to-primary" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/95 to-transparent" style={{ height: '80%', top: '20%' }} />

                <div className="absolute top-20 right-5 flex flex-col items-end gap-1 opacity-70 pointer-events-none">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/40 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-ping" />
                    <span className="font-telemetry-data text-[10px] text-tertiary-fixed tracking-wider">
                      OPTIC-SYNC: 99.4%
                    </span>
                  </div>
                  <span className="font-telemetry-unit text-[10px] text-surface-container-high tracking-widest uppercase">
                    LATENCY 12ms // BIO-V5
                  </span>
                </div>
              </div>

              {/* Header with Back button */}
              <header className="relative z-20 flex items-center justify-between px-5 pt-6">
                <button
                  onClick={() => setStep(3)}
                  aria-label="Volver"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/30 text-surface-bright backdrop-blur-md active:scale-95 transition-transform"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[14px] tracking-[0.28em] text-surface-bright uppercase font-medium">
                    HORSEVISION
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" />
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/30 text-surface-bright backdrop-blur-md">
                  <span className="material-symbols-outlined text-lg">lock</span>
                </div>
              </header>

              {/* Form Content */}
              <div className="relative z-20 flex flex-col px-5 pb-8 pt-2">
                <div className="inline-flex items-center self-start gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container shadow-md mb-3">
                  <span className="material-symbols-outlined text-sm">star</span>
                  <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">
                    PRUEBA EXCLUSIVA 7 DÍAS
                  </span>
                </div>

                <div className="flex flex-col gap-1 mb-3">
                  <h1 className="text-[30px] leading-tight text-surface-bright font-light tracking-tight font-sans">
                    Comienza tu <span className="font-semibold text-secondary-fixed">Prueba Gratuita</span>
                  </h1>
                  <p className="text-[14px] text-surface-container-high opacity-90 leading-snug">
                    Sin cobros anticipados. Cancela cuando quieras con 1 toque.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-primary/60 backdrop-blur-xl mb-3 shadow-xl">
                  {/* Horse Name Input */}
                  <div className="relative flex items-center bg-surface-container-highest/10 rounded-xl px-3.5 py-2.5 transition-all focus-within:bg-surface-container-highest/20">
                    <div className="flex flex-col flex-1 min-w-0">
                      <label className="text-[10px] text-surface-container-high tracking-wider uppercase font-mono" htmlFor="horseNameInput">
                        Nombre de tu caballo
                      </label>
                      <input
                        className="w-full bg-transparent font-sans text-[17px] font-semibold text-surface-bright placeholder:text-surface-container-high/40 focus:outline-none focus:ring-0 p-0"
                        id="horseNameInput"
                        placeholder="Ej. Valegro, Cornet Obolensky..."
                        type="text"
                        value={horseName}
                        onChange={(e) => setHorseName(e.target.value)}
                      />
                    </div>
                    <span className="material-symbols-outlined text-secondary-fixed text-xl shrink-0 ml-2">
                      verified
                    </span>
                  </div>

                  {/* Discipline Pills */}
                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <span className="text-[10px] text-surface-container-high uppercase tracking-widest pl-1 font-mono">
                      Especialidad de Alto Rendimiento
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" id="disciplineContainer">
                      {disciplines.map((d) => {
                        const isSelected = selectedDiscipline === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSelectedDiscipline(d)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all duration-200 ${
                              isSelected
                                ? 'bg-secondary-fixed text-on-secondary-fixed shadow-sm font-semibold'
                                : 'bg-primary/80 text-surface-container-high hover:text-surface-bright'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleFinish}
                    className="relative group w-full py-4 px-6 rounded-2xl bg-secondary-fixed text-on-secondary-fixed font-sans text-[15px] font-bold flex items-center justify-between shadow-xl active:scale-[0.98] transition-transform duration-150 overflow-hidden"
                    type="button"
                  >
                    <div className="flex items-center gap-2 relative z-10">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="tracking-tight">Empezar ahora — 7 Días Gratis</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-on-secondary-fixed/10 flex items-center justify-center relative z-10 transition-transform group-hover:translate-x-0.5">
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </div>
                  </button>

                  {/* Step indicator (Step 4 active) */}
                  <div className="flex items-center justify-center gap-1.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-container-high/40" />
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-container-high/40" />
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-container-high/40" />
                    <div className="w-6 h-1.5 rounded-full bg-secondary-fixed flex items-center pl-0.5">
                      <span className="w-1 h-1 rounded-full bg-on-secondary-fixed" />
                    </div>
                  </div>

                  <p className="text-center font-telemetry-unit text-[10px] text-surface-container-high/70 tracking-wider">
                    Sin compromiso • Cancela en cualquier momento • Acceso completo al motor de IA
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}

      </div>
    </div>
  );
}
