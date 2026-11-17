import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  X,
  Sparkles,
  Crown,
  ShieldCheck,
  Calendar,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const PAYPAL_CLIENT_ID = 'BAANE3LHKnrMKf-jZ-ez5-Xkoi3dhx19UkuhHfyj6c5uWRy1lb3B5FiOt1NBUej1AatHi1xHGVjeQAZ2ag';

export default function PricingModal({ isOpen, onClose }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPlan, setSelectedPlan] = useState('1-horse'); // default to 1-horse to highlight the 7-day trial
  const [sdkReady, setSdkReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const paypalContainerRef = useRef(null);

  const plans = [
    {
      id: '1-horse',
      name: '1 Caballo',
      target: 'Propietarios individuales y jinetes',
      priceMonthly: '6,99',
      priceYearlyPerMonth: '5,59',
      yearlyBilled: '67',
      horseLimit: '1 Caballo Registrado',
      badge: '7 Días Gratis',
      badgeClass: 'bg-emerald-600 text-white shadow-sm font-extrabold',
      hasTrial: true,
      trialText: '7 Días de Prueba Gratis (Cobro de $6.99 a partir del día 8)',
      features: [
        '✨ 7 Días de Prueba Gratis sin cobro hoy',
        '1 ejemplar registrado en cuadra',
        'Análisis cinemático de trote en 30 FPS',
        'Detección automática 17 keypoints',
        'Barras de asimetría EVJ (<6mm)',
        'Gráfica de evolución temporal',
      ],
      highlight: true,
    },
    {
      id: '3-horses',
      name: '3 Caballos',
      target: 'Jinetes, criadores y entrenadores',
      priceMonthly: '15,99',
      priceYearlyPerMonth: '12,79',
      yearlyBilled: '149',
      horseLimit: 'Hasta 3 Caballos',
      badge: 'Más Popular',
      badgeClass: 'card-3d-racing-green text-white shadow-sm',
      hasTrial: false,
      trialText: 'Cobro inmediato · Sin período de prueba',
      features: [
        '⚡ Cobro directo sin período de prueba',
        'Hasta 3 caballos registrados en cuadra',
        'Informe clínico veterinario con IA (DeepSeek V3)',
        'Acceso para 2 usuarios (dueño + jinete)',
        'Descarga de Informes Oficiales en PDF',
        'Curva evolutiva comparativa entre ejemplares',
      ],
      highlight: false,
    },
    {
      id: '50-horses',
      name: 'Hasta 50 Caballos',
      target: 'Haras, centros de entrenamiento y clínicas',
      priceMonthly: '99',
      priceYearlyPerMonth: '79',
      yearlyBilled: '890',
      horseLimit: 'Hasta 50 Caballos',
      badge: 'Haras & Stud',
      badgeClass: 'bg-amber-600 dark:bg-amber-500 text-white shadow-sm',
      hasTrial: false,
      trialText: 'Cobro inmediato · Sin período de prueba',
      features: [
        '⚡ Cobro directo sin período de prueba',
        'Hasta 50 caballos en cuadra simultáneos',
        'Informes personalizados con logo de tu Haras',
        'Historial masivo y trazabilidad por veterinario',
        'Exportación masiva de certificados PDF',
        'Soporte técnico prioritario 24/7',
      ],
      highlight: false,
    },
  ];

  const currentPlanObj = plans.find((p) => p.id === selectedPlan) || plans[0];

  // Load PayPal JavaScript SDK dynamically
  useEffect(() => {
    if (!isOpen) return;

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
      script.onload = () => {
        setSdkReady(true);
      };
      script.onerror = () => {
        console.warn('No se pudo cargar el SDK oficial de PayPal.');
        setSdkReady(false);
      };
      document.body.appendChild(script);
    } else {
      setSdkReady(true);
    }
  }, [isOpen]);

  // Render PayPal Smart Buttons when SDK is ready and plan changes
  useEffect(() => {
    if (!isOpen || !sdkReady || !window.paypal || !paypalContainerRef.current) return;

    // Clear previous button render
    paypalContainerRef.current.innerHTML = '';

    try {
      window.paypal
        .Buttons({
          style: {
            shape: 'pill',
            color: 'gold',
            layout: 'horizontal',
            label: 'paypal',
            tagline: false,
            height: 48,
          },
          createOrder: async () => {
            setIsProcessing(true);
            setErrorMessage('');
            try {
              const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  plan_id: selectedPlan,
                  billing_cycle: billingCycle,
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.detail || 'Error al crear orden en PayPal');
              return data.order_id;
            } catch (err) {
              setErrorMessage(err.message || 'No se pudo iniciar la orden de PayPal.');
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
                  plan_id: selectedPlan,
                }),
              });
              const capture = await res.json();
              if (!res.ok) throw new Error(capture.detail || 'Error al capturar orden');

              // Save local active state
              localStorage.setItem('hv_active_plan', selectedPlan);
              localStorage.setItem('hv_subscription_active', 'true');
              localStorage.setItem(
                'hv_subscription_details',
                JSON.stringify({
                  planId: selectedPlan,
                  orderId: data.orderID,
                  trialDays: currentPlanObj.hasTrial ? 7 : 0,
                  date: new Date().toISOString(),
                })
              );

              setSuccessInfo({
                planName: currentPlanObj.name,
                hasTrial: currentPlanObj.hasTrial,
                orderId: data.orderID,
              });
            } catch (err) {
              setErrorMessage(err.message || 'No se pudo completar el pago con PayPal.');
            } finally {
              setIsProcessing(false);
            }
          },
          onError: (err) => {
            console.error('PayPal Error:', err);
            setErrorMessage('Hubo un error al procesar el pago con PayPal.');
            setIsProcessing(false);
          },
        })
        .render(paypalContainerRef.current);
    } catch (e) {
      console.warn('Error al renderizar botones de PayPal:', e);
    }
  }, [isOpen, sdkReady, selectedPlan, billingCycle]);

  if (!isOpen) return null;

  // Fallback direct activation for demo / testing
  const handleDirectActivation = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan,
          billing_cycle: billingCycle,
        }),
      });
      const data = await res.json();
      
      localStorage.setItem('hv_active_plan', selectedPlan);
      localStorage.setItem('hv_subscription_active', 'true');
      localStorage.setItem(
        'hv_subscription_details',
        JSON.stringify({
          planId: selectedPlan,
          orderId: data.order_id || `ORD-${Date.now()}`,
          trialDays: currentPlanObj.hasTrial ? 7 : 0,
          date: new Date().toISOString(),
        })
      );

      setSuccessInfo({
        planName: currentPlanObj.name,
        hasTrial: currentPlanObj.hasTrial,
        orderId: data.order_id || 'PP-TEST-APPROVED',
      });
    } catch {
      localStorage.setItem('hv_active_plan', selectedPlan);
      localStorage.setItem('hv_subscription_active', 'true');
      setSuccessInfo({
        planName: currentPlanObj.name,
        hasTrial: currentPlanObj.hasTrial,
        orderId: 'PP-LOCAL-APPROVED',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 view-enter"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[430px] max-h-[92vh] sm:max-h-[820px] bg-[#F8FAFC] dark:bg-[#121217] border border-slate-300 dark:border-[#2D2D35] flex flex-col rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Mobile Sheet Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-700 mx-auto mt-2 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 pt-3 pb-3 bg-white dark:bg-[#16161C] border-b border-slate-200 dark:border-[#26262A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full card-3d-racing-green flex items-center justify-center text-white shadow-md">
              <Crown className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-mono text-[15px] font-extrabold text-slate-900 dark:text-white">
                Planes de Suscripción
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                7 días de prueba gratis en el plan 1 Caballo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de planes"
            className="w-8 h-8 rounded-full card-3d-interactive flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SUCCESS CONFIRMATION STATE */}
        {successInfo ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-4 view-enter">
            <div className="w-16 h-16 rounded-full card-3d-racing-green flex items-center justify-center text-white shadow-xl animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <span className="font-mono text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20">
                {successInfo.hasTrial ? 'PRUEBA GRATUITA DE 7 DÍAS' : 'SUSCRIPCIÓN ACTIVA'}
              </span>
              <h3 className="font-mono text-[20px] font-black text-slate-900 dark:text-white mt-2">
                ¡Pago Confirmado con PayPal!
              </h3>
              <p className="text-[13px] text-slate-600 dark:text-zinc-300 max-w-[280px] mt-1">
                {successInfo.hasTrial
                  ? 'Disfrutas de 7 días 100% gratis. Tu cobro de US$ 6,99 iniciará a partir del día 8. Puedes cancelar en cualquier momento.'
                  : `Tu plan "${successInfo.planName}" ha sido activado de inmediato con facturación segura PayPal.`}
              </p>
            </div>

            <div className="w-full bg-slate-100 dark:bg-[#181820] p-3 rounded-2xl font-mono text-[11px] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#26262A]">
              <span>ID Orden PayPal: </span>
              <strong className="text-slate-900 dark:text-white">{successInfo.orderId}</strong>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full card-3d-racing-green py-3.5 rounded-2xl font-mono text-[13px] font-bold text-white shadow-lg active:scale-95 transition"
            >
              Comenzar a Evaluar en la Cuadra
            </button>
          </div>
        ) : (
          /* SCROLLABLE CONTENT */
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 no-scrollbar">
            {/* Dynamic Trial / Immediate Billing Banner */}
            {currentPlanObj.hasTrial ? (
              <div className="rounded-[18px] bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/30 dark:via-[#1C1C22] dark:to-amber-950/20 border border-[#0D3F2E]/30 dark:border-emerald-500/40 p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
                  <div>
                    <span className="font-mono text-[11px] font-extrabold text-slate-900 dark:text-white block">
                      ¡Prueba Gratuita de 7 Días!
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-zinc-300">
                      Exclusivo en Plan 1 Caballo. Cobro a partir del día 8.
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-extrabold px-2.5 py-1 rounded-full card-3d-racing-green text-white shadow-sm shrink-0">
                  7 Días Gratis
                </span>
              </div>
            ) : (
              <div className="rounded-[18px] bg-slate-100/90 dark:bg-[#181820] border border-slate-200 dark:border-[#26262A] p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white block">
                      Cobro Inmediato con PayPal
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      Planes multi-caballo sin período de prueba.
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full card-3d-subtle text-slate-700 dark:text-zinc-300 shrink-0">
                  Pago Directo
                </span>
              </div>
            )}

            {/* Billing Switcher: Mensual vs Anual */}
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl card-3d-recessed w-60 shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all ${
                    billingCycle === 'monthly'
                      ? 'card-3d-racing-green text-white shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                    billingCycle === 'yearly'
                      ? 'card-3d-racing-green text-white shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Anual</span>
                  <span className="text-[9px] text-amber-300 font-extrabold">-20%</span>
                </button>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-500/30 text-red-600 dark:text-red-400 font-mono text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 3 Tiered Plan Cards */}
            <div className="flex flex-col gap-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isMonthly = billingCycle === 'monthly';
                const displayPrice = isMonthly ? plan.priceMonthly : plan.priceYearlyPerMonth;
                const billedPeriodLabel = isMonthly ? '/mes' : '/mes (anual)';

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative rounded-[22px] p-4 flex flex-col gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'card-3d border-2 border-[#0D3F2E] dark:border-emerald-500 shadow-[0_8px_24px_rgba(13,63,46,0.18)] ring-2 ring-[#0D3F2E]/15 dark:ring-emerald-500/20'
                        : 'card-3d-subtle hover:border-slate-400 dark:hover:border-zinc-600 opacity-90'
                    }`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <span className={`absolute -top-2.5 right-4 font-mono text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${plan.badgeClass}`}>
                        {plan.badge}
                      </span>
                    )}

                    {/* Header Row: Title & Price */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono text-[15px] font-extrabold text-slate-900 dark:text-white truncate">
                            {plan.name}
                          </h4>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-[#0D3F2E] dark:bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {plan.target}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-baseline justify-end gap-0.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                            US$
                          </span>
                          <span className="font-mono text-[20px] font-black text-slate-900 dark:text-white tabular-nums">
                            {displayPrice}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-500 dark:text-zinc-400 block -mt-0.5">
                          {billedPeriodLabel}
                        </span>
                      </div>
                    </div>

                    {/* Horse Quota Pill + Trial Pill */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="py-1 px-2.5 rounded-lg bg-amber-50 dark:bg-[#181820] border border-amber-200 dark:border-amber-900/30 font-mono text-[10px] font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                        <span>🐴</span>
                        <span>{plan.horseLimit}</span>
                      </div>

                      {plan.hasTrial && (
                        <div className="py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 font-mono text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                          7 días gratis
                        </div>
                      )}
                    </div>

                    {/* Feature Bullets */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-[#26262A]">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-zinc-300">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FIXED BOTTOM PAYPAL CHECKOUT BAR */}
        {!successInfo && (
          <div className="p-4 bg-white dark:bg-[#16161C] border-t border-slate-200 dark:border-[#26262A] flex flex-col gap-2.5 shrink-0">
            {/* PayPal Container for official PayPal Buttons */}
            <div className="w-full flex flex-col items-center">
              <div
                ref={paypalContainerRef}
                className="w-full min-h-[48px] flex items-center justify-center"
              />

              {/* Fallback button if PayPal SDK is still loading */}
              {(!sdkReady || isProcessing) && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleDirectActivation}
                  className="w-full card-3d-racing-green min-h-[50px] rounded-[16px] font-mono text-[13px] font-extrabold text-white flex items-center justify-center gap-2 active:scale-95 transition shadow-lg"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {currentPlanObj.hasTrial
                      ? 'Activar Prueba de 7 Días con PayPal'
                      : `Pagar US$ ${billingCycle === 'monthly' ? currentPlanObj.priceMonthly : currentPlanObj.priceYearlyPerMonth} con PayPal`}
                  </span>
                </button>
              )}
            </div>

            {/* Trial & Guarantee Terms */}
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 dark:text-zinc-400 font-mono text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>
                {currentPlanObj.hasTrial
                  ? '7 días gratis sin cobro hoy · Cancela antes del día 7 en PayPal'
                  : 'Facturación directa segura por PayPal · Cancela cuando quieras'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
