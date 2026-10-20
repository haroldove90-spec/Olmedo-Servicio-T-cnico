import React, { useState } from 'react';
import { ServiceOrder } from '../../types';
import { 
  Copy, 
  Check, 
  Printer, 
  Download, 
  FileText, 
  Search, 
  Calendar, 
  Truck, 
  Wrench, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ConsolidatedReportsLogViewProps {
  orders: ServiceOrder[];
  title?: string;
  companyName?: string;
  showFilters?: boolean;
}

export const ConsolidatedReportsLogView: React.FC<ConsolidatedReportsLogViewProps> = ({
  orders,
  title = 'COTIZACIÓN 20261012 ENVIAR',
  companyName,
  showFilters = true
}) => {
  const { addToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [headerTitle, setHeaderTitle] = useState(title);

  // Helper para formatear fecha como en la imagen del cliente (ej. "MARTES 6 OCTUBRE")
  const formatDayHeader = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'FECHA NO REGISTRADA';
      const dayName = d.toLocaleDateString('es-MX', { weekday: 'long' }).toUpperCase();
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('es-MX', { month: 'long' }).toUpperCase();
      return `${dayName} ${dayNum} ${monthName}`;
    } catch {
      return 'FECHA';
    }
  };

  // Helper para generar el texto de refacciones requeridas
  const formatPartsRequired = (order: ServiceOrder): string => {
    if (order.partsUsed && order.partsUsed.length > 0) {
      return order.partsUsed.map(p => {
        const qty = typeof p.quantity === 'number' ? `${p.quantity} ` : `${p.quantity} `;
        const desc = p.description.toUpperCase();
        const pos = p.position ? ` (${p.position.toUpperCase()})` : '';
        return `${qty}${desc}${pos}`.trim();
      }).join(', ');
    }

    // Si tiene refacciones en el texto de correctivo o notas preventivas
    if (order.workPerformedDetail && order.workPerformedDetail.includes('reemplaz')) {
      const partsMatch = order.workPerformedDetail.match(/reemplazan?\s+([^,.]+)/gi);
      if (partsMatch) {
        return partsMatch.map(m => m.replace(/reemplazan?\s+/i, '').toUpperCase()).join(', ');
      }
    }

    return 'BALATAS POS 1Y2, LÍQUIDOS Y CONSUMIBLES DE AJUSTE';
  };

  // Helper para generar el texto del correctivo realizado
  const formatCorrective = (order: ServiceOrder, index: number): string => {
    if (order.workPerformedDetail) {
      // Limpiar prefijo repetitivo si ya lo tiene
      let text = order.workPerformedDetail.replace(/^CORRECTIVO REALIZADO:\s*/i, '');
      return text;
    }

    if (order.repairs && order.repairs.length > 0) {
      return order.repairs.map((r, rIdx) => 
        `Asistencia vial ${index + 1}.${rIdx + 1}. ${r.title} OK: ${r.description} OK.`
      ).join(' ');
    }

    const nature = order.serviceType === 'rescate' ? 'Asistencia vial' : 'Servicio en taller';
    return `${nature} ${index + 1}. Se realiza diagnóstico integral, ajuste y calibración operativa OK. Unidad habilitada.`;
  };

  // Filtrado interno si se busca alguna palabra clave
  const filteredOrders = orders.filter(o => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (o.folio || '').toLowerCase().includes(term) ||
      (o.vehicle.plates || '').toLowerCase().includes(term) ||
      (o.vehicle.failureDescription || '').toLowerCase().includes(term) ||
      (o.operatorName || '').toLowerCase().includes(term) ||
      (o.workPerformedDetail || '').toLowerCase().includes(term)
    );
  });

  // Generador de texto plano idéntico a la imagen del usuario
  const generatePlainText = (): string => {
    let text = `${headerTitle}\r\n\r\n`;

    filteredOrders.forEach((order, idx) => {
      const dayHeader = formatDayHeader(order.createdAt);
      const operator = order.operatorName || order.userOperatorName || order.vehicle.driverContact;
      const failure = (order.vehicle.failureDescription || 'REVISIÓN GENERAL').trim();
      const corrective = formatCorrective(order, idx);
      const parts = formatPartsRequired(order);

      text += `${dayHeader}\r\n`;
      if (operator) {
        text += `OPERADOR: ${operator}\r\n`;
      }
      text += `FALLA REPORTADA: ${failure}\r\n`;
      text += `CORRECTIVO REALIZADO: ${corrective}\r\n`;
      text += `★★★  REFACCIONES REQUERIDAS: ${parts}\r\n\r\n`;
    });

    return text;
  };

  // Copiar al portapapeles
  const handleCopyText = async () => {
    const fullText = generatePlainText();
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      addToast('success', 'Texto Copiado al Portapapeles', 'El formato tipo bitácora se copió listo para WhatsApp o correo.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast('error', 'Error al copiar', 'No se pudo copiar automáticamente.');
    }
  };

  // Imprimir / Guardar en PDF
  const handlePrint = () => {
    window.print();
  };

  // Descargar archivo .txt
  const handleDownloadTxt = () => {
    const fullText = generatePlainText();
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bitacora_Fallas_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('success', 'Archivo TXT Descargado', 'Se descargó el reporte en formato texto.');
  };

  return (
    <div className="space-y-4">
      
      {/* Barra de herramientas y acciones rápidas (se oculta al imprimir) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#040057] flex items-center justify-center font-black">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-[#040057]">
              Bitácora Técnica Consolidada (Formato Cliente)
            </h4>
            <p className="text-[11px] text-slate-500">
              {filteredOrders.length} intervenciones registradas cronológicamente
              {companyName && ` • ${companyName}`}
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            type="button"
            onClick={handleCopyText}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado a Portapapeles!' : 'Copiar Texto para WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Descargar .txt</span>
          </button>

        </div>

      </div>

      {/* Buscador opcional */}
      {showFilters && (
        <div className="relative print:hidden">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por falla, refacción, operador o placas..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#040057]"
          />
        </div>
      )}

      {/* DOCUMENTO PRINCIPAL (IDÉNTICO A LA FOTO DEL CLIENTE) */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-300 shadow-sm font-sans text-slate-900 leading-relaxed print:p-0 print:border-none print:shadow-none">
        
        {/* TÍTULO PRINCIPAL EDITABLE O FIJO */}
        <div className="mb-6 pb-2 border-b-2 border-blue-900 flex items-center justify-between">
          <input
            type="text"
            value={headerTitle}
            onChange={(e) => setHeaderTitle(e.target.value)}
            className="font-black text-base sm:text-lg text-blue-900 uppercase tracking-tight bg-transparent border-none focus:outline-hidden focus:ring-0 w-full"
            placeholder="COTIZACIÓN 20261012 ENVIAR"
          />
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 print:hidden">
            (Título editable)
          </span>
        </div>

        {/* LISTADO DE REPORTES CON LA ESTRUCTURA EXACTA */}
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No hay reportes de falla registrados para mostrar en esta bitácora.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, idx) => {
              const dayHeader = formatDayHeader(order.createdAt);
              const operator = order.operatorName || order.userOperatorName || order.vehicle.driverContact;
              const failure = order.vehicle.failureDescription || 'REVISIÓN GENERAL DE SISTEMA';
              const corrective = formatCorrective(order, idx);
              const parts = formatPartsRequired(order);

              return (
                <div 
                  key={order.id || idx} 
                  className="space-y-1.5 pb-5 border-b border-slate-200 last:border-b-0 text-xs sm:text-[13px]"
                >
                  
                  {/* FECHA / DÍA */}
                  <div className="font-black text-slate-900 uppercase tracking-wide text-xs sm:text-sm flex items-center gap-2">
                    <span>{dayHeader}</span>
                    <span className="text-[10px] text-slate-500 font-bold lowercase">
                      ({order.unitNumber || `Unidad ${order.vehicle.economicNumber}`})
                    </span>
                  </div>

                  {/* OPERADOR SI APLICA */}
                  {operator && (
                    <div className="font-bold text-slate-800">
                      <span className="text-slate-900 uppercase">OPERADOR:</span> {operator}
                    </div>
                  )}

                  {/* FALLA REPORTADA */}
                  <div className="text-slate-900 font-medium leading-normal">
                    <strong className="font-extrabold uppercase text-slate-900">FALLA REPORTADA:</strong> {failure}
                  </div>

                  {/* CORRECTIVO REALIZADO (EN COLOR AZUL FUERTE COMO EN LA FOTO) */}
                  <div className="text-blue-900 font-semibold leading-normal">
                    <strong className="font-extrabold uppercase text-slate-900">CORRECTIVO REALIZADO:</strong>{' '}
                    <span>{corrective}</span>
                  </div>

                  {/* ★★★ REFACCIONES REQUERIDAS */}
                  <div className="text-slate-900 font-extrabold tracking-tight pt-0.5">
                    <span className="text-amber-500 mr-1.5">★★★</span>
                    <span className="uppercase font-black text-slate-900 mr-1.5">REFACCIONES REQUERIDAS:</span>
                    <span className="text-slate-800 font-bold uppercase">{parts}</span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Separador decorativo al final similar al de la imagen */}
        <div className="pt-6 mt-4 text-[10px] text-slate-300 font-mono tracking-widest text-center select-none">
          ****************************************************************************************************************
        </div>

      </div>

    </div>
  );
};
