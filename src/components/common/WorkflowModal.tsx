import React from 'react';
import { X, GitBranch, ArrowRight, CheckCircle2, AlertTriangle, ArrowDown } from 'lucide-react';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#040057] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">Flujo de Trabajo Operativo</h2>
              <p className="text-xs text-blue-200">Arquitectura de Procesos Olemdo Servicio Técnico</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-[#040057]">
            Este diagrama refleja exactamente el flujo integral del sistema (Graph TD), conectando los 4 roles desde el reporte inicial hasta la facturación fiscal.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Paso 1: Solicitud */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
              <div className="flex items-center gap-2 font-bold text-sm text-[#040057] mb-1">
                <span className="w-6 h-6 rounded-full bg-[#040057] text-white text-xs flex items-center justify-center font-bold">A</span>
                Cliente genera Solicitud
              </div>
              <p className="text-xs text-slate-600">
                El cliente registra tipo de atención (Taller / Asistencia / Rescate carretero) y ficha de la unidad (tipo, placas, económico, ubicación y avería).
              </p>
            </div>

            {/* Paso 2: Asignación */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
              <div className="flex items-center gap-2 font-bold text-sm text-[#040057] mb-1">
                <span className="w-6 h-6 rounded-full bg-[#040057] text-white text-xs flex items-center justify-center font-bold">B</span>
                Jefe de Taller Asigna Técnico
              </div>
              <p className="text-xs text-slate-600">
                Operaciones prioriza la solicitud y asigna un técnico calificado según especialidad (diésel, frenos, eléctrico) y disponibilidad geográfica.
              </p>
            </div>

            {/* Paso 3: Inicio y Diagnóstico */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
              <div className="flex items-center gap-2 font-bold text-sm text-[#040057] mb-1">
                <span className="w-6 h-6 rounded-full bg-[#040057] text-white text-xs flex items-center justify-center font-bold">C</span>
                Técnico abre OS e Inicia Trabajo
              </div>
              <p className="text-xs text-slate-600">
                El técnico recibe notificación, registra la hora exacta de inicio de labores y el diagnóstico en sitio o taller.
              </p>
            </div>

            {/* Paso 4: Evidencias e Insumos */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
              <div className="flex items-center gap-2 font-bold text-sm text-[#040057] mb-1">
                <span className="w-6 h-6 rounded-full bg-[#040057] text-white text-xs flex items-center justify-center font-bold">D</span>
                Carga de Evidencias e Insumos
              </div>
              <p className="text-xs text-slate-600">
                Captura obligatoria de fotos y notas de <strong>ANTES</strong>, <strong>DURANTE</strong> y <strong>DESPUÉS</strong>, más refacciones empleadas.
              </p>
            </div>

            {/* Paso 5: Validación Administrativa */}
            <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/50 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-900 mb-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">E</span>
                Área Administrativa Valida Servicio y Evidencias
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-2">
                <div className="p-3 bg-white rounded-lg border border-amber-200">
                  <div className="font-bold text-rose-700 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    No autoriza / Observaciones (F)
                  </div>
                  <p className="text-slate-600">
                    Se regresa la orden al técnico con notas de corrección para aclarar, complementar o sustituir evidencias. El técnico corrige y reenvía (F → D).
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-200">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Autoriza Liberación (G)
                  </div>
                  <p className="text-slate-600">
                    Se autoriza la liberación física de la unidad al técnico y se habilita la generación del Reporte formal con fotos y exportación automática a Excel.
                  </p>
                </div>
              </div>
            </div>

            {/* Paso 6: Cotización */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
              <div className="flex items-center gap-2 font-bold text-sm text-[#040057] mb-1">
                <span className="w-6 h-6 rounded-full bg-[#040057] text-white text-xs flex items-center justify-center font-bold">H</span>
                Gerencia Genera Cotización
              </div>
              <p className="text-xs text-slate-600">
                Presupuesto desglosado: mano de obra (horas) + refacciones utilizadas + viáticos/grúa + IVA 16%.
              </p>
            </div>

            {/* Paso 7: Aprobación del Cliente */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
              <div className="flex items-center gap-2 font-bold text-sm text-[#040057] mb-1">
                <span className="w-6 h-6 rounded-full bg-[#040057] text-white text-xs flex items-center justify-center font-bold">I</span>
                Cliente Recibe y Autoriza
              </div>
              <p className="text-xs text-slate-600">
                El área administrativa del cliente revisa digitalmente los montos y emite su aprobación con firma electrónica.
              </p>
            </div>

            {/* Paso 8: Facturación */}
            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/50 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 mb-1">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs flex items-center justify-center font-bold">J</span>
                Gerencia Realiza Facturación Final
              </div>
              <p className="text-xs text-slate-600">
                Emisión de factura fiscal digital con folio CFDI, desglose tributario y registro contable de cobro.
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#040057] text-white text-sm font-semibold hover:bg-[#070085] transition"
          >
            Cerrar Diagrama
          </button>
        </div>

      </div>
    </div>
  );
};
