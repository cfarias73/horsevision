import React from 'react';
import {
  User,
  Crown,
  ChevronRight,
  HelpCircle,
  Layers,
  ExternalLink,
  Smartphone,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { useAppLanguage } from '../lib/language';

const PLAN_DATA = {
  '1-horse': {
    name: 'Plan Básico · 1 Caballo',
    price: 'US$ 6.99 / mes',
    limit: 1,
  },
  '3-horses': {
    name: 'Plan Profesional · Hasta 5 Caballos',
    price: 'US$ 15.99 / mes',
    limit: 5,
  },
  '5-horses': {
    name: 'Plan Profesional · Hasta 5 Caballos',
    price: 'US$ 15.99 / mes',
    limit: 5,
  },
  '50-horses': {
    name: 'Plan Haras · Hasta 50 Caballos',
    price: 'US$ 99.00 / mes',
    limit: 50,
  },
};

export default function ProfileView({
  user = null,
  activePlanId: propActivePlanId,
  onOpenAuth,
  onSignOut,
  onOpenPricing,
  horses = [],
  onGoToCuadra,
  onOpenInstallModal,
  onBackToLanding,
}) {
  const { language, setLanguage } = useAppLanguage();
  let storedPlan = '1-horse';
  try {
    storedPlan = localStorage.getItem('hv_active_plan') || '1-horse';
  } catch {
    storedPlan = '1-horse';
  }
  const activePlanId = propActivePlanId || storedPlan;
  const currentPlan = PLAN_DATA[activePlanId] || PLAN_DATA['1-horse'];

  const horsesUsed = horses.length;
  const quotaPct = Math.min(100, Math.round((horsesUsed / currentPlan.limit) * 100));
  const isQuotaFull = horsesUsed >= currentPlan.limit;

  return (
    <div className="flex flex-col gap-3.5 pt-1 view-enter">
      {/* 1. Tarjeta de Mi Cuenta */}
      <div className="rounded-[24px] card-3d p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl card-3d-racing-green flex items-center justify-center text-white text-[18px] font-mono font-extrabold shadow-md shrink-0">
              {user?.email ? (
                user.email.slice(0, 2).toUpperCase()
              ) : (
                <User className="w-6 h-6 text-emerald-300" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-[15px] font-extrabold text-slate-900 dark:text-white truncate">
                  {user?.email ? user.email.split('@')[0] : 'Invitado'}
                </h2>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full card-3d-racing-green text-white font-bold shadow-sm shrink-0">
                  {user ? 'Cuenta Activa' : 'Sin Sesión'}
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                {user?.email ? user.email : 'Inicia sesión para acceder a tu cuadra'}
              </p>
            </div>
          </div>

          {user ? (
            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar Sesión"
              className="px-3 py-1.5 rounded-xl card-3d-interactive text-red-600 dark:text-red-400 font-mono text-[11px] font-bold flex items-center gap-1.5 transition shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth?.('login')}
              className="px-3 py-1.5 rounded-xl card-3d-racing-green text-white font-mono text-[11px] font-bold shadow-md active:scale-95 transition shrink-0"
            >
              Acceder
            </button>
          )}
        </div>

        {!user && (
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-600 dark:text-zinc-400">
              ¿Aún no tienes cuenta?
            </span>
            <button
              type="button"
              onClick={() => onOpenAuth?.('signup')}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Cuenta Gratis</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Tarjeta de Mi Plan y Cupo de Caballos */}
      <div className="rounded-[24px] card-3d-racing-green p-4 text-white shadow-lg flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[9px] uppercase font-bold text-emerald-200 tracking-wider block">
                {activePlanId === '1-horse'
                  ? 'Suscripción Activa · 7 Días Gratis'
                  : 'Suscripción Activa · PayPal'}
              </span>
              <h3 className="font-mono text-[14px] font-extrabold mt-0.5 truncate">
                {currentPlan.name}
              </h3>
              <p className="font-mono text-[11px] text-emerald-100/80">
                {currentPlan.price}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPricing}
            className="px-3.5 py-1.5 rounded-xl bg-white text-[#0D3F2E] font-mono text-[11px] font-extrabold shadow-md active:scale-95 transition shrink-0"
          >
            Cambiar Plan
          </button>
        </div>

        {/* Quota Progress Bar */}
        <div className="pt-2 border-t border-white/15 flex flex-col gap-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-100 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Cupo de Caballos</span>
            </span>
            <span className="font-bold text-white">
              {horsesUsed} de {currentPlan.limit} registrados
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isQuotaFull ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${quotaPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-emerald-200/90 pt-0.5">
            <span>
              {isQuotaFull
                ? `Límite de ${currentPlan.limit} alcanzado`
                : `${currentPlan.limit - horsesUsed} disponible(s)`}
            </span>
            {onGoToCuadra && (
              <button
                type="button"
                onClick={onGoToCuadra}
                className="underline font-bold text-white hover:text-emerald-200"
              >
                Ir a Cuadra
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="rounded-[22px] card-3d p-4 flex flex-col gap-3 shadow-sm">
        <div>
          <h3 className="text-[13px] font-extrabold text-slate-900 dark:text-white">Language</h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">Choose the app display language.</p>
        </div>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="App language">
          <button
            type="button"
            aria-pressed={language === 'en'}
            onClick={() => setLanguage('en')}
            className={`min-h-[42px] rounded-xl border text-[12px] font-bold transition ${
              language === 'en'
                ? 'card-3d-racing-green text-white'
                : 'card-3d-interactive text-slate-700 dark:text-zinc-200'
            }`}
          >
            English
          </button>
          <button
            type="button"
            aria-pressed={language === 'es'}
            onClick={() => setLanguage('es')}
            className={`min-h-[42px] rounded-xl border text-[12px] font-bold transition ${
              language === 'es'
                ? 'card-3d-racing-green text-white'
                : 'card-3d-interactive text-slate-700 dark:text-zinc-200'
            }`}
          >
            Español
          </button>
        </div>
      </section>

      {/* 3. Lista Compacta de Acciones Esenciales */}
      <div className="rounded-[22px] card-3d p-2 flex flex-col divide-y divide-slate-100 dark:divide-[#26262A] shadow-sm font-mono text-[12px]">
        {onOpenInstallModal && (
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="w-full px-3.5 py-3 flex items-center justify-between text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Instalar App en mi Teléfono</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        <a
          href="mailto:soporte@horsevision.app?subject=Consulta%20HorseVision%20App"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-3 flex items-center justify-between text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Soporte y Ayuda</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="w-full px-3.5 py-3 flex items-center justify-between text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>Volver a la Página Web</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {user && (
          <button
            type="button"
            onClick={onSignOut}
            className="w-full px-3.5 py-3 flex items-center justify-between text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-b-xl transition font-bold"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </button>
        )}
      </div>
    </div>
  );
}
