import React from 'react';
import { ServiceOrder } from '../../types';
import { Printer, Download, CheckCircle2, ShieldCheck, PenTool } from 'lucide-react';

interface TechnicalReportDocumentProps {
  order: ServiceOrder;
  onSignClient?: () => void;
  showSignButton?: boolean;
}

export const TechnicalReportDocument: React.FC<TechnicalReportDocumentProps> = ({ 
  order, 
  onSignClient,
  showSignButton = false
}) => {
  const handlePrint = () => {
    window.print();
  };

  const reportNum = order.reportNumber || order.folio.replace(/[^0-9]/g, '').slice(-3) || '023';
  const orderDate = new Date(order.createdAt);
  const formattedDate = `${orderDate.getDate()}/${orderDate.toLocaleDateString('es-MX', { month: 'long' }).toUpperCase()}/${orderDate.getFullYear()}`;

  // Divide parts into 2 groups or display neatly matching the format
  const parts = order.partsUsed || [];

  return (
    <div className="space-y-4">
      {/* Botones de acción en pantalla (se ocultan al imprimir) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 rounded-xl print:hidden">
        <div className="text-xs font-semibold text-slate-700">
          Formato Oficial: <strong>REPORTE TÉCNICO {reportNum}</strong>
        </div>
        
        <div className="flex items-center gap-2">
          {showSignButton && !order.clientSignature && onSignClient && (
            <button
              onClick={onSignClient}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Firmar de Conformidad (Cliente)</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-lg bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar en PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENTO FÍSICO / HOJA DE REPORTE (Exactamente idéntica a la imagen del usuario) */}
      <div className="bg-white p-3.5 sm:p-8 md:p-10 border border-slate-300 rounded-xl shadow-lg max-w-[850px] mx-auto text-slate-900 font-sans leading-tight text-xs print:p-0 print:border-none print:shadow-none print:m-0 print:max-w-none overflow-x-auto">
        
        {/* Cabecera: Título y Logotipo */}
        <div className="flex items-start justify-between pb-3 border-b-2 border-slate-900 mb-3 gap-2">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
            REPORTE TÉCNICO {reportNum}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <img
              src="https://appdesignproyectos.com/olmedologo.png"
              alt="Olemdo Servicio Técnico"
              className="h-10 sm:h-14 w-auto object-contain"
            />
          </div>
        </div>

        {/* Fila 1: Cliente, Usuario y Fecha */}
        <div className="grid grid-cols-12 gap-1 mb-2">
          <div className="col-span-12 sm:col-span-5 border border-slate-900 p-1.5">
            <div className="text-[10px] font-extrabold uppercase text-slate-700 mb-0.5">CLIENTE</div>
            <div className="font-bold text-slate-900 text-sm uppercase truncate">
              {order.clientCompany || order.clientName || 'GRUPO SATI'}
            </div>
          </div>

          <div className="col-span-12 sm:col-span-4 border border-slate-900 p-1.5">
            <div className="text-[10px] font-extrabold uppercase text-slate-700 mb-0.5">USUARIO</div>
            <div className="font-bold text-slate-900 text-sm uppercase truncate">
              {order.userOperatorName || order.vehicle.driverContact || 'OMAR BALDERAS'}
            </div>
          </div>

          <div className="col-span-12 sm:col-span-3 border border-slate-900 p-1.5">
            <div className="text-[10px] font-extrabold uppercase text-slate-700 mb-0.5">FECHA</div>
            <div className="font-bold text-slate-900 text-sm uppercase">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Fila 2: Servicio Solicitado (Correctivo / Preventivo) */}
        <div className="border border-slate-900 p-1.5 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-extrabold uppercase text-slate-900 text-[11px] sm:w-48">
            SERVICIO SOLICITADO
          </div>
          
          <div className="flex items-center gap-6 sm:flex-1 justify-start sm:justify-around">
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 border-2 border-slate-900 flex items-center justify-center font-bold text-xs ${
                order.maintenanceNature !== 'preventivo' ? 'bg-slate-900 text-white' : 'bg-white'
              }`}>
                {order.maintenanceNature !== 'preventivo' ? '✕' : ''}
              </span>
              <span className="font-black uppercase text-xs">CORRECTIVO</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 border-2 border-slate-900 flex items-center justify-center font-bold text-xs ${
                order.maintenanceNature === 'preventivo' ? 'bg-slate-900 text-white' : 'bg-white'
              }`}>
                {order.maintenanceNature === 'preventivo' ? '✕' : ''}
              </span>
              <span className="font-black uppercase text-xs">PREVENTIVO</span>
            </div>
          </div>
        </div>

        {/* Fila 3: Inspección Preventiva */}
        <div className="border border-slate-900 mb-2">
          <div className="bg-slate-100 px-2 py-1 font-extrabold uppercase text-[10px] border-b border-slate-900">
            INSPECCIÓN PREVENTIVA
          </div>
          <div className="p-2 font-bold uppercase text-xs text-slate-900">
            {order.preventiveInspectionNotes || order.vehicle.failureDescription || 'UNIDAD PRESENTA FALLA EN FRENOS, FALTA DE TUERCAS'}
          </div>
        </div>

        {/* Fila 4: Ficha Técnica del Equipo */}
        <div className="border border-slate-900 mb-2">
          <table className="w-full text-left border-collapse">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="w-5/12 p-1.5 font-bold uppercase border-r border-slate-900 bg-slate-50">
                  No. Placa/Económico
                </td>
                <td className="w-7/12 p-1.5 font-black uppercase text-slate-900">
                  {order.vehicle.economicNumber} / {order.vehicle.plates}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-1.5 font-bold uppercase border-r border-slate-900 bg-slate-50">
                  Modelo del Equipo
                </td>
                <td className="p-1.5 font-bold uppercase text-slate-900">
                  {order.vehicle.brandModel || 'ANKAI'}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-1.5 font-bold uppercase border-r border-slate-900 bg-slate-50">
                  Número de Serie de Chasis
                </td>
                <td className="p-1.5 font-mono font-bold uppercase text-slate-900">
                  {order.vehicle.chassisSerialNumber || 'LA83J1PK5SA100693'}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-1.5 font-bold uppercase border-r border-slate-900 bg-slate-50">
                  Modelo de Motor/Transmisión
                </td>
                <td className="p-1.5 font-bold uppercase text-slate-900">
                  {order.vehicle.engineModelTransmission || 'WP7NG260E61'}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-1.5 font-bold uppercase border-r border-slate-900 bg-slate-50">
                  Serie del Motor/Transmisión
                </td>
                <td className="p-1.5 font-mono font-bold uppercase text-slate-900">
                  {order.vehicle.engineSeriesTransmission || '1625A000221'}
                </td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold uppercase border-r border-slate-900 bg-slate-50">
                  Odómetro/Horómetro
                </td>
                <td className="p-1.5 font-bold uppercase text-slate-900">
                  {order.vehicle.odometerReading || '130618 KM'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Fila 5: Diagnóstico Técnico */}
        <div className="border border-slate-900 mb-2">
          <div className="bg-slate-100 px-2 py-1 font-extrabold uppercase text-[10px] border-b border-slate-900">
            DIAGNÓSTICO TÉCNICO
          </div>
          <div className="p-2 font-bold uppercase text-xs text-slate-900">
            {order.initialDiagnosis || order.vehicle.failureDescription || 'UNIDAD PRESENTA FALLA EN FRENOS, FALTA DE TUERCAS'}
          </div>
        </div>

        {/* Fila 6: Servicio Realizado */}
        <div className="border border-slate-900 mb-2">
          <div className="bg-slate-100 px-2 py-1 font-extrabold uppercase text-[10px] border-b border-slate-900">
            SERVICIO REALIZADO
          </div>
          <div className="p-2.5 text-xs text-slate-900 leading-relaxed uppercase font-medium text-justify">
            {order.workPerformedDetail || 
             `CORRECTIVO REALIZADO: se brinda servicio de rescate/asistencia vial, se reemplazan balatas (POS 3y4) y (POS 5y6) (PROPORCIONADAS POR CLIENTE), se instalan los mismos tambores (no tenían daño), se reemplaza matraca de freno (POS 3y4) y (POS 5y6), se reemplaza sensor MAT y sensor MAP, se realiza escaneo y reestablecimiento de parámetros, se instalan llantas (POS 3y4) y (POS 5y6), y se instalan 4 tuercas UNEMON (POS 5y6) y 4 tuercas UNEMON (POS 3y4).`}
          </div>
        </div>

        {/* Fila 7: Refacciones Instaladas */}
        <div className="border border-slate-900 mb-6">
          <div className="bg-slate-100 px-2 py-1 font-extrabold uppercase text-[10px] border-b border-slate-900">
            REFACCIONES INSTALADAS
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] font-black uppercase bg-slate-50">
                <th className="p-1.5 border-r border-slate-900 w-8/12">DESCRIPCIÓN</th>
                <th className="p-1.5 w-4/12 text-center">CANTIDAD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-[11px]">
              {parts.length > 0 ? (
                parts.map((part, pIdx) => (
                  <tr key={part.id || pIdx}>
                    <td className="p-1.5 border-r border-slate-900 font-bold uppercase">
                      {part.description}
                      {part.providedByClient && !part.description.includes('CLIENTE') && (
                        <span className="text-slate-600 block text-[9px]">(PROPORCIONADAS POR CLIENTE)</span>
                      )}
                    </td>
                    <td className="p-1.5 text-center font-bold uppercase">
                      {typeof part.quantity === 'number' ? `${part.quantity} PIEZA(S)` : part.quantity}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-2 border-r border-slate-900 font-bold uppercase">
                    JUEGO DE BALATAS (POS 3Y4) (PROPORCIONADAS POR CLIENTE)
                  </td>
                  <td className="p-2 text-center font-bold uppercase">1 JUEGO</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Fila 8: Firmas del Técnico y del Cliente */}
        <div className="grid grid-cols-2 gap-8 pt-4 pb-2 mt-4">
          <div className="text-center">
            <div className="border-b-2 border-slate-900 min-h-[48px] flex items-end justify-center pb-1">
              {order.technicianSignature && (
                <span className="font-serif italic text-base text-[#040057] font-bold">
                  {order.technicianSignature}
                </span>
              )}
            </div>
            <div className="font-extrabold uppercase text-xs text-slate-900 mt-1.5 tracking-wider">
              FIRMA DEL TÉCNICO
            </div>
            <div className="text-[10px] text-slate-500 uppercase">
              {order.assignedTechnicianName || 'Carlos Mendoza'}
            </div>
          </div>

          <div className="text-center">
            <div className="border-b-2 border-slate-900 min-h-[48px] flex items-end justify-center pb-1">
              {order.clientSignature ? (
                <span className="font-serif italic text-base text-[#040057] font-bold">
                  {order.clientSignature}
                </span>
              ) : (
                <span className="text-slate-400 text-[10px] italic pb-1">
                  Pendiente de firma de recepción
                </span>
              )}
            </div>
            <div className="font-extrabold uppercase text-xs text-slate-900 mt-1.5 tracking-wider">
              FIRMA DEL CLIENTE
            </div>
            <div className="text-[10px] text-slate-500 uppercase">
              {order.userOperatorName || order.vehicle.driverContact || 'Omar Balderas (Operador)'}
            </div>
          </div>
        </div>

        {/* Pie de página oficial */}
        <div className="pt-4 border-t border-slate-300 text-center text-[9px] text-slate-400 uppercase tracking-widest mt-2">
          Olemdo Servicio Técnico • Documento Oficial de Entrega y Recepción de Unidad • Folio de Servicio {order.folio}
        </div>

      </div>
    </div>
  );
};
