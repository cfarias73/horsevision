import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Check,
  ChevronRight,
  ChevronDown,
  X,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Menu
} from 'lucide-react';

const PAYPAL_CLIENT_ID = 'BAANE3LHKnrMKf-jZ-ez5-Xkoi3dhx19UkuhHfyj6c5uWRy1lb3B5FiOt1NBUej1AatHi1xHGVjeQAZ2ag';

export default function LandingPage({ onLaunchApp }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [legalModalTab, setLegalModalTab] = useState(null); // 'terms' | 'privacy' | null

  // PayPal checkout modal state
  const [sdkReady, setSdkReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const paypalContainerRef = useRef(null);

  // Plans data in USD aligned with PayPal backend
  const plans = [
    {
      id: '1-horse',
      name: 'Básico',
      limit: '1 caballo',
      price: '6.99',
      trial: '7 días de prueba gratis',
      popular: false,
      features: [
        'Análisis de movimiento con IA',
        'Chat con IA especialista',
        'Reportes y seguimiento básico'
      ]
    },
    {
      id: '3-horses',
      name: 'Profesional',
      limit: 'Hasta 5 caballos',
      price: '15.99',
      trial: null,
      popular: true,
      features: [
        'Todas las funciones incluidas',
        'Gestión de hasta 5 caballos',
        'Histórico y comparativas evolutivas',
        'Exportación de informes para veterinario'
      ]
    },
    {
      id: '50-horses',
      name: 'Haras / Pro',
      limit: 'Hasta 50 caballos',
      price: '99.00',
      trial: null,
      popular: false,
      features: [
        'Todas las funciones sin restricciones',
        'Gestión de hasta 50 caballos',
        'Soporte prioritario 24/7',
        'Informes personalizados con logo de Haras'
      ]
    }
  ];

  // Navigate to App directly in specified Auth mode ('signup' | 'login')
  const handleGoToApp = (mode = 'signup') => {
    const safeMode = typeof mode === 'string' ? mode : 'signup';
    if (onLaunchApp) {
      onLaunchApp(safeMode);
    } else {
      window.location.href = '/app';
    }
  };

  // Select plan action:
  // - If it has a free trial (Básico 7 días gratis), send directly to signup/start trial without payment!
  // - If it's a paid tier (Profesional / Ilimitado), open the PayPal checkout modal.
  const handleSelectPlan = (plan) => {
    if (plan.trial) {
      try {
        localStorage.removeItem('hv_selected_plan_intent');
        localStorage.setItem('hv_trial_active', 'true');
        localStorage.setItem('hv_active_plan', '1-horse');
      } catch (e) {}
      handleGoToApp('signup');
      return;
    }
    setSelectedPlanForCheckout(plan);
    setCheckoutError('');
    setCheckoutSuccess(null);
  };

  // Load PayPal SDK when checkout modal opens
  useEffect(() => {
    if (!selectedPlanForCheckout) return;

    if (window.paypal) {
      setSdkReady(true);
      return;
    }

    const scriptId = 'paypal-sdk-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
      script.async = true;
      script.onload = () => setSdkReady(true);
      script.onerror = () => setCheckoutError('No se pudo cargar el SDK de PayPal.');
      document.body.appendChild(script);
    } else {
      setSdkReady(true);
    }
  }, [selectedPlanForCheckout]);

  // Render PayPal Smart Buttons inside checkout modal
  useEffect(() => {
    if (!selectedPlanForCheckout || !sdkReady || !window.paypal || !paypalContainerRef.current) return;

    paypalContainerRef.current.innerHTML = '';

    try {
      window.paypal
        .Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'paypal',
            height: 44,
          },
          createOrder: async () => {
            setIsProcessing(true);
            setCheckoutError('');
            try {
              const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  plan_id: selectedPlanForCheckout.id,
                  billing_cycle: 'monthly',
                }),
              });
              const data = await res.json();
              if (data.order_id) {
                return data.order_id;
              }
              throw new Error(data.detail || 'Error al iniciar pedido en PayPal');
            } catch (err) {
              setCheckoutError(err.message || 'Error de conexión con PayPal');
              setIsProcessing(false);
              throw err;
            }
          },
          onApprove: async (data) => {
            try {
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  order_id: data.orderID,
                  plan_id: selectedPlanForCheckout.id,
                }),
              });
              const result = await res.json();
              if (result.status === 'COMPLETED') {
                setCheckoutSuccess(result);
                try {
                  localStorage.setItem('horsevision_subscription', JSON.stringify(result));
                  localStorage.setItem('hv_active_plan', selectedPlanForCheckout.id);
                  localStorage.setItem('hv_subscription_active', 'true');
                } catch (e) {}
                setTimeout(() => {
                  handleGoToApp('signup');
                }, 2000);
              } else {
                setCheckoutError('El pago no pudo completarse.');
              }
            } catch (err) {
              setCheckoutError('Error al confirmar la suscripción.');
            } finally {
              setIsProcessing(false);
            }
          },
          onError: (err) => {
            console.error('PayPal Error:', err);
            setCheckoutError('Error en la pasarela de PayPal.');
            setIsProcessing(false);
          },
        })
        .render(paypalContainerRef.current);
    } catch (e) {
      console.warn('Error al renderizar PayPal:', e);
    }
  }, [selectedPlanForCheckout, sdkReady]);

  const faqs = [
    {
      q: '¿Qué necesito para analizar el trote?',
      a: 'Solo necesitas tu teléfono móvil. Graba al caballo trotando lateralmente durante 10 a 15 segundos a unos 8-12 metros de distancia. No se requieren sensores, cables ni marcas físicas.'
    },
    {
      q: '¿HorseVision es una herramienta de diagnóstico veterinario?',
      a: 'No. HorseVision es una plataforma de apoyo y telemetría articular con IA. Sus métricas y gráficas aportan datos objetivos que complementan la evaluación clínica de tu veterinario de confianza.'
    },
    {
      q: '¿Puedo gestionar más de un caballo?',
      a: 'Sí. Nuestros planes te permiten gestionar 1 caballo (Básico), hasta 5 caballos (Profesional) o hasta 50 caballos simultáneos (Haras / Pro), cada uno con su historial biomecánico y evolutivo independiente.'
    },
    {
      q: '¿Qué puedo consultar en el chat con IA especialista?',
      a: 'El asistente con IA clínica (respaldado por DeepSeek) responde dudas sobre patrones biomecánicos, ejercicios correctivos de rehabilitación, biomecánica del trote, nutrición deportiva y manejo diario.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F2F5F4] text-[#071B24] font-sans selection:bg-[#D9F99D] selection:text-[#071B24]">
      {/* =========================================================================
          1. HEADER / FLOATING GLASS PILL NAVBAR
          ========================================================================= */}
      <header className="fixed top-3 left-0 right-0 z-50 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto h-[66px] rounded-full bg-[#071B24]/90 backdrop-blur-xl border border-white/15 px-4 sm:px-6 flex items-center justify-between text-white shadow-[0_16px_40px_rgba(7,27,36,0.28)] transition-all">
          {/* Brand */}
          <button
            type="button"
            onClick={() => handleGoToApp('signup')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-full bg-white p-1.5 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/landing-assets/logo/horsevision-mark.png"
                alt="HorseVision Logo"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex items-baseline">
              <span className="font-extrabold text-[20px] sm:text-[22px] tracking-tight">HorseVision</span>
              <sup className="text-[10px] text-[#00D1C2] font-mono ml-0.5">®</sup>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#D9E3E5]">
            <a href="#funciones" className="hover:text-[#00D1C2] transition-colors">Funciones</a>
            <a href="#como-funciona" className="hover:text-[#00D1C2] transition-colors">Cómo funciona</a>
            <a href="#planes" className="hover:text-[#00D1C2] transition-colors">Planes</a>
            <a href="#faq" className="hover:text-[#00D1C2] transition-colors">FAQ</a>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleGoToApp('login')}
              className="hidden sm:inline-flex px-4 py-2 text-[13px] font-semibold text-white/90 border border-white/20 hover:border-white/50 rounded-full transition-all"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => handleGoToApp('signup')}
              className="px-4 sm:px-5 py-2 text-[13px] font-extrabold text-[#071B24] bg-[#D9F99D] hover:bg-[#ccf482] rounded-full shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Probar gratis
            </button>
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Floating Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-[88px] z-40 rounded-[28px] bg-[#071B24]/95 backdrop-blur-xl border border-white/15 p-6 flex flex-col gap-3 text-white text-[15px] font-semibold md:hidden shadow-[0_24px_60px_rgba(7,27,36,0.45)]">
          <a href="#funciones" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00D1C2]">Funciones</a>
          <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00D1C2]">Cómo funciona</a>
          <a href="#planes" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00D1C2]">Planes</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00D1C2]">FAQ</a>
          <button
            type="button"
            onClick={() => { setMobileMenuOpen(false); handleGoToApp('login'); }}
            className="w-full py-3 mt-2 rounded-full border border-white/20 text-center font-bold"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => { setMobileMenuOpen(false); handleGoToApp('signup'); }}
            className="w-full py-3 rounded-full bg-[#D9F99D] text-[#071B24] text-center font-extrabold"
          >
            Probar gratis
          </button>
        </div>
      )}

      {/* =========================================================================
          2. HERO SECTION
          ========================================================================= */}
      <section className="relative pt-[130px] sm:pt-[150px] pb-14 sm:pb-20 px-4 sm:px-8 lg:px-16 overflow-hidden bg-radial from-[#15515A] via-[#0B3039] to-[#071820] text-white">
        {/* Background Horse Image with Tracking Overlay */}
        <div 
          className="absolute inset-y-0 right-0 w-full lg:w-[65%] bg-cover bg-center lg:bg-right opacity-40 lg:opacity-85 pointer-events-none"
          style={{
            backgroundImage: `url('/landing-assets/images/horse-hero.jpg')`,
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,1) 75%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,1) 75%, transparent 100%)'
          }}
        />

        {/* Deep Shade Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071820] via-[#071820]/90 lg:via-[#071820]/75 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <p className="text-[11px] sm:text-[12px] font-extrabold tracking-[3px] text-[#00D1C2] uppercase mb-4 sm:mb-5">
              PLATAFORMA EQUINA CON IA
            </p>

            {/* Headline */}
            <h1 className="text-[36px] sm:text-[52px] lg:text-[62px] font-extrabold tracking-[-1.5px] sm:tracking-[-2.5px] leading-[1.05] mb-5 sm:mb-6">
              Analiza el trote de tu caballo y detecta{' '}
              <span className="text-[#D9F99D]">posibles anomalías</span>
            </h1>

            {/* Hero Copy */}
            <p className="text-[15px] sm:text-[17px] leading-relaxed text-[#D4E0E2] max-w-xl mb-8">
              Análisis biomecánico con visión por computadora, métricas claras y un chat con IA especializada en caballos.
            </p>

            {/* Hero CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-12 sm:mb-16">
              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-extrabold text-[14px] text-[#071B24] bg-[#D9F99D] hover:bg-[#ccf482] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D9F99D]/20"
              >
                <span className="w-6 h-6 rounded-full bg-[#071B24]/10 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </span>
                <span>Ver demostración (1 min)</span>
              </button>
              <button
                type="button"
                onClick={() => handleGoToApp('signup')}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full font-bold text-[14px] text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all backdrop-blur-sm"
              >
                Probar gratis
              </button>
            </div>

            {/* 4 Feature Mini-Points */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-white/10 max-w-xl">
              <div className="flex flex-col items-start gap-2">
                <img src="/landing-assets/icons/activity.svg" alt="" className="w-6 h-6 filter invert opacity-90" />
                <span className="text-[12px] font-medium text-[#E3EEEE] leading-snug">
                  Análisis del<br />movimiento
                </span>
              </div>
              <div className="flex flex-col items-start gap-2">
                <img src="/landing-assets/icons/activity.svg" alt="" className="w-6 h-6 filter invert opacity-90" />
                <span className="text-[12px] font-medium text-[#E3EEEE] leading-snug">
                  Detección de<br />anomalías
                </span>
              </div>
              <div className="flex flex-col items-start gap-2">
                <img src="/landing-assets/icons/chat.svg" alt="" className="w-6 h-6 filter invert opacity-90" />
                <span className="text-[12px] font-medium text-[#E3EEEE] leading-snug">
                  Chat con IA<br />especialista
                </span>
              </div>
              <div className="flex flex-col items-start gap-2">
                <img src="/landing-assets/icons/horses.svg" alt="" className="w-6 h-6 filter invert opacity-90" />
                <span className="text-[12px] font-medium text-[#E3EEEE] leading-snug">
                  Gestión de<br />tus caballos
                </span>
              </div>
            </div>
          </div>

          {/* Floating Analysis Badge (Right Side) */}
          <div className="hidden lg:block absolute right-4 top-10 w-[240px] p-5 rounded-[26px] bg-[#071B24]/90 border border-[#00D1C2]/40 shadow-2xl shadow-[#00D1C2]/20 backdrop-blur-xl">
            <strong className="block text-[14px] font-bold text-white mb-2">Análisis del trote</strong>
            <div className="flex items-center gap-2 text-[12px] text-[#00D1C2] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#D9F99D] animate-pulse" />
              <span>Movimiento estable</span>
            </div>
            {/* SVG Wave */}
            <div className="mt-3 h-8 border-b-2 border-[#00D1C2] rounded-full transform -skew-y-3 opacity-90" />
            <div className="mt-2 flex items-center justify-between text-[10px] text-white/60 font-mono">
              <span>Simetría: 96%</span>
              <span>Cadencia: 1.28s</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FEATURE SECTION (4 Cards Bento Grid)
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16 bg-[#F2F5F4]" id="funciones">
        <div className="max-w-7xl mx-auto">
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-extrabold tracking-[2.6px] text-[#0F3D44] uppercase mb-3">
              UNA PLATAFORMA, VARIAS HERRAMIENTAS
            </p>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-[-1.5px] leading-tight text-[#071B24]">
              Todo lo que necesitas para analizar y dar seguimiento a tus caballos
            </h2>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Analiza el movimiento */}
            <article className="p-6 bg-white border border-[#0F3D44]/[0.06] rounded-[28px] shadow-[0_12px_32px_-6px_rgba(7,27,36,0.06)] hover:shadow-[0_16px_38px_-6px_rgba(7,27,36,0.10)] transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#EEF4F2] flex items-center justify-center mb-4">
                  <img src="/landing-assets/icons/play.svg" alt="" className="w-5 h-5 text-[#0F3D44]" />
                </div>
                <h3 className="text-[19px] font-bold tracking-tight text-[#071B24] mb-2">
                  Analiza el movimiento
                </h3>
                <p className="text-[13px] text-[#586A70] leading-relaxed mb-4">
                  Sube un video y obtén el análisis biomecánico del trote con métricas claras.
                </p>
              </div>
              <img
                src="/landing-assets/images/motion-analysis.jpg"
                alt="Vista de análisis de movimiento"
                className="w-full h-40 object-cover rounded-[20px] border border-[#0F3D44]/[0.05]"
              />
            </article>

            {/* Card 2: Detecta posibles anomalías */}
            <article className="p-6 bg-white border border-[#0F3D44]/[0.06] rounded-[28px] shadow-[0_12px_32px_-6px_rgba(7,27,36,0.06)] hover:shadow-[0_16px_38px_-6px_rgba(7,27,36,0.10)] transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#EEF4F2] flex items-center justify-center mb-4">
                  <img src="/landing-assets/icons/activity.svg" alt="" className="w-5 h-5 text-[#0F3D44]" />
                </div>
                <h3 className="text-[19px] font-bold tracking-tight text-[#071B24] mb-2">
                  Detecta anomalías
                </h3>
                <p className="text-[13px] text-[#586A70] leading-relaxed mb-4">
                  Identifica posibles irregularidades en el patrón de movimiento.
                </p>
              </div>
              <img
                src="/landing-assets/images/anomaly-analysis.jpg"
                alt="Visualización de anomalías"
                className="w-full h-40 object-cover rounded-[20px] border border-[#0F3D44]/[0.05]"
              />
            </article>

            {/* Card 3: Chat con IA especialista */}
            <article className="p-6 bg-white border border-[#0F3D44]/[0.06] rounded-[28px] shadow-[0_12px_32px_-6px_rgba(7,27,36,0.06)] hover:shadow-[0_16px_38px_-6px_rgba(7,27,36,0.10)] transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#EEF4F2] flex items-center justify-center mb-4">
                  <img src="/landing-assets/icons/chat.svg" alt="" className="w-5 h-5 text-[#0F3D44]" />
                </div>
                <h3 className="text-[19px] font-bold tracking-tight text-[#071B24] mb-2">
                  Chat con IA especialista
                </h3>
                <p className="text-[13px] text-[#586A70] leading-relaxed mb-4">
                  Resuelve dudas sobre cuidado, entrenamiento, rendimiento y manejo de tus caballos.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 p-3.5 bg-[#F4F7F6] border border-[#0F3D44]/[0.06] rounded-[20px] text-[11px]">
                <div className="self-end bg-white text-[#071B24] px-3 py-2 rounded-2xl rounded-tr-sm max-w-[90%] font-medium shadow-sm">
                  ¿Por qué mi caballo tiene un trote irregular?
                </div>
                <div className="self-start bg-[#0F3D44] text-white px-3 py-2 rounded-2xl rounded-tl-sm max-w-[95%] font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D9F99D] animate-pulse" />
                  <span>Consulta a HorseVision IA</span>
                </div>
              </div>
            </article>

            {/* Card 4: Gestiona tus caballos */}
            <article className="p-6 bg-white border border-[#0F3D44]/[0.06] rounded-[28px] shadow-[0_12px_32px_-6px_rgba(7,27,36,0.06)] hover:shadow-[0_16px_38px_-6px_rgba(7,27,36,0.10)] transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#EEF4F2] flex items-center justify-center mb-4">
                  <img src="/landing-assets/icons/horses.svg" alt="" className="w-5 h-5 text-[#0F3D44]" />
                </div>
                <h3 className="text-[19px] font-bold tracking-tight text-[#071B24] mb-2">
                  Gestiona tus caballos
                </h3>
                <p className="text-[13px] text-[#586A70] leading-relaxed mb-4">
                  Administra tus caballos, históricos de análisis y seguimiento en un solo lugar.
                </p>
              </div>
              <div className="space-y-2">
                {['Valentino', 'Lucero', 'Tornado'].map((horse, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3.5 py-2.5 bg-[#F4F7F6] border border-[#0F3D44]/[0.05] rounded-2xl text-[12px] font-semibold text-[#071B24]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00D1C2]" />
                      <span>{horse}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. PRODUCT SECTION (Dashboard & Multiplatform Showcase)
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-[#071B24] via-[#0B3038] to-[#0F3D44] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Laptop / Screen Preview */}
          <div className="lg:col-span-7">
            <div className="relative rounded-[28px] overflow-hidden shadow-2xl border border-white/15 group">
              <img
                src="/landing-assets/images/dashboard-preview.jpg"
                alt="Panel de análisis HorseVision"
                className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-4 left-4 right-4 px-4 py-3 bg-[#071B24]/75 backdrop-blur-xl rounded-full text-[12px] text-white/90 flex items-center justify-between border border-white/15 gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D9F99D] shrink-0" />
                  <span className="font-mono truncate">Disponible en Móvil (PWA) y Computadora</span>
                </div>
                <span className="text-[#00D1C2] font-semibold shrink-0">Sin sensores requeridos</span>
              </div>
            </div>
          </div>

          {/* Value Props & Checklist */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <p className="text-[11px] font-extrabold tracking-[2.6px] text-[#00D1C2] uppercase mb-3">
              TODO EN UNA SOLA PLATAFORMA
            </p>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-[-1.5px] leading-tight mb-6">
              Tus caballos, sus análisis y tu asistente de IA.
            </h2>
            <p className="text-[15px] text-[#D4E0E2] leading-relaxed mb-6">
              Diseñado tanto para jinetes particulares como para veterinarios y directores de haras. Funciona directamente en tu teléfono desde las cuadras o en tu pantalla de escritorio.
            </p>

            <ul className="space-y-3.5 mb-8">
              {[
                'Análisis biomecánico del trote en 60 segundos',
                'Detección temprana de posibles anomalías y sobrecargas',
                'Asistente con IA especializada disponible 24/7',
                'Gestión completa de cuadra y fichas evolutivas',
                'Planes flexibles para 1, 5 y hasta 50 caballos'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[14px] text-[#E1EBED]">
                  <div className="w-5 h-5 rounded-full bg-[#D9F99D]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#D9F99D] stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div>
              <a
                href="#planes"
                className="inline-flex items-center gap-2 text-[15px] font-bold text-[#00D1C2] hover:text-[#D9F99D] transition-colors"
              >
                <span>Conoce los planes y precios</span>
                <span className="text-[18px]">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. STEPS SECTION (Cómo funciona - Bento Cards)
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16 bg-white" id="como-funciona">
        <div className="max-w-7xl mx-auto">
          {/* Heading */}
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="text-[11px] font-extrabold tracking-[2.6px] text-[#0F3D44] uppercase mb-3">
              SENCILLO Y DIRECTO
            </p>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-[-1.5px] text-[#071B24]">
              Cómo funciona
            </h2>
          </div>

          {/* 3 Steps Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Step 1 */}
            <article className="rounded-[28px] bg-[#F4F7F6] border border-[#0F3D44]/[0.06] p-7 shadow-[0_8px_24px_-4px_rgba(7,27,36,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <span className="w-11 h-11 rounded-2xl bg-[#0F3D44] text-[#D9F99D] font-extrabold text-[15px] flex items-center justify-center tabular-nums shadow-sm">
                  01
                </span>
                <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <img src="/landing-assets/icons/upload.svg" alt="" className="w-6 h-6 text-[#0F3D44]" />
                </div>
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-[#071B24] mb-2">Sube un video</h3>
                <p className="text-[14px] text-[#586A70] leading-relaxed">
                  Graba el trote de tu caballo (10-15s en línea recta lateral) y cárgalo en la plataforma desde tu teléfono.
                </p>
              </div>
            </article>

            {/* Step 2 */}
            <article className="rounded-[28px] bg-[#F4F7F6] border border-[#0F3D44]/[0.06] p-7 shadow-[0_8px_24px_-4px_rgba(7,27,36,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <span className="w-11 h-11 rounded-2xl bg-[#0F3D44] text-[#D9F99D] font-extrabold text-[15px] flex items-center justify-center tabular-nums shadow-sm">
                  02
                </span>
                <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <img src="/landing-assets/icons/activity.svg" alt="" className="w-6 h-6 text-[#0F3D44]" />
                </div>
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-[#071B24] mb-2">Analiza con IA</h3>
                <p className="text-[14px] text-[#586A70] leading-relaxed">
                  Nuestra tecnología con visión artificial procesa el movimiento, detecta los puntos articulares y calcula la simetría.
                </p>
              </div>
            </article>

            {/* Step 3 */}
            <article className="rounded-[28px] bg-[#F4F7F6] border border-[#0F3D44]/[0.06] p-7 shadow-[0_8px_24px_-4px_rgba(7,27,36,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <span className="w-11 h-11 rounded-2xl bg-[#0F3D44] text-[#D9F99D] font-extrabold text-[15px] flex items-center justify-center tabular-nums shadow-sm">
                  03
                </span>
                <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <img src="/landing-assets/icons/chart.svg" alt="" className="w-6 h-6 text-[#0F3D44]" />
                </div>
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-[#071B24] mb-2">Obtén resultados</h3>
                <p className="text-[14px] text-[#586A70] leading-relaxed">
                  Revisa métricas clave, visualizaciones cinemáticas e informes para compartir con tu veterinario o entrenador.
                </p>
              </div>
            </article>
          </div>

          <p className="text-center text-[12px] text-[#859398] mt-16 max-w-lg mx-auto">
            Los resultados son de carácter informativo y preventivo, y no sustituyen la valoración clínica de un profesional veterinario colegiado.
          </p>
        </div>
      </section>

      {/* =========================================================================
          6. PRICING SECTION (Bento Pricing aligned with App + PayPal)
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16 bg-[#F2F5F4]" id="planes">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-10">
            <p className="text-[11px] font-extrabold tracking-[2.6px] text-[#0F3D44] uppercase mb-3">
              PLANES FLEXIBLES
            </p>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-[-1.5px] text-[#071B24] mb-3">
              Una suscripción para cada necesidad
            </h2>
            <p className="text-[15px] text-[#66777C]">
              Precios en dólares (USD). Empieza con tu prueba gratis o elige el plan para tu cuadra. Cancela cuando quieras.
            </p>
          </div>

          {/* 3 Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {plans.map((plan) => {
              const priceDisplay = `$${plan.price} USD`;

              return (
                <article
                  key={plan.id}
                  className={`relative p-8 rounded-[28px] flex flex-col justify-between transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-br from-[#0F3D44] to-[#071B24] text-white border border-white/15 shadow-[0_20px_48px_-8px_rgba(15,61,68,0.45)] md:-translate-y-2'
                      : 'bg-white border border-[#0F3D44]/[0.06] shadow-[0_12px_32px_-6px_rgba(7,27,36,0.06)] hover:shadow-[0_16px_38px_-6px_rgba(7,27,36,0.10)]'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-[#D9F99D] text-[#071B24] font-extrabold text-[11px] uppercase tracking-wider shadow-sm">
                      Más elegido
                    </span>
                  )}

                  <div>
                    <h3 className={`text-[22px] font-extrabold mb-1 ${plan.popular ? 'text-white' : 'text-[#071B24]'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-[13px] font-medium mb-6 ${plan.popular ? 'text-white/75' : 'text-[#65767B]'}`}>
                      {plan.limit}
                    </p>

                    <div className="mb-6">
                      <div className={`text-[32px] font-extrabold tracking-tight tabular-nums ${plan.popular ? 'text-white' : 'text-[#071B24]'}`}>
                        {priceDisplay}
                        <small className={`text-[13px] font-normal ml-1 ${plan.popular ? 'text-white/70' : 'text-[#66777C]'}`}>/ mes</small>
                      </div>
                      {plan.trial && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4F2] text-[#0F3D44] font-bold text-[11px] mt-2">
                          <Check className="w-3 h-3" />
                          <span>{plan.trial}</span>
                        </div>
                      )}
                    </div>

                    <ul className={`space-y-3 mb-8 pt-4 border-t ${plan.popular ? 'border-white/15' : 'border-slate-100'}`}>
                      {plan.features.map((feat, fIdx) => (
                        <li
                          key={fIdx}
                          className={`flex items-start gap-2.5 text-[13px] ${plan.popular ? 'text-white/90' : 'text-[#53666C]'}`}
                        >
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 stroke-[2.5] ${
                              plan.popular ? 'text-[#D9F99D]' : 'text-[#00D1C2]'
                            }`}
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-3.5 px-5 rounded-full font-extrabold text-[14px] transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 ${
                        plan.popular
                          ? 'bg-[#D9F99D] text-[#071B24] hover:bg-[#ccf482] shadow-lg'
                          : plan.trial
                          ? 'bg-[#00D1C2] text-[#071B24] hover:bg-[#00baa7] shadow-md'
                          : 'bg-[#0F3D44] text-white hover:bg-[#09282D] shadow-md'
                      }`}
                    >
                      {plan.trial ? (
                        <>
                          <span>Probar 7 Días Gratis</span>
                          <span className="text-[16px]">→</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Comenzar con {plan.name}</span>
                        </>
                      )}
                    </button>
                    <p
                      className={`text-center text-[11px] mt-2.5 font-medium ${
                        plan.popular
                          ? 'text-white/65'
                          : plan.trial
                          ? 'text-[#0F3D44]'
                          : 'text-slate-400 text-[10.5px]'
                      }`}
                    >
                      {plan.trial
                        ? 'Acceso instantáneo · Sin cobro hoy'
                        : 'Pago seguro con PayPal / Tarjeta de Débito y Crédito'}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FAQ SECTION (Rounded Capsules)
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16 bg-white" id="faq">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <p className="text-[11px] font-extrabold tracking-[2.6px] text-[#0F3D44] uppercase mb-3">
              PREGUNTAS FRECUENTES
            </p>
            <h2 className="text-[32px] sm:text-[42px] font-extrabold tracking-[-1.5px] leading-tight text-[#071B24] mb-4">
              Antes de empezar
            </h2>
            <p className="text-[14px] text-[#617278] leading-relaxed">
              ¿Tienes dudas sobre los requerimientos técnicos de grabación o el alcance de los informes? Aquí tienes las respuestas más habituales.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-[22px] bg-[#F4F7F6] border border-[#0F3D44]/[0.06] px-5 py-4 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-3 text-left font-bold text-[15.5px] text-[#071B24] hover:text-[#0F3D44] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="w-8 h-8 rounded-full bg-white text-[#0F3D44] shadow-sm flex items-center justify-center shrink-0 font-bold text-[18px]">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-[14px] text-[#586A70] leading-relaxed pr-4">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER (With Privacy Policy, Terms & Clinical/Trainer Disclaimer)
          ========================================================================= */}
      <footer className="py-12 px-4 sm:px-8 lg:px-16 bg-[#071B24] text-[#C6D4D7] border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white p-1.5 flex items-center justify-center shadow-sm">
                <img
                  src="/landing-assets/logo/horsevision-mark.png"
                  alt="HorseVision"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-baseline">
                <span className="font-extrabold text-[20px] text-white tracking-tight">HorseVision</span>
                <sup className="text-[9px] text-[#00D1C2] font-mono ml-0.5">®</sup>
              </div>
            </div>

            {/* Legal Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[13px] font-semibold">
              <button
                type="button"
                onClick={() => setLegalModalTab('terms')}
                className="text-[#D4E0E2] hover:text-[#D9F99D] underline-offset-4 hover:underline transition-colors"
              >
                Términos y Condiciones
              </button>
              <button
                type="button"
                onClick={() => setLegalModalTab('privacy')}
                className="text-[#D4E0E2] hover:text-[#D9F99D] underline-offset-4 hover:underline transition-colors"
              >
                Política de Privacidad
              </button>
              <button
                type="button"
                onClick={() => setLegalModalTab('terms')}
                className="text-[#00D1C2] hover:text-[#D9F99D] underline-offset-4 hover:underline transition-colors"
              >
                Deslinde de Responsabilidad
              </button>
            </div>

            <div className="text-[12px] text-[#91A4A9] font-mono text-center md:text-right">
              © {new Date().getFullYear()} HorseVision. Todos los derechos reservados.
            </div>
          </div>

          {/* Explicit Non-Veterinarian & Non-Trainer Disclaimer Banner */}
          <div className="rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4 text-[12px] text-[#B8C7CA] leading-relaxed flex flex-col sm:flex-row items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00D1C2] shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Aviso Legal y Deslinde de Responsabilidad:</strong> HorseVision®{' '}
              <strong className="text-[#D9F99D]">no es una clínica veterinaria, médico veterinario ni entrenador ecuestre</strong>.
              Es una herramienta tecnológica de apoyo y análisis biomecánico por visión artificial con fines exclusivamente informativos y de seguimiento. Sus métricas, reportes e interacciones con IA{' '}
              <strong className="text-white">no constituyen un diagnóstico clínico ni un plan profesional de entrenamiento</strong>, y no sustituyen en ningún caso la evaluación presencial de un médico veterinario colegiado ni la dirección de un entrenador certificado.
            </p>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          CHECKOUT MODAL (Conectado a PayPal SDK)
          ========================================================================= */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-[#0F3D44]/10 overflow-hidden text-[#071B24]">
            {/* Modal Header */}
            <div className="p-6 bg-[#071B24] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-[#00D1C2] uppercase">
                  Suscripción Segura
                </span>
                <h3 className="text-[20px] font-extrabold">
                  Plan {selectedPlanForCheckout.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForCheckout(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {checkoutSuccess ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h4 className="text-[22px] font-extrabold text-slate-900">
                    ¡Pago Completado con Éxito!
                  </h4>
                  <p className="text-[14px] text-slate-600">
                    Tu suscripción al Plan {selectedPlanForCheckout.name} ha sido activada. Redirigiendo a la aplicación...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 bg-[#F4F7F6] rounded-[22px] mb-6 border border-[#0F3D44]/[0.06]">
                    <div>
                      <p className="text-[14px] font-bold">{selectedPlanForCheckout.limit}</p>
                      <p className="text-[12px] text-slate-500">Facturación mensual recurrente</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[22px] font-black text-[#071B24] tabular-nums">
                        ${selectedPlanForCheckout.price} USD
                      </p>
                      {selectedPlanForCheckout.trial && (
                        <span className="text-[11px] font-bold text-[#0F3D44]">
                          {selectedPlanForCheckout.trial}
                        </span>
                      )}
                    </div>
                  </div>

                  {checkoutError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-[12px] text-red-700 flex items-center gap-2 mb-4">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{checkoutError}</span>
                    </div>
                  )}

                  {/* PayPal Container */}
                  <div className="w-full flex flex-col items-center">
                    <div
                      ref={paypalContainerRef}
                      className="w-full min-h-[44px]"
                    />

                    {(!sdkReady || isProcessing) && (
                      <div className="py-4 text-center text-[12px] text-slate-400 animate-pulse">
                        Cargando pasarela de pago segura...
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-[#0F3D44]" />
                    <span>Cifrado SSL de 256 bits · Procesado por PayPal</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DEMO VIDEO MODAL
          ========================================================================= */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#071B24] rounded-[32px] border border-white/20 overflow-hidden shadow-2xl">
            <div className="p-4 sm:px-6 flex items-center justify-between border-b border-white/10 text-white">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9F99D]" />
                <span className="font-bold text-[14px]">Demostración de Análisis Cinemático (HorseVision AI)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6 bg-black flex items-center justify-center">
              <video
                src="/demo_horse_trot.mp4"
                controls
                autoPlay
                className="w-full max-h-[70vh] rounded-[22px] border border-white/10"
              />
            </div>
            <div className="p-4 sm:px-6 bg-[#071B24] flex flex-wrap items-center justify-between gap-3 text-white text-[12px]">
              <span className="text-white/65">Extracción de articulaciones y cálculo de simetría en tiempo real.</span>
              <button
                type="button"
                onClick={() => { setShowDemoModal(false); handleGoToApp('signup'); }}
                className="px-5 py-2.5 rounded-full bg-[#D9F99D] text-[#071B24] font-extrabold hover:bg-[#ccf482] transition"
              >
                Probar en mi caballo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LEGAL MODAL (Términos y Condiciones & Política de Privacidad)
          ========================================================================= */}
      {legalModalTab && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setLegalModalTab(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[88vh] bg-white rounded-[32px] shadow-2xl border border-[#0F3D44]/10 overflow-hidden text-[#071B24] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 sm:p-6 bg-[#071B24] text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-[#00D1C2] uppercase">
                  Marco Legal · HorseVision®
                </span>
                <h3 className="text-[20px] font-extrabold">
                  {legalModalTab === 'terms' ? 'Términos y Condiciones' : 'Política de Privacidad'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalModalTab(null)}
                aria-label="Cerrar ventana legal"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="px-5 sm:px-6 pt-4 pb-2 bg-[#F2F5F4] border-b border-[#0F3D44]/10 shrink-0">
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-white border border-[#0F3D44]/10 shadow-sm">
                <button
                  type="button"
                  onClick={() => setLegalModalTab('terms')}
                  className={`py-2 px-3 rounded-full text-[12.5px] font-bold transition ${
                    legalModalTab === 'terms'
                      ? 'bg-[#0F3D44] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#071B24]'
                  }`}
                >
                  Términos y Condiciones
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModalTab('privacy')}
                  className={`py-2 px-3 rounded-full text-[12.5px] font-bold transition ${
                    legalModalTab === 'privacy'
                      ? 'bg-[#0F3D44] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#071B24]'
                  }`}
                >
                  Política de Privacidad
                </button>
              </div>
            </div>

            {/* Scrollable Legal Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-[13.5px] text-[#3B4E54] leading-relaxed">
              {legalModalTab === 'terms' ? (
                <>
                  <div className="rounded-[22px] bg-[#EEF4F2] border border-[#0F3D44]/15 p-4 text-[#071B24]">
                    <p className="font-extrabold text-[14px] mb-1">
                      1. Herramienta de apoyo y análisis — No somos veterinarios ni entrenadores
                    </p>
                    <p className="text-[13px] text-[#33464C]">
                      HorseVision® es exclusivamente una plataforma tecnológica de apoyo y análisis biomecánico asistida por visión artificial e inteligencia artificial. <strong>No somos médicos veterinarios, clínicos equinos ni entrenadores ecuestres</strong>, ni brindamos diagnósticos médicos, tratamientos farmacológicos o planes oficiales de entrenamiento deportivo.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#071B24] mb-1">
                      2. Limitación de responsabilidad clínica y deportiva
                    </h4>
                    <p>
                      Toda métrica de simetría, ángulo dorsal, oscilación vertical o sugerencia generada por el asistente IA tiene carácter meramente informativo y orientativo. Ante cualquier sospecha de cojera, dolor agudo, lesión o bajo rendimiento, el usuario debe consultar obligatoriamente a un médico veterinario colegiado y/o a su entrenador profesional presencial antes de tomar decisiones de carga de trabajo o salud sobre el caballo.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#071B24] mb-1">
                      3. Planes y suscripciones (1, 5 y 50 caballos)
                    </h4>
                    <p>
                      El acceso se rige según la capacidad de ejemplares del plan contratado: Básico (1 caballo con prueba gratuita de 7 días), Profesional (hasta 5 caballos) y Haras / Pro (hasta 50 caballos). El usuario puede cancelar su suscripción en cualquier momento antes del siguiente periodo de facturación mensual en dólares estadounidenses (USD).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#071B24] mb-1">
                      4. Uso responsable y seguridad en pista
                    </h4>
                    <p>
                      El manejo físico del caballo durante la grabación de video a la cuerda o en línea recta es responsabilidad íntegra del propietario, jinete o manejador. Realiza siempre las grabaciones en superficies seguras, sin jinete y respetando la distancia recomendada para evitar riesgos.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-[22px] bg-[#EEF4F2] border border-[#0F3D44]/15 p-4 text-[#071B24]">
                    <p className="font-extrabold text-[14px] mb-1">
                      Compromiso de Privacidad HorseVision®
                    </p>
                    <p className="text-[13px] text-[#33464C]">
                      Protegemos tus datos personales, las fichas de tus caballos y los videos que analizas en nuestra herramienta de apoyo y análisis biomecánico.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#071B24] mb-1">
                      1. Datos que recopilamos
                    </h4>
                    <p>
                      Al crear tu cuenta mediante Supabase Auth recopilamos tu correo electrónico de acceso y las fichas descriptivas de los ejemplares que registres voluntariamente (nombre, raza, disciplina, edad y notas evolutivas).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#071B24] mb-1">
                      2. Procesamiento privado de videos y métricas biomecánicas
                    </h4>
                    <p>
                      Los videos subidos o grabados se procesan únicamente para calcular los puntos articulares y métricas de simetría de tu sesión. No vendemos, alquilamos ni compartimos videos ni historiales de tus caballos con terceros con fines publicitarios.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#071B24] mb-1">
                      3. Pagos seguros con PayPal
                    </h4>
                    <p>
                      Todas las transacciones de suscripción se procesan directamente a través de la pasarela oficial de PayPal bajo cifrado SSL. HorseVision® no solicita ni almacena números completos de tarjetas bancarias ni códigos CVV en sus servidores.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#071B24] mb-1">
                      4. Derechos de eliminación y contacto
                    </h4>
                    <p>
                      Puedes eliminar ejemplares de tu cuadra o solicitar la eliminación definitiva de tu cuenta y datos asociados escribiendo en cualquier momento a{' '}
                      <a href="mailto:soporte@horsevision.app" className="text-[#0F3D44] font-bold underline">
                        soporte@horsevision.app
                      </a>.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer Action */}
            <div className="px-5 sm:px-6 py-4 bg-[#F2F5F4] border-t border-[#0F3D44]/10 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setLegalModalTab(null)}
                className="px-6 py-2.5 rounded-full bg-[#0F3D44] text-white text-[13px] font-bold hover:bg-[#09282D] transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
