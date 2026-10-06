import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Edit3, 
  Camera, 
  FileText, 
  Sparkles, 
  AlertCircle,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { EvidencePhoto, ServiceOrder } from '../../types';
import { useApp } from '../../context/AppContext';

interface GerenciaEvidenceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder;
  evidenceToEdit?: EvidencePhoto | null;
  onSaveEvidence?: (photoId: string, updates: Partial<EvidencePhoto>) => void;
  onSaveTechnicalData?: (updates: {
    initialDiagnosis?: string;
    workPerformedDetail?: string;
    preventiveInspectionNotes?: string;
    chassisSerialNumber?: string;
    engineModelTransmission?: string;
    engineSeriesTransmission?: string;
    odometerReading?: string;
  }) => void;
}

export const GerenciaEvidenceEditModal: React.FC<GerenciaEvidenceEditModalProps> = ({
  isOpen,
  onClose,
  order,
  evidenceToEdit,
  onSaveEvidence,
  onSaveTechnicalData,
}) => {
  const { services } = useApp();

  // Mode: 'evidence' or 'technical_data'
  const isEditingSingleEvidence = Boolean(evidenceToEdit);

  // Single Evidence fields
  const [evidenceTitle, setEvidenceTitle] = useState(evidenceToEdit?.title || '');
  const [evidenceNotes, setEvidenceNotes] = useState(evidenceToEdit?.notes || '');
  const [evidencePhase, setEvidencePhase] = useState<'antes' | 'correctivo_realizado'>(
    evidenceToEdit?.phase === 'antes' ? 'antes' : 'correctivo_realizado'
  );

  // Technical data fields
  const [diagText, setDiagText] = useState(order.initialDiagnosis || order.vehicle.failureDescription || '');
  const [workText, setWorkText] = useState(order.workPerformedDetail || '');
  const [preventiveNotes, setPreventiveNotes] = useState(order.preventiveInspectionNotes || '');
  const [chassisSerial, setChassisSerial] = useState(order.vehicle.chassisSerialNumber || '');
  const [engineModel, setEngineModel] = useState(order.vehicle.engineModelTransmission || '');
  const [engineSeries, setEngineSeries] = useState(order.vehicle.engineSeriesTransmission || '');
  const [odometer, setOdometer] = useState(order.vehicle.odometerReading || '');

  // Synchronize state when evidenceToEdit or order changes
  useEffect(() => {
    if (evidenceToEdit) {
      setEvidenceTitle(evidenceToEdit.title || '');
      setEvidenceNotes(evidenceToEdit.notes || '');
      setEvidencePhase(evidenceToEdit.phase === 'antes' ? 'antes' : 'correctivo_realizado');
    } else {
      setDiagText(order.initialDiagnosis || order.vehicle.failureDescription || '');
      setWorkText(order.workPerformedDetail || '');
      setPreventiveNotes(order.preventiveInspectionNotes || '');
      setChassisSerial(order.vehicle.chassisSerialNumber || '');
      setEngineModel(order.vehicle.engineModelTransmission || '');
      setEngineSeries(order.vehicle.engineSeriesTransmission || '');
      setOdometer(order.vehicle.odometerReading || '');
    }
  }, [evidenceToEdit?.id, order.id, isOpen]);

  if (!isOpen) return null;

  const handleSaveEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceToEdit || !onSaveEvidence) return;

    onSaveEvidence(evidenceToEdit.id, {
      title: evidenceTitle.trim(),
      notes: evidenceNotes.trim() || undefined,
      phase: evidencePhase,
    });
    onClose();
  };

  const handleSaveTechDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveTechnicalData) return;

    onSaveTechnicalData({
      initialDiagnosis: diagText.trim(),
      workPerformedDetail: workText.trim(),
      preventiveInspectionNotes: preventiveNotes.trim(),
      chassisSerialNumber: chassisSerial.trim(),
      engineModelTransmission: engineModel.trim(),
      engineSeriesTransmission: engineSeries.trim(),
      odometerReading: odometer.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col min-w-0">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#040057] text-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold truncate">
                {isEditingSingleEvidence 
                  ? 'Corrección y Edición de Evidencia (Gerencia)' 
                  : 'Edición de Registros y Ficha del Técnico (Gerencia)'}
              </h3>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Corrige faltas de ortografía, redacción técnica y observaciones antes de facturar
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isEditingSingleEvidence && evidenceToEdit ? (
          <form onSubmit={handleSaveEvidenceSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
            
            {/* Foto preview */}
            <div className="bg-slate-900 rounded-xl overflow-hidden p-2 flex justify-center items-center">
              <img
                src={evidenceToEdit.url}
                alt={evidenceToEdit.title}
                className="max-h-56 w-auto object-contain rounded-lg"
              />
            </div>

            {/* Fase */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px]">
                Fase de la Evidencia
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEvidencePhase('antes')}
                  className={`py-2 px-3 rounded-xl font-bold border transition ${
                    evidencePhase === 'antes'
                      ? 'bg-[#040057] text-white border-[#040057]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  1. Antes
                </button>
                <button
                  type="button"
                  onClick={() => setEvidencePhase('correctivo_realizado')}
                  className={`py-2 px-3 rounded-xl font-bold border transition ${
                    evidencePhase === 'correctivo_realizado'
                      ? 'bg-[#040057] text-white border-[#040057]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  2. Correctivo realizado
                </button>
              </div>
            </div>

            {/* Título editable */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Título del Componente / Evidencia *
              </label>
              <input
                type="text"
                required
                value={evidenceTitle}
                onChange={(e) => setEvidenceTitle(e.target.value)}
                placeholder="Corrige ortografía o describe formalmente el componente..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#040057] text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Edita errores ortográficos para que se imprima limpio en el reporte formal y Excel.
              </span>
            </div>

            {/* Notas técnicas editables */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Notas Técnicas y Observaciones de Inspección
              </label>
              <textarea
                rows={3}
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                placeholder="Detalles de torque, condición del componente, mediciones de presión..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#040057] text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Guardar Corrección</span>
              </button>
            </div>

          </form>
        ) : (
          /* Formulario de corrección general de registros del técnico */
          <form onSubmit={handleSaveTechDataSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
              <strong>Modo de Revisión Editorial:</strong> Puedes corregir faltas de ortografía, datos de series mecánicas o complementar la descripción del trabajo realizado antes de emitir la cotización o reporte formal.
            </div>

            {/* Diagnóstico técnico */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Diagnóstico Técnico en Sitio / Taller *
              </label>
              <textarea
                rows={2}
                required
                value={diagText}
                onChange={(e) => setDiagText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg uppercase"
              />
            </div>

            {/* Servicio Realizado Detallado */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700">
                  Servicio Realizado Detallado *
                </label>
                <span className="text-[10px] text-slate-400">Corrige redacción o añade servicios</span>
              </div>

              {/* Selector del Catálogo */}
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="flex items-center justify-between text-[11px] mb-1 font-bold text-[#040057]">
                  <span>⚡ Insertar Servicio desde Catálogo de Olemdo:</span>
                  <span className="text-[10px] text-slate-500 font-normal">Autocompleta texto</span>
                </div>
                <select
                  onChange={(e) => {
                    const srv = services.find(s => s.id === e.target.value);
                    if (srv) {
                      const addition = `CORRECTIVO REALIZADO: ${srv.name}. ${srv.description}`;
                      setWorkText(prev => prev ? `${prev}\n\n• ${addition}` : addition);
                    }
                  }}
                  defaultValue=""
                  className="w-full px-2 py-1 rounded border border-indigo-300 bg-white text-xs text-slate-800"
                >
                  <option value="">-- Seleccionar servicio ofrecido --</option>
                  {services.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name} — ${s.basePrice.toLocaleString('es-MX')} MXN
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                rows={4}
                required
                value={workText}
                onChange={(e) => setWorkText(e.target.value)}
                placeholder="Descripción formal del trabajo realizado, refacciones instaladas y pruebas de funcionamiento..."
                className="w-full px-3 py-2 border rounded-lg uppercase leading-relaxed text-xs"
              />
            </div>

            {/* Falla / Inspección Preventiva */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Falla Inicial / Inspección Preventiva
              </label>
              <input
                type="text"
                value={preventiveNotes}
                onChange={(e) => setPreventiveNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg uppercase"
              />
            </div>

            {/* Series y odómetro */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-[#040057] uppercase text-[11px] block">
                Ficha Mecánica del Equipo
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serie Chasis (VIN):</label>
                  <input
                    type="text"
                    value={chassisSerial}
                    onChange={(e) => setChassisSerial(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono uppercase bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Odómetro / Horómetro:</label>
                  <input
                    type="text"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg uppercase bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modelo Motor/Transmisión:</label>
                  <input
                    type="text"
                    value={engineModel}
                    onChange={(e) => setEngineModel(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg uppercase bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serie Motor/Transmisión:</label>
                  <input
                    type="text"
                    value={engineSeries}
                    onChange={(e) => setEngineSeries(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono uppercase bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Guardar Cambios del Técnico</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
