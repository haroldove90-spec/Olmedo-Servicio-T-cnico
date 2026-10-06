import React from 'react';
import { 
  Printer, 
  Send, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  FileText,
  Building2,
  Phone,
  CheckCircle2,
  FileCheck,
  X,
  Wrench,
  Truck,
  Package
} from 'lucide-react';
import { ServiceOrder, PartUsed } from '../../types';

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
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-[#040057] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
        )}
      </div>
    );
  }

  // Identificar si la cotización ya contiene partidas de mano de obra y viáticos en su arreglo de productos
  const laborInParts = (quote.parts || []).filter(p => p.category === 'mano_obra');
  const viaticosInParts = (quote.parts || []).filter(p => p.category === 'viaticos');
  const productsInParts = (quote.parts || []).filter(p => p.category !== 'mano_obra' && p.category !== 'viaticos');

  // Si no existen partidas explícitas de mano de obra pero hay laborHours, construir partida compatible
  const allConceptItems: PartUsed[] = [...(quote.parts || [])];

  if (laborInParts.length === 0 && (quote.laborHours || 0) > 0) {
    allConceptItems.unshift({
      id: 'legacy-mo',
      partNumber: 'MO-ESP-01',
      description: `Mano de Obra Especializada en ${order.vehicle.type.toUpperCase()}`,
      quantity: quote.laborHours,
      unitPrice: quote.laborRatePerHour || 650,
      category: 'mano_obra',
    });
  }

  if (viaticosInParts.length === 0 && (quote.expensesAndTowing || 0) > 0) {
    allConceptItems.push({
      id: 'legacy-via',
      partNumber: 'VIA-ASIS-01',
      description: 'Viáticos de Desplazamiento en Carretera / Grúa y Asistencia en Sitio',
      quantity: 1,
      unitPrice: quote.expensesAndTowing,
      category: 'viaticos',
    });
  }

  // Cálculos de subtotales desglosados
  const laborSubtotal = allConceptItems
    .filter(p => p.category === 'mano_obra')
    .reduce((acc, p) => {
      const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1);
      return acc + (q * (p.unitPrice || 0));
    }, 0);

  const viaticosSubtotal = allConceptItems
    .filter(p => p.category === 'viaticos')
    .reduce((acc, p) => {
      const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1);
      return acc + (q * (p.unitPrice || 0));
    }, 0);

  const productsSubtotal = allConceptItems
    .filter(p => p.category !== 'mano_obra' && p.category !== 'viaticos')
    .reduce((acc, p) => {
      const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1);
      return acc + (q * (p.unitPrice || 0));
    }, 0);

  const quoteDate = new Date(quote.createdAt);
  const formattedDate = `${quoteDate.getDate()}/${quoteDate.toLocaleDateString('es-MX', { month: 'long' }).toUpperCase()}/${quoteDate.getFullYear()}`;

  return (
    <div className="flex flex-col h-full max-h-[92vh] bg-slate-100 overflow-hidden">
      {/* Barra de herramientas superior (Fija, oculta en impresión) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 sm:p-4 bg-white border-b border-slate-200 shrink-0 print:hidden shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>Cotización Formal: <strong className="text-[#040057]">{order.folio}</strong></span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            quote.status === 'aprobada' ? 'bg-emerald-100 text-emerald-800' :
            quote.status === 'enviada' ? 'bg-amber-100 text-amber-800' :
            quote.status === 'rechazada' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
          }`}>
            Estado: {quote.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onShareWhatsApp && (
            <button
              onClick={() => onShareWhatsApp(order)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Compartir cotización al WhatsApp del cliente"
            >
              <span className="text-sm">📲</span>
              <span>Compartir WhatsApp</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Imprimir documento en tamaño carta o guardar como PDF"
          >
            <Printer className="w-3.5 h-3.5 text-blue-200" />
            <span>Imprimir / Guardar PDF (Carta)</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition"
              title="Cerrar vista"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Área scrollable para consultar toda la cotización de principio a fin */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 print:p-0 print:overflow-visible bg-slate-200/60">
        
        {/* DOCUMENTO OFICIAL A TAMAÑO CARTA (8.5in x 11in = max-w-[816px]) */}
        <div 
          id="quotation-printable-document" 
          className="bg-white p-6 sm:p-8 md:p-9 border border-slate-300 rounded-xl shadow-lg max-w-[816px] mx-auto text-slate-900 font-sans leading-tight text-xs print:p-0 print:border-none print:shadow-none print:m-0 print:max-w-none print:rounded-none"
        >
          
          {/* Cabecera Institucional Olemdo */}
          <div className="flex items-start justify-between pb-3.5 border-b-2 border-slate-900 mb-3.5 gap-4">
            <div className="space-y-1">
              <img
                src="https://appdesignproyectos.com/olmedologo.png"
                alt="Olemdo Servicio Técnico"
                className="h-12 sm:h-14 w-auto object-contain block"
              />
              <div className="text-[11px] font-black text-[#040057] tracking-tight">
                OLEMDO SERVICIO TÉCNICO DIÉSEL Y TALLER PESADO S.A. DE C.V.
              </div>
              <div className="text-[10px] text-slate-600">
                Mantenimiento Preventivo y Correctivo • Rescate Carretero • Asistencia Vial 24/7
              </div>
              <div className="text-[9.5px] text-slate-500">
                Tel / WhatsApp: (55) 7890-4422 • Correo: contacto@olmedoserviciotecnico.com
              </div>
            </div>

            <div className="text-right space-y-0.5 shrink-0">
              <div className="inline-block bg-[#040057] text-white px-3 py-1 text-[11px] font-black uppercase rounded tracking-wider">
                COTIZACIÓN FORMAL
              </div>
              <div className="text-base font-black text-rose-700 font-mono">
                FOLIO: {order.folio}
              </div>
              <div className="text-[11px] font-semibold text-slate-700">
                Fecha: <strong>{formattedDate}</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                Vigencia: 15 días naturales
              </div>
            </div>
          </div>

          {/* Ficha Cliente y Unidad */}
          <div className="grid grid-cols-2 gap-3 mb-3.5">
            <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50/60 space-y-1">
              <div className="font-bold text-[10.5px] text-[#040057] uppercase border-b border-slate-200 pb-0.5">
                Datos del Cliente / Empresa
              </div>
              <div><strong>Cliente:</strong> {order.clientName}</div>
              <div><strong>Empresa:</strong> {order.clientCompany || order.clientName}</div>
              <div><strong>Contacto / Tel:</strong> {order.clientContact}</div>
              <div><strong>Ubicación:</strong> {order.vehicle.location}</div>
            </div>

            <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50/60 space-y-1">
              <div className="font-bold text-[10.5px] text-[#040057] uppercase border-b border-slate-200 pb-0.5">
                Ficha Técnica del Vehículo
              </div>
              <div><strong>Tipo de Unidad:</strong> {order.vehicle.type.toUpperCase()}</div>
              <div><strong>Marca / Modelo:</strong> {order.vehicle.brandModel || 'No especificado'}</div>
              <div><strong>Placas:</strong> {order.vehicle.plates} • <strong>Económico:</strong> {order.vehicle.economicNumber}</div>
              <div><strong>Odómetro / Horas:</strong> {order.vehicle.odometerReading || 'En revisión'}</div>
            </div>
          </div>

          {/* Diagnóstico y Trabajo Técnico */}
          <div className="border border-slate-300 p-2.5 rounded-lg mb-3.5 space-y-0.5 bg-slate-50/30">
            <div className="font-bold text-[10.5px] text-[#040057] uppercase border-b border-slate-200 pb-0.5">
              Diagnóstico Inicial y Servicio Solicitado
            </div>
            <div className="text-[11px] text-slate-800 leading-relaxed pt-0.5">
              {order.workPerformedDetail || order.initialDiagnosis || order.vehicle.failureDescription}
            </div>
          </div>

          {/* Tabla Unificada de Productos, Servicios, Mano de Obra y Viáticos */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-3.5">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040057] text-white text-[10.5px] font-bold">
                <tr>
                  <th className="p-2 w-10 text-center">Part.</th>
                  <th className="p-2 w-24">Código</th>
                  <th className="p-2 w-24">Tipo</th>
                  <th className="p-2">Descripción del Producto / Servicio / Concepto</th>
                  <th className="p-2 w-14 text-center">Cant.</th>
                  <th className="p-2 w-24 text-right">P. Unitario</th>
                  <th className="p-2 w-24 text-right">Importe MXN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allConceptItems.map((item, idx) => {
                  const qty = typeof item.quantity === 'number' ? item.quantity : (parseFloat(String(item.quantity)) || 1);
                  const itemTotal = qty * (item.unitPrice || 0);

                  const isLabor = item.category === 'mano_obra';
                  const isViatico = item.category === 'viaticos';
                  const isService = item.category === 'servicio';

                  return (
                    <tr 
                      key={item.id || idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                    >
                      <td className="p-2 text-center font-bold text-slate-600">{idx + 1}</td>
                      <td className="p-2 font-mono text-[10.5px] text-slate-700">{item.partNumber}</td>
                      <td className="p-2">
                        {isLabor ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 inline-block">
                            Mano de Obra
                          </span>
                        ) : isViatico ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 inline-block">
                            Viáticos
                          </span>
                        ) : isService ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 inline-block">
                            Servicio
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 inline-block">
                            Producto
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="font-bold text-slate-800">{item.description}</div>
                        {item.position && <div className="text-[10px] text-slate-500">Posición: {item.position}</div>}
                      </td>
                      <td className="p-2 text-center font-semibold">
                        {isLabor ? `${qty} hrs` : qty}
                      </td>
                      <td className="p-2 text-right">
                        {item.providedByClient ? 'Cliente ($0.00)' : `$${(item.unitPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                      </td>
                      <td className="p-2 text-right font-bold">
                        {item.providedByClient ? '$0.00' : `$${itemTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Resumen Financiero y Totales */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex-1 border border-slate-300 p-2.5 rounded-lg space-y-1 text-[10.5px]">
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

            <div className="w-64 border border-slate-300 rounded-lg overflow-hidden text-xs">
              {laborSubtotal > 0 && (
                <div className="p-1.5 px-2 flex justify-between bg-slate-50 border-b border-slate-200">
                  <span className="text-slate-600">Subtotal Mano de Obra:</span>
                  <span className="font-semibold">${laborSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {productsSubtotal > 0 && (
                <div className="p-1.5 px-2 flex justify-between bg-slate-50 border-b border-slate-200">
                  <span className="text-slate-600">Subtotal Productos / Refacciones:</span>
                  <span className="font-semibold">${productsSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {viaticosSubtotal > 0 && (
                <div className="p-1.5 px-2 flex justify-between bg-slate-50 border-b border-slate-200">
                  <span className="text-slate-600">Subtotal Viáticos / Asistencia:</span>
                  <span className="font-semibold">${viaticosSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="p-2 flex justify-between font-bold border-b border-slate-300 bg-slate-50/70">
                <span>Subtotal Neto:</span>
                <span>${quote.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-1.5 px-2 flex justify-between text-slate-700 border-b border-slate-300">
                <span>I.V.A. Trasladado (16%):</span>
                <span>${quote.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-2 flex justify-between bg-[#040057] text-white font-black text-sm">
                <span>TOTAL MXN:</span>
                <span>${quote.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Firmas de Autorización - Dentro de los márgenes de hoja carta */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-slate-800 text-center text-xs break-inside-avoid print:pt-4">
            <div className="space-y-1">
              <div className="h-9 border-b border-slate-400 flex items-center justify-center text-[10px] text-slate-500 italic max-w-[240px] mx-auto">
                {order.adminApprovedBy ? `Firma digital: ${order.adminApprovedBy}` : 'Lic. Laura Méndez - Gerencia'}
              </div>
              <div className="font-bold text-[#040057] text-[11px]">GERENCIA ADMINISTRATIVA Y TALLER</div>
              <div className="text-[9.5px] text-slate-500">Olemdo Servicio Técnico Automotriz y Diésel S.A. de C.V.</div>
            </div>

            <div className="space-y-1">
              <div className="h-9 border-b border-slate-400 flex items-center justify-center text-[10px] text-slate-500 italic max-w-[240px] mx-auto">
                {quote.approvedBy ? `Autorizado por: ${quote.approvedBy}` : 'Firma de Autorización del Cliente'}
              </div>
              <div className="font-bold text-[#040057] text-[11px]">CLIENTE / REPRESENTANTE AUTORIZADO</div>
              <div className="text-[9.5px] text-slate-500">{order.clientName}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

