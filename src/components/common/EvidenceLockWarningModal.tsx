import React from 'react';
import { 
  AlertTriangle, 
  Lock, 
  CheckCircle2, 
  X, 
  Camera, 
  Video, 
  ShieldAlert, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export interface EvidenceLockWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit?: () => void;
  title?: string;
  subtitle?: string;
  hasBefore?: boolean;
  hasAfter?: boolean;
  type?: 'repair' | 'order_close' | 'client_photo' | 'validation_block';
  repairTitle?: string;
}

export const EvidenceLockWarningModal: React.FC<EvidenceLockWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
  title,
  subtitle,
  hasBefore = false,
  hasAfter = false,
  type = 'repair',
  repairTitle,
}) => {
  if (!isOpen) return null;

  const defaultTitles = {
    repair: '¡Advertencia! Candado de Evidencias Requeridas',
    order_close: '¡Atención! No es posible cerrar la orden sin evidencias completas',
    client_photo: '¡Atención! Foto Obligatoria para Reportar Falla',
    validation_block: '¡Proceso Bloqueado! Faltan Evidencias Antes / Después',
  };

  const modalTitle = title || defaultTitles[type];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-amber-300 overflow-hidden flex flex-col my-auto">
        
        {/* Encabezado con Alerta */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-100 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                CANDADO DE CALIDAD Y AUDITORÍA OBLIGATORIO
              </div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                {modalTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition cursor-pointer"
            title="Cerrar advertencia"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con Diagnóstico del Candado */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {type === 'client_photo' ? (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Para enviar tu reporte de falla es <strong className="text-rose-700 font-extrabold">estrictamente obligatorio adjuntar por lo menos una fotografía</strong> de la unidad o de la pieza dañada.
              </p>
              
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
                <Camera className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">¿Por qué es indispensable?</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    Permite al Jefe de Taller diagnosticar la magnitud de la avería, despachar la cuadrilla adecuada y alistar las refacciones antes de trasladarse.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {subtitle || (
                  type === 'repair'
                    ? `No se puede guardar ni cerrar la reparación ${repairTitle ? `"${repairTitle}"` : ''} sin haber registrado ambas evidencias.`
                    : 'Para avanzar el proceso o cerrar la orden, el técnico, jefe de taller o gerencia deben contar con el registro de 1 evidencia ANTES y 1 evidencia DESPUÉS en los trabajos realizados.'
                )}
              </p>

              {/* Checklist de Evidencias */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
                <div className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                  Estado de Evidencias Requeridas (2 Obligatorias):
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  
                  {/* Evidencia ANTES */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                    hasBefore 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 shrink-0" />
                      <span>1. Evidencia ANTES</span>
                    </div>
                    {hasBefore ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-extrabold">
                        <CheckCircle2 className="w-4 h-4" /> Subida
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-rose-700 font-extrabold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Falta
                      </span>
                    )}
                  </div>

                  {/* Evidencia DESPUÉS */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                    hasAfter 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 shrink-0" />
                      <span>2. Evidencia DESPUÉS</span>
                    </div>
                    {hasAfter ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-extrabold">
                        <CheckCircle2 className="w-4 h-4" /> Subida
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-rose-700 font-extrabold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Falta
                      </span>
                    )}
                  </div>

                </div>

                <p className="text-[11px] text-slate-500 italic pt-1">
                  🔒 El candado se desbloquea en cuanto subas la foto o video correspondiente a cada fase.
                </p>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            {onConfirmExit && (
              <button
                type="button"
                onClick={onConfirmExit}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Descartar y Salir
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-extrabold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>
                {type === 'client_photo' ? 'Tomar / Subir Fotografía Ahora' : 'Completar Evidencias Requeridas'}
              </span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
