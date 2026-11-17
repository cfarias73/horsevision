import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Activity,
  Award,
  ChevronRight,
  Check,
  Minus,
  Sparkles,
  ArrowUpRight,
  Layers,
  Clock,
  Play,
  Download
} from 'lucide-react';

export default function LandingPage({ onLaunchApp }) {
  const [activeTab, setActiveTab] = useState('manifesto');

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
    <div className="min-h-screen bg-[#FBF9F2] text-[#1B1C18] font-sans selection:bg-[#E3E3DC] selection:text-[#000000]">
      {/* =========================================================================
          HEADER / TOP BAR
          ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 w-full z-40 bg-[#FBF9F2]/90 backdrop-blur-md border-b border-[#E3E3DC]">
        <div className="max-w-7xl mx-auto h-20 px-6 sm:px-10 flex items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleAction()}
              className="flex flex-col items-start leading-none tracking-tight text-left group"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[13px] font-bold tracking-[0.24em] text-[#1B1C18] uppercase">
                  HorseVision
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#785923]" />
              </div>
              <span className="font-mono text-[10px] text-[#444845] tracking-[0.16em] uppercase mt-1">
                Laboratorio Clínico de Biomecánica
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 font-mono text-[11px] tracking-[0.14em] uppercase text-[#444845]">
            <a href="#manifiesto" className="hover:text-[#1B1C18] transition-colors py-1">
              Manifiesto
            </a>
            <a href="#telemetria" className="hover:text-[#1B1C18] transition-colors py-1">
              Telemetría
            </a>
            <a href="#caso-clinico" className="hover:text-[#1B1C18] transition-colors py-1">
              Trilogía Clínica
            </a>
            <a href="#licencias" className="hover:text-[#1B1C18] transition-colors py-1">
              Planes & Precios
            </a>
          </nav>

          {/* CTA Actions */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleAction()}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1B1C18] text-white font-mono text-[11px] tracking-[0.1em] uppercase hover:bg-[#30312C] shadow-sm transition-all"
            >
              <span>Abrir App PWA</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION: THE KINEMATIC VITRINE
          ========================================================================= */}
      <section className="pt-32 pb-20 px-6 sm:px-10 max-w-7xl mx-auto flex flex-col items-center">
        {/* Authority Micro-Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E9E8E1] mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#785923] animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1B1C18] font-medium">
            Estándar Clínico EVJ Keegan // Visión Artificial Sub-Milimétrica
          </span>
        </div>

        {/* Hero Title */}
        <div className="max-w-4xl text-center mb-10 space-y-4">
          <h1 className="font-serif text-[42px] sm:text-[62px] leading-[1.08] text-[#1B1C18] font-normal tracking-tight">
            La Perfección del Trote. <br />
            <span className="italic font-serif text-[#1B1C18]">Cuantificada al Milímetro.</span>
          </h1>
          <p className="font-sans text-[16px] sm:text-[18px] text-[#444845] max-w-2xl mx-auto leading-relaxed pt-2">
            Visión computacional sin marcadores ni sensores adheridos para caballos de deporte y sementales de élite. Transforma 15 segundos de vídeo a 90° en un informe biomecánico de grado quirúrgico en menos de un minuto.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <button
              type="button"
              onClick={() => handleAction('1-horse')}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1B1C18] text-white font-mono text-[12px] tracking-[0.12em] uppercase hover:bg-[#30312C] shadow-lg active:scale-95 transition-all"
            >
              <span>Comenzar Prueba de 7 Días Gratis</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>

            <button
              type="button"
              onClick={() => handleAction()}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#E9E8E1] text-[#1B1C18] font-mono text-[12px] tracking-[0.12em] uppercase hover:bg-[#E3E3DC] transition-all"
            >
              <span>Entrar a la App Web</span>
            </button>
          </div>

          <p className="font-mono text-[10px] text-[#747875] tracking-wider pt-2">
            Prueba gratuita de 7 días para 1 caballo · Cancela cuando quieras · Sin permanencia
          </p>
        </div>

        {/* Centerpiece HUD Vitrine */}
        <div className="w-full max-w-6xl relative rounded-2xl bg-white p-3 sm:p-5 shadow-2xl border border-[#E3E3DC] overflow-hidden">
          {/* HUD Top Bar */}
          <div className="flex items-center justify-between px-3 py-2 text-[#444845] font-mono text-[10px] uppercase tracking-wider border-b border-[#F5F4ED] mb-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#1B1C18]">CANAL 01 // KINEMATIC ENGINE</span>
              <span className="hidden sm:inline text-[#747875]">LATENCIA: &lt; 60s</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#785923] font-bold">17 Nodos AP-10K: Activos</span>
              <span className="text-[#1B1C18]">16:9 · 30 FPS HD</span>
            </div>
          </div>

          {/* Video / Analysis Canvas Mockup */}
          <div className="relative w-full h-[360px] sm:h-[540px] rounded-xl overflow-hidden bg-[#09090B] flex items-center justify-center">
            <img
              src="https://lh3.googleusercontent.com/aida/ALJJyrCmRBHW8CbjOCi9878iRzR4FeO0vUy4ixsgM79h_57NIE4J-fmzKz4vysISv5XwjHWXW_Fxk0K8_cQKvamSBx6b_DTxdxjG5_eYBHwyJ3tftSAXupPtr4O5gmHUvNVI7P1KEf8pzpStNH04ScdMpj4Oda07u0BbWZUh8vYKMnR6KFNU-yFOPX0JfDy5ZgbFdn6J4btKhpQgDPnku0zqL62VP1xSlKY6d5m_occ_6DIV"
              alt="Análisis Biomecánico de Caballo"
              className="w-full h-full object-cover object-center opacity-90"
            />

            {/* Optical reticle overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border border-dashed border-white/25 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00daf3] shadow-[0_0_12px_#00daf3]" />
              </div>
              <div className="absolute top-6 left-6 font-mono text-[10px] text-white/70 tracking-widest">
                [FRAME: 112/150 // ENCUADRE 90°]
              </div>
              <div className="absolute bottom-6 right-6 font-mono text-[10px] text-white/70 tracking-widest">
                [TOLERANCIA EVJ: ≤ 6.0 mm]
              </div>
            </div>

            {/* Floating Telemetry Badges */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col gap-2 max-w-[220px]">
              <div className="bg-[#141417]/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 text-white shadow-xl">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase text-zinc-400">
                  <span>Confianza IA</span>
                  <span className="text-[#00daf3] font-bold">99.8%</span>
                </div>
                <div className="w-full bg-white/15 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-[#00daf3] h-full w-[99.8%]" />
                </div>
              </div>

              <div className="bg-[#141417]/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 text-white shadow-xl">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase text-zinc-400">
                  <span>Asimetría Media</span>
                  <span className="text-[#FECE57] font-bold">0.74 mm</span>
                </div>
                <p className="font-mono text-[9px] text-emerald-400 mt-0.5">
                  ✓ Simetría Normal (Sin cojera)
                </p>
              </div>

              <div className="bg-[#141417]/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 text-white shadow-xl">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase text-zinc-400">
                  <span>Balance de Apoyo</span>
                  <span className="text-white font-bold">99.2%</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] mt-1 text-zinc-300">
                  <span>L: 50.4%</span>
                  <span className="text-zinc-500">/</span>
                  <span className="text-[#00daf3]">R: 49.6%</span>
                </div>
              </div>
            </div>

            {/* Bottom Joint Angle Pills */}
            <div className="absolute bottom-6 left-6 hidden sm:flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00daf3]" />
                <span className="font-mono text-[11px] font-bold text-[#1B1C18] uppercase">
                  Ángulo Corvejón: 142.6°
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#785923]" />
                <span className="font-mono text-[11px] font-bold text-[#1B1C18] uppercase">
                  Flexión Menudillo: 118.2°
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: NUMERICAL PURITY STRIP (METRICS)
          ========================================================================= */}
      <section className="w-full px-6 sm:px-10 py-16 bg-[#F5F4ED] border-y border-[#E3E3DC]" id="telemetria">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-[#E3E3DC]/60 flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#747875] font-bold">
              Tolerancia Óptica
            </span>
            <div className="my-4">
              <div className="font-serif text-[42px] text-[#1B1C18] font-normal leading-none tracking-tight">
                ±0.8<span className="text-[24px] text-[#785923]">mm</span>
              </div>
            </div>
            <p className="text-[13px] text-[#444845] leading-snug">
              Precisión milimétrica validada en pistas de arena de sílice y césped de competición.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm border border-[#E3E3DC]/60 flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#747875] font-bold">
              Arquitectura Biomecánica
            </span>
            <div className="my-4">
              <div className="font-serif text-[42px] text-[#1B1C18] font-normal leading-none tracking-tight">
                17 <span className="text-[24px] text-[#785923]">Nodos</span>
              </div>
            </div>
            <p className="text-[13px] text-[#444845] leading-snug">
              Topología anatómica quadrupedal (YOLOv8 + AP-10K) con tracking articular a 30 FPS.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm border border-[#E3E3DC]/60 flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#747875] font-bold">
              Cero Estrés Animal
            </span>
            <div className="my-4">
              <div className="font-serif text-[42px] text-[#1B1C18] font-normal leading-none tracking-tight">
                0 <span className="text-[24px] text-[#785923]">Sensores</span>
              </div>
            </div>
            <p className="text-[13px] text-[#444845] leading-snug">
              Sin arneses ni sensores IMU adheridos que alteren el paso natural del caballo.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm border border-[#E3E3DC]/60 flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#747875] font-bold">
              Ventana Preventiva
            </span>
            <div className="my-4">
              <div className="font-serif text-[42px] text-[#1B1C18] font-normal leading-none tracking-tight">
                28 <span className="text-[24px] text-[#785923]">Días</span>
              </div>
            </div>
            <p className="text-[13px] text-[#444845] leading-snug">
              Anticipa lesiones ortopédicas de ligamento y articulación semanas antes de ser visibles.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: EDITORIAL CHAPTER (THE SCIENTIFIC MANIFESTO)
          ========================================================================= */}
      <section className="w-full px-6 sm:px-10 py-24 max-w-7xl mx-auto" id="manifiesto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Portrait & Quote */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-[#E9E8E1] aspect-[3/4]">
              <img
                src="https://lh3.googleusercontent.com/aida/ALJJyrAAqyP2L33XVH7kUeBy6LbmpF9MRTzM6ir-yRDLzOR4zguHvNM23O6lmyE-BcguAfZ_OVS9lydqdqFmCchKBNKtO1znSDAmmz1ooTVYq_5aDxt9c2ltq6_IEluyAh2otZiwPYCJKyWt33AlmW3S58wUXK61ePIUdKVATnqASocUrTNumQuzndO2-anH7vcbAibkL258yrOcnzzweykm4Kuy2MZ2FmIOPSBtxWFcqSQG"
                alt="Retrato de Semental de Élite"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FECE57] font-bold">
                  Semental Hannoveriano · Salto Gran Premio
                </span>
                <div className="font-serif text-[20px] font-normal mt-1">
                  Evaluación de Trote en Pista a 90°
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#EFEEE7] rounded-2xl border border-[#E3E3DC]">
              <p className="font-serif text-[18px] italic text-[#1B1C18] leading-relaxed">
                “En el alto rendimiento, medio segundo de duda en la impulsión del corvejón es la diferencia entre ganar el Gran Premio o una baja clínica de seis meses.”
              </p>
              <div className="mt-4 flex items-center justify-between font-mono text-[11px]">
                <span className="font-bold text-[#1B1C18]">H. van den Berg</span>
                <span className="text-[#444845]">Director Técnico de Salto, Aachen</span>
              </div>
            </div>
          </div>

          {/* Right Column: Copy & Comparison */}
          <div className="lg:col-span-7 flex flex-col justify-center lg:pl-8 space-y-6">
            <div className="inline-flex items-center gap-2 text-[#785923] font-mono text-[11px] uppercase tracking-[0.25em] font-bold">
              <span>Capítulo 01</span>
              <span>//</span>
              <span>Resolución Biomecánica</span>
            </div>

            <h2 className="font-serif text-[36px] sm:text-[46px] text-[#1B1C18] font-normal leading-[1.12] tracking-tight">
              El ojo humano tiene un límite. <br />
              <span className="italic font-serif text-[#1B1C18]">La visión computacional no.</span>
            </h2>

            <div className="space-y-4 text-[#444845] text-[16px] leading-relaxed">
              <p>
                Una asimetría de 3 milímetros en el corvejón o en el menudillo posterior es completamente indetectable a simple vista, incluso para el jinete o veterinario más experimentado del mundo.
              </p>
              <p>
                Cuando un caballo de doma o salto manifiesta una cojera apreciable (Grado 2 de la escala AAEP), la lesión de cartílago o la inflamación del ligamento suspensorio ya se encuentra en fase aguda.
              </p>
              <p>
                HorseVision procesa el trote en 16:9 con giroscopio y calcula la aceleración instantánea y oscilación vertical. Cada análisis genera un diagnóstico con 99.8% de fiabilidad matemática según el umbral Keegan (≤ 6.0 mm), detectando problemas semanas antes del dolor.
              </p>
            </div>

            {/* Comparison Metrics */}
            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#F5F4ED] rounded-xl border border-[#E3E3DC]">
                <span className="font-mono text-[10px] text-[#747875] uppercase tracking-wider block font-bold">
                  Inspección Visual Tradicional
                </span>
                <span className="font-serif text-[28px] text-[#1B1C18] font-normal block mt-1">
                  ±15 mm
                </span>
                <span className="text-[12px] text-[#747875] block mt-1">
                  Apreciación subjetiva a simple vista
                </span>
              </div>

              <div className="p-4 bg-[#E3E3DC] rounded-xl border border-[#C4C7C4]">
                <span className="font-mono text-[10px] text-[#785923] uppercase tracking-wider block font-bold">
                  Motor HorseVision Lab
                </span>
                <span className="font-serif text-[28px] text-[#1B1C18] font-normal block mt-1">
                  ±0.8 mm
                </span>
                <span className="text-[12px] text-[#444845] block mt-1">
                  Precisión cinemática fotograma a fotograma
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: THE CLINICAL TRILOGY (1 - 2 - 3)
          ========================================================================= */}
      <section className="w-full px-6 sm:px-10 py-24 bg-[#F5F4ED] border-t border-[#E3E3DC]" id="caso-clinico">
        <div className="max-w-7xl mx-auto flex flex-col space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#785923] font-bold">
                Trilogía Clínica
              </span>
              <h2 className="font-serif text-[36px] sm:text-[44px] text-[#1B1C18] font-normal tracking-tight mt-1">
                Ingeniería de Pista en Tres Actos
              </h2>
            </div>
            <p className="text-[14px] text-[#444845] max-w-md">
              Diseñado para integrarse en segundos en la rutina diaria de la cuadra sin alterar el entrenamiento del ejemplar.
            </p>
          </div>

          {/* 3 Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Act 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E3E3DC] flex flex-col justify-between group hover:shadow-xl transition-all">
              <div>
                <div className="relative w-full h-64 rounded-xl overflow-hidden bg-[#E9E8E1] mb-6">
                  <img
                    src="https://lh3.googleusercontent.com/aida/ALJJyrAYcodAffSUVE2uoKRhoNFlAWtv1u7BNcXAguOScXs23RgGBNEZE-3EvI6qjsaDopHD6iHz4TmQNJI7f7jm1rt4Jp7d3-OHpkviVxiH7wVeF0n6jW4aBFj5Zo-u4BGFl0idYNp87O4LTHKoNfa2do19KdMmQWWrSwJQX_8Gr2ElW-Ca4_4FQUImn8D6UXGdPWFj7o2-wo1xJxa76MDQ8voJOZFTb-WBCG-EofZpKZAY"
                    alt="Paso 1: Grabación en Pista a 90 grados"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-[#1B1C18]/80 backdrop-blur-sm text-white font-mono text-[10px] uppercase tracking-widest">
                    Acto 01 // Captura
                  </div>
                </div>

                <h3 className="font-serif text-[22px] text-[#1B1C18] font-normal mb-2">
                  Captura Guiada a 90°
                </h3>
                <p className="text-[14px] text-[#444845] leading-relaxed">
                  Graba 15 segundos con tu smartphone en formato horizontal 16:9 con nivelador giroscópico en pantalla. En línea recta o círculo a la cuerda.
                </p>
              </div>

              <div className="pt-6 border-t border-[#F5F4ED] flex items-center justify-between font-mono text-[10px] text-[#747875]">
                <span className="uppercase font-bold text-[#1B1C18]">Giroscopio Activo</span>
                <span>16:9 // 30 FPS</span>
              </div>
            </div>

            {/* Act 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E3E3DC] flex flex-col justify-between group hover:shadow-xl transition-all">
              <div>
                <div className="relative w-full h-64 rounded-xl overflow-hidden bg-[#E9E8E1] mb-6">
                  <img
                    src="https://lh3.googleusercontent.com/aida/ALJJyrDpZ25hdrdXAgB06srFqSniNUrViGdWYmvkcVY9FAD2GgNUAzGA8g8ROl3jsDZ-746HNiJXtnjvl_3t6O0zWdF_JcpedY3mVrqWGE93OO8YUlmBHauS2_hv4LZ8BaaAZ46o8x5aytMFtHkZstv26m5uwzRuddJgq8TxXXvS7dxsFiiePISyyJIWauG0Tqkof9h36Y8I4ycP1xrmFZvGAn7edyNydwqO_DCu6BMt7Aat"
                    alt="Paso 2: Cinemática y Dinámica de Tendones"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-[#1B1C18]/80 backdrop-blur-sm text-white font-mono text-[10px] uppercase tracking-widest">
                    Acto 02 // Cinemática
                  </div>
                </div>

                <h3 className="font-serif text-[22px] text-[#1B1C18] font-normal mb-2">
                  17 Keypoints & Tendones
                </h3>
                <p className="text-[14px] text-[#444845] leading-relaxed">
                  Cálculo automático de ángulos articulares en nuca, cruz, menudillo y corvejón. Clasificación de fases de apoyo (Stance) y vuelo (Swing).
                </p>
              </div>

              <div className="pt-6 border-t border-[#F5F4ED] flex items-center justify-between font-mono text-[10px] text-[#747875]">
                <span className="uppercase font-bold text-[#1B1C18]">YOLOv8 + AP-10K</span>
                <span className="text-[#785923] font-bold">17 Nodos</span>
              </div>
            </div>

            {/* Act 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E3E3DC] flex flex-col justify-between group hover:shadow-xl transition-all">
              <div>
                <div className="relative w-full h-64 rounded-xl bg-[#E9E8E1] p-5 flex flex-col justify-between mb-6 overflow-hidden">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase">
                    <span className="font-bold text-[#1B1C18]">Oscilación Vertical</span>
                    <span className="px-2 py-0.5 rounded bg-white text-[#785923] font-bold">
                      Keegan Validated
                    </span>
                  </div>

                  <div className="py-2">
                    <svg className="w-full h-24 text-[#1B1C18]" fill="none" stroke="currentColor" viewBox="0 0 300 120">
                      <line stroke="#C4C7C4" strokeDasharray="3 3" x1="0" x2="300" y1="20" y2="20" />
                      <line stroke="#C4C7C4" x1="0" x2="300" y1="60" y2="60" />
                      <line stroke="#C4C7C4" strokeDasharray="3 3" x1="0" x2="300" y1="100" y2="100" />
                      <path d="M0,60 Q35,5 75,60 T150,60 T225,60 T300,60" fill="none" stroke="#00daf3" strokeWidth="2.5" />
                      <path d="M0,60 Q35,7 75,60 T150,60 T225,60 T300,60" fill="none" stroke="#1B1C18" strokeDasharray="4 2" strokeWidth="1.5" />
                    </svg>
                    <div className="flex items-center justify-between font-mono text-[9px] text-[#747875] mt-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#00daf3]" /> Oscilación Nuca
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#1B1C18]" /> Oscilación Grupa
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-2.5 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#444845]">Índice de Simetría:</span>
                    <span className="font-bold text-emerald-600">98.7% (Óptimo)</span>
                  </div>
                </div>

                <h3 className="font-serif text-[22px] text-[#1B1C18] font-normal mb-2">
                  Diagnóstico & Reporte PDF
                </h3>
                <p className="text-[14px] text-[#444845] leading-relaxed">
                  Generación de informe pericial oficial descargable en PDF con gráficas de evolución temporal para veterinarios, jinetes y comités de compraventa.
                </p>
              </div>

              <div className="pt-6 border-t border-[#F5F4ED] flex items-center justify-between font-mono text-[10px] text-[#747875]">
                <span className="uppercase font-bold text-[#1B1C18]">PDF Export</span>
                <span className="text-[#1B1C18] font-bold">Follow the Progress</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: AUTHORITY TESTIMONIAL
          ========================================================================= */}
      <section className="w-full px-6 sm:px-10 py-20 bg-[#EFEEE7]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#785923] block font-bold">
            Veredicto Clínico Independiente
          </span>
          <blockquote className="font-serif text-[28px] sm:text-[38px] text-[#1B1C18] font-normal italic leading-tight">
            “HorseVision aporta una objetividad matemática que antes requería laboratorios fijos de cientos de miles de euros. Ahora detectamos micro-desbalances en la pista antes de que exista daño tisular.”
          </blockquote>
          <div className="pt-2 flex flex-col items-center">
            <span className="font-sans text-[16px] text-[#1B1C18] font-bold tracking-tight">
              Dr. Marcus von Stauffenberg
            </span>
            <span className="font-mono text-[11px] text-[#444845] uppercase tracking-widest mt-0.5">
              Asesor Veterinario FEI & Especialista en Ortopedia Equina, Zúrich
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: REAL SAAS PRICING & PLANS (PAYPAL INTEGRATED)
          ========================================================================= */}
      <section className="w-full px-6 sm:px-10 py-24 bg-[#FBF9F2]" id="licencias">
        <div className="max-w-7xl mx-auto flex flex-col space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#785923] font-bold">
              Planes & Suscripciones Transparentes
            </span>
            <h2 className="font-serif text-[36px] sm:text-[44px] text-[#1B1C18] font-normal tracking-tight">
              Precisión Adaptada a tu Cuadra
            </h2>
            <p className="text-[14px] text-[#444845]">
              Prueba gratuita sin compromiso en el plan individual. Pagos seguros y facturación flexible con PayPal.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Plan 1: 1 Caballo */}
            <div className="bg-[#F5F4ED] rounded-2xl p-8 border border-[#E3E3DC] flex flex-col justify-between hover:shadow-lg transition-all relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#747875] font-bold">
                    Propietario Individual
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FECE57] text-[#251A00] font-mono text-[10px] font-bold uppercase tracking-wider">
                    7 Días Gratis
                  </span>
                </div>

                <h3 className="font-serif text-[26px] text-[#1B1C18] font-normal">
                  Plan 1 Caballo
                </h3>
                <p className="text-[13px] text-[#444845]">
                  Ideal para propietarios particulares que entrenan a su propio caballo.
                </p>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-[42px] text-[#1B1C18] font-normal leading-none">
                      $6.99
                    </span>
                    <span className="font-mono text-[12px] text-[#747875] uppercase">
                      USD / mes
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-emerald-700 mt-1 font-semibold">
                    7 Días de Prueba Gratis · Cobro de $6.99 a partir del día 8
                  </p>
                </div>

                <ul className="space-y-3 pt-4 border-t border-[#E3E3DC] font-sans text-[13px] text-[#1B1C18]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#785923] shrink-0" />
                    <span>1 caballo registrado de por vida</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#785923] shrink-0" />
                    <span>Análisis de vídeo cinemático ilimitado a 90°</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#785923] shrink-0" />
                    <span>Detección automática 17 keypoints</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#785923] shrink-0" />
                    <span>Gráficas de oscilación y simetría</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#747875]">
                    <Minus className="w-4 h-4 shrink-0" />
                    <span>Módulo evolutivo temporal</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => handleAction('1-horse')}
                  className="w-full py-3.5 px-4 rounded-full bg-[#1B1C18] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#30312C] active:scale-95 transition-all shadow-md"
                >
                  Comenzar 7 Días Gratis
                </button>
              </div>
            </div>

            {/* Plan 2: 3 Caballos (Destacado Obsidian) */}
            <div className="bg-[#1B1C18] text-white rounded-2xl p-8 border border-[#30312C] shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#785923]/25 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FECE57] font-bold">
                    Estándar Profesional
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#00daf3] font-mono text-[10px] font-bold uppercase tracking-wider">
                    Más Popular
                  </span>
                </div>

                <h3 className="font-serif text-[26px] text-white font-normal">
                  Plan 3 Caballos
                </h3>
                <p className="text-[13px] text-zinc-300">
                  Para jinetes, criadores y entrenadores con varios atletas en activo.
                </p>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-[42px] text-white font-normal leading-none">
                      $15.99
                    </span>
                    <span className="font-mono text-[12px] text-zinc-400 uppercase">
                      USD / mes
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-zinc-400 mt-1">
                    Facturación mensual con PayPal · Sin período de prueba
                  </p>
                </div>

                <ul className="space-y-3 pt-4 border-t border-white/10 font-sans text-[13px] text-zinc-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00daf3] shrink-0" />
                    <span>Hasta 3 ejemplares registrados simultáneamente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00daf3] shrink-0" />
                    <span>Módulo "Follow the Progress" (Evolución histórica)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00daf3] shrink-0" />
                    <span>Descarga de Informes Oficiales en PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00daf3] shrink-0" />
                    <span>Asistente Clínico IA veterinario integrado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00daf3] shrink-0" />
                    <span>Acceso para 2 usuarios (dueño + jinete)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8 relative z-10">
                <button
                  type="button"
                  onClick={() => handleAction('3-horses')}
                  className="w-full py-3.5 px-4 rounded-full bg-[#785923] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#8D6B2D] active:scale-95 transition-all shadow-xl font-bold"
                >
                  Suscribirme a Plan Pro
                </button>
              </div>
            </div>

            {/* Plan 3: Hasta 50 Caballos */}
            <div className="bg-[#F5F4ED] rounded-2xl p-8 border border-[#E3E3DC] flex flex-col justify-between hover:shadow-lg transition-all relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#747875] font-bold">
                    Haras & Clínicas
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E3E3DC] text-[#1B1C18] font-mono text-[10px] font-bold uppercase tracking-wider">
                    Equipos
                  </span>
                </div>

                <h3 className="font-serif text-[26px] text-[#1B1C18] font-normal">
                  Hasta 50 Caballos
                </h3>
                <p className="text-[13px] text-[#444845]">
                  Para ganaderías, clubes hípicos y centros veterinarios ecuestres.
                </p>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-[42px] text-[#1B1C18] font-normal leading-none">
                      $99.00
                    </span>
                    <span className="font-mono text-[12px] text-[#747875] uppercase">
                      USD / mes
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-zinc-500 mt-1">
                    Facturación mensual con PayPal · Sin período de prueba
                  </p>
                </div>

                <ul className="space-y-3 pt-4 border-t border-[#E3E3DC] font-sans text-[13px] text-[#1B1C18]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#785923] shrink-0" />
                    <span>Hasta 50 ejemplares registrados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#785923] shrink-0" />
                    <span>Historial y trazabilidad biométrica ilimitada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#785923] shrink-0" />
                    <span>Dossiers periciales para compraventa y seguros</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#785923] shrink-0" />
                    <span>Acceso para múltiples usuarios y mozos de cuadra</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#785923] shrink-0" />
                    <span>Soporte prioritario veterinario directo</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => handleAction('50-horses')}
                  className="w-full py-3.5 px-4 rounded-full bg-[#E3E3DC] text-[#1B1C18] font-mono text-[11px] tracking-wider uppercase hover:bg-[#1B1C18] hover:text-white active:scale-95 transition-all"
                >
                  Acceso Haras & Clínicas
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: CLOSING CALL TO ACTION
          ========================================================================= */}
      <section className="w-full px-6 sm:px-10 py-24 bg-[#1B1C18] text-white relative overflow-hidden">
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#785923]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 text-[#FECE57] font-mono text-[11px] uppercase tracking-[0.25em] font-bold">
            <span>Acceso Inmediato PWA</span>
            <span>//</span>
            <span>Sin Descarga en App Store</span>
          </div>

          <h2 className="font-serif text-[38px] sm:text-[54px] font-normal tracking-tight text-white leading-tight">
            Protege el Movimiento Más Perfecto de la Naturaleza.
          </h2>

          <p className="font-sans text-[16px] sm:text-[18px] text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Comienza tu prueba gratuita de 7 días hoy mismo. Abre la aplicación en tu móvil, apunta la cámara a 90° y comprueba la simetría de tu ejemplar en 60 segundos.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleAction('1-horse')}
              className="px-8 py-4 rounded-full bg-[#785923] text-white font-mono text-[12px] uppercase tracking-[0.14em] hover:bg-[#8D6B2D] shadow-2xl active:scale-95 transition-all font-bold"
            >
              Comenzar Evaluación Gratuita (7 Días)
            </button>
            <button
              type="button"
              onClick={() => handleAction()}
              className="px-6 py-4 rounded-full bg-white/10 text-white font-mono text-[12px] uppercase tracking-[0.14em] hover:bg-white/20 transition-all"
            >
              Abrir Aplicación PWA
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="w-full bg-[#F5F4ED] border-t border-[#E3E3DC] py-12 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-[11px] text-[#747875]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1B1C18]">HorseVision Lab AG</span>
            <span>·</span>
            <span>Precisión Cinemática Equina</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} HorseVision Technologies. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => handleAction()} className="hover:text-[#1B1C18] underline">
              Entrar a la App
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
