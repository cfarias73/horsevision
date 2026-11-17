import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Dumbbell,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  RefreshCw,
  Clock,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import VetChatModal from './VetChatModal';

/**
 * Generates an executive, publication-grade Sports Veterinary Biomechanical Certificate in PDF.
 */
function generateOfficialPdf(report, analysisData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const sym = analysisData?.symmetry_report || {};
  const kin = analysisData?.kinematics_summary || {};
  const limbs = analysisData?.limbs || {};
  const meta = report.metadata || {};

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // --- PAGE 1: DIAGNÓSTICO CLÍNICO BIOMECÁNICO ---
  // Header background banner (British Racing Green)
  doc.setFillColor(13, 63, 46);
  doc.rect(0, 0, pageWidth, 36, 'F');
  
  // Emerald brand accent line
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 36, pageWidth, 2, 'F');

  // Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('HORSEVISION™ BIOMECHANICS', margin, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(235, 245, 240);
  doc.text('INFORME CLÍNICO DE CINEMÁTICA Y REHABILITACIÓN ECUESTRE', margin, 23);
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text('MOTOR IA: DEEPSEEK SPORTS VETERINARY SPECIALIST (V3) • AP-10K SIMCC', margin, 29);

  // Meta box (Right side)
  doc.setFontSize(8);
  doc.setTextColor(220, 235, 228);
  doc.text(`Fecha: ${meta.evaluation_timestamp || new Date().toLocaleDateString()}`, pageWidth - margin, 16, { align: 'right' });
  doc.text(`ID Evaluación: HV-${Math.floor(100000 + Math.random() * 900000)}`, pageWidth - margin, 22, { align: 'right' });
  doc.text('Certificado de Análisis 2D', pageWidth - margin, 28, { align: 'right' });

  let y = 46;

  // Patient Info & Score Box
  doc.setFillColor(245, 248, 246);
  doc.setDrawColor(215, 228, 220);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 63, 46);
  doc.text(`EJEMPLAR: ${meta.horse_name || 'Equino'}`, margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 75, 70);
  doc.text(`Disciplina: ${meta.discipline || 'Salto / Deporte'}`, margin + 4, y + 14);
  doc.text(`Cadencia: ${kin.cadence_spm || 0} pasos/min   |   Zancada: ${kin.stride_length_m || 0} m   |   Dorso ROM: ${kin.back_rom_deg || kin.rom_deg || 0}°`, margin + 4, y + 20);

  // Score badge inside box
  const score = sym.global_score ?? meta.global_score ?? 0;
  doc.setFillColor(score >= 80 ? 16 : score >= 60 ? 217 : 220, score >= 80 ? 185 : score >= 60 ? 119 : 38, score >= 80 ? 129 : score >= 60 ? 6 : 38);
  doc.roundedRect(pageWidth - margin - 38, y + 3, 34, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('SCORE SIMETRÍA', pageWidth - margin - 21, y + 9, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`${score} / 100`, pageWidth - margin - 21, y + 17, { align: 'center' });

  y += 30;

  // Diagnóstico Clínico Principal
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(185, 28, 28);
  doc.text(`DIAGNÓSTICO FUNCIONAL: ${report.clinical_grade || 'Evaluación en Curso'}`, margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 70);
  const summaryLines = doc.splitTextToSize(report.executive_summary || 'Sin resumen disponible.', contentWidth - 8);
  doc.text(summaryLines, margin + 4, y + 13);

  y += 30;

  // Desglose Biomecánico Sección
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 63, 46);
  doc.text('1. DESGLOSE BIOMECÁNICO CUANTITATIVO', margin, y);
  y += 5;

  const breakdowns = [
    { title: 'Cabeza y Nuca (Head Nod - Impacto vs Impulso):', text: report.biomechanical_breakdown?.head_and_neck },
    { title: 'Pelvis y Grupa (Pelvic Hike/Drop - Propulsión Posterior):', text: report.biomechanical_breakdown?.pelvis_and_propulsion },
    { title: 'Línea Dorsal Toracolumbar (Rango de Movimiento ROM Dorsal):', text: report.biomechanical_breakdown?.thoracolumbar_back },
    { title: 'Dinámica de Extremidades (Fase de Apoyo vs Vuelo):', text: report.biomechanical_breakdown?.limb_dynamics },
  ];

  breakdowns.forEach((item) => {
    if (y > 260) return;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(13, 63, 46);
    doc.text(item.title, margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(item.text || 'Sin anomalías registradas en este segmento anatómico.', contentWidth - 6);
    doc.text(lines.slice(0, 2), margin + 3, y + 11);
    y += 22;
  });

  // Footer Page 1
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 150);
  doc.text('HorseVision AI Engine • Validación Cinemática EVJ 1mm • Página 1 de 2', margin, pageHeight - 8);

  // --- PAGE 2: PLAN DE REHABILITACIÓN Y EJERCICIOS ---
  doc.addPage();

  // Header background banner Page 2
  doc.setFillColor(13, 63, 46);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 24, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('PLAN DE REHABILITACIÓN & EJERCICIOS CORRECTIVOS', margin, 14);
  doc.setFontSize(8);
  doc.setTextColor(200, 230, 215);
  doc.text(`PACIENTE: ${meta.horse_name || 'Equino'}   |   OBJETIVO: ${report.rehabilitation_plan?.target_goal || 'Reacondicionamiento'}`, margin, 20);

  y = 32;

  // Fases de Rehabilitación
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(13, 63, 46);
  doc.text('2. FASES TEMPORALES DE PROGRESIÓN', margin, y);
  y += 5;

  const phases = report.rehabilitation_plan?.weekly_phases || [];
  phases.forEach((p) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(13, 63, 46);
    doc.text(`${p.phase}: ${p.focus}`, margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const rLines = doc.splitTextToSize(p.routine || '', contentWidth - 6);
    doc.text(rLines.slice(0, 2), margin + 3, y + 11);
    y += 21;
  });

  y += 2;

  // Ejercicios Correctivos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(13, 63, 46);
  doc.text('3. EJERCICIOS CORRECTIVOS PRESCRITOS', margin, y);
  y += 5;

  const exercises = report.rehabilitation_plan?.corrective_exercises || [];
  exercises.slice(0, 3).forEach((ex, idx) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(13, 63, 46);
    doc.text(`${idx + 1}. ${ex.name} (${ex.category || 'Técnico'})`, margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Frecuencia: ${ex.frequency || 'N/A'}   |   Duración: ${ex.duration || 'N/A'}`, margin + 3, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const instLines = doc.splitTextToSize(ex.instructions || '', contentWidth - 6);
    doc.text(instLines.slice(0, 2), margin + 3, y + 15);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`Beneficio Biomecánico: ${ex.biomechanical_benefit || ''}`, margin + 3, y + 23);

    y += 29;
  });

  y += 2;

  // Herraje y Observaciones Veterinarias
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(161, 98, 7);
  doc.text('4. RECOMENDACIONES DE HERRAJE, BALANCE PODAL & SEGUIMIENTO', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 63, 18);
  const farLines = doc.splitTextToSize(`Herraje: ${report.farriery_and_vet_notes || 'Mantener balance simétrico mediolateral.'}`, contentWidth - 6);
  doc.text(farLines.slice(0, 2), margin + 3, y + 11);

  const followLines = doc.splitTextToSize(`Control: ${report.followup_recommendation || 'Evaluación en 14 días.'}`, contentWidth - 6);
  doc.text(followLines.slice(0, 2), margin + 3, y + 18);

  // Footer Page 2
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 150);
  doc.text('HorseVision AI Engine • Validación Cinemática EVJ 1mm • Página 2 de 2', margin, pageHeight - 8);

  doc.save(`HorseVision_Reporte_Clinico_${(meta.horse_name || 'Equino').replace(/\s+/g, '_')}.pdf`);
}

/**
 * AI Clinical Report & Rehabilitation Plan Card (DeepSeek V3 Powered)
 */
export default function AIClinicalReport({ analysisData }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('resumen');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Custom horse details input
  const [horseName, setHorseName] = useState('Dakota');
  const [discipline, setDiscipline] = useState('Salto Clásico');
  const [notes, setNotes] = useState('');

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horse_name: horseName,
          discipline: discipline,
          notes: notes,
          symmetry_report: analysisData?.symmetry_report || {},
          kinematics_summary: analysisData?.kinematics_summary || {},
          limbs: analysisData?.limbs || analysisData?.limb_kinematics || {},
          analysis_data: analysisData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en servidor IA (HTTP ${response.status})`);
      }

      const data = await response.json();
      setReport(data);
      setIsFormOpen(false);
    } catch (err) {
      setError(err?.message || 'Error al generar informe con DeepSeek V3');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    generateOfficialPdf(report, analysisData);
  };

  return (
    <div className="rounded-[24px] card-3d p-4 flex flex-col gap-4 shadow-md">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#26262A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full card-3d-racing-green flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">
              Informe Biomecánico
            </h3>
          </div>
        </div>

        {report && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-xl card-3d-interactive flex items-center gap-1.5 transition shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Editar
          </button>
        )}
      </div>

      {/* Configuration Form (Collapsible or Initial State) */}
      {(!report || isFormOpen) && (
        <div className="rounded-[20px] card-3d-recessed p-4 flex flex-col gap-3 shadow-inner">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">Ejemplar</label>
              <input
                type="text"
                value={horseName}
                onChange={(e) => setHorseName(e.target.value)}
                placeholder="Dakota"
                className="w-full bg-white dark:bg-[#121215] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-2.5 py-2 text-[12px] font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#0D3F2E] shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">Disciplina</label>
              <input
                type="text"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder="Salto, Doma..."
                className="w-full bg-white dark:bg-[#121215] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-2.5 py-2 text-[12px] font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#0D3F2E] shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">Notas (Opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones de manejo o trote"
              className="w-full bg-white dark:bg-[#121215] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-2.5 py-2 text-[11px] text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#0D3F2E] shadow-sm"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 p-2.5 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full mt-1 card-3d-racing-green min-h-[48px] text-white font-mono text-[12px] font-extrabold py-2.5 px-4 rounded-[16px] shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analizando Cinemática...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{report ? 'Regenerar Informe' : 'Generar Informe Biomecánico'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Generated Report Display */}
      {report && (
        <div className="flex flex-col gap-3">
          {/* Diagnostic Badge Card */}
          <div className="rounded-[20px] card-3d p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[#0D3F2E] dark:text-emerald-400 tracking-wider">
                  Diagnóstico Funcional
                </span>
                <h4 className="font-mono text-[13px] font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {report.clinical_grade}
                </h4>
              </div>
              <span
                className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 border shadow-sm ${
                  report.risk_level === 'Bajo'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : report.risk_level === 'Moderado'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
                }`}
              >
                Riesgo: {report.risk_level}
              </span>
            </div>

            <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed pt-2 border-t border-slate-200 dark:border-[#26262A]">
              {report.executive_summary}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1.5 card-3d-recessed rounded-[16px] shadow-inner">
            {[
              { id: 'resumen', label: 'Cinemática', icon: Layers },
              { id: 'plan', label: 'Fases', icon: Calendar },
              { id: 'ejercicios', label: 'Ejercicios', icon: Dumbbell },
              { id: 'veterinario', label: 'Herraje', icon: Stethoscope },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-mono text-[10px] font-bold transition-all ${
                    active
                      ? 'card-3d-racing-green text-white scale-[1.02]'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.96]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Desglose Cinemático */}
          {activeTab === 'resumen' && (
            <div className="flex flex-col gap-2.5">
              {report.biomechanical_breakdown && (
                <>
                  <div className="rounded-[18px] card-3d-interactive p-3.5 shadow-sm">
                    <p className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                      Cabeza y Nuca
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                      {report.biomechanical_breakdown.head_and_neck}
                    </p>
                  </div>

                  <div className="rounded-[18px] card-3d-interactive p-3.5 shadow-sm">
                    <p className="font-mono text-[11px] font-bold text-pink-600 dark:text-pink-400 mb-1">
                      Pelvis y Propulsión
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                      {report.biomechanical_breakdown.pelvis_and_propulsion}
                    </p>
                  </div>

                  <div className="rounded-[18px] card-3d-interactive p-3.5 shadow-sm">
                    <p className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      Dorso Toracolumbar
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                      {report.biomechanical_breakdown.thoracolumbar_back}
                    </p>
                  </div>

                  <div className="rounded-[18px] card-3d-interactive p-3.5 shadow-sm">
                    <p className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-1">
                      Dinámica de Extremidades
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                      {report.biomechanical_breakdown.limb_dynamics}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Fases */}
          {activeTab === 'plan' && (
            <div className="flex flex-col gap-2.5">
              <div className="rounded-[18px] card-3d-recessed border border-emerald-900/30 p-3 shadow-inner">
                <p className="font-mono text-[10px] text-[#0D3F2E] dark:text-emerald-400 font-bold uppercase">
                  Objetivo
                </p>
                <p className="text-[11px] text-slate-800 dark:text-zinc-200 mt-0.5 font-medium">
                  {report.rehabilitation_plan?.target_goal}
                </p>
              </div>

              {(report.rehabilitation_plan?.weekly_phases || []).map((phase, idx) => (
                <div key={idx} className="rounded-[18px] card-3d-interactive p-3.5 flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                      {phase.phase}
                    </span>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full card-3d-subtle text-[#0D3F2E] dark:text-emerald-400 border border-[#0D3F2E]/20 dark:border-emerald-600/30 font-semibold">
                      Enfoque
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200">
                    {phase.focus}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed pt-1.5 border-t border-slate-200 dark:border-[#26262A]">
                    {phase.routine}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Ejercicios Correctivos */}
          {activeTab === 'ejercicios' && (
            <div className="flex flex-col gap-2.5">
              {(report.rehabilitation_plan?.corrective_exercises || []).map((ex, idx) => (
                <div key={idx} className="rounded-[18px] card-3d-interactive p-3.5 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h5 className="font-mono text-[12px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full card-3d-racing-green font-mono text-[10px] flex items-center justify-center text-white">
                        {idx + 1}
                      </span>
                      {ex.name}
                    </h5>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full card-3d-subtle text-slate-600 dark:text-zinc-300 font-semibold">
                      {ex.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600 dark:text-zinc-400 card-3d-recessed px-3 py-1.5 rounded-xl">
                    <span>⏱ Frecuencia: <strong className="text-slate-900 dark:text-white">{ex.frequency}</strong></span>
                    <span>⌛ Duración: <strong className="text-slate-900 dark:text-white">{ex.duration}</strong></span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold">Instrucciones de ejecución:</span>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                      {ex.instructions}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-[#26262A] bg-emerald-50 dark:bg-emerald-950/20 -mx-3.5 -mb-3.5 p-3 rounded-b-[18px]">
                    <span className="block text-[10px] text-[#0D3F2E] dark:text-emerald-400 font-bold">Beneficio Biomecánico:</span>
                    <p className="text-[10px] text-slate-600 dark:text-zinc-400 italic">
                      {ex.biomechanical_benefit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Herraje y Recomendaciones */}
          {activeTab === 'veterinario' && (
            <div className="flex flex-col gap-2.5">
              <div className="rounded-[18px] card-3d-interactive border-amber-300 dark:border-amber-900/40 p-3.5 flex flex-col gap-1.5 shadow-sm">
                <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Herraje y Balance Podal
                </span>
                <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                  {report.farriery_and_vet_notes}
                </p>
              </div>

              <div className="rounded-[18px] card-3d-interactive border-blue-300 dark:border-blue-900/40 p-3.5 flex flex-col gap-1.5 shadow-sm">
                <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Próximo Control
                </span>
                <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                  {report.followup_recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons: Chat & Download PDF */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-full card-3d-interactive border border-emerald-500/30 hover:border-emerald-500 text-slate-900 dark:text-white font-mono text-[12px] font-bold py-3 px-4 rounded-[18px] shadow-sm flex items-center justify-center gap-2 group transition active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4 text-[#0D3F2E] dark:text-[#10B981] group-hover:scale-110 transition" />
              <span>Consultor Biomecánico IA</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="w-full card-3d-racing-green text-white font-mono text-[12px] font-bold py-3 px-4 rounded-[18px] shadow-lg flex items-center justify-center gap-2 group transition active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-white group-hover:scale-110 transition" />
              <span>Descargar Informe PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* RealHorse-style Instant Vet Chat Modal */}
      <VetChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        analysisData={analysisData}
        horseName={horseName}
        discipline={discipline}
      />
    </div>
  );
}
