import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Activity,
  Check,
  ChevronRight,
  ArrowRight,
  Play,
  Share2,
  FileText,
  Calendar,
  Sparkles,
  Layers,
  Heart,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function LandingPage({ onLaunchApp }) {
  const [selectedBilling, setSelectedBilling] = useState('monthly'); // 'monthly' | 'yearly'

  const handleAction = (planId = null) => {
    if (planId) {
      try {
        localStorage.setItem('hv_selected_plan_intent', planId);
      } catch (e) {}
    }
    if (onLaunchApp) {
      onLaunchApp();
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#0D3F2E] selection:text-white">
      {/* =========================================================================
          1. HEADER / NAVBAR (Clean, Airy RealHorse Style)
          ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto h-20 px-6 sm:px-10 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => handleAction()}
            className="flex items-center gap-3 group text-left"
          >
            <img
              src="/logos/horsevision-icon.png"
              alt="HorseVision Icon"
              className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-sans text-[20px] font-extrabold tracking-tight text-[#0D3F2E]">
                HorseVision
              </span>
              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider -mt-1">
                Biomechanics Lab
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate-600">
            <a href="#como-funciona" className="hover:text-[#0D3F2E] transition">
              Cómo funciona
            </a>
            <a href="#beneficios" className="hover:text-[#0D3F2E] transition">
              Beneficios
            </a>
            <a href="#planes" className="hover:text-[#0D3F2E] transition">
              Planes
            </a>
            <a href="#testimonios" className="hover:text-[#0D3F2E] transition">
              Testimonios
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleAction()}
              className="hidden sm:inline-flex px-4 py-2 text-[13px] font-semibold text-slate-700 hover:text-[#0D3F2E] transition"
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => handleAction('1-horse')}
              className="px-5 py-2.5 rounded-full bg-[#0D3F2E] hover:bg-[#125740] text-white text-[13px] font-bold shadow-md active:scale-95 transition-all"
            >
              Comenzar Gratis
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION (RealHorse Cinematic Visual + Direct Message)
          ========================================================================= */}
      <section className="relative pt-20 min-h-[580px] sm:min-h-[680px] flex items-center justify-center text-white overflow-hidden bg-slate-900">
        {/* Background photo with clean dark gradient overlay */}
        <img
          src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=2000&q=85"
          alt="Caballo trotando en pista"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-45 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center flex flex-col items-center">
          {/* Subtle Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6 text-white text-[12px] font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Inteligencia Artificial para la Salud Equina</span>
          </div>

          {/* RealHorse Style Hero Headline */}
          <h1 className="text-[40px] sm:text-[64px] font-bold tracking-tight leading-[1.08] max-w-3xl">
            Entiende a tu Caballo <br className="hidden sm:inline" />
            <span className="text-[#A7F3D0]">Mucho Mejor</span>
          </h1>

          <p className="mt-5 text-[16px] sm:text-[19px] text-slate-200 max-w-xl font-normal leading-relaxed">
            La forma más sencilla de evaluar la simetría de movimiento, zancada y bienestar de tu caballo directamente desde tu teléfono móvil. Sin sensores invasivos.
          </p>

          {/* Main CTA Pill */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={() => handleAction('1-horse')}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0D3F2E] hover:bg-[#125740] text-white text-[15px] font-bold shadow-xl shadow-black/40 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Comenzar Prueba de 7 Días</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleAction()}
              className="w-full sm:w-auto px-6 py-4 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-[15px] font-semibold transition"
            >
              Abrir Aplicación PWA
            </button>
          </div>

          <p className="mt-4 text-[12px] text-slate-300 font-mono">
            7 Días gratis en Plan 1 Caballo · Cancela con 1 clic cuando quieras
          </p>
        </div>
      </section>

      {/* =========================================================================
          3. "TAN SENCILLO COMO 1 - 2 - 3" (Easy as 1-2-3 from RealHorse)
          ========================================================================= */}
      <section className="py-24 px-6 sm:px-10 max-w-6xl mx-auto" id="como-funciona">
        <div className="text-center mb-16">
          <span className="text-[12px] uppercase font-mono font-bold tracking-[0.2em] text-[#0D3F2E]">
            Paso a Paso
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-bold text-slate-900 tracking-tight mt-1">
            Tan fácil como 1 - 2 - 3
          </h2>
          <p className="text-[16px] text-slate-500 max-w-lg mx-auto mt-2">
            No necesitas sensores costosos ni experiencia técnica. Si sabes manejar un caballo, sabes usar HorseVision.
          </p>
        </div>

        <div className="flex flex-col gap-16 sm:gap-24">
          {/* Step 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 font-mono text-[18px] font-bold text-[#0D3F2E]">
                <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[14px]">
                  01
                </span>
                <span>Graba el Trote en 15 Segundos</span>
              </div>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Sostén tu teléfono en la mano y filma a tu caballo trotando a 90° en línea recta o en círculo a la cuerda. La aplicación te guía en pantalla con un nivelador giroscópico forzado a 16:9 para asegurar el ángulo perfecto.
              </p>
              <div className="flex items-center gap-4 text-[13px] font-mono text-slate-500 pt-2">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#10B981]" /> Sin cables ni arneses
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#10B981]" /> Guías en pantalla
                </span>
              </div>
            </div>

            {/* Mockup 1: Horizontal filming preview */}
            <div className="relative rounded-3xl bg-slate-900 p-2 shadow-2xl border border-slate-800 overflow-hidden aspect-[16/9] flex items-center justify-center group">
              <img
                src="https://images.unsplash.com/photo-1598974357801-cbca100e6571?auto=format&fit=crop&w=1000&q=80"
                alt="Encuadre 16:9 de trote"
                className="w-full h-full object-cover rounded-2xl opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-[11px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Encuadre 16:9 a 90° · Grabando</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center md:flex-row-reverse">
            <div className="flex flex-col gap-3 md:order-2">
              <div className="inline-flex items-center gap-2 font-mono text-[18px] font-bold text-[#0D3F2E]">
                <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[14px]">
                  02
                </span>
                <span>Análisis de IA en 60 Segundos</span>
              </div>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Nuestro motor de Visión Artificial detecta 17 keypoints anatómicos en cada fotograma. Mide los tiempos de apoyo de cada casco, la flexión de los corvejones y menudillos, y calcula el índice de simetría global.
              </p>
              <div className="flex items-center gap-4 text-[13px] font-mono text-slate-500 pt-2">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#10B981]" /> 17 puntos anatómicos
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#10B981]" /> Estándar Keegan ≤ 6mm
                </span>
              </div>
            </div>

            {/* Mockup 2: Phone vertical analysis card */}
            <div className="flex justify-center md:order-1">
              <div className="w-full max-w-[320px] rounded-[32px] bg-white p-4 shadow-xl border border-slate-200 flex flex-col gap-3 font-sans">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=200&q=80"
                    alt="Dakota"
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-[15px] text-slate-900">Dakota</h4>
                    <span className="text-[11px] text-slate-500 font-mono">Silla Francés · 7 años</span>
                  </div>
                  <span className="ml-auto font-mono text-[12px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    88/100
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[12px] text-slate-600">
                  <div className="flex justify-between font-mono font-bold text-slate-800 mb-1">
                    <span>Simetría de Apoyo</span>
                    <span className="text-emerald-600">Óptima (98.4%)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Excelente respuesta en diagonales. Sin asimetrías de impacto visibles.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 font-mono text-[18px] font-bold text-[#0D3F2E]">
                <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[14px]">
                  03
                </span>
                <span>Evolución en el Tiempo & Reportes</span>
              </div>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                No son análisis aislados: consulta la gráfica histórica de cada caballo para ver si su biomecánica mejora con el entrenamiento o si hay sobrecarga. Descarga reportes clínicos en PDF listos para enviar a tu veterinario.
              </p>
              <div className="flex items-center gap-4 text-[13px] font-mono text-slate-500 pt-2">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#10B981]" /> Gráfica evolutiva histórica
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#10B981]" /> Exportación a PDF oficial
                </span>
              </div>
            </div>

            {/* Mockup 3: Evolution Chart preview */}
            <div className="flex justify-center">
              <div className="w-full max-w-[340px] rounded-[32px] bg-slate-900 text-white p-5 shadow-xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-400">HISTORIAL EVOLUTIVO</span>
                  <span className="text-emerald-400 font-bold">+18 pts recuperación</span>
                </div>
                {/* SVG Curve */}
                <svg className="w-full h-24 text-emerald-400" viewBox="0 0 300 100" fill="none">
                  <path
                    d="M10,80 Q75,65 150,45 T290,20"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="290" cy="20" r="4" fill="#10B981" />
                </svg>
                <div className="flex justify-between font-mono text-[10px] text-zinc-500 border-t border-white/10 pt-2">
                  <span>Ago 2024 (70 pts)</span>
                  <span className="text-white font-bold">Nov 2024 (88 pts)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. "ANTICÍPATE A LAS COJERAS" (Value Proposition Highlight)
          ========================================================================= */}
      <section className="py-20 bg-slate-50 border-y border-slate-200 px-6 sm:px-10" id="beneficios">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="rounded-3xl overflow-hidden shadow-xl aspect-[4/3] bg-slate-200">
            <img
              src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80"
              alt="Jinete evaluando a su caballo"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[12px] uppercase font-mono font-bold tracking-[0.2em] text-[#0D3F2E]">
              Medicina Preventiva
            </span>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-slate-900 tracking-tight leading-tight">
              Anticípate a las lesiones antes de que aparezca el dolor.
            </h2>
            <p className="text-[15px] text-slate-600 leading-relaxed">
              Más del 80% de las lesiones musculoesqueléticas en caballos de salto, doma y carreras comienzan con micro-asimetrías invisibles al ojo humano.
            </p>
            <p className="text-[15px] text-slate-600 leading-relaxed">
              Cuando un caballo empieza a mostrar una cojera evidente, el cartílago o el tendón ya están en fase inflamatoria. Con HorseVision detectas la sobrecarga semanas antes, salvando la temporada deportiva y ahorrando miles de euros en tratamientos.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleAction('1-horse')}
                className="inline-flex items-center gap-2 font-mono text-[13px] font-bold text-[#0D3F2E] hover:underline"
              >
                <span>Probar con mi caballo (7 Días Gratis)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. TRES PILARES CLAVE (Icon Grid)
          ========================================================================= */}
      <section className="py-20 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D3F2E] flex items-center justify-center mb-2">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-[18px] font-bold text-slate-900">100% Desde tu Teléfono</h3>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Sin sensores caros, sin chalecos ni accesorios que molesten al caballo. Solo tu cámara y la IA de visión computacional.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D3F2E] flex items-center justify-center mb-2">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-[18px] font-bold text-slate-900">Diagnóstico en 60 Segundos</h3>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Grabas, la IA analiza y de inmediato tienes el puntaje de simetría de cabeza, grupa y cada miembro sobre la arena.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D3F2E] flex items-center justify-center mb-2">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-[18px] font-bold text-slate-900">Datos para tu Veterinario</h3>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Comparte datos matemáticos y reportes en PDF oficiales para tomar decisiones clínicas con objetividad absoluta.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. TESTIMONIOS (Social Proof)
          ========================================================================= */}
      <section className="py-20 bg-slate-50 border-t border-slate-200 px-6 sm:px-10" id="testimonios">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <span className="text-[12px] uppercase font-mono font-bold tracking-[0.2em] text-[#0D3F2E]">
            Comunidad Ecuestre
          </span>
          <h2 className="text-[32px] sm:text-[40px] font-bold text-slate-900 tracking-tight mt-1">
            Respaldado por jinetes, criadores y veterinarios
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <p className="text-[15px] text-slate-700 italic leading-relaxed">
              “HorseVision nos permitió detectar una leve falta de empuje en el posterior izquierdo antes de un concurso importante. Ajustamos el herraje a tiempo y Dakota rindió al 100%.”
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0D3F2E] text-white font-bold flex items-center justify-center text-[13px]">
                MR
              </div>
              <div className="text-left font-mono text-[12px]">
                <span className="font-bold text-slate-900 block">Martina Rossi</span>
                <span className="text-slate-500">Jinete de Salto Clásico 1.40m</span>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <p className="text-[15px] text-slate-700 italic leading-relaxed">
              “Como veterinario de pista, tener una herramienta rápida que mide la oscilación de nuca y grupa en mm sin colocar sensores me ahorra horas de valoración subjetiva.”
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0D3F2E] text-white font-bold flex items-center justify-center text-[13px]">
                JA
              </div>
              <div className="text-left font-mono text-[12px]">
                <span className="font-bold text-slate-900 block">Dr. Javier Armenta</span>
                <span className="text-slate-500">Médico Veterinario Especialista en Cojeras</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. PLANES Y PRECIOS (Choose Your Plan · RealHorse Clear Layout)
          ========================================================================= */}
      <section className="py-24 px-6 sm:px-10 max-w-6xl mx-auto" id="planes">
        <div className="text-center mb-14">
          <span className="text-[12px] uppercase font-mono font-bold tracking-[0.2em] text-[#0D3F2E]">
            Precios Claros y Transparentes
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-bold text-slate-900 tracking-tight mt-1">
            Elige el plan ideal para tu cuadra
          </h2>
          <p className="text-[15px] text-slate-500 max-w-md mx-auto mt-2">
            Prueba gratis sin compromiso. Facturación segura procesada por PayPal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1: 1 Caballo */}
          <div className="rounded-[32px] bg-white border border-slate-200 p-8 shadow-sm flex flex-col justify-between relative hover:shadow-xl transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Individual
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold uppercase">
                  7 Días Gratis
                </span>
              </div>

              <h3 className="text-[22px] font-bold text-slate-900">Plan 1 Caballo</h3>
              <p className="text-[13px] text-slate-500 leading-snug">
                Para jinetes y propietarios individuales que entrenan con su propio ejemplar.
              </p>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-[42px] font-extrabold text-slate-900 tracking-tight">
                    $6.99
                  </span>
                  <span className="font-mono text-[12px] text-slate-400">USD / mes</span>
                </div>
                <p className="text-[11px] font-mono text-emerald-600 font-bold mt-1">
                  7 Días Gratis · Cobro de $6.99 a partir del 8º día
                </p>
              </div>

              <ul className="space-y-3 pt-4 border-t border-slate-100 text-[13px] text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>1 caballo registrado</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Análisis de video ilimitado a 90°</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Detección 17 keypoints anatómicos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Diagnóstico resumido de simetría</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleAction('1-horse')}
                className="w-full py-3.5 px-4 rounded-full bg-[#0D3F2E] hover:bg-[#125740] text-white font-mono text-[12px] font-bold uppercase tracking-wider shadow-md active:scale-95 transition"
              >
                Comenzar 7 Días Gratis
              </button>
            </div>
          </div>

          {/* Plan 2: 3 Caballos (Destacado) */}
          <div className="rounded-[32px] bg-[#0D3F2E] text-white p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden border-2 border-emerald-400/40">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                  Profesional
                </span>
                <span className="px-3 py-1 rounded-full bg-white text-[#0D3F2E] font-mono text-[10px] font-extrabold uppercase shadow-sm">
                  Más Popular
                </span>
              </div>

              <h3 className="text-[22px] font-bold text-white">Plan 3 Caballos</h3>
              <p className="text-[13px] text-emerald-100/80 leading-snug">
                Para entrenadores, jinetes de competición y criadores con varios atletas.
              </p>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-[42px] font-extrabold text-white tracking-tight">
                    $15.99
                  </span>
                  <span className="font-mono text-[12px] text-emerald-200">USD / mes</span>
                </div>
                <p className="text-[11px] font-mono text-emerald-300 mt-1">
                  Cobro mensual inmediato con PayPal
                </p>
              </div>

              <ul className="space-y-3 pt-4 border-t border-white/15 text-[13px] text-emerald-50">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Hasta 3 ejemplares registrados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Módulo evolutivo "Follow the Progress"</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Descarga de Informes Oficiales en PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Asistente Clínico IA veterinario</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleAction('3-horses')}
                className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-slate-100 text-[#0D3F2E] font-mono text-[12px] font-extrabold uppercase tracking-wider shadow-lg active:scale-95 transition"
              >
                Suscribirme a Plan Pro
              </button>
            </div>
          </div>

          {/* Plan 3: Hasta 50 Caballos */}
          <div className="rounded-[32px] bg-white border border-slate-200 p-8 shadow-sm flex flex-col justify-between relative hover:shadow-xl transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Equipos & Clínicas
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-mono text-[10px] font-bold uppercase">
                  Haras
                </span>
              </div>

              <h3 className="text-[22px] font-bold text-slate-900">Hasta 50 Caballos</h3>
              <p className="text-[13px] text-slate-500 leading-snug">
                Para yeguadas, clubes hípicos y centros veterinarios deportivos.
              </p>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-[42px] font-extrabold text-slate-900 tracking-tight">
                    $99.00
                  </span>
                  <span className="font-mono text-[12px] text-slate-400">USD / mes</span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 mt-1">
                  Cobro mensual inmediato con PayPal
                </p>
              </div>

              <ul className="space-y-3 pt-4 border-t border-slate-100 text-[13px] text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Hasta 50 caballos registrados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Trazabilidad histórica completa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Dossiers periciales para compraventa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Soporte prioritario veterinario</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleAction('50-horses')}
                className="w-full py-3.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-mono text-[12px] font-bold uppercase tracking-wider active:scale-95 transition"
              >
                Acceso Haras & Clínicas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. BANNER FINAL DE CONVERSIÓN (Warm Call to Action)
          ========================================================================= */}
      <section className="relative py-20 px-6 sm:px-10 bg-slate-900 text-white overflow-hidden text-center">
        <img
          src="https://images.unsplash.com/photo-1598974357801-cbca100e6571?auto=format&fit=crop&w=1800&q=80"
          alt="Horse and rider"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-950" />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-4">
          <h2 className="text-[32px] sm:text-[48px] font-bold tracking-tight leading-tight">
            Comienza a Evaluar a tu Caballo Hoy Mismo
          </h2>
          <p className="text-[16px] text-slate-300 max-w-xl">
            Únete a cientos de jinetes y entrenadores que cuidan la salud y el rendimiento de sus atletas con objetividad.
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => handleAction('1-horse')}
              className="px-8 py-4 rounded-full bg-[#0D3F2E] hover:bg-[#125740] text-white text-[15px] font-bold shadow-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Comenzar Prueba de 7 Días</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FOOTER MINIMALISTA
          ========================================================================= */}
      <footer className="py-12 px-6 sm:px-10 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-[12px] text-slate-500">
          <div className="flex items-center gap-3">
            <img
              src="/logos/horsevision-icon.png"
              alt="HorseVision"
              className="w-6 h-6 object-contain"
            />
            <span className="font-bold text-slate-800">HorseVision · Biomecánica Equina</span>
          </div>

          <div>
            <span>© {new Date().getFullYear()} HorseVision. Todos los derechos reservados.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleAction()}
              className="text-[#0D3F2E] font-bold hover:underline"
            >
              Entrar a la App
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
