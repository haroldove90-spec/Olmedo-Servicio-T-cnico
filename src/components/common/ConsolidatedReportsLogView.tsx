import React, { useState } from 'react';
import { ServiceOrder } from '../../types';
import { 
  Copy, 
  Check, 
  Search, 
  FileSpreadsheet,
  Layers,
  Wrench,
  Truck,
  Phone,
  User,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportOrdersToExcel } from '../../utils/excelExport';
import { getStatusSemaphore, getStatusTextColor } from '../../utils/statusSemaphore';

interface ConsolidatedReportsLogViewProps {
  orders: ServiceOrder[];
  title?: string;
  companyName?: string;
  showFilters?: boolean;
}

export const ConsolidatedReportsLogView: React.FC<ConsolidatedReportsLogViewProps> = ({
  orders,
  title = 'BITÁCORA TÉCNICA DE REPORTES Y SERVICIOS',
  companyName,
  showFilters = true
}) => {
  const { addToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [headerTitle, setHeaderTitle] = useState(title);

  // Normalizador para búsqueda inteligente sin acentos ni distinción mayúsculas/minúsculas
  const normalize = (val: string | undefined | null) => 
    (val || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Helper para formatear fecha de cada entrada de bitácora
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
      return order.workPerformedDetail.replace(/^CORRECTIVO REALIZADO:\s*/i, '');
    }

    if (order.repairs && order.repairs.length > 0) {
      return order.repairs.map((r, rIdx) => 
        `Asistencia vial ${index + 1}.${rIdx + 1}. ${r.title} OK: ${r.description} OK.`
      ).join(' ');
    }

    const nature = order.serviceType === 'rescate' ? 'Asistencia vial' : 'Servicio en taller';
    return `${nature} ${index + 1}. Se realiza diagnóstico integral, ajuste y calibración operativa OK. Unidad habilitada.`;
  };

  // Normalizar y clasificar el estatus de una orden en uno de los 5 estatus oficiales
  const getOrderOfficialStatusKey = (order: ServiceOrder): string => {
    const s = order.status;
    if (s === 'por_atender' || s === 'solicitado') return 'por_atender';
    if (s === 'en_proceso' || s === 'asignado' || s === 'en_diagnostico_trabajo') return 'en_proceso';
    if (s === 'pendiente_refacciones') return 'pendiente_refacciones';
    if (s === 'validando_pruebas' || s === 'evidencias_en_revision' || s === 'evidencias_rechazadas' || s === 'cotizacion_pendiente') return 'validando_pruebas';
    return 'habilitada';
  };

  // BUSCADOR INTELIGENTE MULTICRITERIO PARA BITÁCORAS
  // Busca por teléfonos, correctivo, nombre, nombre de unidad, placas, folio, refacciones, etc.
  const filteredOrders = orders.filter(order => {
    // 1. Filtro por Estatus Oficial
    if (statusFilter !== 'todos') {
      const officialKey = getOrderOfficialStatusKey(order);
      if (officialKey !== statusFilter) {
        return false;
      }
    }

    // 2. Filtro de búsqueda inteligente por texto
    if (!searchTerm.trim()) return true;

    const query = normalize(searchTerm);
    const searchTokens = query.split(/\s+/).filter(Boolean);

    // Extraer teléfonos
    const rawPhones = `${order.operatorPhone || ''} ${order.vehicle.driverContact || ''} ${order.clientContact || ''}`;
    const cleanPhones = rawPhones.replace(/[^0-9]/g, ' ');

    // Extraer refacciones
    const partsText = (order.partsUsed || []).map(p => `${p.description} ${p.partNumber || ''} ${p.position || ''}`).join(' ');

    // Extraer reparaciones
    const repairsText = (order.repairs || []).map(r => `${r.title} ${r.description}`).join(' ');

    // Target integral de búsqueda
    const fullTarget = normalize(
      `${order.folio} ${order.reportNumber || ''} ${order.unitNumber || ''} ` +
      `${order.vehicle.economicNumber} ${order.vehicle.plates} ${order.vehicle.brand || ''} ${order.vehicle.model || ''} ` +
      `${order.clientName || ''} ${order.clientCompany || ''} ${order.clientContact || ''} ` +
      `${order.operatorName || ''} ${order.userOperatorName || ''} ${order.vehicle.driverContact || ''} ` +
      `${order.assignedTechnicianName || ''} ` +
      `${order.vehicle.location || ''} ${order.vehicle.failureDescription || ''} ` +
      `${order.initialDiagnosis || ''} ${order.workPerformedDetail || ''} ` +
      `${partsText} ${repairsText} ${order.serviceType || ''} ${order.closingNotes || ''} ` +
      `${getStatusSemaphore(order.status).label} ${rawPhones} ${cleanPhones}`
    );

    // Todas las palabras clave deben coincidir
    return searchTokens.every(token => fullTarget.includes(token));
  });

  // Generador de texto plano idéntico a la imagen del usuario
  const generatePlainText = (): string => {
    let text = `${headerTitle}\r\n\r\n`;

    filteredOrders.forEach((order, idx) => {
      const dayHeader = formatDayHeader(order.createdAt);
      const operator = order.operatorName || order.userOperatorName || order.vehicle.driverContact || 'Operador en turno';
      const failure = (order.vehicle.failureDescription || 'REVISIÓN GENERAL').trim();
      const corrective = formatCorrective(order, idx);
      const parts = formatPartsRequired(order);

      text += `${dayHeader}\r\n`;
      text += `OPERADOR: ${operator}\r\n`;
      text += `FALLA REPORTADA: ${failure}\r\n`;
      text += `CORRECTIVO REALIZADO: ${corrective}\r\n`;
      text += `★★★  REFACCIONES REQUERIDAS: ${parts}\r\n\r\n`;
    });

    return text;
  };

  // Copiar al portapapeles para WhatsApp
  const handleCopyText = async () => {
    const fullText = generatePlainText();
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      addToast('success', 'Texto Copiado al Portapapeles', 'El formato de bitácora se copió listo para WhatsApp.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast('error', 'Error al copiar', 'No se pudo copiar automáticamente.');
    }
  };

  // DESCARGA EXCLUSIVA EN EXCEL (.xlsx) PARA BITÁCORAS
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      addToast('warning', 'Sin registros', 'No hay reportes en la bitácora con los filtros seleccionados.');
      return;
    }

    const success = exportOrdersToExcel(filteredOrders, {
      filenamePrefix: `Bitacora_Tecnica_${filteredOrders.length}_Registros`,
      sheetName: 'Bitácora de Intervenciones',
      businessName: 'Servicio Técnico Olmedo'
    });

    if (success) {
      addToast('success', 'Excel Generado', `Se descargaron ${filteredOrders.length} registros de la bitácora en Excel (.xlsx) con tablas completas.`);
    } else {
      addToast('error', 'Error', 'No se pudo generar el archivo Excel.');
    }
  };

  return (
    <div className="space-y-4 w-full">
      
      {/* Barra de herramientas de Bitácoras: SOLO EXPORTACIÓN EN EXCEL (SIN PDF Y SIN TXT) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm sm:text-base text-[#040057]">
              Módulo de Bitácora Técnica Consolidada
            </h4>
            <p className="text-xs text-slate-500">
              {filteredOrders.length} intervenciones registradas • Exportación directa exclusiva en formato Excel (.xlsx)
              {companyName && ` • ${companyName}`}
            </p>
          </div>
        </div>

        {/* Botones de acción: Copiar para WhatsApp y DESCARGA EN EXCEL ÚNICAMENTE */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          <button
            type="button"
            onClick={handleCopyText}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            title="Copiar contenido de la bitácora estructurado para enviar por WhatsApp"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado a Portapapeles!' : 'Copiar Texto para WhatsApp'}</span>
          </button>

          {/* ÚNICO BOTÓN DE DESCARGA: EXCEL CON TABLAS Y DATOS COMPLETOS */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-black transition shadow-sm cursor-pointer ring-2 ring-emerald-400/40"
            title="Descargar la bitácora con todas las tablas y columnas en formato Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Descargar en Excel (.xlsx)</span>
          </button>

        </div>

      </div>

      {/* BUSCADOR INTELIGENTE Y SELECTOR DE ESTATUS EN BITÁCORAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Buscador inteligente */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscador inteligente: busca por teléfono, correctivo, nombre, número de unidad, placas, refacción o falla..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#040057] shadow-2xs"
          />
        </div>

        {/* Campo para seleccionar estatus ajustado con los 5 estatus oficiales y colores */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estatus oficial"
            className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white text-xs sm:text-sm font-bold text-[#040057] focus:ring-2 focus:ring-[#040057] transition cursor-pointer shadow-2xs"
          >
            <option value="todos">Todos los Reportes (Cualquier estatus)</option>
            <option value="por_atender" className="text-amber-700 font-bold">
              Por atender (Jefe de taller aun no asigna tecnico)
            </option>
            <option value="en_proceso" className="text-blue-700 font-bold">
              En proceso (cuando tecnico ya fue asigndo)
            </option>
            <option value="pendiente_refacciones" className="text-orange-700 font-bold">
              Pendiente por refacciones
            </option>
            <option value="validando_pruebas" className="text-purple-700 font-bold">
              Validando / Pruebas (Gerente revisa evidencia para liberar)
            </option>
            <option value="habilitada" className="text-emerald-700 font-bold">
              Habilitada (Se envia notificación al cliente)
            </option>
          </select>
        </div>

      </div>

      {/* TABLA Y VISTA DE BITÁCORA ESTRUCTURADA */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-300 shadow-xs font-sans text-slate-900 leading-relaxed">
        
        {/* TÍTULO PRINCIPAL EDITABLE O FIJO */}
        <div className="mb-6 pb-2 border-b-2 border-blue-900 flex items-center justify-between">
          <input
            type="text"
            value={headerTitle}
            onChange={(e) => setHeaderTitle(e.target.value)}
            className="font-black text-base sm:text-lg text-blue-900 uppercase tracking-tight bg-transparent border-none focus:outline-hidden focus:ring-0 w-full"
            placeholder="BITÁCORA TÉCNICA DE INTERVENCIONES Y FALLAS"
          />
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
            (Título editable)
          </span>
        </div>

        {/* LISTADO DE REPORTES CON LA ESTRUCTURA EXACTA */}
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No hay registros en la bitácora que coincidan con la búsqueda o estatus seleccionado.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, idx) => {
              const dayHeader = formatDayHeader(order.createdAt);
              const operator = order.operatorName || order.userOperatorName || order.vehicle.driverContact || 'OPERADOR NO REGISTRADO';
              const operatorPhone = order.operatorPhone || '';
              const failure = (order.vehicle.failureDescription || 'REVISIÓN GENERAL DEL SISTEMA').trim();
              const corrective = formatCorrective(order, idx);
              const parts = formatPartsRequired(order);
              const statusSemaphore = getStatusSemaphore(order.status);
              const textColor = getStatusTextColor(order.status);

              return (
                <div
                  key={order.id || idx}
                  className="pb-6 border-b border-slate-200 last:border-b-0 space-y-2 text-xs sm:text-sm"
                >
                  {/* Encabezado del día en Mayúsculas Azules y Badge de Estatus */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="font-black text-blue-800 text-xs sm:text-sm tracking-wide">
                      {dayHeader} • {order.unitNumber || `Unidad ${order.vehicle.economicNumber}`} ({order.vehicle.plates})
                    </h5>

                    {/* Estatus con texto en colores según el requerimiento oficial */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-black uppercase ${textColor}`}>
                        ● {statusSemaphore.label}
                      </span>
                    </div>
                  </div>

                  {/* Operador al volante con teléfono si está registrado */}
                  <div className="font-semibold text-slate-800 flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900">OPERADOR:</span>
                    <span>{operator}</span>
                    {operatorPhone && (
                      <a 
                        href={`tel:${operatorPhone.replace(/[^0-9+]/g, '')}`} 
                        className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
                        title="Llamar"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>({operatorPhone})</span>
                      </a>
                    )}
                  </div>

                  {/* Falla Reportada */}
                  <div className="text-slate-800">
                    <span className="font-extrabold text-slate-900">FALLA REPORTADA: </span>
                    <span className="font-medium">{failure}</span>
                  </div>

                  {/* Correctivo Realizado */}
                  <div className="text-slate-800">
                    <span className="font-extrabold text-slate-900">CORRECTIVO REALIZADO: </span>
                    <span className="font-medium">{corrective}</span>
                  </div>

                  {/* Refacciones Requeridas */}
                  <div className="text-slate-900 pt-0.5">
                    <span className="font-black text-slate-900">★★★ REFACCIONES REQUERIDAS: </span>
                    <span className="font-bold text-[#040057]">{parts}</span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
