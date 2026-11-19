import React, { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAppLanguage } from '../lib/language';
import {
  Send,
  X,
  Bot,
  Loader2,
  Stethoscope,
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

/**
 * VetChatModal:
 * RealHorse "Chat with Our Expert" killer feature:
 * Real-time conversational AI Sports Veterinarian (DeepSeek V3)
 * contextualized with live kinematic and symmetry metrics.
 */
export default function VetChatModal({
  isOpen,
  onClose,
  analysisData,
  horseName = 'Tornado',
  discipline = 'Salto',
  onRequireAuth,
}) {
  const { language } = useAppLanguage();
  const sym = analysisData?.symmetry_report || {};
  const kin = analysisData?.kinematics_summary || {};

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        language === 'en'
          ? `Hello. I have **${horseName}**'s movement analysis loaded (Score: ${sym.global_score ?? 74}/100, Back ROM: ${kin.back_rom_deg ?? 4.4}°). What would you like to ask about?`
          : `Hola. He cargado el análisis biomecánico de **${horseName}** (Score: ${sym.global_score ?? 74}/100, ROM Dorsal: ${kin.back_rom_deg ?? 4.4}°). ¿Qué aspecto deseas consultar?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const quickPrompts = [
    '¿Puedo saltar este fin de semana?',
    '¿Cómo corrijo el dorso rígido?',
    '¿Qué herraje me recomienda para el posterior izquierdo?',
    '¿Cuándo debo volver a evaluar con la app?',
  ];

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
          horse_name: horseName,
          discipline: discipline,
          symmetry_report: sym,
          kinematics_summary: kin,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          language,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al conectar con el servidor.');
      }

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Disculpa, hubo un problema al consultar el expediente. Por favor intenta de nuevo en unos segundos.',
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
      onRequireAuth(send, 'Crea una cuenta o inicia sesión para enviar consultas al asistente.');
      return;
    }
    send();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 view-enter">
      <div className="relative w-full max-w-[430px] h-[92dvh] sm:h-[750px] bg-[#F8FAFC] dark:bg-[#101014] border border-slate-300 dark:border-[#2D2D35] flex flex-col rounded-t-[32px] sm:rounded-[36px] overflow-hidden shadow-2xl">
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-white dark:bg-[#16161B] border-b border-slate-200 dark:border-[#26262A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full card-3d-racing-green flex items-center justify-center text-white shadow-md">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white dark:border-[#16161B]" />
            </div>

            <div>
              <h3 className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">
                Consultor Biomecánico
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                En línea
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full card-3d-interactive flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 no-scrollbar">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={i}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
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
                      : 'card-3d text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-[#2D2D35] rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {isUser ? msg.content : renderFormattedContent(msg.content)}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 font-mono text-[11px] p-2 bg-slate-100 dark:bg-[#16161B]/80 rounded-xl w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D3F2E] dark:text-emerald-400" />
              <span>Veterinario IA analizando cinemática de {horseName}...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-3 py-2 bg-slate-100 dark:bg-[#141418] border-t border-slate-200 dark:border-[#26262A]/60 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
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

        {/* Bottom Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white dark:bg-[#16161B] border-t border-slate-200 dark:border-[#26262A] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Pregúntale al veterinario sobre ${horseName}...`}
            disabled={loading}
            className="flex-1 bg-slate-50 dark:bg-[#0E0E12] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-3 py-2 text-[12px] font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#0D3F2E] shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="w-10 h-10 rounded-xl card-3d-racing-green flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
