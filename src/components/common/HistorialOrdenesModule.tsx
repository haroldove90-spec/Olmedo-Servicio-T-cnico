import React, { useState } from 'react';
import { 
  Archive, 
  Search, 
  Filter, 
  FileText, 
  Printer, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Calendar, 
  AlertCircle, 
  CheckCheck, 
  X, 
  Save, 
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Camera,
  Layers,
  FileSpreadsheet,
  PlusCircle,
  HelpCircle,
  Lock,
  AlertTriangle,
  Sparkles,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, UserRole } from '../../types';
import { TechnicalReportDocument } from './TechnicalReportDocument';
import { StatusSemaphoreBadge } from './StatusSemaphoreBadge';
import { EvidenceLockWarningModal } from './EvidenceLockWarningModal';
import { exportOrdersToExcel } from '../../utils/excelExport';

interface HistorialOrdenesModuleProps {
  forcedRole?: UserRole;
}

export const HistorialOrdenesModule: React.FC<HistorialOrdenesModuleProps> = ({ forcedRole }) => {
  const { 
    currentRole: contextRole, 
    orders, 
    updateOrderGeneral, 
    closeRepairOrder, 
    deleteOrder, 
    addToast 
  } = useApp();

  const activeRole = forcedRole || contextRole || 'gerencia';

  // Modo de visualización: Lista compacta predeterminada (datos principales) vs Tarjetas detalladas
  const [viewMode, setViewMode] = useState<'lista' | 'tarjetas'>('lista');

  // Selección múltiple para exportar en Excel (uno por uno, seleccionados o todos)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Filtros del Buscador Inteligente
  const [searchTerm, setSearchTerm] = useState('');
  const [systemCategoryFilter, setSystemCategoryFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'cerradas' | 'abiertas'>('todas');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'todos' | 'taller' | 'asistencia' | 'rescate'>('todos');
  const [dateFilter, setDateFilter] = useState<'todos' | 'este_mes' | 'mes_anterior' | 'antiguas'>('todos');

  // Modales
  const [viewDetailOrder, setViewDetailOrder] = useState<ServiceOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [printReportOrder, setPrintReportOrder] = useState<ServiceOrder | null>(null);
  const [orderToClose, setOrderToClose] = useState<ServiceOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);

  // Estados del Formulario de Cierre
  const defaultCloserName = 
    activeRole === 'tecnico' ? 'Carlos Mendoza (Técnico Titular)' :
    activeRole === 'jefe_taller' ? 'Ing. Fernando Olvera (Jefe de Taller)' :
    'Ing. Arturo Olmedo (Dirección General)';

  const [closerName, setCloserName] = useState(defaultCloserName);
  const [closingNotes, setClosingNotes] = useState('Servicio y reparaciones concluidas a entera satisfacción. Unidad probada y liberada físicamente.');
  const [finalKm, setFinalKm] = useState('');
  const [driverReceived, setDriverReceived] = useState('');

  // Estados del Formulario de Edición
  const [editClientName, setEditClientName] = useState('');
  const [editClientCompany, setEditClientCompany] = useState('');
  const [editPlates, setEditPlates] = useState('');
  const [editEco, setEditEco] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editChassis, setEditChassis] = useState('');
  const [editEngine, setEditEngine] = useState('');
  const [editOdometer, setEditOdometer] = useState('');
  const [editFailure, setEditFailure] = useState('');
  const [editWorkPerformed, setEditWorkPerformed] = useState('');
  const [editClosingNotes, setEditClosingNotes] = useState('');

  // Normalizador para búsqueda inteligente sin acentos ni distinción mayúsculas
  const normalize = (val: string | undefined | null) => 
    (val || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const normalizedSearch = normalize(searchTerm);

  // Filtrado Inteligente de Órdenes y Reportes de Falla
  const filteredOrders = orders.filter(order => {
    // 1. Buscador Inteligente Multicriterio (Folio, Reporte, Cliente, Placas, Eco, Falla, Chofer, Diagnóstico, Refacciones, Técnico)
    if (normalizedSearch) {
      const partsText = (order.partsUsed || []).map(p => `${p.description || ''} ${p.partNumber || ''}`).join(' ');
      const searchTarget = normalize(
        `${order.folio} ${order.reportNumber || ''} ${order.clientName || ''} ${order.clientCompany || ''} ${order.clientContact || ''} ` +
        `${order.vehicle.plates || ''} ${order.vehicle.economicNumber || ''} ${order.vehicle.brand || ''} ${order.vehicle.model || ''} ` +
        `${order.vehicle.failureDescription || ''} ${order.initialDiagnosis || ''} ${order.workPerformedDetail || ''} ` +
        `${order.assignedTechnicianName || ''} ${order.closedBy || ''} ${order.receivedByDriver || ''} ${order.userOperatorName || ''} ` +
        `${order.vehicle.driverContact || ''} ${order.vehicle.location || ''} ${partsText} ${order.closingNotes || ''}`
      );

      // Si el usuario escribe múltiples palabras (ej. "fuga volvo", "frenos eco-55"), todas deben coincidir
      const searchTokens = normalizedSearch.split(/\s+/).filter(Boolean);
      const matchesAllTokens = searchTokens.every(token => searchTarget.includes(token));
      if (!matchesAllTokens) return false;
    }

    // 2. Filtro Inteligente por Categoría de Sistema / Falla
    if (systemCategoryFilter !== 'todos') {
      const fullFailureText = normalize(
        `${order.vehicle.failureDescription || ''} ${order.initialDiagnosis || ''} ${order.workPerformedDetail || ''}`
      );
      if (systemCategoryFilter === 'motor') {
        const keywords = ['motor', 'calentamiento', 'temperatura', 'enfriamiento', 'anticongelante', 'cilindro', 'cigueñal', 'piston', 'humo', 'termostato', 'aceite'];
        if (!keywords.some(k => fullFailureText.includes(k))) return false;
      } else if (systemCategoryFilter === 'frenos') {
        const keywords = ['freno', 'balata', 'disco', 'aire', 'valvula', 'caliper', 'tambor', 'pedal', 'abs', 'lineas'];
        if (!keywords.some(k => fullFailureText.includes(k))) return false;
      } else if (systemCategoryFilter === 'embrague') {
        const keywords = ['embrague', 'clutch', 'transmision', 'caja', 'velocidad', 'reten', 'collarin', 'biela', 'cardan'];
        if (!keywords.some(k => fullFailureText.includes(k))) return false;
      } else if (systemCategoryFilter === 'electrico') {
        const keywords = ['electrico', 'bateria', 'alternador', 'sensor', 'arranque', 'marcha', 'luz', 'luces', 'fusible', 'corto'];
        if (!keywords.some(k => fullFailureText.includes(k))) return false;
      } else if (systemCategoryFilter === 'fugas') {
        const keywords = ['fuga', 'aceite', 'goteo', 'manguera', 'reten', 'sellado', 'empaque', 'diesel'];
        if (!keywords.some(k => fullFailureText.includes(k))) return false;
      } else if (systemCategoryFilter === 'rescate') {
        if (!order.requiresRescue && order.serviceType !== 'rescate') return false;
      }
    }

    // 3. Filtro por estatus
    const isClosed = order.status === 'cerrado' || order.status === 'unidad_liberada' || order.status === 'facturado';
    if (statusFilter === 'cerradas' && !isClosed) return false;
    if (statusFilter === 'abiertas' && isClosed) return false;

    // 4. Filtro por tipo de servicio
    if (serviceTypeFilter !== 'todos' && order.serviceType !== serviceTypeFilter) return false;

    // 5. Filtro por fecha
    if (dateFilter !== 'todos') {
      const orderDate = new Date(order.createdAt).getTime();
      const now = Date.now();
      const thirtyDays = 1000 * 60 * 60 * 24 * 30;
      const sixtyDays = thirtyDays * 2;

      if (dateFilter === 'este_mes' && (now - orderDate) > thirtyDays) return false;
      if (dateFilter === 'mes_anterior' && ((now - orderDate) <= thirtyDays || (now - orderDate) > sixtyDays)) return false;
      if (dateFilter === 'antiguas' && (now - orderDate) <= sixtyDays) return false;
    }

    return true;
  });

  // Estadísticas del Historial
  const totalInHistory = orders.length;
  const closedCount = orders.filter(o => o.status === 'cerrado' || o.status === 'unidad_liberada' || o.status === 'facturado').length;
  const openCount = orders.filter(o => o.status !== 'cerrado' && o.status !== 'unidad_liberada' && o.status !== 'facturado').length;

  const [showCloseWarningModal, setShowCloseWarningModal] = useState(false);
  const [closeWarningMessage, setCloseWarningMessage] = useState('');

  // Apertura de modal de cierre
  const handleOpenCloseModal = (order: ServiceOrder) => {
    setOrderToClose(order);
    setCloserName(defaultCloserName);
    setFinalKm(order.vehicle.odometerReading || order.vehicle.mileage || '');
    setDriverReceived(order.receivedByDriver || order.userOperatorName || order.vehicle.driverContact || '');
    setClosingNotes(order.closingNotes || 'Servicio y reparaciones concluidas a satisfacción. Unidad probada y liberada.');
  };

  // Confirmar Cierre con candado de evidencias
  const handleConfirmClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToClose) return;

    const hasBefore = orderToClose.evidences.some(ev => ev.phase === 'antes') || (orderToClose.repairs || []).some(r => Boolean(r.evidenceBeforeUrl));
    const hasAfter = orderToClose.evidences.some(ev => ev.phase === 'despues' || ev.phase === 'correctivo_realizado') || (orderToClose.repairs || []).some(r => Boolean(r.evidenceAfterUrl));

    // CANDADO ESTRICTO: no podrá continuar con el proceso si no sube 2 evidencias (antes y después)
    if (!hasBefore || !hasAfter) {
      setCloseWarningMessage(
        'Candado Obligatorio: No es posible cerrar la orden sin contar con al menos 1 evidencia ANTES y 1 evidencia DESPUÉS de las reparaciones realizadas.'
      );
      setShowCloseWarningModal(true);
      return;
    }

    closeRepairOrder(orderToClose.id, {
      closedBy: closerName.trim() || defaultCloserName,
      closedByRole: activeRole,
      closingNotes: closingNotes.trim(),
      receivedByDriver: driverReceived.trim() || undefined,
      finalKilometers: finalKm.trim() || undefined,
    });

    setOrderToClose(null);
  };

  // Advertencia al pulsar 'X' o cancelar si faltan evidencias
  const handleAttemptCloseOrderModal = () => {
    if (!orderToClose) return;
    const hasBefore = orderToClose.evidences.some(ev => ev.phase === 'antes') || (orderToClose.repairs || []).some(r => Boolean(r.evidenceBeforeUrl));
    const hasAfter = orderToClose.evidences.some(ev => ev.phase === 'despues' || ev.phase === 'correctivo_realizado') || (orderToClose.repairs || []).some(r => Boolean(r.evidenceAfterUrl));

    if (!hasBefore || !hasAfter) {
      setCloseWarningMessage(
        '¡Atención! Para que no se te olvide tomar tu evidencia ANTES y tu evidencia DESPUÉS, recuerda que son indispensables para auditar el servicio. ¿Deseas salir de todas formas?'
      );
      setShowCloseWarningModal(true);
      return;
    }
    setOrderToClose(null);
  };

  // Apertura de modal de edición
  const handleOpenEditModal = (order: ServiceOrder) => {
    setEditingOrder(order);
    setEditClientName(order.clientName || '');
    setEditClientCompany(order.clientCompany || '');
    setEditPlates(order.vehicle.plates || '');
    setEditEco(order.vehicle.economicNumber || '');
    setEditBrand(order.vehicle.brand || '');
    setEditModel(order.vehicle.model || '');
    setEditChassis(order.vehicle.chassisSerialNumber || '');
    setEditEngine(order.vehicle.engineModelTransmission || '');
    setEditOdometer(order.vehicle.odometerReading || order.vehicle.mileage || '');
    setEditFailure(order.vehicle.failureDescription || '');
    setEditWorkPerformed(order.workPerformedDetail || '');
    setEditClosingNotes(order.closingNotes || '');
  };

  // Guardar Cambios de Edición
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    updateOrderGeneral(editingOrder.id, {
      clientName: editClientName.trim() || editingOrder.clientName,
      clientCompany: editClientCompany.trim() || undefined,
      workPerformedDetail: editWorkPerformed.trim() || editingOrder.workPerformedDetail,
      closingNotes: editClosingNotes.trim() || editingOrder.closingNotes,
      vehicle: {
        ...editingOrder.vehicle,
        plates: editPlates.trim().toUpperCase() || editingOrder.vehicle.plates,
        economicNumber: editEco.trim().toUpperCase() || editingOrder.vehicle.economicNumber,
        brand: editBrand.trim() || editingOrder.vehicle.brand,
        model: editModel.trim() || editingOrder.vehicle.model,
        chassisSerialNumber: editChassis.trim() || editingOrder.vehicle.chassisSerialNumber,
        engineModelTransmission: editEngine.trim() || editingOrder.vehicle.engineModelTransmission,
        odometerReading: editOdometer.trim() || editingOrder.vehicle.odometerReading,
        mileage: editOdometer.trim() || editingOrder.vehicle.mileage,
        failureDescription: editFailure.trim() || editingOrder.vehicle.failureDescription,
      },
    });

    addToast('success', 'Orden Actualizada', `Se guardaron los cambios de la orden ${editingOrder.folio}.`);
    setEditingOrder(null);
  };

  // Confirmar Borrado
  const handleConfirmDelete = () => {
    if (!orderToDelete) return;
    deleteOrder(orderToDelete.id);
    setOrderToDelete(null);
  };

  // Manejo de Selección para exportación en Excel
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // 1. Descarga individual en Excel (uno por uno)
  const handleExportSingleExcel = (order: ServiceOrder) => {
    const success = exportOrdersToExcel([order], {
      filenamePrefix: `Reporte_${order.folio}`,
      sheetName: `Reporte ${order.folio}`,
      businessName: 'Servicio Técnico Olmedo'
    });
    if (success) {
      addToast('success', 'Excel Generado', `Reporte ${order.folio} descargado en Excel (.xlsx).`);
    } else {
      addToast('error', 'Error', 'No se pudo generar el archivo Excel.');
    }
  };

  // 2. Descarga de seleccionados en Excel (algunos seleccionados mediante casillas)
  const handleExportSelectedExcel = () => {
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    if (selectedOrders.length === 0) {
      addToast('warning', 'Sin selección', 'Marca la casilla de los reportes u órdenes que deseas exportar.');
      return;
    }
    const success = exportOrdersToExcel(selectedOrders, {
      filenamePrefix: `Seleccionados_${selectedOrders.length}_Reportes`,
      sheetName: 'Reportes Seleccionados',
      businessName: 'Servicio Técnico Olmedo'
    });
    if (success) {
      addToast('success', 'Excel Generado', `Se descargaron ${selectedOrders.length} reporte(s) seleccionados en Excel (.xlsx).`);
    } else {
      addToast('error', 'Error', 'No se pudo generar el archivo Excel.');
    }
  };

  // 3. Descarga de todos los visibles o filtrados al mismo tiempo en Excel
  const handleExportAllFilteredExcel = () => {
    if (filteredOrders.length === 0) {
      addToast('warning', 'Sin registros', 'No hay órdenes en la lista actual para exportar.');
      return;
    }
    const isFiltered = Boolean(searchTerm || systemCategoryFilter !== 'todos' || statusFilter !== 'todas' || serviceTypeFilter !== 'todos' || dateFilter !== 'todos');
    const success = exportOrdersToExcel(filteredOrders, {
      filenamePrefix: isFiltered ? `Historial_Filtrado_${filteredOrders.length}_Reportes` : `Historial_Completo_${filteredOrders.length}_Reportes`,
      sheetName: 'Historial de Reportes',
      businessName: 'Servicio Técnico Olmedo'
    });
    if (success) {
      addToast('success', 'Historial Descargado', `Se descargaron ${filteredOrders.length} reporte(s) del historial en Excel (.xlsx).`);
    } else {
      addToast('error', 'Error', 'No se pudo generar el archivo Excel.');
    }
  };

  // 4. Descarga de toda la base histórica completa (sin importar filtros)
  const handleExportAllDatabaseExcel = () => {
    if (orders.length === 0) {
      addToast('warning', 'Sin registros', 'No hay órdenes en la base de datos.');
      return;
    }
    const success = exportOrdersToExcel(orders, {
      filenamePrefix: `Historial_Total_BD_${orders.length}_Reportes`,
      sheetName: 'Base Histórica Total',
      businessName: 'Servicio Técnico Olmedo'
    });
    if (success) {
      addToast('success', 'Base Total Descargada', `Se exportaron las ${orders.length} órdenes totales en Excel (.xlsx).`);
    } else {
      addToast('error', 'Error', 'No se pudo generar el archivo Excel.');
    }
  };

  // Retrocompatibilidad con llamadas legacy
  const handleExportCSV = handleExportAllFilteredExcel;

  return (
    <div className="space-y-6 pb-12 w-full max-w-full min-w-0">
      
      {/* Cabecera del Módulo de Historial */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057] flex items-center gap-2 truncate">
                <Archive className="w-6 h-6 text-indigo-600 shrink-0" />
                <span>Historial de Órdenes de Reparación y Servicios</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Consulta, edición, impresión oficial de reportes técnicos, exportación a PDF/Excel y cierre formal de órdenes de trabajo.
            </p>
          </div>

          {/* Acciones Superiores de Exportación en Excel y Gestión */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {selectedOrderIds.length > 0 && (
              <button
                onClick={handleExportSelectedExcel}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer ring-2 ring-emerald-300 animate-pulse"
                title="Descargar en Excel (.xlsx) las órdenes marcadas con casilla"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Seleccionados ({selectedOrderIds.length}) en Excel</span>
              </button>
            )}

            <button
              onClick={handleExportAllFilteredExcel}
              disabled={filteredOrders.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Descargar todas las órdenes visibles en archivo Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Descargar Todo en Excel ({filteredOrders.length})</span>
            </button>

            {orders.length > filteredOrders.length && (
              <button
                onClick={handleExportAllDatabaseExcel}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Descargar todo el historial general sin filtros en Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span>BD Completa ({orders.length})</span>
              </button>
            )}

            {openCount > 0 && (
              <button
                onClick={() => {
                  const firstOpen = orders.find(o => o.status !== 'cerrado' && o.status !== 'unidad_liberada');
                  if (firstOpen) handleOpenCloseModal(firstOpen);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Dar por Cerrada una Orden</span>
              </button>
            )}
          </div>
        </div>

        {/* Tarjetas de Estadísticas Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-500">Total en Historial</div>
            <div className="text-xl sm:text-2xl font-black text-[#040057] mt-0.5">{totalInHistory}</div>
            <div className="text-[11px] text-slate-500">Expedientes registrados</div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-[10px] uppercase font-bold text-emerald-700">Órdenes Cerradas</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-0.5">{closedCount}</div>
            <div className="text-[11px] text-emerald-600">Concluidas con éxito</div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="text-[10px] uppercase font-bold text-amber-700">Pendientes de Cierre</div>
            <div className="text-xl sm:text-2xl font-black text-amber-800 mt-0.5">{openCount}</div>
            <div className="text-[11px] text-amber-600">Listas para archivar</div>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-[10px] uppercase font-bold text-blue-700">Filtradas Actuales</div>
            <div className="text-xl sm:text-2xl font-black text-[#040057] mt-0.5">{filteredOrders.length}</div>
            <div className="text-[11px] text-blue-600">En vista en pantalla</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Buscador Inteligente Multicriterio */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        
        {/* Cabecera del Buscador y Alternador de Vistas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Buscador Inteligente de Reportes de Falla
            </span>
            {searchTerm && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-[11px] border border-indigo-200">
                {filteredOrders.length} resultado{filteredOrders.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Selector de Modo de Visualización (Lista compacta vs Tarjetas) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'lista'
                  ? 'bg-white text-[#040057] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista de lista compacta: muestra solo datos principales y abre detalle al hacer click"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Modo Lista (Recomendado)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tarjetas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'tarjetas'
                  ? 'bg-white text-[#040057] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista en tarjetas expandidas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Modo Tarjetas</span>
            </button>
          </div>
        </div>

        {/* Input del Buscador Inteligente y Filtros Rápidos de Estatus */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Buscador de Texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por folio, cliente, falla, placas, económico, chofer, técnico, refacción o palabra clave..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#040057] focus:border-transparent outline-hidden bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros Rápidos de Estatus */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs shrink-0">
            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Estatus:</span>
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'cerradas', label: 'Cerradas', count: closedCount },
              { id: 'abiertas', label: 'Por Cerrar', count: openCount },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === btn.id
                    ? 'bg-[#040057] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{btn.label}</span>
                {btn.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === btn.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {btn.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Categorías Rápidas de Fallas y Sistemas */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Filtro Rápido:</span>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'motor', label: 'Motor / Calentamiento' },
            { id: 'frenos', label: 'Frenos / Balatas' },
            { id: 'embrague', label: 'Embrague / Clutch' },
            { id: 'electrico', label: 'Eléctrico / Sensores' },
            { id: 'fugas', label: 'Fugas de Fluidos' },
            { id: 'rescate', label: 'Rescates en Carretera' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSystemCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                systemCategoryFilter === cat.id
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
          {systemCategoryFilter !== 'todos' && (
            <button
              onClick={() => setSystemCategoryFilter('todos')}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline ml-1 cursor-pointer"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Filtros Secundarios: Tipo de Servicio y Antigüedad */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Tipo Servicio:</span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'taller', label: 'Taller' },
              { id: 'asistencia', label: 'Asistencia Vial' },
              { id: 'rescate', label: 'Rescate Carretero' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setServiceTypeFilter(st.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  serviceTypeFilter === st.id
                    ? 'bg-indigo-100 text-[#040057] font-bold border border-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Antigüedad:</span>
            {[
              { id: 'todos', label: 'Todo el Historial' },
              { id: 'este_mes', label: 'Últimos 30 días' },
              { id: 'mes_anterior', label: '30 a 60 días' },
              { id: 'antiguas', label: 'Antiguas (+60 días)' },
            ].map((dt) => (
              <button
                key={dt.id}
                onClick={() => setDateFilter(dt.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  dateFilter === dt.id
                    ? 'bg-indigo-100 text-[#040057] font-bold border border-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {dt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de Acciones para Órdenes Seleccionadas */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              {selectedOrderIds.length}
            </span>
            <div>
              <div className="font-bold text-emerald-950 text-xs">
                {selectedOrderIds.length} reporte(s) seleccionado(s)
              </div>
              <div className="text-[11px] text-emerald-700">
                Listos para descargar en archivo Excel (.xlsx) con desglose de refacciones y datos completos.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportSelectedExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer ring-2 ring-emerald-300"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar {selectedOrderIds.length} Seleccionados en Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-emerald-200 transition cursor-pointer"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Órdenes del Historial */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
          <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No se encontraron órdenes en el historial</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            No hay registros que coincidan con los criterios de búsqueda o filtros seleccionados. Prueba limpiando los filtros o el buscador.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSystemCategoryFilter('todos');
              setStatusFilter('todas');
              setServiceTypeFilter('todos');
              setDateFilter('todos');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : viewMode === 'lista' ? (
        /* VISTA LISTA COMPACTA: SOLO DATOS PRINCIPALES (CLICK PARA VER TODO) */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Encabezado de Columnas (Desktop) */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-3 bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider items-center">
            <div className="col-span-2 flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                title="Seleccionar / Deseleccionar todos los registros visibles"
              />
              <span>Folio / Fecha</span>
            </div>
            <div className="col-span-3">Cliente / Unidad</div>
            <div className="col-span-3">Falla Reportada Principal</div>
            <div className="col-span-2">Estatus / Servicio</div>
            <div className="col-span-2 text-right">Descargar Excel / Detalle</div>
          </div>

          {/* Filas de Registros en Forma de Lista */}
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => {
              const isClosed = order.status === 'cerrado' || order.status === 'unidad_liberada' || order.status === 'facturado';
              const isRescue = order.requiresRescue || order.serviceType === 'rescate';

              return (
                <div
                  key={order.id}
                  onClick={() => setViewDetailOrder(order)}
                  className={`p-3.5 sm:p-4 hover:bg-indigo-50/50 transition-all cursor-pointer flex flex-col md:grid md:grid-cols-12 md:gap-3 md:items-center group ${
                    selectedOrderIds.includes(order.id)
                      ? 'bg-emerald-50/40 border-l-4 border-l-emerald-500'
                      : isClosed ? 'bg-slate-50/20' : 'bg-white'
                  }`}
                  title="Haz click para ver toda la información pertinente de este reporte de falla"
                >
                  {/* Columna 1: Checkbox, Folio, Fecha y Rescate */}
                  <div className="col-span-2 min-w-0 mb-1.5 md:mb-0 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => handleToggleSelectOrder(order.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0 accent-emerald-600"
                      title="Seleccionar para exportar en Excel"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-indigo-600 group-hover:scale-125 transition-transform"></span>
                        <span className="font-black text-[#040057] text-sm group-hover:text-indigo-700 transition">
                          {order.folio}
                        </span>
                        {isRescue && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase">
                            Rescate
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 ml-3.5">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{new Date(order.createdAt).toLocaleDateString('es-MX')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Columna 2: Cliente y Unidad */}
                  <div className="col-span-3 min-w-0 mb-1.5 md:mb-0">
                    <div className="font-bold text-slate-900 text-xs truncate">
                      {order.clientCompany || order.clientName}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">
                      <span className="font-semibold text-slate-800">{order.vehicle.brand} {order.vehicle.model || order.vehicle.type}</span>
                      <span className="mx-1">•</span>
                      <span>Eco: <strong>{order.vehicle.economicNumber}</strong></span>
                      <span className="mx-1">•</span>
                      <span>Placas: <strong>{order.vehicle.plates}</strong></span>
                    </div>
                  </div>

                  {/* Columna 3: Falla Reportada (Sintética, 1 renglón) */}
                  <div className="col-span-3 min-w-0 pr-2 mb-1.5 md:mb-0">
                    <div className="md:hidden text-[10px] uppercase font-bold text-slate-400 mb-0.5">Falla Reportada:</div>
                    <p className="text-slate-700 text-xs truncate font-medium" title={order.vehicle.failureDescription}>
                      {order.vehicle.failureDescription || order.initialDiagnosis || order.workPerformedDetail || 'Reporte de falla registrado'}
                    </p>
                    {order.assignedTechnicianName && (
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        Técnico: <span className="text-slate-600 font-semibold">{order.assignedTechnicianName}</span>
                      </div>
                    )}
                  </div>

                  {/* Columna 4: Estatus y Servicio */}
                  <div className="col-span-2 flex flex-wrap items-center gap-1.5 mb-2 md:mb-0">
                    <StatusSemaphoreBadge status={order.status} size="sm" />
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      order.serviceType === 'rescate' ? 'bg-rose-100 text-rose-800' :
                      order.serviceType === 'asistencia' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.serviceType}
                    </span>
                  </div>

                  {/* Columna 5: Acciones (Descargar individual en Excel + Ver Detalle) */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSingleExcel(order);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white transition cursor-pointer shadow-2xs border border-emerald-300 hover:border-emerald-600 flex items-center gap-1.5 text-xs font-bold"
                      title={`Descargar reporte ${order.folio} individual en archivo Excel (.xlsx)`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                      <span>Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewDetailOrder(order);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 group-hover:bg-[#040057] text-slate-700 group-hover:text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Ver toda la información pertinente del reporte"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500 group-hover:text-white shrink-0" />
                      <span className="hidden sm:inline">Detalle</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISTA TARJETAS EXPANDIDAS */
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => {
            const isClosed = order.status === 'cerrado' || order.status === 'unidad_liberada' || order.status === 'facturado';
            const beforePhotos = order.evidences.filter(e => e.phase === 'antes');
            const afterPhotos = order.evidences.filter(e => e.phase === 'despues' || e.phase === 'correctivo_realizado');

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition shadow-xs hover:shadow-md ${
                  selectedOrderIds.includes(order.id)
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : isClosed ? 'border-emerald-200/80 bg-gradient-to-r from-white via-slate-50/30 to-emerald-50/20' : 'border-slate-200'
                }`}
              >
                {/* Cabecera de la Tarjeta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => handleToggleSelectOrder(order.id)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      title="Seleccionar para exportar en Excel"
                    />

                    <span className="text-base sm:text-lg font-black text-[#040057]">
                      {order.folio}
                    </span>

                    {order.reportNumber && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-extrabold text-[11px] border border-slate-200">
                        REPORTE TÉCNICO {order.reportNumber}
                      </span>
                    )}

                    <StatusSemaphoreBadge status={order.status} />

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.serviceType === 'rescate' ? 'bg-rose-100 text-rose-800' :
                      order.serviceType === 'asistencia' ? 'bg-blue-100 text-blue-800' :
                      'bg-indigo-100 text-indigo-800'
                    }`}>
                      {order.serviceType}
                    </span>

                    {isClosed && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        <span>Cerrada Formalmente</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Apertura: {new Date(order.createdAt).toLocaleDateString('es-MX')}</span>
                    {order.closedAt && (
                      <span className="text-emerald-700 font-semibold ml-2">
                        • Cierre: {new Date(order.closedAt).toLocaleDateString('es-MX')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido Principal de la Orden */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 text-xs">
                  
                  {/* Columna 1: Datos de Unidad y Cliente */}
                  <div className="md:col-span-5 space-y-1.5 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-sm">
                        {order.vehicle.brand ? `${order.vehicle.brand} - ` : ''}{order.vehicle.model || order.vehicle.type.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                      <span>Placas: <strong className="text-slate-900">{order.vehicle.plates}</strong></span>
                      <span>•</span>
                      <span>Económico: <strong className="text-slate-900">{order.vehicle.economicNumber}</strong></span>
                    </div>

                    <div className="text-slate-600">
                      Cliente: <strong className="text-slate-800">{order.clientCompany || order.clientName}</strong>
                      {order.userOperatorName && (
                        <div className="text-[11px] text-slate-500">Operador / Chofer: {order.userOperatorName}</div>
                      )}
                    </div>

                    {(order.vehicle.odometerReading || order.vehicle.mileage) && (
                      <div className="text-[11px] text-slate-500">
                        Odómetro al servicio: <strong className="text-[#040057]">{order.vehicle.odometerReading || order.vehicle.mileage}</strong>
                      </div>
                    )}
                  </div>

                  {/* Columna 2: Diagnóstico y Trabajo Realizado */}
                  <div className="md:col-span-4 space-y-1.5 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Trabajo Realizado / Falla</div>
                    <p className="text-slate-700 line-clamp-2 leading-relaxed">
                      {order.workPerformedDetail || order.initialDiagnosis || order.vehicle.failureDescription}
                    </p>

                    {order.closingNotes && (
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-[11px] text-emerald-900 mt-1">
                        <strong className="text-emerald-800">Dictamen de Cierre: </strong>
                        <span>{order.closingNotes}</span>
                      </div>
                    )}

                    {order.closedBy && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cerrado por: <strong>{order.closedBy}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Columna 3: Evidencias y Refacciones */}
                  <div className="md:col-span-3 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Evidencias Fotográficas:</span>
                        </span>
                        <span className="font-bold text-slate-800">{order.evidences.length}</span>
                      </div>

                      {/* Miniaturas de Fotos Antes y Después */}
                      {order.evidences.length > 0 ? (
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                          {order.evidences.slice(0, 3).map((ph) => (
                            <div key={ph.id} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                              <img src={ph.url} alt={ph.title} className="w-full h-full object-cover" />
                              <span className={`absolute bottom-0 inset-x-0 text-[8px] font-extrabold text-white text-center py-0.2 ${
                                ph.phase === 'antes' ? 'bg-amber-600' : 'bg-emerald-600'
                              }`}>
                                {ph.phase === 'antes' ? 'ANTES' : 'DESPUÉS'}
                              </span>
                            </div>
                          ))}
                          {order.evidences.length > 3 && (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600 shrink-0">
                              +{order.evidences.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">Sin fotografías</div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Refacciones instaladas: <strong className="text-slate-800">{order.partsUsed.length}</strong> partidas
                    </div>
                  </div>

                </div>

                {/* Barra de Acciones de la Orden */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {/* Botón Ver / Consultar */}
                    <button
                      onClick={() => setViewDetailOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Ver expediente completo"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#040057]" />
                      <span>Ver Expediente</span>
                    </button>

                    {/* Botón Imprimir / PDF Oficial */}
                    <button
                      onClick={() => setPrintReportOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#040057] border border-blue-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Imprimir formato oficial o descargar PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#040057]" />
                      <span>Reporte Oficial (PDF)</span>
                    </button>

                    {/* Botón Descargar este reporte en Excel */}
                    <button
                      onClick={() => handleExportSingleExcel(order)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-900 hover:text-white border border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title={`Descargar reporte ${order.folio} individual en archivo Excel (.xlsx)`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                      <span>Descargar Excel (.xlsx)</span>
                    </button>

                    {/* Botón Editar / Actualizar */}
                    <button
                      onClick={() => handleOpenEditModal(order)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Editar datos, textos o notas de la orden"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Editar / Actualizar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botón Cerrar si no está cerrada */}
                    {!isClosed && (
                      <button
                        onClick={() => handleOpenCloseModal(order)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Dar por cerrada formalmente la orden"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cerrar Orden</span>
                      </button>
                    )}

                    {/* Botón Borrar (con confirmación) */}
                    <button
                      onClick={() => setOrderToDelete(order)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Eliminar orden del historial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CIERRE FORMAL DE ORDEN DE REPARACIÓN */}
      {orderToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-bold text-[#040057]">
                  Cerrar Orden de Reparación {orderToClose.folio}
                </h3>
              </div>
              <button
                onClick={handleAttemptCloseOrderModal}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmClose} className="space-y-4 mt-4 text-xs">
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 text-sm">
                  Unidad: {orderToClose.vehicle.brand || ''} {orderToClose.vehicle.model || orderToClose.vehicle.type.toUpperCase()}
                </div>
                <div className="text-slate-600">
                  Placas: <strong>{orderToClose.vehicle.plates}</strong> • Económico: <strong>{orderToClose.vehicle.economicNumber}</strong>
                </div>
                <div className="text-slate-500">
                  Cliente: {orderToClose.clientCompany || orderToClose.clientName}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre de quien da por cerrada la orden *
                </label>
                <input
                  type="text"
                  required
                  value={closerName}
                  onChange={(e) => setCloserName(e.target.value)}
                  placeholder="Tu nombre y cargo..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Rol activo que autoriza: <strong>{activeRole.toUpperCase()}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Odómetro / Kilometraje al cierre
                  </label>
                  <input
                    type="text"
                    value={finalKm}
                    onChange={(e) => setFinalKm(e.target.value)}
                    placeholder="ej. 130,618 KM"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chofer / Operador que recibe la unidad
                  </label>
                  <input
                    type="text"
                    value={driverReceived}
                    onChange={(e) => setDriverReceived(e.target.value)}
                    placeholder="ej. Omar Balderas (Operador)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dictamen Final y Observaciones de Cierre *
                </label>
                <textarea
                  rows={3}
                  required
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Detalla la conformidad del servicio, pruebas de ruta, calibraciones y entrega..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleAttemptCloseOrderModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Cierre y Pasar a Historial</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ADVERTENCIA: CANDADO AL CERRAR LA ORDEN */}
      <EvidenceLockWarningModal
        isOpen={showCloseWarningModal}
        onClose={() => setShowCloseWarningModal(false)}
        onConfirmExit={() => {
          setShowCloseWarningModal(false);
          setOrderToClose(null);
        }}
        type="order_close"
        subtitle={closeWarningMessage}
        hasBefore={Boolean(orderToClose?.evidences.some(ev => ev.phase === 'antes') || (orderToClose?.repairs || []).some(r => Boolean(r.evidenceBeforeUrl)))}
        hasAfter={Boolean(orderToClose?.evidences.some(ev => ev.phase === 'despues' || ev.phase === 'correctivo_realizado') || (orderToClose?.repairs || []).some(r => Boolean(r.evidenceAfterUrl)))}
      />

      {/* MODAL 2: EDICIÓN Y ACTUALIZACIÓN DE ORDEN */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base sm:text-lg font-bold text-[#040057]">
                  Actualizar Datos de la Orden {editingOrder.folio}
                </h3>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cliente / Razón Social *</label>
                  <input
                    type="text"
                    required
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Empresa / Grupo</label>
                  <input
                    type="text"
                    value={editClientCompany}
                    onChange={(e) => setEditClientCompany(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Placas *</label>
                  <input
                    type="text"
                    required
                    value={editPlates}
                    onChange={(e) => setEditPlates(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold uppercase text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Económico *</label>
                  <input
                    type="text"
                    required
                    value={editEco}
                    onChange={(e) => setEditEco(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold uppercase text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marca Unidad</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    placeholder="ej. Kenworth"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modelo Unidad</label>
                  <input
                    type="text"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    placeholder="ej. T680 2022"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Serie de Chasis</label>
                  <input
                    type="text"
                    value={editChassis}
                    onChange={(e) => setEditChassis(e.target.value)}
                    placeholder="VIN / Chasis"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modelo Motor / Transmisión</label>
                  <input
                    type="text"
                    value={editEngine}
                    onChange={(e) => setEditEngine(e.target.value)}
                    placeholder="ej. Cummins X15"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Odómetro / Kilometraje</label>
                  <input
                    type="text"
                    value={editOdometer}
                    onChange={(e) => setEditOdometer(e.target.value)}
                    placeholder="ej. 445,210 KM"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Falla Reportada Inicial</label>
                <textarea
                  rows={2}
                  value={editFailure}
                  onChange={(e) => setEditFailure(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detalle del Servicio / Trabajo Realizado</label>
                <textarea
                  rows={3}
                  value={editWorkPerformed}
                  onChange={(e) => setEditWorkPerformed(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dictamen u Observaciones de Cierre</label>
                <textarea
                  rows={2}
                  value={editClosingNotes}
                  onChange={(e) => setEditClosingNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#040057] outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXPEDIENTE COMPLETO / CONSULTA EN PROFUNDIDAD */}
      {viewDetailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#040057]" />
                <h3 className="text-base sm:text-lg font-bold text-[#040057]">
                  Expediente Completo • {viewDetailOrder.folio}
                </h3>
                {viewDetailOrder.reportNumber && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-extrabold text-slate-800 text-xs">
                    REPORTE {viewDetailOrder.reportNumber}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportSingleExcel(viewDetailOrder)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-emerald-300 transition shadow-2xs"
                  title={`Descargar reporte ${viewDetailOrder.folio} en archivo Excel (.xlsx)`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Descargar en Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    const ord = viewDetailOrder;
                    setViewDetailOrder(null);
                    setPrintReportOrder(ord);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#040057] hover:bg-blue-100 font-bold text-xs flex items-center gap-1 cursor-pointer border border-blue-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Reporte</span>
                </button>
                <button
                  onClick={() => setViewDetailOrder(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-5 mt-4 text-xs">
              
              {/* Bloque 1: Ficha General de la Unidad */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Cliente & Empresa</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{viewDetailOrder.clientCompany || viewDetailOrder.clientName}</div>
                  <div className="text-slate-500 mt-0.5">{viewDetailOrder.clientContact}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Vehículo / Unidad</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {viewDetailOrder.vehicle.brand || ''} {viewDetailOrder.vehicle.model || viewDetailOrder.vehicle.type.toUpperCase()}
                  </div>
                  <div className="text-slate-600 mt-0.5 font-medium">
                    Placas: <strong>{viewDetailOrder.vehicle.plates}</strong> • Eco: <strong>{viewDetailOrder.vehicle.economicNumber}</strong>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Datos Mecánicos</div>
                  <div className="text-slate-700 mt-0.5">Odómetro: <strong>{viewDetailOrder.vehicle.odometerReading || viewDetailOrder.vehicle.mileage || 'N/A'}</strong></div>
                  <div className="text-slate-500 font-mono text-[11px] truncate">Serie Chasis: {viewDetailOrder.vehicle.chassisSerialNumber || 'N/A'}</div>
                </div>
              </div>

              {/* Bloque 2: Diagnóstico y Trabajo Realizado */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 text-[#040057]">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>Falla Inicial Reportada</span>
                  </div>
                  <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 mt-1 leading-relaxed">
                    {viewDetailOrder.vehicle.failureDescription}
                  </p>
                </div>

                <div>
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 text-[#040057]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Servicio y Correctivo Realizado</span>
                  </div>
                  <p className="p-2.5 bg-emerald-50/50 rounded-lg text-slate-800 mt-1 leading-relaxed border border-emerald-100">
                    {viewDetailOrder.workPerformedDetail || viewDetailOrder.initialDiagnosis || 'Servicio correctivo concluido.'}
                  </p>
                </div>

                {viewDetailOrder.closingNotes && (
                  <div>
                    <div className="font-bold text-slate-800 text-xs text-emerald-800">
                      Dictamen Final de Cierre y Entrega
                    </div>
                    <p className="p-2.5 bg-emerald-100/50 rounded-lg text-emerald-950 mt-1 leading-relaxed border border-emerald-200">
                      {viewDetailOrder.closingNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Bloque 3: Evidencias Fotográficas Antes y Después */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Galería Fotográfica de Evidencias ({viewDetailOrder.evidences.length})</span>
                </h4>

                {viewDetailOrder.evidences.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400">
                    Sin fotografías adjuntas a esta orden.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {viewDetailOrder.evidences.map((photo) => (
                      <div key={photo.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                        <div className="relative h-28 bg-slate-100">
                          <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                          <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white shadow-xs ${
                            photo.phase === 'antes' ? 'bg-amber-600' : 'bg-emerald-600'
                          }`}>
                            {photo.phase === 'antes' ? 'ANTES' : 'DESPUÉS'}
                          </span>
                        </div>
                        <div className="p-2">
                          <div className="font-bold text-slate-800 truncate text-[11px]">{photo.title}</div>
                          {photo.notes && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{photo.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bloque 4: Refacciones Utilizadas */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Refacciones e Insumos Instalados ({viewDetailOrder.partsUsed.length})</span>
                </h4>

                {viewDetailOrder.partsUsed.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400">
                    No se registraron refacciones adicionales para este servicio.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">No. Parte</th>
                          <th className="p-2.5">Descripción</th>
                          <th className="p-2.5 text-center">Cantidad</th>
                          <th className="p-2.5 text-right">P. Unitario</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewDetailOrder.partsUsed.map((part) => (
                          <tr key={part.id}>
                            <td className="p-2.5 font-mono text-slate-600">{part.partNumber}</td>
                            <td className="p-2.5 font-medium text-slate-800">{part.description}</td>
                            <td className="p-2.5 text-center font-bold">{part.quantity}</td>
                            <td className="p-2.5 text-right font-mono">${part.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Barra de Acciones Inferior del Expediente */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => handleExportSingleExcel(viewDetailOrder)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition ring-2 ring-emerald-300/60"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Descargar este Expediente en Excel (.xlsx)</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const ord = viewDetailOrder;
                      setViewDetailOrder(null);
                      setPrintReportOrder(ord);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Reporte Oficial (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewDetailOrder(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cerrar Consulta
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: IMPRESIÓN OFICIAL DEL REPORTE TÉCNICO (PDF / IMPRESORA) */}
      {printReportOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#040057]" />
                <h3 className="font-bold text-[#040057] text-base">
                  Vista Previa para Impresión / Exportación PDF • {printReportOrder.folio}
                </h3>
              </div>
              <button
                onClick={() => setPrintReportOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Documento Oficial con Formato Membretado */}
            <TechnicalReportDocument order={printReportOrder} />
          </div>
        </div>
      )}

      {/* MODAL 5: CONFIRMACIÓN DE BORRADO SEGURO */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              ¿Eliminar orden {orderToDelete.folio} del historial?
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Esta acción borrará la orden de la base de datos local y sus evidencias asociadas. ¿Deseas proceder?
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
