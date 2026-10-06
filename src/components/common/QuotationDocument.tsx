import React from 'react';
import { 
  Printer, 
  Send, 
  Download, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  FileText,
  Building2,
  Phone,
  CheckCircle2,
  FileCheck,
  FileUp,
  X
} from 'lucide-react';
import { ServiceOrder } from '../../types';

interface QuotationDocumentProps {
  order: ServiceOrder;
  onClose?: () => void;
  onShareWhatsApp?: (order: ServiceOrder) => void;
}

export const QuotationDocument: React.FC<QuotationDocumentProps> = ({ 
  order, 
  onClose,
  onShareWhatsApp 
}) => {
  const quote = order.quotation;

  const handlePrint = () => {
    window.print();
  };

  if (!quote) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl">
        <p className="text-slate-500 text-sm">Esta orden no cuenta con una cotización registrada todavía.</p>
      </div>
    );
  }

  const laborSubtotal = (quote.laborHours || 0) * (quote.laborRatePerHour || 0);
  const partsSubtotal = (quote.parts || []).reduce((acc, p) => {
    const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1);
    return acc + (q * p.unitPrice);
  }, 0);
  const quoteDate = new Date(quote.createdAt);
  const formattedDate = `${quoteDate.getDate()}/${quoteDate.toLocaleDateString('es-MX', { month: 'long' }).toUpperCase()}/${quoteDate.getFullYear()}`;

  return (
    <div className="space-y-4">
      {/* Botones de acción en pantalla (ocultos en impresión) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 rounded-xl print:hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>Cotización Formal: <strong>{order.folio}</strong></span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            quote.status === 'aprobada' ? 'bg-emerald-100 text-emerald-800' :
            quote.status === 'enviada' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
          }`}>
            Estado: {quote.status.toUpperCase()}
          </span>
          {quote.importedPdfName && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1">
              <FileUp className="w-3 h-3" />
              PDF Importado
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onShareWhatsApp && (
            <button
              onClick={() => onShareWhatsApp(order)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Compartir presupuesto al WhatsApp del cliente"
            >
              <span>📲 Compartir WhatsApp</span>
            </button>
          )}

          {quote.pdfUrl && (
            <a
              href={quote.pdfUrl}
              download={`Cotizacion_${order.folio}.pdf`}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Bajar PDF Importado</span>
            </a>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-lg bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar PDF</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* DOCUMENTO OFICIAL IMPRESO */}
      <div className="bg-white p-5 sm:p-8 md:p-10 border border-slate-300 rounded-xl shadow-lg max-w-[850px] mx-auto text-slate-900 font-sans leading-tight text-xs print:p-0 print:border-none print:shadow-none print:m-0 print:max-w-none overflow-x-auto">
        
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900 mb-4 gap-4">
          <div className="space-y-1">
            <img
              src="https://appdesignproyectos.com/olmedologo.png"
              alt="Olemdo Servicio Técnico"
              className="h-14 sm:h-16 w-auto object-contain block"
            />
            <div className="text-[11px] font-bold text-[#040057]">
              OLEMDO SERVICIO TÉCNICO DIÉSEL Y TALLER PESADO S.A. DE C.V.
            </div>
            <div className="text-[10px] text-slate-600">
              Mantenimiento Preventivo y Correctivo • Rescate Carretero • Asistencia Vial 24/7
            </div>
            <div className="text-[10px] text-slate-600">
              Teléfono / WhatsApp: (55) 7890-4422 • Correo: contacto@olmedoserviciotecnico.com
            </div>
          </div>

          <div className="text-right space-y-1 shrink-0">
            <div className="inline-block bg-[#040057] text-white px-3 py-1 text-xs font-black uppercase rounded tracking-wider">
              COTIZACIÓN FORMAL
            </div>
            <div className="text-base font-black text-rose-700 font-mono">
              FOLIO: {order.folio}
            </div>
            <div className="text-[11px] font-semibold text-slate-700">
              Fecha de Emisión: <strong>{formattedDate}</strong>
            </div>
            <div className="text-[10px] text-slate-500">
              Vigencia: 15 días naturales
            </div>
          </div>
        </div>

        {/* Datos del Cliente y de la Unidad */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="border border-slate-400 p-2.5 rounded bg-slate-50/50 space-y-1">
            <div className="font-bold text-[11px] text-[#040057] uppercase border-b border-slate-300 pb-1">
              Datos del Cliente / Empresa
            </div>
            <div><strong>Cliente:</strong> {order.clientName}</div>
            <div><strong>Empresa:</strong> {order.clientCompany || order.clientName}</div>
            <div><strong>Contacto / Teléfono:</strong> {order.clientContact}</div>
            <div><strong>Ubicación de Atención:</strong> {order.vehicle.location}</div>
          </div>

          <div className="border border-slate-400 p-2.5 rounded bg-slate-50/50 space-y-1">
            <div className="font-bold text-[11px] text-[#040057] uppercase border-b border-slate-300 pb-1">
              Ficha Técnica del Vehículo
            </div>
            <div><strong>Tipo de Unidad:</strong> {order.vehicle.type.toUpperCase()}</div>
            <div><strong>Marca / Modelo:</strong> {order.vehicle.brandModel || 'No especificado'}</div>
            <div><strong>Placas:</strong> {order.vehicle.plates} • <strong>Económico:</strong> {order.vehicle.economicNumber}</div>
            <div><strong>Odómetro / Horas:</strong> {order.vehicle.odometerReading || 'En revisión'}</div>
          </div>
        </div>

        {/* Diagnóstico y Trabajo Técnico */}
        <div className="border border-slate-400 p-2.5 rounded mb-4 space-y-1">
          <div className="font-bold text-[11px] text-[#040057] uppercase border-b border-slate-300 pb-1">
            Diagnóstico Inicial y Servicio Solicitado
          </div>
          <div className="text-[11px] text-slate-800 leading-relaxed">
            {order.workPerformedDetail || order.initialDiagnosis || order.vehicle.failureDescription}
          </div>
        </div>

        {/* Tabla de Conceptos: Mano de Obra y Refacciones */}
        <div className="border border-slate-400 rounded overflow-hidden mb-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#040057] text-white text-[11px] font-bold">
              <tr>
                <th className="p-2 w-12 text-center">Part.</th>
                <th className="p-2 w-28">Código</th>
                <th className="p-2">Descripción del Servicio / Refacción</th>
                <th className="p-2 w-16 text-center">Cant.</th>
                <th className="p-2 w-24 text-right">P. Unitario</th>
                <th className="p-2 w-24 text-right">Importe MXN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {/* Partida 1: Mano de obra */}
              <tr className="bg-slate-50 font-medium">
                <td className="p-2 text-center font-bold">1</td>
                <td className="p-2 font-mono text-[11px]">MO-ESP-01</td>
                <td className="p-2">
                  <div className="font-bold text-slate-900">Mano de Obra Técnica Especializada en {order.vehicle.type.toUpperCase()}</div>
                  <div className="text-[10px] text-slate-500">
                    Técnico Titular: {order.assignedTechnicianName || 'Personal Certificado Olemdo'} ({quote.laborHours} horas estimadas)
                  </div>
                </td>
                <td className="p-2 text-center">{quote.laborHours} hrs</td>
                <td className="p-2 text-right">${quote.laborRatePerHour.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td className="p-2 text-right font-bold">${laborSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
              </tr>

              {/* Partidas de refacciones */}
              {quote.parts.map((p, idx) => {
                const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1);
                const partTotal = q * p.unitPrice;
                return (
                  <tr key={p.id || idx}>
                    <td className="p-2 text-center text-slate-600">{idx + 2}</td>
                    <td className="p-2 font-mono text-[11px] text-slate-700">{p.partNumber}</td>
                    <td className="p-2">
                      <div className="font-bold text-slate-800">{p.description}</div>
                      {p.position && <div className="text-[10px] text-slate-500">Posición: {p.position}</div>}
                    </td>
                    <td className="p-2 text-center">{p.quantity}</td>
                    <td className="p-2 text-right">
                      {p.providedByClient ? 'Cliente ($0.00)' : `$${p.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="p-2 text-right font-bold">
                      {p.providedByClient ? '$0.00' : `$${partTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    </td>
                  </tr>
                );
              })}

              {/* Viáticos / Asistencia Carretera */}
              {quote.expensesAndTowing > 0 && (
                <tr className="bg-slate-50/50">
                  <td className="p-2 text-center text-slate-600">{quote.parts.length + 2}</td>
                  <td className="p-2 font-mono text-[11px]">VIA-ASIS-01</td>
                  <td className="p-2 font-bold text-slate-800">
                    Viáticos de Desplazamiento en Carretera / Grúa o Asistencia en Sitio
                  </td>
                  <td className="p-2 text-center">1 SERVICIO</td>
                  <td className="p-2 text-right">${quote.expensesAndTowing.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="p-2 text-right font-bold">${quote.expensesAndTowing.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen Financiero y Totales */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1 border border-slate-300 p-3 rounded space-y-1.5 text-[11px]">
            <div className="font-bold text-slate-800 uppercase text-[10px]">Términos Comerciales y Garantía:</div>
            <p className="text-slate-600">
              • Precios expresados en Moneda Nacional (MXN).
            </p>
            <p className="text-slate-600">
              • Garantía por escrito de <strong>90 días naturales</strong> en toda mano de obra mecánica efectuada por personal de Olemdo.
            </p>
            <p className="text-slate-600">
              • Facturación electrónica válida con CFDI 4.0 al confirmar la orden.
            </p>
            {quote.notes && (
              <div className="pt-1 text-slate-700 italic border-t border-slate-200">
                <strong>Notas adicionales:</strong> {quote.notes}
              </div>
            )}
          </div>

          <div className="w-64 border border-slate-400 rounded overflow-hidden text-xs">
            <div className="p-2 flex justify-between bg-slate-50 border-b border-slate-200">
              <span className="text-slate-600">Subtotal Mano de Obra:</span>
              <span className="font-semibold">${laborSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2 flex justify-between bg-slate-50 border-b border-slate-200">
              <span className="text-slate-600">Subtotal Refacciones:</span>
              <span className="font-semibold">${partsSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            {quote.expensesAndTowing > 0 && (
              <div className="p-2 flex justify-between bg-slate-50 border-b border-slate-200">
                <span className="text-slate-600">Viáticos / Asistencia:</span>
                <span className="font-semibold">${quote.expensesAndTowing.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="p-2 flex justify-between font-bold border-b border-slate-300">
              <span>Subtotal Neto:</span>
              <span>${quote.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2 flex justify-between text-slate-700 border-b border-slate-300">
              <span>I.V.A. Trasladado (16%):</span>
              <span>${quote.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2.5 flex justify-between bg-[#040057] text-white font-black text-sm">
              <span>TOTAL MXN:</span>
              <span>${quote.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Firmas de Autorización */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-800 text-center text-xs">
          <div className="space-y-1">
            <div className="h-10 border-b border-slate-400 flex items-center justify-center text-[10px] text-slate-400 italic">
              {order.adminApprovedBy ? `Firma digital: ${order.adminApprovedBy}` : 'Lic. Laura Méndez - Gerencia'}
            </div>
            <div className="font-bold text-[#040057]">GERENCIA ADMINISTRATIVA Y TALLER</div>
            <div className="text-[10px] text-slate-500">Olemdo Servicio Técnico Automotriz y Diésel</div>
          </div>

          <div className="space-y-1">
            <div className="h-10 border-b border-slate-400 flex items-center justify-center text-[10px] text-slate-400 italic">
              {quote.approvedBy ? `Autorizado por: ${quote.approvedBy}` : 'Firma de Autorización del Cliente'}
            </div>
            <div className="font-bold text-[#040057]">CLIENTE / REPRESENTANTE AUTORIZADO</div>
            <div className="text-[10px] text-slate-500">{order.clientName}</div>
          </div>
        </div>

      </div>
    </div>
  );
};
