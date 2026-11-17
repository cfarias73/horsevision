import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Check,
  Sparkles,
  Info
} from 'lucide-react';

const DISCIPLINES = [
  'Salto Clásico',
  'Doma Clásica',
  'Polo',
  'Carrera',
  'Endurance',
  'Rodeo',
  'Paseo / Recreativo',
];

const BREEDS = [
  'Silla Francés',
  'Pura Sangre (PSI)',
  'Warmblood Holandés (KWPN)',
  'Cuarto de Milla',
  'Criollo',
  'Pura Raza Española (PRE)',
  'Árabe',
  'Lusitano',
  'Otro',
];

export default function HorseModal({ isOpen, onClose, onSave, horseToEdit = null }) {
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [breed, setBreed] = useState(BREEDS[0]);
  const [discipline, setDiscipline] = useState(DISCIPLINES[0]);
  const [sex, setSex] = useState('Castrado');
  const [age, setAge] = useState('7');
  const [height, setHeight] = useState('1.68');
  const [haras, setHaras] = useState('Haras San Francisco');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    if (horseToEdit) {
      setName(horseToEdit.name || '');
      setBreed(horseToEdit.breed || BREEDS[0]);
      setDiscipline(horseToEdit.discipline || DISCIPLINES[0]);
      setSex(horseToEdit.sex || 'Castrado');
      setAge(String(horseToEdit.age || '7'));
      setHeight(String(horseToEdit.height || '1.68'));
      setHaras(horseToEdit.haras || 'Haras San Francisco');
      setNotes(horseToEdit.notes || '');
      setPhotoUrl(horseToEdit.photoUrl || '');
    } else {
      setName('');
      setBreed(BREEDS[0]);
      setDiscipline(DISCIPLINES[0]);
      setSex('Castrado');
      setAge('7');
      setHeight('1.68');
      setHaras('Haras San Francisco');
      setNotes('');
      setPhotoUrl('');
    }
  }, [horseToEdit, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setPhotoUrl(uploadEvent.target?.result || '');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: horseToEdit?.id || `horse_${Date.now()}`,
      name: name.trim(),
      breed,
      discipline,
      sex,
      age: Number(age) || 5,
      height: Number(height) || 1.65,
      haras: haras.trim(),
      notes: notes.trim(),
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=500&q=80',
      lastScore: horseToEdit?.lastScore || 85,
      lastEvaluated: horseToEdit?.lastEvaluated || 'Reciente',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 view-enter">
      <div className="relative w-full max-w-[430px] max-h-[92dvh] sm:max-h-[850px] bg-[#F8FAFC] dark:bg-[#101014] border border-slate-300 dark:border-[#2D2D35] flex flex-col rounded-t-[32px] sm:rounded-[36px] overflow-hidden shadow-2xl">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-white dark:bg-[#16161B] border-b border-slate-200 dark:border-[#26262A] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-mono text-[15px] font-bold text-slate-900 dark:text-white">
              {horseToEdit ? 'Editar Ejemplar' : 'Registrar Ejemplar'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Ficha biométrica y deportiva
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full card-3d-interactive flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-5 flex flex-col gap-4">
          {/* Photo Uploader / Preview */}
          <div className="flex flex-col items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-28 h-28 rounded-[24px] overflow-hidden card-3d cursor-pointer group shadow-md flex items-center justify-center border-2 border-dashed border-[#0D3F2E]/30 dark:border-emerald-500/40 hover:border-[#0D3F2E] transition-all"
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name || 'Caballo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400 dark:text-zinc-500 gap-1.5 p-2 text-center">
                  <Camera className="w-6 h-6 text-[#0D3F2E] dark:text-[#10B981]" />
                  <span className="font-mono text-[9px] font-bold">Subir Foto</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-mono font-bold transition-opacity">
                Cambiar
              </div>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
              Foto de perfil lateral
            </span>
          </div>

          {/* Name & Haras */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">
                Nombre del Ejemplar *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Dakota"
                className="w-full bg-white dark:bg-[#16161B] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-3 py-2 text-[12px] font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0D3F2E] shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">
                Haras / Cuadra
              </label>
              <input
                type="text"
                value={haras}
                onChange={(e) => setHaras(e.target.value)}
                placeholder="Haras San Francisco"
                className="w-full bg-white dark:bg-[#16161B] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-3 py-2 text-[12px] font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0D3F2E] shadow-sm"
              />
            </div>
          </div>

          {/* Breed & Discipline */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">
                Raza
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full bg-white dark:bg-[#16161B] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-2.5 py-2 text-[11px] font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0D3F2E] shadow-sm"
              >
                {BREEDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">
                Disciplina
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full bg-white dark:bg-[#16161B] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-2.5 py-2 text-[11px] font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0D3F2E] shadow-sm"
              >
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sex, Age, Height */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">
                Sexo
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full bg-white dark:bg-[#16161B] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-2 py-2 text-[11px] font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0D3F2E] shadow-sm"
              >
                <option value="Castrado">Castrado</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">
                Edad (Años)
              </label>
              <input
                type="number"
                min="1"
                max="35"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-white dark:bg-[#16161B] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-2.5 py-2 text-[12px] font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0D3F2E] shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">
                Alzada (m)
              </label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="1.68"
                className="w-full bg-white dark:bg-[#16161B] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-2.5 py-2 text-[12px] font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0D3F2E] shadow-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1 font-semibold">
              Notas de Manejo / Historial (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Sensibilidad en posterior izquierdo, herraje con pestaña lateral..."
              className="w-full bg-white dark:bg-[#16161B] border border-slate-300 dark:border-[#2D2D33] rounded-xl px-3 py-2 text-[11px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0D3F2E] shadow-sm resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 min-h-[50px] rounded-[18px] card-3d-racing-green text-white font-mono text-[14px] font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Check className="w-4 h-4" />
            <span>{horseToEdit ? 'Guardar Cambios' : 'Registrar Ejemplar'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
