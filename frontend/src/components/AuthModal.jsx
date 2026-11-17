import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login', // 'login' | 'signup' | 'recovery'
  onAuthSuccess,
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'recovery'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (newMode) => {
    resetFormState();
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
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
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
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
          // Logged in immediately
          onAuthSuccess?.(data.user);
          onClose();
        } else {
          // Email confirmation required by Supabase
          setSuccessMsg(
            '¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu dirección y activar tu cuenta.'
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
            throw new Error('Correo o contraseña incorrectos. Verifica tus datos.');
          }
          throw error;
        }

        onAuthSuccess?.(data.user);
        onClose();
      } catch (err) {
        setErrorMsg(err.message || 'Error al iniciar sesión.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-[28px] bg-[#F8FAFC] dark:bg-[#141417] border border-slate-200 dark:border-white/10 p-6 text-slate-900 dark:text-white shadow-2xl overflow-hidden font-sans transition-colors duration-300">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#0D3F2E]/20 dark:bg-[#0D3F2E]/40 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/60 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center gap-2 pt-1 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0D3F2E] flex items-center justify-center text-white shadow-md mb-1">
            <span className="material-symbols-outlined text-[26px]">pets</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#0D3F2E] border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono text-[9px] uppercase font-bold tracking-wider mb-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Autenticación Segura · Supabase</span>
            </div>
            <h3 className="font-mono text-[18px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              {mode === 'login' && 'Iniciar Sesión'}
              {mode === 'signup' && 'Crear tu Cuenta'}
              {mode === 'recovery' && 'Recuperar Contraseña'}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
              {mode === 'login' && 'Accede a tu cuadra, reportes clínicos y telemetría.'}
              {mode === 'signup' && 'Regístrate con tu correo para comenzar tus evaluaciones.'}
              {mode === 'recovery' && 'Te enviaremos un enlace seguro a tu correo.'}
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-red-700 dark:text-red-300 font-mono text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-mono text-[11px] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 font-mono">
          {/* Email input */}
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

          {/* Password input (login & signup) */}
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

          {/* Repeat password (signup only) */}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0D3F2E] to-[#145740] hover:from-[#114b37] hover:to-[#1a6b4f] border border-emerald-500/30 text-white font-mono text-[12px] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Iniciar Sesión'}
                  {mode === 'signup' && 'Crear mi Cuenta'}
                  {mode === 'recovery' && 'Enviar Enlace de Recuperación'}
                </span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </>
            )}
          </button>
        </form>

        {/* Footer Mode Switchers */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10 text-center font-mono text-[11px] text-slate-500 dark:text-zinc-400">
          {mode === 'login' && (
            <p>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Crear cuenta gratis
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              ¿Ya tienes una cuenta registrada?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Inicia sesión aquí
              </button>
            </p>
          )}

          {mode === 'recovery' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              ← Volver a Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
