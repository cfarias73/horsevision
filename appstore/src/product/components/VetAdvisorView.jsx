import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiFetch } from '../lib/api';
import { useAppLanguage } from '../lib/language';
import {
  Send,
  Bot,
  Stethoscope,
  Loader2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

function renderFormattedContent(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/^#{1,4}\s+/gm, '');
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

const isErrorMessage = (msg) =>
  msg?.role === 'assistant' &&
  typeof msg.content === 'string' &&
  (msg.content.includes('No pude conectar con el Agente Veterinario IA') ||
    msg.content.includes('Disculpa, hubo un problema'));

function cleanSavedChatMessages(list) {
  if (!Array.isArray(list)) return [];
  const cleaned = [];
  for (const m of list) {
    if (isErrorMessage(m)) {
      if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === 'user') {
        cleaned.pop();
      }
      continue;
    }
    cleaned.push(m);
  }
  return cleaned;
}

/**
 * VetAdvisorView:
 * Permanent standalone tab for the AI Equine Specialist (DeepSeek V3).
 * Works seamlessly both with active kinematic metrics or for general
 * equestrian, farriery, training, and veterinary questions.
 * Persists conversation history per horse/context in localStorage.
 */
export default function VetAdvisorView({
  horses = [],
  selectedHorse,
  onSelectHorse,
  analysisData,
  sessions = [],
  onRequireAuth,
}) {
  const { language } = useAppLanguage();
  const [contextKey, setContextKey] = useState(() => {
    if (selectedHorse?.id) return selectedHorse.id;
    if (horses.length > 0) return horses[0].id;
    return 'general';
  });

  // Sync if selectedHorse changes externally and contextKey isn't locked to another horse
  useEffect(() => {
    if (selectedHorse?.id && horses.some((h) => h.id === selectedHorse.id)) {
      setContextKey(selectedHorse.id);
    } else if (contextKey !== 'general' && !horses.some((h) => h.id === contextKey)) {
      setContextKey(horses[0]?.id || 'general');
    }
  }, [selectedHorse, horses]);

  const activeHorse = useMemo(
    () => horses.find((h) => h.id === contextKey) || null,
    [horses, contextKey]
  );

  // Resolve available kinematic context for the selected horse
  const resolvedMetrics = useMemo(() => {
    if (!activeHorse) return null;

    const metaName = analysisData?.metadata?.horse_name?.toLowerCase();
    if (
      analysisData?.symmetry_report &&
      (!metaName || metaName === activeHorse.name.toLowerCase())
    ) {
      return {
        symmetry_report: analysisData.symmetry_report,
        kinematics_summary: analysisData.kinematics_summary || {},
        score: Math.round(analysisData.symmetry_report.global_score ?? activeHorse.lastScore ?? 85),
        source: 'Análisis reciente',
      };
    }

    const latestSession = sessions.find(
      (s) => s.horse?.toLowerCase() === activeHorse.name.toLowerCase()
    );
    if (latestSession) {
      return {
        symmetry_report: latestSession.symmetry_report || {
          global_score: latestSession.score,
          grade_label: latestSession.statusLabel,
          clinical_decision: `Último control (${latestSession.date}): ${latestSession.statusLabel}`,
          fore_impact_asym_mm: 2.2,
          fore_pushoff_asym_mm: 1.9,
          hind_impact_asym_mm: parseFloat(latestSession.asymmetryMm) || 3.2,
          hind_pushoff_asym_mm: 2.6,
        },
        kinematics_summary: latestSession.kinematics_summary || {
          back_rom_deg: 8.2,
          stride_length_m: 2.38,
          cadence_spm: 84,
        },
        score: latestSession.score,
        source: latestSession.date,
      };
    }

    return null;
  }, [activeHorse, analysisData, sessions]);

  const storageKey = `hv_vet_chat_history_${contextKey}_${language}`;

  const getInitialGreeting = (horseObj, metrics) => {
    if (language === 'en') {
      if (horseObj && metrics) {
        return [
          {
            role: 'assistant',
            content: `Hello. I have **${horseObj.name}**'s movement report loaded (${horseObj.discipline}, Score: ${metrics.score}/100). Ask me about the trot, exercises, shoeing, or recovery.`,
          },
        ];
      }
      if (horseObj) {
        return [
          {
            role: 'assistant',
            content: `Hello. I’m ready to help with **${horseObj.name}** (${horseObj.breed} · ${horseObj.discipline}). You can ask about training, care, shoeing, or prevention.`,
          },
        ];
      }
      return [
        {
          role: 'assistant',
          content: 'Hello. I’m HorseVision’s **Equine AI Specialist**. Ask me about equine biomechanics, movement asymmetry, sport horse shoeing, training, or daily care.',
        },
      ];
    }

    if (horseObj && metrics) {
      return [
        {
          role: 'assistant',
          content: `Hola. Tengo cargado el expediente biomecánico de **${horseObj.name}** (${horseObj.discipline}, Score: ${metrics.score}/100). Pregúntame lo que necesites sobre su trote, ejercicios, herraje o recuperación.`,
        },
      ];
    }
    if (horseObj) {
      return [
        {
          role: 'assistant',
          content: `Hola. Estoy listo para asesorarte sobre **${horseObj.name}** (${horseObj.breed} · ${horseObj.discipline}). Aún no has grabado un video reciente, pero puedes consultarme sobre entrenamiento, manejo, herraje o prevención.`,
        },
      ];
    }
    return [
      {
        role: 'assistant',
        content:
          'Hola. Soy tu **Especialista Veterinario IA de HorseVision**. Puedes hacerme cualquier consulta sobre biomecánica equina, detección de cojeras, herraje deportivo, entrenamiento o manejo diario.',
      },
    ];
  };

  const loadMessagesForKey = (key, horseObj, metrics) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned = cleanSavedChatMessages(parsed);
        while (cleaned.length > 0 && cleaned[cleaned.length - 1].role === 'user') {
          cleaned.pop();
        }
        if (cleaned.some((m) => m.role === 'user')) {
          return cleaned;
        }
      }
    } catch {
      // ignore
    }
    return getInitialGreeting(horseObj, metrics);
  };

  const [messages, setMessages] = useState(() =>
    loadMessagesForKey(storageKey, activeHorse, resolvedMetrics)
  );

  // Load saved conversation whenever contextKey changes
  useEffect(() => {
    setMessages(loadMessagesForKey(storageKey, activeHorse, resolvedMetrics));
  }, [storageKey]);

  // Persist valid messages on every update (never save transient network errors)
  useEffect(() => {
    try {
      const toPersist = cleanSavedChatMessages(messages);
      localStorage.setItem(storageKey, JSON.stringify(toPersist));
    } catch {
      // ignore
    }
  }, [storageKey, messages]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = resolvedMetrics
    ? [
        '¿Cómo interpreto estos resultados?',
        '¿Qué ejercicios mejoran su simetría?',
        '¿Qué herraje conviene valorar?',
        '¿Cuándo volver a evaluar su trote?',
      ]
    : [
        '¿Qué ejercicios mejoran la impulsión posterior?',
        '¿Cómo detectar fatiga muscular tras el salto?',
        'Recomendaciones de herraje deportivo',
        'Rutina de calentamiento para dorso frío',
      ];

  const handleResetChat = () => {
    const fresh = getInitialGreeting(activeHorse, resolvedMetrics);
    setMessages(fresh);
    try {
      localStorage.setItem(storageKey, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  };

  const executeSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horse_name: activeHorse?.name || 'Consulta General Equina',
          discipline: activeHorse?.discipline || 'Deporte y Manejo Equino',
          symmetry_report: resolvedMetrics?.symmetry_report || {},
          kinematics_summary: resolvedMetrics?.kinematics_summary || {},
          messages: newMessages
            .filter((m) => !isErrorMessage(m))
            .map((m) => ({ role: m.role, content: m.content })),
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            'No pude conectar con el Agente Veterinario IA en este momento. Verifica tu conexión e intenta nuevamente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;
    const send = () => executeSendMessage(text);
    if (onRequireAuth) {
      onRequireAuth(send, 'Crea una cuenta o inicia sesión para consultar al agente de biomecánica.');
      return;
    }
    send();
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-165px)] min-h-[480px] max-h-[720px] pt-1 gap-2.5 view-enter">
      {/* Top Specialist Header & Context Selector */}
      <div className="rounded-[22px] card-3d p-3.5 flex flex-col gap-2.5 shadow-sm shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-2xl card-3d-racing-green flex items-center justify-center text-white shadow-md">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white dark:border-[#16161B]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-mono text-[14px] font-extrabold text-slate-900 dark:text-white truncate">
                Agente IA Especialista
              </h2>
              <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Veterinaria Deportiva & Biomecánica · 24/7
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetChat}
            title="Nueva consulta"
            className="px-2.5 py-1.5 rounded-xl card-3d-interactive text-slate-600 dark:text-zinc-300 font-mono text-[10px] font-bold flex items-center gap-1 active:scale-95 transition shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Nueva</span>
          </button>
        </div>

        {/* Horizontal Context Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {horses.map((h) => {
            const active = contextKey === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  setContextKey(h.id);
                  onSelectHorse?.(h);
                }}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold whitespace-nowrap transition active:scale-95 ${
                  active
                    ? 'card-3d-racing-green text-white shadow-sm'
                    : 'card-3d-subtle text-slate-600 dark:text-zinc-300'
                }`}
              >
                🐴 {h.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setContextKey('general')}
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 ${
              contextKey === 'general'
                ? 'card-3d-racing-green text-white shadow-sm'
                : 'card-3d-subtle text-slate-600 dark:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Consulta General</span>
          </button>
        </div>

        {/* Active Context Pill */}
        <div className="px-2.5 py-1 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-1.5 text-[10px] font-mono text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate">
            {activeHorse && resolvedMetrics
              ? `Contexto cargado: ${activeHorse.name} · Score ${resolvedMetrics.score}/100 · ${activeHorse.discipline}`
              : activeHorse
              ? `Ejemplar: ${activeHorse.name} (${activeHorse.discipline}) · Consulta preventiva`
              : 'Modo Consulta General Equina (sin análisis adjunto)'}
          </span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 rounded-[22px] card-3d overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 no-scrollbar">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={i}
                className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full card-3d-subtle flex items-center justify-center text-[#0D3F2E] dark:text-emerald-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  data-no-localize={isUser ? 'true' : undefined}
                  className={`max-w-[85%] rounded-[18px] p-3 text-[12px] leading-relaxed shadow-sm ${
                    isUser
                      ? 'card-3d-racing-green text-white rounded-tr-none'
                      : 'bg-slate-50 dark:bg-[#18181D] text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-[#2D2D35] rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {isUser ? msg.content : renderFormattedContent(msg.content)}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 font-mono text-[11px] p-2 bg-slate-100 dark:bg-[#16161B] rounded-xl w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D3F2E] dark:text-emerald-400" />
              <span>Especialista IA elaborando respuesta...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Strip */}
        <div className="px-3 py-2 bg-slate-100/80 dark:bg-[#141418] border-t border-slate-200 dark:border-[#26262A]/60 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSendMessage(q)}
              className="font-mono text-[10px] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white card-3d-interactive px-2.5 py-1 rounded-full whitespace-nowrap active:scale-95 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Bottom Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-2.5 bg-white dark:bg-[#16161B] border-t border-slate-200 dark:border-[#26262A] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeHorse
                ? `Pregunta sobre ${activeHorse.name} o manejo...`
                : 'Haz tu consulta veterinaria o biomecánica...'
            }
            disabled={loading}
            className="flex-1 bg-slate-50 dark:bg-[#0E0E12] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-3 py-2 text-[12px] font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#0D3F2E] shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            aria-label="Enviar consulta"
            className="w-10 h-10 rounded-xl card-3d-racing-green flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition shadow-md shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
