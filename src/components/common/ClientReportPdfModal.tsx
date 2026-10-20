import React from 'react';
import { ServiceOrder } from '../../types';
import { 
  Printer, 
  X, 
  Download, 
  Truck, 
  User, 
  Phone, 
  MapPin, 
  Gauge, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface ClientReportPdfModalProps {
  order: ServiceOrder | null;
  onClose: () => void;
}

export const ClientReportPdfModal: React.FC<ClientReportPdfModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const reportDate = new Date(order.createdAt);
  const formattedDate = reportDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isRescue = order.requiresRescue || order.serviceType === 'rescate';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      
      {/* Contenedor del Modal */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Barra superior de herramientas (se oculta al imprimir) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              PDF
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">
                Reporte de Falla • {order.unitNumber || `Unidad ${order.vehicle.economicNumber}`}
              </h3>
              <p className="text-xs text-slate-400">
                Documento de servicio concluido y habilitado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ÁREA IMPRIMIBLE DEL DOCUMENTO */}
        <div className="p-4 sm:p-8 md:p-10 overflow-y-auto bg-slate-50 space-y-6 text-slate-900 text-xs sm:text-sm print:p-0 print:bg-white print:overflow-visible">
          
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
            
            {/* CABECERA MEMBRETADA (SOLO LOGO Y NOMBRE DEL NEGOCIO, SIN SUBTÍTULOS NI FOLIO) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-900">
              <div className="flex items-center gap-3.5">
                <img
                  src="https://appdesignproyectos.com/olmedologo.png"
                  alt="Servicio Técnico Olmedo"
                  className="h-12 sm:h-16 w-auto object-contain"
                />
                <div>
                  <h1 className="text-lg sm:text-2xl font-black text-[#040057] uppercase tracking-tight">
                    SERVICIO TÉCNICO OLMEDO
                  </h1>
                </div>
              </div>

              <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-none border-slate-200 shrink-0">
                <span className="text-[10px] font-black uppercase text-slate-400 block">DOCUMENTO DE SERVICIO:</span>
                <span className="text-sm sm:text-base font-black text-[#040057] block">
                  {order.unitNumber || `Unidad ${order.vehicle.economicNumber}`}
                </span>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Servicio Concluido
                </span>
                {isRescue && (
                  <span className="block mt-1 text-[10px] font-black uppercase text-rose-600">
                    ⚠️ Rescate Carretero
                  </span>
                )}
              </div>
            </div>

            {/* FECHA Y CLIENTE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">EMPRESA / CLIENTE REGISTRADO:</span>
                <span className="font-extrabold text-sm sm:text-base text-[#040057]">
                  {order.clientCompany || order.clientName || 'Flotillas Express S.A. de C.V.'}
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  Contacto: <strong>{order.clientContact || order.operatorName}</strong>
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">FECHA Y HORA DE EMISIÓN:</span>
                <span className="font-bold text-xs sm:text-sm text-slate-800 block capitalize">
                  {formattedDate}
                </span>
                {order.assignedTechnicianName && (
                  <span className="text-xs text-indigo-700 font-bold block mt-0.5">
                    Técnico asignado: {order.assignedTechnicianName}
                  </span>
                )}
              </div>
            </div>

            {/* FICHA TÉCNICA DE LA UNIDAD */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-extrabold text-xs text-[#040057] uppercase flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Datos Técnicos de la Unidad y Odómetro</span>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">No. de Unidad</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {order.unitNumber || `Unidad ${order.vehicle.economicNumber}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Placas</span>
                  <span className="font-extrabold text-slate-900 text-sm">{order.vehicle.plates}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">No. Económico</span>
                  <span className="font-extrabold text-slate-900 text-sm">{order.vehicle.economicNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Kilometraje / Odómetro</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {order.vehicle.odometerReading || order.vehicle.mileage || 'No registrado'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Marca, Modelo y Tipo</span>
                  <span className="font-semibold text-slate-800">
                    {order.vehicle.brandModel || `${order.vehicle.brand || 'Kenworth'} ${order.vehicle.model || 'T680'}`} ({order.vehicle.type?.toUpperCase() || 'TRACTOCAMIÓN'})
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tipo de Servicio Solicitado</span>
                  <span className="font-bold uppercase text-slate-800">
                    {isRescue ? 'Rescate en Ruta / Asistencia Vial' : 'Ingreso a Taller Mecánico'}
                  </span>
                </div>
              </div>
            </div>

            {/* OPERADOR Y UBICACIÓN */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-extrabold text-xs text-[#040057] uppercase flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Operador y Ubicación del Incidente</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Operador al Volante:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {order.operatorName || order.clientContact}
                  </div>
                  {order.operatorPhone && (
                    <div className="text-emerald-700 font-semibold mt-1">
                      Teléfono: {order.operatorPhone}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Ubicación / Referencias del Vehículo:</span>
                  <p className="text-slate-800 font-medium mt-0.5 leading-relaxed">
                    {order.vehicle.location}
                  </p>
                  {order.rescueLocationUrl && (
                    <div className="mt-1 text-[11px] text-indigo-700 font-bold truncate">
                      Enlace GPS: {order.rescueLocationUrl}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FALLA REPORTADA INICIAL */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-extrabold text-xs text-[#040057] uppercase">
                Descripción Detallada de la Falla Reportada por el Cliente
              </div>
              <div className="p-4 text-xs text-slate-900 leading-relaxed font-medium bg-white">
                {order.vehicle.failureDescription}
              </div>
            </div>

            {/* EVIDENCIAS FOTOGRÁFICAS ADJUNTAS */}
            {order.evidences && order.evidences.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-extrabold text-xs text-[#040057] uppercase flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Evidencias Fotográficas Registradas ({order.evidences.length} Fotografías)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Antes y Diagnóstico
                  </span>
                </div>
                
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {order.evidences.map((ev, i) => (
                    <div key={ev.id || i} className="border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1.5">
                      <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-900 border border-slate-200">
                        <img 
                          src={ev.url} 
                          alt={ev.title || `Evidencia ${i + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="text-[10px] font-black text-slate-900 truncate" title={ev.title}>
                        {ev.title || `Evidencia ${i + 1}`}
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-semibold">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 font-bold text-slate-700 uppercase">
                          {ev.phase === 'antes' ? 'Antes' : 'Correctivo'}
                        </span>
                        <span>{new Date(ev.timestamp).toLocaleDateString('es-MX')}</span>
                      </div>
                      {ev.notes && (
                        <p className="text-[9px] text-slate-600 italic line-clamp-2">
                          {ev.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OBSERVACIONES AGREGADAS POR EL CLIENTE */}
            {order.clientObservationsHistory && order.clientObservationsHistory.length > 0 && (
              <div className="border border-amber-200 bg-amber-50/50 rounded-xl overflow-hidden">
                <div className="bg-amber-100/70 px-4 py-2 border-b border-amber-200 font-extrabold text-xs text-amber-950 uppercase">
                  Historial de Observaciones Adicionales Registradas por el Cliente ({order.clientObservationsHistory.length})
                </div>
                <div className="p-4 space-y-2.5">
                  {order.clientObservationsHistory.map((obs) => (
                    <div key={obs.id} className="bg-white p-3 rounded-xl border border-amber-200 text-xs text-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-slate-700">{obs.author}</span>
                        <span>{new Date(obs.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="font-medium text-slate-900">{obs.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PIE DE PÁGINA: SOLO NOMBRE DEL NEGOCIO (SIN LOGO) */}
            <div className="pt-8 border-t border-slate-300 text-center">
              <span className="text-sm font-black text-[#040057] tracking-wider uppercase">
                SERVICIO TÉCNICO OLMEDO
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
