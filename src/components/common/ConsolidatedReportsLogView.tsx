import React, { useState } from 'react';
import { ServiceOrder } from '../../types';
import { 
  Copy, 
  Check, 
  Search, 
  FileSpreadsheet,
  Phone,
  Printer,
  FileText,
  X,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  exportHistorialReporteFallaExcel, 
  formatFechaCreacionExcel, 
  formatTipoServicioSolicitado 
} from '../../utils/excelExport';
import { getStatusSemaphore, getStatusTextColor } from '../../utils/statusSemaphore';

interface ConsolidatedReportsLogViewProps {
  orders: ServiceOrder[];
  title?: string;
  companyName?: string;
  showFilters?: boolean;
}

export const ConsolidatedReportsLogView: React.FC<ConsolidatedReportsLogViewProps> = ({
  orders,
  title = 'BITÁCORA DE REPORTES DE FALLA Y SERVICIOS',
  companyName,
  showFilters = true
}) => {
  const { addToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [headerTitle, setHeaderTitle] = useState(title);
  const [showPdfTableModal, setShowPdfTableModal] = useState(false);

  // Normalizador para búsqueda inteligente sin acentos ni distinción mayúsculas/minúsculas
  const normalize = (val: string | undefined | null) => 
    (val || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Helper para formatear encabezado del día (ej. MARTES 6 OCTUBRE)
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

  // Fecha y año dinámicos para los metadatos de la cabecera
  const now = new Date();
  const dayName = now.toLocaleDateString('es-MX', { weekday: 'long' });
  const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const monthName = now.toLocaleDateString('es-MX', { month: 'long' });
  const monthNameCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const downloadDateDisplay = `${dayNameCap} ${now.getDate()} de ${monthNameCap} del ${now.getFullYear()}`;
  const currentYear = String(now.getFullYear());

  // Nombre de la empresa cliente
  const effectiveCompanyName = 
    companyName || 
    orders[0]?.clientCompany || 
    orders[0]?.clientName || 
    'GRUPO SATI S.A. DE C.V.';

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
      `${formatTipoServicioSolicitado(order)} ` +
      `${getStatusSemaphore(order.status).label} ${rawPhones} ${cleanPhones}`
    );

    return searchTokens.every(token => fullTarget.includes(token));
  });

  // DESCARGA EXCLUSIVA EN EXCEL (.xlsx) CON EL FORMATO TABULAR EXACTO DE LA CAPTURA
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      addToast('warning', 'Sin registros', 'No hay reportes en la bitácora con los filtros seleccionados.');
      return;
    }

    const success = exportHistorialReporteFallaExcel(filteredOrders, {
      companyName: effectiveCompanyName,
      downloadDate: downloadDateDisplay,
      year: currentYear,
      filenamePrefix: `Historial_Reporte_${filteredOrders.length}_Regs`
    });

    if (success) {
      addToast(
        'success', 
        'Excel Descargado', 
        `Se descargó el Historial de Reporte de falla (${filteredOrders.length} registros) en Excel (.xlsx) con tablas completas.`
      );
    } else {
      addToast('error', 'Error', 'No se pudo generar el archivo Excel.');
    }
  };

  // Impresión directa del PDF con la tabla oficial
  const handlePrintPdfTable = () => {
    window.print();
  };

  // Copiar texto para WhatsApp
  const handleCopyText = async () => {
    let text = `${headerTitle}\r\n\r\n`;

    filteredOrders.forEach((order, idx) => {
      const dayHeader = formatDayHeader(order.createdAt);
      const eco = order.vehicle?.economicNumber || order.unitNumber || 'S/E';
      const operador = order.operatorName || order.userOperatorName || order.vehicle?.driverContact || 'Operador en turno';
      const telefono = order.operatorPhone ? ` (${order.operatorPhone})` : '';
      const failure = (order.vehicle.failureDescription || 'REVISIÓN GENERAL').trim();
      const km = order.vehicle?.odometerReading || order.vehicle?.mileage || 'S/K';
      const serv = formatTipoServicioSolicitado(order);
      const ubi = order.vehicle?.location || 'Laborando';
      const corrective = formatCorrective(order, idx);
      const parts = formatPartsRequired(order);

      text += `${dayHeader} • ${order.unitNumber || `Unidad ${eco}`} (${order.vehicle.plates})\r\n`;
      text += `FECHA DE CREACIÓN: ${formatFechaCreacionExcel(order.createdAt)}\r\n`;
      text += `UNIDAD / ECONÓMICO: ${eco}\r\n`;
      text += `OPERADOR: ${operador}${telefono}\r\n`;
      text += `KILOMETRAJE: ${km}\r\n`;
      text += `TIPO DE SERVICIO SOLICITADO: ${serv}\r\n`;
      text += `UBICACIÓN: ${ubi}\r\n`;
      text += `FALLA REPORTADA: ${failure}\r\n`;
      text += `CORRECTIVO REALIZADO: ${corrective}\r\n`;
      text += `★★★  REFACCIONES REQUERIDAS: ${parts}\r\n\r\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast('success', 'Texto Copiado al Portapapeles', 'El formato de bitácora se copió listo para WhatsApp.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast('error', 'Error al copiar', 'No se pudo copiar automáticamente.');
    }
  };

  return (
    <div className="space-y-4 w-full">
      
      {/* ==================================================================== */}
      {/* BARRA SUPERIOR DE ACCIONES: DESCARGA EN EXCEL, VER PDF TABLAS Y COPIAR*/}
      {/* ==================================================================== */}
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
              {filteredOrders.length} registros • Visualización en tarjetas • Exportación oficial en Excel y PDF
              {effectiveCompanyName && ` • ${effectiveCompanyName}`}
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Botón Copiar para WhatsApp */}
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
            <span>{copied ? '¡Copiado!' : 'Copiar Texto para WhatsApp'}</span>
          </button>

          {/* Botón Ver / Descargar PDF en Tablas */}
          <button
            type="button"
            onClick={() => setShowPdfTableModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Ver y exportar PDF con el formato de tablas idéntico a la hoja oficial"
          >
            <FileText className="w-4 h-4 text-blue-200" />
            <span>Exportar PDF (Tablas)</span>
          </button>

          {/* BOTÓN OFICIAL DE DESCARGA EN EXCEL CON LA TABLA EXACTA */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-black transition shadow-sm cursor-pointer ring-2 ring-emerald-400/40"
            title="Descargar el Historial de Reporte de falla en Excel (.xlsx) con tablas y columnas completas"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Descargar en Excel (.xlsx)</span>
          </button>

        </div>

      </div>

      {/* ==================================================================== */}
      {/* BUSCADOR INTELIGENTE Y SELECTOR DE ESTATUS EN BITÁCORAS              */}
      {/* ==================================================================== */}
      {showFilters && (
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
      )}

      {/* ==================================================================== */}
      {/* VISTA EN TARJETAS ESTRUCTURADAS (IDÉNTICO AL DISEÑO DE CAPTURA)     */}
      {/* ==================================================================== */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-300 shadow-xs font-sans text-slate-900 leading-relaxed">
        
        {/* TÍTULO PRINCIPAL EDITABLE O FIJO CON LÍNEA AZUL INFERIOR */}
        <div className="mb-6 pb-2 border-b-2 border-blue-900 flex items-center justify-between">
          <input
            type="text"
            value={headerTitle}
            onChange={(e) => setHeaderTitle(e.target.value)}
            className="font-black text-base sm:text-lg text-blue-900 uppercase tracking-tight bg-transparent border-none focus:outline-hidden focus:ring-0 w-full"
            placeholder="BITÁCORA DE REPORTES DE FALLA Y SERVICIOS"
          />
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
            (TÍTULO EDITABLE)
          </span>
        </div>

        {/* LISTADO DE REPORTES EN FORMATO DE TARJETA CON TODA LA NUEVA INFORMACIÓN */}
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm font-medium">
            No hay registros en la bitácora que coincidan con la búsqueda o estatus seleccionado.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, idx) => {
              const dayHeader = formatDayHeader(order.createdAt);
              const fechaCreacion = formatFechaCreacionExcel(order.createdAt);
              const economico = order.vehicle?.economicNumber || order.unitNumber || 'S/E';
              const operador = order.operatorName || order.userOperatorName || order.vehicle?.driverContact || 'Operador en turno';
              const telefono = order.operatorPhone || '';
              const km = order.vehicle?.odometerReading || order.vehicle?.mileage || 'S/K';
              const tipoServicio = formatTipoServicioSolicitado(order);
              const ubicacion = order.vehicle?.location || 'Laborando';
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
                  {/* Encabezado: Día • Unidad • Placas y Estatus Oficial a la derecha */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="font-black text-blue-900 text-xs sm:text-sm tracking-wide uppercase">
                      {dayHeader} • {order.unitNumber || `Unidad ${economico}`} ({order.vehicle.plates})
                    </h5>

                    {/* Badge de Estatus con punto y texto en colores según el requerimiento oficial */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-black uppercase ${textColor}`}>
                        ● {statusSemaphore.label}
                      </span>
                    </div>
                  </div>

                  {/* 1. FECHA DE CREACIÓN */}
                  <div className="text-slate-800">
                    <span className="font-extrabold text-slate-900">FECHA DE CREACIÓN: </span>
                    <span className="font-medium">{fechaCreacion}</span>
                  </div>

                  {/* 2. UNIDAD / ECONÓMICO */}
                  <div className="text-slate-800">
                    <span className="font-extrabold text-slate-900">UNIDAD / ECONÓMICO: </span>
                    <span className="font-bold text-[#040057]">{economico}</span>
                    <span className="text-slate-600 font-medium">
                      {order.vehicle.brandModel ? ` • ${order.vehicle.brandModel}` : ''}
                    </span>
                  </div>

                  {/* 3. OPERADOR (con link de llamada si existe teléfono) */}
                  <div className="font-semibold text-slate-800 flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900">OPERADOR:</span>
                    <span>{operador}</span>
                    {telefono && (
                      <a 
                        href={`tel:${telefono.replace(/[^0-9+]/g, '')}`} 
                        className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
                        title={`Llamar a ${telefono}`}
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>({telefono})</span>
                      </a>
                    )}
                  </div>

                  {/* 4. KILOMETRAJE (sin la palabra hubometro) */}
                  <div className="text-slate-800">
                    <span className="font-extrabold text-slate-900">KILOMETRAJE: </span>
                    <span className="font-medium text-slate-900">{km}</span>
                  </div>

                  {/* 5. TIPO DE SERVICIO SOLICITADO */}
                  <div className="text-slate-800 flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900">TIPO DE SERVICIO SOLICITADO: </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase ${
                      tipoServicio === 'Rescate' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                        : tipoServicio === 'Asistencia Vial'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}>
                      {tipoServicio}
                    </span>
                  </div>

                  {/* 6. UBICACIÓN */}
                  <div className="text-slate-800">
                    <span className="font-extrabold text-slate-900">UBICACIÓN: </span>
                    <span className="font-medium">{ubicacion}</span>
                  </div>

                  {/* 7. FALLA REPORTADA */}
                  <div className="text-slate-800">
                    <span className="font-extrabold text-slate-900">FALLA REPORTADA: </span>
                    <span className="font-medium">{failure}</span>
                  </div>

                  {/* 8. CORRECTIVO REALIZADO */}
                  <div className="text-slate-800">
                    <span className="font-extrabold text-slate-900">CORRECTIVO REALIZADO: </span>
                    <span className="font-medium">{corrective}</span>
                  </div>

                  {/* 9. REFACCIONES REQUERIDAS */}
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

      {/* ==================================================================== */}
      {/* MODAL EXCLUSIVO: EXPORTAR / IMPRIMIR PDF EN FORMATO DE TABLAS OFICIAL */}
      {/* ==================================================================== */}
      {showPdfTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" />
                <h3 className="font-black text-base sm:text-lg text-[#040057]">
                  Vista de Impresión / PDF en Tablas Oficiales
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPdfTable}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar como PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfTableModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Documento en Tablas Oficiales (Idéntico a la captura del usuario) */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs print:m-0 print:border-none">
              
              {/* Banner Coral */}
              <div className="bg-[#FF6B4A] px-5 py-3 text-white font-bold text-lg">
                Historial de Reporte de falla
              </div>

              {/* Metadatos */}
              <div className="px-5 py-3 bg-white text-xs text-slate-800 space-y-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 w-36 shrink-0">Empresa:</span>
                  <span className="font-semibold text-slate-800 uppercase">{effectiveCompanyName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 w-36 shrink-0">Fecha Descarga:</span>
                  <span className="text-slate-700">{downloadDateDisplay}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 w-36 shrink-0">Estatus de Factura:</span>
                  <span className="text-slate-700">normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 w-36 shrink-0">Año:</span>
                  <span className="text-slate-700">{currentYear}</span>
                </div>
              </div>

              {/* Tabla de 7 columnas */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FF6B4A] text-white font-bold text-xs">
                      <th className="py-2.5 px-3 border-r border-[#FF856B]">Fecha de Creacion</th>
                      <th className="py-2.5 px-3 border-r border-[#FF856B]">Unidad/Económico</th>
                      <th className="py-2.5 px-3 border-r border-[#FF856B]">Operador</th>
                      <th className="py-2.5 px-3 border-r border-[#FF856B]">Kilometraje</th>
                      <th className="py-2.5 px-3 border-r border-[#FF856B]">Tipo de Servicio Solicitado</th>
                      <th className="py-2.5 px-3 border-r border-[#FF856B]">Falla Reportada</th>
                      <th className="py-2.5 px-3">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o, i) => {
                      const fecha = formatFechaCreacionExcel(o.createdAt);
                      const eco = o.vehicle?.economicNumber || o.unitNumber || 'S/E';
                      const op = o.operatorName || o.userOperatorName || o.vehicle?.driverContact || 'Operador en turno';
                      const tel = o.operatorPhone ? ` (${o.operatorPhone})` : '';
                      const km = o.vehicle?.odometerReading || o.vehicle?.mileage || 'S/K';
                      const tipo = formatTipoServicioSolicitado(o);
                      const falla = o.vehicle?.failureDescription || o.initialDiagnosis || 'Revisión técnica';
                      const ubi = o.vehicle?.location || 'Laborando';
                      const isEven = i % 2 === 0;

                      return (
                        <tr key={i} className={`${isEven ? 'bg-white' : 'bg-[#FFF3EE]'} border-b border-slate-200 text-xs`}>
                          <td className="py-2 px-3 border-r border-slate-200 font-medium whitespace-nowrap">{fecha}</td>
                          <td className="py-2 px-3 border-r border-slate-200 font-bold whitespace-nowrap">{eco}</td>
                          <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">{op}{tel}</td>
                          <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">{km}</td>
                          <td className="py-2 px-3 border-r border-slate-200 font-semibold whitespace-nowrap">{tipo}</td>
                          <td className="py-2 px-3 border-r border-slate-200">{falla}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{ubi}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
