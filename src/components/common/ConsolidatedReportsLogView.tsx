import React, { useState } from 'react';
import { ServiceOrder } from '../../types';
import { 
  Copy, 
  Check, 
  Search, 
  FileSpreadsheet,
  Phone,
  ChevronDown,
  Building2,
  Calendar,
  Layers,
  Sparkles
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
  title = 'Historial de Reporte de falla',
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
  // Busca por teléfonos, correctivo, nombre, número de unidad, placas, folio, refacciones, etc.
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

    // Todas las palabras clave deben coincidir
    return searchTokens.every(token => fullTarget.includes(token));
  });

  // DESCARGA EXCLUSIVA EN EXCEL (.xlsx) CON EL FORMATO EXACTO DE LA CAPTURA
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

  // Copiar al portapapeles resumen tabular en texto
  const handleCopyText = async () => {
    let text = `HISTORIAL DE REPORTE DE FALLA\r\n`;
    text += `Empresa: ${effectiveCompanyName}\r\n`;
    text += `Fecha Descarga: ${downloadDateDisplay}\r\n`;
    text += `Estatus de Factura: normal\r\n`;
    text += `Año: ${currentYear}\r\n\r\n`;
    text += `Fecha | Unidad/Eco | Operador | Km/Hubo | Servicio | Falla | Ubicación\r\n`;
    text += `--------------------------------------------------------------------------------\r\n`;

    filteredOrders.forEach((order) => {
      const fecha = formatFechaCreacionExcel(order.createdAt);
      const eco = order.vehicle?.economicNumber || order.unitNumber || 'S/E';
      const op = order.operatorName || order.userOperatorName || order.vehicle?.driverContact || 'Operador';
      const km = order.vehicle?.odometerReading || order.vehicle?.mileage || 'S/K';
      const serv = formatTipoServicioSolicitado(order);
      const falla = order.vehicle?.failureDescription || 'Revisión técnica';
      const ubi = order.vehicle?.location || 'Laborando';
      text += `${fecha} | ${eco} | ${op} | ${km} | ${serv} | ${falla} | ${ubi}\r\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast('success', 'Texto Copiado al Portapapeles', 'El historial en formato tabla se copió listo para WhatsApp u hojas de cálculo.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast('error', 'Error al copiar', 'No se pudo copiar automáticamente.');
    }
  };

  return (
    <div className="space-y-4 w-full">
      
      {/* ==================================================================== */}
      {/* BARRA SUPERIOR DE ACCIONES: DESCARGA EN EXCEL Y COPIAR                 */}
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
              {filteredOrders.length} registros • Exportación directa exclusiva en formato Excel (.xlsx)
              {effectiveCompanyName && ` • ${effectiveCompanyName}`}
            </p>
          </div>
        </div>

        {/* Botones de acción: Copiar y DESCARGA EN EXCEL (.xlsx) */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          <button
            type="button"
            onClick={handleCopyText}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            title="Copiar contenido estructurado de la tabla para enviar por WhatsApp"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Texto para WhatsApp'}</span>
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
      {/* VISTA TABULAR EXACTA A LA CAPTURA DE EXCEL (WhatsApp_Image...)       */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden font-sans">
        
        {/* BANNER SUPERIOR COLOR CORAL (Idéntico a la fila 1 del Excel) */}
        <div className="bg-[#FF6B4A] px-5 py-3.5 flex items-center justify-between text-white">
          <input
            type="text"
            value={headerTitle}
            onChange={(e) => setHeaderTitle(e.target.value)}
            aria-label="Título del historial de reporte de falla"
            className="font-bold text-lg sm:text-xl text-white bg-transparent border-none focus:outline-hidden focus:ring-0 w-full tracking-wide"
            placeholder="Historial de Reporte de falla"
          />
          <span className="text-[10px] font-semibold text-white/80 shrink-0 uppercase tracking-wider">
            Formato Excel Oficial
          </span>
        </div>

        {/* METADATOS DE EMPRESA Y FECHA (Filas 2, 3, 4, 5 del Excel) */}
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

        {/* TABLA PRINCIPAL DE 7 COLUMNAS (Idéntica a la captura del usuario) */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            
            {/* Cabecera Coral con Flechas Desplegables estilo Excel */}
            <thead>
              <tr className="bg-[#FF6B4A] text-white font-bold text-xs">
                
                {/* 1. Fecha de Creacion */}
                <th className="py-2.5 px-3.5 border-r border-[#FF856B] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>Fecha de Creacion</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-90 shrink-0" />
                  </div>
                </th>

                {/* 2. Unidad/Económico */}
                <th className="py-2.5 px-3.5 border-r border-[#FF856B] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>Unidad/Económico</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-90 shrink-0" />
                  </div>
                </th>

                {/* 3. Operador */}
                <th className="py-2.5 px-3.5 border-r border-[#FF856B] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>Operador</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-90 shrink-0" />
                  </div>
                </th>

                {/* 4. Kilometraje/Hubodómetro */}
                <th className="py-2.5 px-3.5 border-r border-[#FF856B] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>Kilometraje/Hubodómetro</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-90 shrink-0" />
                  </div>
                </th>

                {/* 5. Tipo de Servicio Solicitado */}
                <th className="py-2.5 px-3.5 border-r border-[#FF856B] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>Tipo de Servicio Solicitado</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-90 shrink-0" />
                  </div>
                </th>

                {/* 6. Falla Reportada */}
                <th className="py-2.5 px-3.5 border-r border-[#FF856B] min-w-[260px]">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>Falla Reportada</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-90 shrink-0" />
                  </div>
                </th>

                {/* 7. Ubicación */}
                <th className="py-2.5 px-3.5 whitespace-nowrap min-w-[150px]">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>Ubicación</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-90 shrink-0" />
                  </div>
                </th>

              </tr>
            </thead>

            {/* Filas de datos con fondo alterno Blanco / Salmón claro */}
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron reportes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const fecha = formatFechaCreacionExcel(order.createdAt);
                  const economico = order.vehicle?.economicNumber || order.unitNumber || 'S/E';
                  const operador = order.operatorName || order.userOperatorName || order.vehicle?.driverContact || 'Operador en turno';
                  const telefono = order.operatorPhone || '';
                  const km = order.vehicle?.odometerReading || order.vehicle?.mileage || 'S/K';
                  const tipoServicio = formatTipoServicioSolicitado(order);
                  const falla = order.vehicle?.failureDescription || order.initialDiagnosis || 'Revisión técnica general';
                  const ubicacion = order.vehicle?.location || 'Laborando';

                  // Alternancia de filas idéntica al Excel (blanco / melocotón suave)
                  const isEven = idx % 2 === 0;
                  const rowBg = isEven ? 'bg-white' : 'bg-[#FFF3EE]';

                  return (
                    <tr 
                      key={order.id || idx} 
                      className={`${rowBg} hover:bg-orange-100/50 transition-colors border-b border-slate-200/80 text-slate-800 text-xs`}
                    >
                      {/* 1. Fecha de Creación */}
                      <td className="py-2 px-3.5 border-r border-slate-200/80 font-medium text-slate-700 whitespace-nowrap">
                        {fecha}
                      </td>

                      {/* 2. Unidad/Económico */}
                      <td className="py-2 px-3.5 border-r border-slate-200/80 font-bold text-slate-900 whitespace-nowrap">
                        {economico}
                      </td>

                      {/* 3. Operador (con link de teléfono si existe) */}
                      <td className="py-2 px-3.5 border-r border-slate-200/80 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{operador}</span>
                          {telefono && (
                            <a 
                              href={`tel:${telefono.replace(/[^0-9+]/g, '')}`}
                              className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline inline-flex items-center gap-0.5 ml-1"
                              title={`Llamar a ${telefono}`}
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span className="text-[11px]">({telefono})</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 4. Kilometraje/Hubodómetro */}
                      <td className="py-2 px-3.5 border-r border-slate-200/80 font-medium text-slate-800 whitespace-nowrap">
                        {km}
                      </td>

                      {/* 5. Tipo de Servicio Solicitado */}
                      <td className="py-2 px-3.5 border-r border-slate-200/80 font-semibold whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          tipoServicio === 'Rescate' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                            : tipoServicio === 'Asistencia Vial'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {tipoServicio}
                        </span>
                      </td>

                      {/* 6. Falla Reportada */}
                      <td className="py-2 px-3.5 border-r border-slate-200/80 font-normal text-slate-800 leading-snug">
                        {falla}
                      </td>

                      {/* 7. Ubicación */}
                      <td className="py-2 px-3.5 font-medium text-slate-700 whitespace-nowrap">
                        {ubicacion}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* Pie de tabla con conteo */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Total de registros mostrados: <strong>{filteredOrders.length}</strong></span>
          <span className="text-[11px] text-slate-400">Los registros reflejan la captura y recepción en tiempo real</span>
        </div>

      </div>

    </div>
  );
};
