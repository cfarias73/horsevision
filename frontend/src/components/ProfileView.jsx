import React, { useState } from 'react';
import {
  User,
  Shield,
  Crown,
  ChevronRight,
  Settings,
  HelpCircle,
  Sparkles,
  Layers,
  HardDrive,
  Sun,
  Moon,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Smartphone,
  Download,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react';

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

export default function ProfileView({
  user = null,
  onOpenAuth,
  onSignOut,
  onOpenPricing,
  onOpenOnboarding,
  horses = [],
  sessionsCount = 4,
  onGoToCuadra,
  onOpenInstallModal,
  onBackToLanding,
}) {
  const [activePlanId, setActivePlanId] = useState(() => {
    return localStorage.getItem('hv_active_plan') || '3-horses';
  });

  const [unitSystem, setUnitSystem] = useState(() => {
    return localStorage.getItem('hv_units') || 'metric';
  });

  const [currentLang, setCurrentLang] = useState(() => {
    try {
      const match = document.cookie.match(/googtrans=\/[^/]+\/([a-z]{2})/i);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    } catch (e) {
      // ignore
    }
    return localStorage.getItem('hv_app_lang') || 'es';
  });

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('hv_app_lang', langCode);

    try {
      const hostname = window.location.hostname;
      if (langCode === 'es') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
      } else {
        document.cookie = `googtrans=/es/${langCode}; path=/;`;
        document.cookie = `googtrans=/es/${langCode}; path=/; domain=${hostname};`;
      }
    } catch (err) {
      console.warn('Cookie set error:', err);
    }

    // Trigger Google Translate combo if available
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = langCode === 'es' ? '' : langCode;
      combo.dispatchEvent(new Event('change'));
    } else {
      // Reload to let Google translate read the new cookie
      window.location.reload();
    }
  };

  const PLAN_DATA = {
    '1-horse': {
      name: 'Plan 1 Caballo',
      price: 'US$ 6,99/mes',
      limit: 1,
      badge: 'Individual',
    },
    '3-horses': {
      name: 'Plan 3 Caballos',
      price: 'US$ 15,99/mes',
      limit: 3,
      badge: 'Más Popular',
    },
    '50-horses': {
      name: 'Plan Hasta 50 Caballos',
      price: 'US$ 99/mes',
      limit: 50,
      badge: 'Haras & Stud',
    },
  };

  const currentPlan = PLAN_DATA[activePlanId] || PLAN_DATA['3-horses'];
  const horsesUsed = horses.length;
  const quotaPct = Math.min(100, Math.round((horsesUsed / currentPlan.limit) * 100));
  const isQuotaFull = horsesUsed >= currentPlan.limit;

  const handleToggleUnits = (unit) => {
    setUnitSystem(unit);
    try {
      localStorage.setItem('hv_units', unit);
    } catch {
      // ignore
    }
  };

  const handleClearCache = () => {
    if (window.confirm('¿Deseas reiniciar los datos en caché de la aplicación?')) {
      try {
        localStorage.removeItem('hv_sessions');
        localStorage.removeItem('hv_horses');
        window.location.reload();
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="flex flex-col gap-3.5 pt-1 view-enter">
      {/* 1. Account Identity Card (Supabase Auth) */}
      <div className="rounded-[24px] card-3d p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl card-3d-racing-green flex items-center justify-center text-white text-[18px] font-mono font-extrabold shadow-md shrink-0">
              {user?.email ? user.email.slice(0, 2).toUpperCase() : <User className="w-6 h-6 text-emerald-300" />}
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
                {user?.email ? user.email : 'Inicia sesión para sincronizar tu cuadra'}
              </p>
            </div>
          </div>

          {/* Auth Action Button */}
          {user ? (
            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar Sesión"
              className="p-2 rounded-xl card-3d-interactive text-red-500 hover:text-red-600 transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
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

        {/* If guest, display quick signup banner */}
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

      {/* 2. Real SaaS Subscription & Quota Card */}
      <div className="rounded-[24px] card-3d-racing-green p-4 text-white shadow-lg flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase font-bold text-emerald-200 tracking-wider block">
                {activePlanId === '1-horse'
                  ? 'Suscripción Activa · 7 Días de Prueba'
                  : 'Suscripción Activa · Facturación PayPal'}
              </span>
              <h3 className="font-mono text-[15px] font-extrabold mt-0.5">
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

        {/* Real Quota Bar */}
        <div className="pt-2 border-t border-white/15 flex flex-col gap-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-100 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Cupo de Ejemplares</span>
            </span>
            <span className="font-bold text-white">
              {horsesUsed} de {currentPlan.limit} registrados
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isQuotaFull ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${quotaPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-emerald-200/90 pt-0.5">
            <span>
              {isQuotaFull
                ? 'Cupo completado en este plan'
                : `Tienes ${currentPlan.limit - horsesUsed} cupo(s) disponible(s)`}
            </span>
            <button
              type="button"
              onClick={onGoToCuadra}
              className="underline font-bold text-white hover:text-emerald-200"
            >
              Ir a Cuadra
            </button>
          </div>
        </div>
      </div>

      {/* 3. Operational App Preferences */}
      <div className="rounded-[22px] card-3d p-4 flex flex-col gap-3 shadow-sm">
        <h4 className="font-mono text-[12px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#0D3F2E] dark:text-[#10B981]" />
          <span>Preferencias Biomecánicas</span>
        </h4>

        {/* Units Switcher */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-[#26262A]">
          <div>
            <span className="font-mono text-[12px] font-bold text-slate-800 dark:text-zinc-200 block">
              Sistema de Unidades
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400">
              Métrico (milímetros / metros)
            </span>
          </div>

          <div className="grid grid-cols-2 p-1 rounded-xl card-3d-recessed font-mono text-[10px] font-bold">
            <button
              type="button"
              onClick={() => handleToggleUnits('metric')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                unitSystem === 'metric'
                  ? 'card-3d-racing-green text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Métrico
            </button>
            <button
              type="button"
              onClick={() => handleToggleUnits('imperial')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                unitSystem === 'imperial'
                  ? 'card-3d-racing-green text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Imperial
            </button>
          </div>
        </div>

        {/* EVJ Standard Threshold Info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#26262A] text-[11px] font-mono">
          <div>
            <span className="font-bold text-slate-800 dark:text-zinc-200 block">
              Tolerancia EVJ Keegan
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400">
              Umbral clínico de simetría
            </span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20">
            ≤ 6.0 mm
          </span>
        </div>
      </div>

      {/* 4. Idioma de la Aplicación (Traductor Global) */}
      <div className="rounded-[22px] card-3d p-4 flex flex-col gap-3 shadow-sm notranslate">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-mono text-[13px] font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Idioma de la App</span>
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                Traducción instantánea con Google Translate
              </p>
            </div>
          </div>

          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {LANGUAGES.find((l) => l.code === currentLang)?.flag}{' '}
            {LANGUAGES.find((l) => l.code === currentLang)?.label}
          </span>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  isSelected
                    ? 'card-3d-racing-green text-white font-bold shadow-md ring-1 ring-emerald-400/40'
                    : 'card-3d-subtle text-slate-700 dark:text-zinc-300 hover:border-emerald-500/30'
                }`}
              >
                <span className="text-[14px]">{lang.flag}</span>
                <span className="truncate">{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Local Storage & Support */}
      <div className="rounded-[22px] card-3d p-2 flex flex-col divide-y divide-slate-100 dark:divide-[#26262A] shadow-sm font-mono text-[12px]">
        {/* Local Storage Info & Reset */}
        <div className="px-3.5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-slate-700 dark:text-zinc-200 block">Almacenamiento Local</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                {horses.length} caballos · Sesiones guardadas
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className="text-[10px] font-bold text-red-500 hover:text-red-600 p-1 rounded-lg card-3d-interactive"
          >
            Limpiar Datos
          </button>
        </div>

        {/* Replay Onboarding Flow */}
        <button
          type="button"
          onClick={onOpenOnboarding}
          className="w-full px-3.5 py-3 flex items-center justify-between text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Tour de Bienvenida (Onboarding)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* PWA Install Action */}
        {onOpenInstallModal && (
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="w-full px-3.5 py-3 flex items-center justify-between text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Instalar App en el Móvil (PWA)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {/* Return to Landing Web Page */}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="w-full px-3.5 py-3 flex items-center justify-between text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>Ver Página Web Principal (Landing)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {/* Real Support Action */}
        <a
          href="mailto:soporte@horsevision.app?subject=Consulta%20HorseVision%20App"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-3 flex items-center justify-between text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Soporte Técnico & Contacto</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* Version Stamp */}
      <div className="text-center font-mono text-[10px] text-slate-400 dark:text-zinc-600 py-1">
        HorseVision 1.0.0 · Motor YOLOv8 + AP-10K
      </div>
    </div>
  );
}
