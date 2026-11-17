import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AuthScreen({ onAuthSuccess, onBackToLanding }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'recovery'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (newMode) => {
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Por favor ingresa tu correo electrónico (Gmail).');
      return;
    }

    if (mode === 'recovery') {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/app`,
        });
        if (error) throw error;
        setSuccessMsg(
          '¡Enlace enviado! Revisa tu bandeja de entrada o spam para restablecer tu contraseña.'
        );
      } catch (err) {
        setErrorMsg(err.message || 'Error al enviar el correo de recuperación.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Por favor ingresa tu contraseña.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden. Verifícalas e intenta nuevamente.');
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
        });

        if (error) throw error;

        if (data.session) {
          // Logged in directly
          onAuthSuccess?.(data.user);
        } else {
          // Check if auto-confirm is enabled or email sent
          setSuccessMsg(
            '¡Cuenta creada exitosamente! Revisa tu correo electrónico para confirmar tu dirección e ingresar.'
          );
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error al crear la cuenta en Supabase.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'login') {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Correo o contraseña incorrectos. Verifica tus credenciales.');
          }
          throw error;
        }

        onAuthSuccess?.(data.user);
      } catch (err) {
        setErrorMsg(err.message || 'Error al iniciar sesión.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto no-scrollbar view-enter font-sans">
      <div className="flex flex-col gap-4 pt-2">
        {/* Top return link to landing */}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="self-start inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Volver a la Página Web</span>
          </button>
        )}

        {/* Brand Hero Header */}
        <div className="flex flex-col items-center text-center gap-2.5 pt-2 pb-2">
          <div className="relative w-16 h-16 rounded-2xl bg-[#0D3F2E] flex items-center justify-center text-white shadow-xl border border-emerald-500/20">
            <span className="material-symbols-outlined text-[32px] text-emerald-300">pets</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#141417] animate-pulse" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-[#0D3F2E] border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono text-[9px] uppercase font-bold tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Acceso Requerido · Laboratorio Clínico</span>
            </div>
            <h1 className="font-mono text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              HorseVision
            </h1>
            <p className="text-[12px] text-slate-500 dark:text-zinc-400 leading-snug max-w-xs mx-auto">
              {mode === 'login' && 'Inicia sesión para acceder a tu cuadra y evaluaciones.'}
              {mode === 'signup' && 'Crea tu cuenta con Gmail para activar tu prueba de 7 días.'}
              {mode === 'recovery' && 'Introduce tu correo para restablecer tu clave.'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        {mode !== 'recovery' && (
          <div className="grid grid-cols-2 p-1 rounded-2xl card-3d-recessed font-mono text-[11px] font-bold">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 rounded-xl transition-all ${
                mode === 'login'
                  ? 'card-3d-racing-green text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-2 rounded-xl transition-all ${
                mode === 'signup'
                  ? 'card-3d-racing-green text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-red-700 dark:text-red-300 font-mono text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-mono text-[11px] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="rounded-[24px] card-3d p-4 shadow-sm border border-slate-200 dark:border-white/10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 font-mono">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-bold">
                Correo Electrónico (Gmail)
              </label>
              <div className="relative flex items-center bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 transition focus-within:border-emerald-500">
                <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 mr-2 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full bg-transparent text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            {mode !== 'recovery' && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-bold">
                    Contraseña
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('recovery')}
                      className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 transition focus-within:border-emerald-500">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 mr-2 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-transparent text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 ml-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (signup only) */}
            {mode === 'signup' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-bold">
                  Repetir Contraseña
                </label>
                <div className="relative flex items-center bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 transition focus-within:border-emerald-500">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 mr-2 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu contraseña"
                    className="w-full bg-transparent text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0D3F2E] to-[#145740] hover:from-[#114b37] hover:to-[#1a6b4f] border border-emerald-500/30 text-white font-mono text-[12px] font-bold flex items-center justify-center gap-2 shadow-xl active:scale-98 transition disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Entrar a HorseVision'}
                    {mode === 'signup' && 'Crear mi Cuenta y Comenzar'}
                    {mode === 'recovery' && 'Enviar Enlace de Recuperación'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recovery back to login */}
        {mode === 'recovery' && (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="text-center font-mono text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold"
          >
            ← Volver a Iniciar Sesión
          </button>
        )}
      </div>

      {/* Security Footer Note */}
      <div className="pt-4 pb-2 text-center font-mono text-[10px] text-slate-400 dark:text-zinc-600">
        HorseVision Biomecánica · Cifrado SSL / Supabase Vault
      </div>
    </div>
  );
}
