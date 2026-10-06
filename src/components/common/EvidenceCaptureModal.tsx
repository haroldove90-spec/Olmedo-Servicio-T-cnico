import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles, 
  Lock,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { EvidencePhoto, ServiceOrder } from '../../types';
import { compressImageFile } from '../../utils/imageUtils';

interface DraftEvidenceCard {
  id: string;
  url: string;
  title: string;
  notes: string;
  isCapturing?: boolean;
}

interface EvidenceCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder;
  initialPhase?: 'antes' | 'correctivo_realizado';
  onSave: (photos: Omit<EvidencePhoto, 'id' | 'timestamp'>[]) => void;
}

const PRESET_TITLES = {
  antes: [
    'Falla inicial y componentes dañados',
    'Desgaste severo en balatas / zapatas',
    'Tambor con surcos y sobrecalentamiento',
    'Fuga de aire en mangueras / conexiones',
    'Birlos sin tuercas de seguridad UNEMON',
    'Lectura de escáner con código de avería',
  ],
  correctivo_realizado: [
    'Instalación y montaje de refacción nueva',
    'Torqueo de tuercas UNEMON a especificación',
    'Tambor rectificado e instalado en posición',
    'Calibración y ajuste de matracas de freno',
    'Prueba de estanqueidad a 120 PSI de presión',
    'Escaneo final con parámetros restablecidos en cero',
  ],
};

