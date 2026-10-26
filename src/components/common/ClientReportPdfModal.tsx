import React from 'react';
import { ServiceOrder } from '../../types';
import { 
  Printer, 
  X, 
  Truck, 
  User, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import { exportOrdersToExcel } from '../../utils/excelExport';

interface ClientReportPdfModalProps {
  order: ServiceOrder | null;
  onClose: () => void;
}

export const ClientReportPdfModal: React.FC<ClientReportPdfModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportOrdersToExcel([order], {
      filenamePrefix: `Reporte_Falla_${order.folio || order.unitNumber || 'Servicio'}`,
      sheetName: 'Reporte de Falla',
      businessName: 'Servicio Técnico Olmedo'
    });
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

  // Helper para extraer nombre de operador y teléfono para llamada directa
  const getOperatorDetails = () => {
    let name = (order.operatorName || order.clientContact || 'Operador al volante').trim();
    let phone = (order.operatorPhone || '').trim();

    // Extraer teléfono entre paréntesis ej. "Ing. Rodrigo Sánchez (55 4912 8840)"
    const match = name.match(/\(([\d\s\-+().]{7,})\)/);
    if (match) {
      if (!phone) {
        phone = match[1].trim();
      }
      name = name.replace(/\(([\d\s\-+().]{7,})\)/, '').trim();
    }

    const cleanTel = phone.replace(/[^0-9+]/g, '');
    return { name, phone, cleanTel };
  };

  const operatorDetails = getOperatorDetails();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-2 md:p-4 overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:fixed print:inset-0">
      
      {/* Contenedor del Modal: Full width, sin sombras encapsuladas en la hoja */}
      <div className="bg-white w-full max-w-5xl lg:max-w-6xl min-h-screen sm:min-h-0 sm:max-h-[95vh] flex flex-col overflow-hidden my-auto rounded-none sm:rounded-2xl shadow-2xl print:shadow-none print:rounded-none print:max-h-none print:w-full">
        
        {/* Barra superior de herramientas (se oculta al imprimir) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              PDF
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">
                Reporte de Falla • {order.unitNumber || `Unidad ${order.vehicle.economicNumber}`}
              </h3>
              <p className="text-xs text-slate-400">
                Formato oficial de servicio sin encapsulado ni sombras • Ancho completo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              title="Descargar este reporte en formato Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Descargar Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              title="Imprimir documento o guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar en PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ÁREA DEL DOCUMENTO: TOTALMENTE DESENCAPSULADA, SIN SOMBRAS NI FONDOS GRISES */}
        <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-10 md:p-12 text-slate-900 text-xs sm:text-sm w-full print:p-6 print:overflow-visible">
          
          <div className="w-full space-y-6">
            
            {/* CABECERA MEMBRETADA: LOGO AMPLIO SIN ENCAPSULADO NI CORTES SUPERIORES */}
            <div className="w-full pb-4 border-b-2 border-[#040057]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Logotipo amplio con espacio superior e inferior sin líneas que lo corten */}
                <div className="flex items-center gap-4 sm:gap-6 overflow-visible py-1">
                  <img
                    src="https://appdesignproyectos.com/olmedologo.png"
                    alt="Servicio Técnico Olmedo"
                    className="h-24 sm:h-28 md:h-32 w-auto object-contain shrink-0"
                  />
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#040057] uppercase tracking-tight">
                      SERVICIO TÉCNICO OLMEDO
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                      Asistencia Mecánica y Eléctrica Especializada para Flotillas
                    </p>
                  </div>
                </div>

                {/* Título Oficial: Reporte de Falla */}
                <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0">
                  <span className="text-[11px] font-black uppercase text-slate-500 block tracking-wider">
                    REPORTE DE FALLA
                  </span>
                  <span className="text-base sm:text-xl font-black text-[#040057] block">
                    {order.unitNumber || `Unidad ${order.vehicle.economicNumber}`}
                  </span>
                  <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Servicio Concluido
                  </span>
                  {isRescue && (
                    <span className="block mt-1 text-[11px] font-black uppercase text-rose-600">
                      ⚠️ Rescate
                    </span>
                  )}
                </div>

              </div>
            </div>

            {/* SECCIÓN 1: EMPRESA / CLIENTE REGISTRADO Y FECHA (SIN LÍNEA DE CONTACTO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block tracking-wider">
                  EMPRESA / CLIENTE REGISTRADO:
                </span>
                <span className="font-black text-base sm:text-lg text-[#040057] block mt-1">
                  {order.clientCompany || order.clientName || 'GRUPO SATI S.A. DE C.V.'}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block tracking-wider">
                  FECHA Y HORA DE EMISIÓN:
                </span>
                <span className="font-bold text-xs sm:text-sm text-slate-800 block mt-1 capitalize">
                  {formattedDate}
                </span>
                {order.assignedTechnicianName && (
                  <span className="text-xs text-indigo-700 font-bold block mt-0.5">
                    Técnico asignado: {order.assignedTechnicianName}
                  </span>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: DATOS TÉCNICOS DE LA UNIDAD (SIN "Y ODÓMETRO", SOLO "KILOMETRAJE", Y SIN "EN RUTA") */}
            <div className="border border-slate-300">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-xs text-[#040057] uppercase flex items-center gap-2 tracking-wide">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>DATOS TÉCNICOS DE LA UNIDAD</span>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">No. de Unidad</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {order.unitNumber || `Unidad ${order.vehicle.economicNumber}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Placas</span>
                  <span className="font-extrabold text-slate-900 text-sm">{order.vehicle.plates}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">No. Económico</span>
                  <span className="font-extrabold text-slate-900 text-sm">{order.vehicle.economicNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Kilometraje</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {order.vehicle.odometerReading || order.vehicle.mileage || 'No registrado'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Marca, Modelo y Tipo</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                    {order.vehicle.brandModel || `${order.vehicle.brand || 'Kenworth'} ${order.vehicle.model || 'T680'}`} ({order.vehicle.type?.toUpperCase() || 'TRACTOCAMIÓN'})
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Tipo de Servicio Solicitado</span>
                  <span className="font-extrabold uppercase text-slate-800 text-xs sm:text-sm">
                    {isRescue ? 'RESCATE / ASISTENCIA VIAL' : 'INGRESO A TALLER MECÁNICO'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: OPERADOR Y UBICACIÓN (LINK DE TELÉFONO ACTIVO EN OPERADOR Y SIN "REFERENCIAS DEL VEHÍCULO") */}
            <div className="border border-slate-300">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-xs text-[#040057] uppercase flex items-center gap-2 tracking-wide">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>OPERADOR Y UBICACIÓN DEL INCIDENTE</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Operador al Volante:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {operatorDetails.name}
                  </div>
                  {operatorDetails.phone && (
                    <div className="mt-1.5">
                      <a
                        href={`tel:${operatorDetails.cleanTel}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 font-black text-xs border border-emerald-300 transition shadow-2xs group cursor-pointer"
                        title="Hacer llamada telefónica directa al operador"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="underline underline-offset-2">{operatorDetails.phone}</span>
                      </a>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Ubicación:</span>
                  <p className="text-slate-800 font-semibold mt-0.5 leading-relaxed text-xs sm:text-sm">
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

            {/* SECCIÓN 4: DESCRIPCIÓN DETALLADA DE LA FALLA REPORTADA POR EL CLIENTE */}
            <div className="border border-slate-300">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-xs text-[#040057] uppercase tracking-wide">
                DESCRIPCIÓN DETALLADA DE LA FALLA REPORTADA POR EL CLIENTE
              </div>
              <div className="p-4 text-xs sm:text-sm text-slate-900 leading-relaxed font-semibold bg-white">
                {order.vehicle.failureDescription}
              </div>
            </div>

            {/* SECCIÓN 5: OBSERVACIONES AGREGADAS POR EL CLIENTE */}
            {order.clientObservationsHistory && order.clientObservationsHistory.length > 0 && (
              <div className="border border-amber-300 bg-amber-50/40">
                <div className="bg-amber-100/80 px-4 py-2 border-b border-amber-300 font-black text-xs text-amber-950 uppercase tracking-wide">
                  HISTORIAL DE OBSERVACIONES ADICIONALES REGISTRADAS POR EL CLIENTE ({order.clientObservationsHistory.length})
                </div>
                <div className="p-4 space-y-2.5">
                  {order.clientObservationsHistory.map((obs) => (
                    <div key={obs.id} className="bg-white p-3 border border-amber-200 text-xs text-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold text-slate-700">{obs.author}</span>
                        <span>{new Date(obs.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="font-semibold text-slate-900">{obs.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PIE DE PÁGINA: SIN LOGO REPETIDO, TEXTO CENTRADO ELEGANTE */}
            <div className="pt-8 border-t-2 border-[#040057] text-center pb-2">
              <span className="text-sm font-black text-[#040057] tracking-wider uppercase block">
                SERVICIO TÉCNICO OLMEDO
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                Atención Mecánica Integral • Reporte Oficial emitido por el sistema
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