export const EvidenceCaptureModal: React.FC<EvidenceCaptureModalProps> = ({
  isOpen,
  onClose,
  order,
  initialPhase = 'antes',
  onSave,
}) => {
  // Count existing evidences in "1. Antes"
  const existingAntesCount = order.evidences.filter(e => e.phase === 'antes').length;

  // Selected phase
  const [selectedPhase, setSelectedPhase] = useState<'antes' | 'correctivo_realizado'>(() => {
    if (initialPhase === 'correctivo_realizado' && existingAntesCount > 0) {
      return 'correctivo_realizado';
    }
    return 'antes';
  });

  // Cards draft (1 to 15 cards)
  const [cards, setCards] = useState<DraftEvidenceCard[]>([
    {
      id: `draft-${Date.now()}-0`,
      url: '',
      title: '',
      notes: '',
    },
  ]);

  const [activeCardIndexForUpload, setActiveCardIndexForUpload] = useState<number>(0);
  const [lockWarning, setLockWarning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Hidden file input refs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle phase change with progression locking rule
  const handleSelectPhase = (phase: 'antes' | 'correctivo_realizado') => {
    if (phase === 'correctivo_realizado') {
      // Must have at least 1 evidence in '1. Antes' in the order or pending to save
      const hasCardReadyInAntes = cards.some(c => c.url.trim().length > 0 && c.title.trim().length > 0);
      
      if (existingAntesCount === 0 && !hasCardReadyInAntes) {
        setLockWarning(
          '⚠️ Paso Bloqueado: Debes cargar y registrar al menos 1 evidencia fotográfica en "1. Antes" antes de poder avanzar a "2. Correctivo realizado".'
        );
        return;
      }

      // If user filled cards in Antes and clicks step 2, save them first
      if (selectedPhase === 'antes' && hasCardReadyInAntes) {
        const validAntesCards = cards.filter(c => c.url.trim().length > 0 && c.title.trim().length > 0);
        const batchToSave: Omit<EvidencePhoto, 'id' | 'timestamp'>[] = validAntesCards.map(c => ({
          phase: 'antes',
          url: c.url,
          title: c.title.trim(),
          notes: c.notes.trim() || undefined,
        }));
        onSave(batchToSave);
        // Reset draft for step 2
        setCards([
          {
            id: `draft-${Date.now()}-0`,
            url: '',
            title: '',
            notes: '',
          },
        ]);
      }
    }
    setLockWarning(null);
    setFormError(null);
    setSelectedPhase(phase);
  };

  // Dedicated button to save step 1 and advance to step 2 immediately
  const handleSaveAndAdvanceToStep2 = () => {
    const validCards = cards.filter(c => c.url.trim().length > 0 && c.title.trim().length > 0);
    
    if (existingAntesCount === 0 && validCards.length === 0) {
      setFormError('⚠️ Debes tomar o subir al menos 1 fotografía con su título en "1. Antes" antes de poder avanzar a "2. Correctivo realizado".');
      return;
    }

    if (validCards.length > 0) {
      const batchToSave: Omit<EvidencePhoto, 'id' | 'timestamp'>[] = validCards.map(c => ({
        phase: 'antes',
        url: c.url,
        title: c.title.trim(),
        notes: c.notes.trim() || undefined,
      }));
      onSave(batchToSave);
    }

    // Reset draft for step 2
    setCards([
      {
        id: `draft-${Date.now()}-0`,
        url: '',
        title: '',
        notes: '',
      },
    ]);
    setSelectedPhase('correctivo_realizado');
    setLockWarning(null);
    setFormError(null);
  };

  // Add a new evidence card (up to 15)
  const handleAddCard = () => {
    if (cards.length >= 15) {
      alert('Has alcanzado el límite máximo de 15 evidencias por carga.');
      return;
    }
    const newCard: DraftEvidenceCard = {
      id: `draft-${Date.now()}-${cards.length}`,
      url: '',
      title: '',
      notes: '',
    };
    setCards([...cards, newCard]);
  };

  // Remove a card
  const handleRemoveCard = (index: number) => {
    if (cards.length <= 1) {
      // Reset only
      setCards([{ id: `draft-${Date.now()}`, url: '', title: '', notes: '' }]);
      return;
    }
    setCards(cards.filter((_, idx) => idx !== index));
  };

  // Update card fields
  const handleUpdateCard = (index: number, field: keyof DraftEvidenceCard, value: string) => {
    setCards(prev => prev.map((c, idx) => idx === index ? { ...c, [field]: value } : c));
  };

  // Trigger camera for a specific card
  const triggerCamera = (index: number) => {
    setActiveCardIndexForUpload(index);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  // Trigger file picker for a specific card
  const triggerGallery = (index: number) => {
    setActiveCardIndexForUpload(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle selected image file from camera or picker
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      // If single file, assign to active card
      if (files.length === 1) {
        const compressed = await compressImageFile(files[0]);
        setCards(prev => prev.map((c, idx) => {
          if (idx === activeCardIndexForUpload) {
            return {
              ...c,
              url: compressed,
              title: c.title || (selectedPhase === 'antes' ? 'Falla detectada en sitio' : 'Correctivo concluido'),
            };
          }
          return c;
        }));
      } else {
        // Multiple files selected from gallery: populate multiple cards up to 15
        const newCardsList = [...cards];
        for (let i = 0; i < files.length && newCardsList.length <= 15; i++) {
          const file = files[i];
          const compressed = await compressImageFile(file);

          const targetIndex = activeCardIndexForUpload + i;
          if (targetIndex < newCardsList.length) {
            newCardsList[targetIndex] = {
              ...newCardsList[targetIndex],
              url: compressed,
              title: newCardsList[targetIndex].title || `Evidencia ${targetIndex + 1}`,
            };
          } else if (newCardsList.length < 15) {
            newCardsList.push({
              id: `draft-${Date.now()}-${newCardsList.length}`,
              url: compressed,
              title: `Evidencia ${newCardsList.length + 1}`,
              notes: '',
            });
          }
        }
        setCards(newCardsList);
      }
      setFormError(null);
    } catch (err: any) {
      alert(`Error al procesar la fotografía: ${err.message || 'Intenta de nuevo'}`);
    }
  };

  // Save all completed cards
  const handleSubmitAll = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if at least 1 card has photo
    const validCards = cards.filter(c => c.url.trim().length > 0 && c.title.trim().length > 0);

    if (validCards.length === 0) {
      setFormError('Debes tomar o subir al menos 1 fotografía con su título antes de guardar.');
      return;
    }

    // Check if any card has photo but missing title
    const missingTitle = cards.some(c => c.url.trim().length > 0 && c.title.trim().length === 0);
    if (missingTitle) {
      setFormError('Por favor asigna un título a todas las fotografías cargadas.');
      return;
    }

    // Prepare batch
    const batchToSave: Omit<EvidencePhoto, 'id' | 'timestamp'>[] = validCards.map(c => ({
      phase: selectedPhase,
      url: c.url,
      title: c.title.trim(),
      notes: c.notes.trim() || undefined,
    }));

    onSave(batchToSave);
    onClose();
  };

  const isStep2Locked = existingAntesCount === 0 && selectedPhase === 'antes';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      {/* Hidden file inputs */}
      {/* Camera capture triggers directly on mobile devices */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Regular gallery picker */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col min-w-0">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#040057] text-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold truncate">
                Carga de Evidencia Fotográfica ({cards.length} de 15)
              </h3>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Orden {order.folio} • {order.vehicle.type.toUpperCase()} ({order.vehicle.plates})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmitAll} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* FASE DE LA EVIDENCIA (2 PASOS SOLICITADOS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Fase de la Evidencia *
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {existingAntesCount > 0 
                  ? `✓ ${existingAntesCount} fotos guardadas en '1. Antes'` 
                  : '⚠️ Paso 1 requerido primero'}
              </span>
            </div>

            {/* Selector de 2 Botones: 1. Antes / 2. Correctivo realizado */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Botón 1. Antes */}
              <button
                type="button"
                onClick={() => handleSelectPhase('antes')}
                className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
                  selectedPhase === 'antes'
                    ? 'bg-[#040057] text-white border-[#040057] shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>1. Antes</span>
                </div>
                <span className="text-[10px] font-medium opacity-85">
                  ({order.evidences.filter(e => e.phase === 'antes').length} fotos)
                </span>
              </button>

              {/* Botón 2. Correctivo realizado */}
              <button
                type="button"
                onClick={() => handleSelectPhase('correctivo_realizado')}
                className={`relative py-3 px-3 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
                  selectedPhase === 'correctivo_realizado'
                    ? 'bg-[#040057] text-white border-[#040057] shadow-md'
                    : isStep2Locked
                    ? 'bg-slate-100 text-slate-400 border-slate-200 hover:border-amber-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isStep2Locked ? (
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  )}
                  <span>2. Correctivo realizado</span>
                </div>
                <span className="text-[10px] font-medium opacity-85">
                  ({order.evidences.filter(e => e.phase === 'correctivo_realizado' || e.phase === 'durante' || e.phase === 'despues').length} fotos)
                </span>
              </button>

            </div>

            {/* Aviso de bloqueo si no hay fotos en Antes */}
            {lockWarning && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{lockWarning}</span>
              </div>
            )}
          </div>

          {/* LISTADO DE TARJETAS DE EVIDENCIA (DE 1 HASTA 15) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#040057]" />
                  <span>Tarjetas de Evidencia</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#040057] text-[11px] font-bold">
                    {cards.length} / 15
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Toma foto o sube desde el dispositivo. Puedes agregar hasta 15 tarjetas con el botón (+).
                </p>
              </div>

              {cards.length < 15 && (
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#040057] border border-blue-200 hover:bg-blue-100 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Tarjeta (+)</span>
                </button>
              )}
            </div>

            {/* Tarjetas individuales */}
            <div className="space-y-4">
              {cards.map((card, idx) => (
                <div
                  key={card.id}
                  className="p-3.5 sm:p-4 rounded-xl border-2 border-slate-200 bg-slate-50/70 hover:border-indigo-200 transition space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-[#040057] text-xs uppercase flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#040057] text-white flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      Evidencia #{idx + 1} ({selectedPhase === 'antes' ? '1. Antes' : '2. Correctivo'})
                    </span>

                    {cards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Eliminar esta tarjeta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar</span>
                      </button>
                    )}
                  </div>

                  {/* Captura de Imagen: CÁMARA O SUBIR (CERO INPUT DE URL) */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      Fotografía del Componente *
                    </label>

                    {card.url ? (
                      /* Preview de la foto ya tomada */
                      <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-black/5 group">
                        <img
                          src={card.url}
                          alt={`Evidencia ${idx + 1}`}
                          className="w-full h-44 sm:h-52 object-contain bg-slate-900 rounded-xl"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => triggerCamera(idx)}
                            className="px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer backdrop-blur-xs"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Retomar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerGallery(idx)}
                            className="px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer backdrop-blur-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Cambiar</span>
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Foto lista para enviar</span>
                        </div>
                      </div>
                    ) : (
                      /* Botones táctiles para tomar foto con cámara o subir archivo */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 sm:p-4 bg-white rounded-xl border-2 border-dashed border-slate-300 text-center">
                        
                        {/* Botón 1: Cámara Móvil */}
                        <button
                          type="button"
                          onClick={() => triggerCamera(idx)}
                          className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#040057] font-bold border border-blue-200 transition cursor-pointer active:scale-98 gap-1.5"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#040057] text-white flex items-center justify-center shadow-xs">
                            <Camera className="w-5 h-5 text-emerald-400" />
                          </div>
                          <span className="text-xs sm:text-sm">Tomar Foto con Cámara</span>
                          <span className="text-[10px] text-slate-500 font-normal">Abre la cámara de tu celular</span>
                        </button>

                        {/* Botón 2: Subir Archivo / Galería */}
                        <button
                          type="button"
                          onClick={() => triggerGallery(idx)}
                          className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 transition cursor-pointer active:scale-98 gap-1.5"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs sm:text-sm">Subir desde Galería</span>
                          <span className="text-[10px] text-slate-500 font-normal">JPG, PNG o archivos de imagen</span>
                        </button>

                      </div>
                    )}
                  </div>

                  {/* Título de la Foto / Componente */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Título de la Foto / Componente *
                    </label>
                    <input
                      type="text"
                      required
                      value={card.title}
                      onChange={(e) => handleUpdateCard(idx, 'title', e.target.value)}
                      placeholder="Ej. Desgaste en balatas / Prueba de presión a 120 PSI"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#040057]"
                    />

                    {/* Sugerencias rápidas */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sugerencias:</span>
                      {PRESET_TITLES[selectedPhase].slice(0, 3).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleUpdateCard(idx, 'title', preset)}
                          className="px-2 py-0.5 rounded-full bg-white border border-slate-200 hover:border-[#040057] text-[10px] text-slate-600 transition"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notas Técnicas de Observación */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Notas Técnicas de Observación (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={card.notes}
                      onChange={(e) => handleUpdateCard(idx, 'notes', e.target.value)}
                      placeholder="Medición de torque, número de serie de repuesto o especificación técnica..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#040057]"
                    />
                  </div>

                </div>
              ))}
            </div>

            {/* Botón para agregar otra tarjeta (hasta 15) */}
            {cards.length < 15 && (
              <button
                type="button"
                onClick={handleAddCard}
                className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-300 hover:border-[#040057] bg-indigo-50/50 hover:bg-indigo-50 text-[#040057] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#040057]" />
                <span>Agregar Otra Tarjeta de Evidencia ({cards.length} de 15)</span>
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <span className="text-xs text-slate-500 font-medium">
              Fase activa: <strong className="uppercase text-[#040057]">{selectedPhase === 'antes' ? '1. Antes' : '2. Correctivo realizado'}</strong>
            </span>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer text-xs"
              >
                Cancelar
              </button>
              
              {selectedPhase === 'antes' ? (
                <>
                  <button
                    type="submit"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <span>Guardar solo "1. Antes"</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndAdvanceToStep2}
                    className="px-4 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <span>Guardar y Avanzar a: 2. Correctivo realizado</span>
                    <span className="text-emerald-400 font-bold">➔</span>
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Guardar {cards.filter(c => c.url).length || 1} Evidencia(s) de Correctivo</span>
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
