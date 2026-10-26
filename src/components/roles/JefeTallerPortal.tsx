import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Truck, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  Filter, 
  UserCheck, 
  Activity, 
  ArrowRight,
  Shield,
  PhoneCall,
  ClipboardCheck,
  Plus,
  BarChart3,
  Bell,
  Archive,
  ClipboardList,
  Search,
  Camera,
  Video,
  ExternalLink,
  Gauge,
  Phone,
  User,
  AlertTriangle,
  Sparkles,
  Eye,
  X,
  Building2,
  LayoutGrid,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, ServiceType, Technician, ServiceStatus } from '../../types';
import { StatusSemaphoreBadge } from '../common/StatusSemaphoreBadge';
import { getStatusTextColor } from '../../utils/statusSemaphore';
import { UnitReceptionManager } from '../common/UnitReceptionManager';
import { MetricsDashboard } from '../common/MetricsDashboard';
import { NotificationsModule } from '../common/NotificationsModule';
import { HistorialOrdenesModule } from '../common/HistorialOrdenesModule';
import { ClientesEmpresasManager } from '../common/ClientesEmpresasManager';
import { ConsolidatedReportsLogView } from '../common/ConsolidatedReportsLogView';
import { playEmergencyAlertSound } from '../../utils/audioAlert';

export const JefeTallerPortal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    orders, 
    technicians, 
    clients,
    assignTechnician,
    updateOrderStatus,
    createClientFaultReport,
    addToast
  } = useApp();

  // Estados de filtrado y búsqueda en Módulo Reportes
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'todos' | 'por_asignar' | 'asignados' | 'rescates'>('por_asignar');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('todos');
  const [viewFormat, setViewFormat] = useState<'operativo' | 'bitacora_cliente'>('operativo');

  // Estados para Modal de Asignación a Técnico
  const [assigningOrder, setAssigningOrder] = useState<ServiceOrder | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>('alta');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');

  // Modal para zoom de foto de evidencia
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // Reportes entrantes pendientes de asignación
  const unassignedOrders = orders.filter(o => 
    o.status === 'solicitado' || 
    o.status === 'por_atender' || 
    !o.assignedTechnicianId
  );

  // Reportes ya asignados
  const assignedOrders = orders.filter(o => Boolean(o.assignedTechnicianId));

  // Reportes que requieren rescate en carretera
  const rescueOrders = orders.filter(o => o.requiresRescue || o.serviceType === 'rescate');

  // Filtrado compuesto según pestaña, búsqueda y tipo de servicio
  const displayedOrders = orders.filter(order => {
    // 1. Filtro por pestaña
    if (filterTab === 'por_asignar') {
      if (order.assignedTechnicianId && order.status !== 'solicitado' && order.status !== 'por_atender') {
        return false;
      }
    } else if (filterTab === 'asignados') {
      if (!order.assignedTechnicianId) return false;
    } else if (filterTab === 'rescates') {
      if (!order.requiresRescue && order.serviceType !== 'rescate') return false;
    }

    // 2. Filtro por tipo de servicio
    if (selectedServiceType !== 'todos' && order.serviceType !== selectedServiceType) {
      return false;
    }

    // 3. Búsqueda inteligente
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchFolio = order.folio.toLowerCase().includes(term);
      const matchPlates = order.vehicle.plates.toLowerCase().includes(term);
      const matchEco = order.vehicle.economicNumber.toLowerCase().includes(term);
      const matchUnit = (order.unitNumber || '').toLowerCase().includes(term);
      const matchOperator = (order.operatorName || order.vehicle.driverContact || '').toLowerCase().includes(term);
      const matchFailure = (order.vehicle.failureDescription || '').toLowerCase().includes(term);
      const matchClient = (order.clientName || order.clientCompany || '').toLowerCase().includes(term);
      const matchTech = (order.assignedTechnicianName || '').toLowerCase().includes(term);

      return matchFolio || matchPlates || matchEco || matchUnit || matchOperator || matchFailure || matchClient || matchTech;
    }

    return true;
  });

  const handleOpenAssignModal = (order: ServiceOrder) => {
    setAssigningOrder(order);
    setSelectedPriority(order.priority || 'alta');
    setAssignmentNotes('');
    
    // Sugerir técnico disponible o el ya asignado si es reasignación
    if (order.assignedTechnicianId) {
      setSelectedTechId(order.assignedTechnicianId);
    } else {
      const available = technicians.find(t => t.status === 'disponible');
      if (available) setSelectedTechId(available.id);
      else if (technicians.length > 0) setSelectedTechId(technicians[0].id);
    }
  };

  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrder || !selectedTechId) return;

    // Ejecutar asignación técnica (dispara la alerta flotante con sonido en tiempo real)
    assignTechnician(assigningOrder.id, selectedTechId, selectedPriority);
    setAssigningOrder(null);
  };

  const calculateElapsedTime = (startDateStr: string) => {
    try {
      const start = new Date(startDateStr).getTime();
      const now = Date.now();
      const diffMin = Math.floor((now - start) / (1000 * 60));
      if (diffMin < 1) return 'Hace unos segundos';
      if (diffMin < 60) return `${diffMin} min`;
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      return `${hours}h ${mins}m`;
    } catch {
      return 'Reciente';
    }
  };

  // Simular reporte de prueba para verificar la alerta flotante con sonido
  const handleSimulateNewClientReport = () => {
    const sampleUnits = ['Unidad 12', 'Unidad 08', 'Unidad 25', 'Unidad 44'];
    const randomUnit = sampleUnits[Math.floor(Math.random() * sampleUnits.length)];
    const isRescue = Math.random() > 0.5;

    createClientFaultReport({
      unitNumber: randomUnit,
      plates: '82-AF-9K',
      economicNumber: 'ECO-409',
      brandModel: 'Kenworth T680 2024',
      odometer: '138,400 KM',
      operatorName: 'Rodrigo Valenzuela',
      operatorPhone: '55-4921-8833',
      failureDescription: isRescue 
        ? 'Pérdida súbita de presión de aceite de motor y fuga de refrigerante en carretera. Unidad varada.'
        : 'Ruido metálico en sistema de frenos y testigo de advertencia encendido en tablero.',
      location: 'Autopista México-Querétaro Km 43.5 pasando caseta Tepotzotlán',
      requiresRescue: isRescue,
      rescueLocationUrl: 'https://maps.google.com/?q=19.7144,-99.2241',
      photos: [
        {
          id: `p-${Date.now()}`,
          url: 'https://images.unsplash.com/photo-1586191582150-109000a65604?auto=format&fit=crop&w=600&q=80',
          title: 'Avería motor detectada',
          timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        }
      ],
      clientName: 'Transportes Águila de Carga S.A.',
      clientCompany: 'Transportes Águila de Carga'
    });
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8 w-full max-w-full min-w-0 overflow-x-hidden">
      
      {/* Resumen Superior de Operaciones */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 animate-pulse"></span>
              <h1 className="text-xl sm:text-2xl font-black text-[#040057] truncate">
                Jefe de Taller
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Despacho Operativo • Asignación de Cuadrillas a Reportes de Clientes • Control Técnico
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MÓDULO SOLICITADO: REPORTES DE CLIENTES Y ASIGNACIÓN      */}
      {/* ======================================================== */}
      {(activeModule === 'reportes' || activeModule === 'bandeja_solicitudes') && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Tarjetas Resumen de Reportes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Reportes</span>
                <span className="text-xl font-black text-[#040057]">{orders.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border-2 border-rose-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Por Asignar</span>
                <span className="text-xl font-black text-rose-700">{unassignedOrders.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Asignados</span>
                <span className="text-xl font-black text-emerald-700">{assignedOrders.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rescates Vial</span>
                <span className="text-xl font-black text-amber-700">{rescueOrders.length}</span>
              </div>
            </div>
          </div>

          {/* Barra de Filtros, Búsqueda Inteligente y Botón de Prueba */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Pestañas de Estado */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                {[
                  { id: 'por_asignar', label: 'Por Asignar', count: unassignedOrders.length, color: 'text-rose-600' },
                  { id: 'asignados', label: 'Asignados a Técnicos', count: assignedOrders.length, color: 'text-emerald-600' },
                  { id: 'rescates', label: 'Rescates en Ruta', count: rescueOrders.length, color: 'text-amber-600' },
                  { id: 'todos', label: 'Todos los Reportes', count: orders.length, color: 'text-slate-600' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id as any)}
                    className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      filterTab === tab.id
                        ? 'bg-[#040057] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Botón para Simular Llegada de Reporte de Cliente (Prueba Alerta) */}
              <button
                type="button"
                onClick={handleSimulateNewClientReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#040057] text-xs font-bold border border-indigo-200 transition cursor-pointer self-start lg:self-auto"
                title="Genera un reporte de cliente para probar la ventana flotante de alerta con sonido"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Simular Reporte de Cliente (Prueba Alerta)</span>
              </button>
            </div>

            {/* Input de Búsqueda Inteligente y Filtro de Servicio */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscador inteligente: Folio, Unidad, Placas, Operador, Falla o Técnico..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#040057] focus:border-[#040057] transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <select
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
              >
                <option value="todos">Todos los Tipos de Servicio</option>
                <option value="rescate">Rescates en Carretera</option>
                <option value="asistencia">Asistencia Vial</option>
                <option value="taller">Visita a Taller</option>
              </select>
            </div>

            {/* Alternar formato: Operativo de Asignación vs Bitácora Consolidada (Formato Cliente) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500">
                Visualización de reportes:
              </span>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewFormat('operativo')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewFormat === 'operativo'
                      ? 'bg-[#040057] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Vista Operativa (Asignar)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewFormat('bitacora_cliente')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewFormat === 'bitacora_cliente'
                      ? 'bg-[#040057] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Bitácora Consolidada (Formato Cliente)</span>
                </button>
              </div>
            </div>

          </div>

          {/* VISTA SEGÚN FORMATO SELECCIONADO */}
          {viewFormat === 'bitacora_cliente' ? (
            <ConsolidatedReportsLogView 
              orders={displayedOrders}
              title="COTIZACIÓN 20261012 ENVIAR"
              showFilters={false}
            />
          ) : displayedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                No hay reportes en este filtro
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchTerm 
                  ? 'No se encontraron resultados para tu búsqueda. Intenta con otro término.' 
                  : 'Todos los reportes de clientes correspondientes a este estatus han sido atendidos.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedOrders.map((order) => {
                const isRescue = order.requiresRescue || order.serviceType === 'rescate';
                const hasAssignedTech = Boolean(order.assignedTechnicianId);

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-3xl p-5 sm:p-6 border-2 transition shadow-xs space-y-4 ${
                      isRescue ? 'border-rose-300 bg-rose-50/15' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    
                    {/* Encabezado del Reporte */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base sm:text-lg font-black text-[#040057]">
                          {order.folio}
                        </span>

                        {isRescue ? (
                          <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>¡Rescate en Ruta!</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-white text-[10px] font-bold uppercase">
                            {order.serviceType === 'asistencia' ? 'Asistencia Vial' : 'Atención de Taller'}
                          </span>
                        )}

                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          order.priority === 'urgente' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          order.priority === 'alta' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          Prioridad {order.priority}
                        </span>

                        <StatusSemaphoreBadge status={order.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reportado hace {calculateElapsedTime(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Ficha de la Unidad, Operador y Ubicación */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 text-xs">
                      
                      {/* 1. Unidad */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Unidad y Odómetro
                        </span>
                        <div className="font-extrabold text-[#040057] text-sm flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{order.unitNumber || `Placas ${order.vehicle.plates}`}</span>
                        </div>
                        <div className="text-slate-600 mt-1 font-semibold">
                          Placas: <span className="text-slate-900 font-bold">{order.vehicle.plates}</span> • Eco: <span className="text-slate-900 font-bold">{order.vehicle.economicNumber}</span>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {order.vehicle.brandModel || order.vehicle.brand || 'Tractocamión'} ({order.vehicle.type})
                        </div>
                        {order.vehicle.mileage && (
                          <div className="text-slate-700 font-bold flex items-center gap-1 mt-1">
                            <Gauge className="w-3 h-3 text-slate-400" />
                            <span>Odómetro: {order.vehicle.mileage}</span>
                          </div>
                        )}
                      </div>

                      {/* 2. Operador y Cliente */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Operador y Contacto
                        </span>
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>{order.operatorName || order.vehicle.driverContact || 'Operador'}</span>
                        </div>
                        {order.operatorPhone && (
                          <div className="mt-1 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <a href={`tel:${order.operatorPhone}`} className="text-emerald-700 font-bold hover:underline">
                              {order.operatorPhone} (Llamar)
                            </a>
                          </div>
                        )}
                        <div className="text-slate-500 mt-1 truncate">
                          Empresa: <strong className="text-slate-700">{order.clientCompany || order.clientName}</strong>
                        </div>
                      </div>

                      {/* 3. Ubicación y Rescate */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Ubicación Reportada
                        </span>
                        <div className="text-slate-700 font-medium flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{order.vehicle.location}</span>
                        </div>
                        {order.rescueLocationUrl && (
                          <div className="mt-2">
                            <a
                              href={order.rescueLocationUrl.startsWith('http') ? order.rescueLocationUrl : `https://${order.rescueLocationUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Abrir en Google Maps</span>
                            </a>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Falla Reportada por el Cliente */}
                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        Falla Reportada por el Cliente:
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                        {order.vehicle.failureDescription}
                      </p>
                    </div>

                    {/* Observaciones adicionales agregadas por el cliente */}
                    {order.clientObservationsHistory && order.clientObservationsHistory.length > 0 && (
                      <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-950 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                          Actualizaciones y Nuevas Observaciones del Cliente ({order.clientObservationsHistory.length}):
                        </span>
                        <div className="space-y-1.5">
                          {order.clientObservationsHistory.map((obs) => (
                            <div key={obs.id} className="bg-white p-2.5 rounded-xl border border-blue-200 text-slate-800 text-xs">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                <span className="font-bold text-[#040057]">{obs.author}</span>
                                <span>{obs.timestamp}</span>
                              </div>
                              <div className="font-semibold">{obs.text}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evidencias Multimedia del Cliente (Fotos y Video 15s) */}
                    {((order.evidences && order.evidences.length > 0) || (order.videoEvidences && order.videoEvidences.length > 0)) && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Evidencias Multimedia ({order.evidences.length} fotos, {order.videoEvidences?.length || 0} videos):
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          {order.evidences.map((ev, idx) => (
                            <div
                              key={idx}
                              onClick={() => setZoomPhotoUrl(ev.url)}
                              className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-100 hover:ring-2 hover:ring-[#040057] transition shrink-0"
                            >
                              <img src={ev.url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>
                          ))}

                          {order.videoEvidences?.map((vid, idx) => (
                            <div key={idx} className="relative w-36 h-20 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 shrink-0">
                              <video src={vid.url} controls className="w-full h-full object-cover" />
                              <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold pointer-events-none">
                                {vid.duration || 15}s
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sección de Asignación de Técnico y Cambio Directo de Estatus */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-slate-100">
                      
                      {/* Estado de Asignación Actual */}
                      <div className="flex items-center gap-3">
                        {hasAssignedTech ? (
                          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs">
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                            <div>
                              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Técnico Asignado:</span>
                              <span className="font-extrabold text-slate-800">{order.assignedTechnicianName}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 text-xs text-amber-900">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="font-bold">Pendiente de Asignación Técnica</span>
                          </div>
                        )}

                        {/* Dropdown de Cambio Rápido de Estatus */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400 font-bold hidden sm:inline">Estatus:</span>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as ServiceStatus, 'Actualizado por Jefe de Taller')}
                            className={`px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-black bg-white shadow-2xs transition-colors ${getStatusTextColor(order.status)}`}
                          >
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

                      {/* Botón de Asignar / Reasignar Técnico */}
                      <div>
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(order)}
                          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 ${
                            hasAssignedTech 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' 
                              : 'bg-[#040057] hover:bg-[#070085] text-white ring-2 ring-indigo-200'
                          }`}
                        >
                          <UserCheck className={`w-4 h-4 ${hasAssignedTech ? 'text-indigo-600' : 'text-emerald-400'}`} />
                          <span>{hasAssignedTech ? 'Reasignar Técnico' : 'Asignar Técnico a este Reporte'}</span>
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* MÓDULO PRINCIPAL: MÉTRICAS DE TALLER (PÁGINA DE INICIO) */}
      {(activeModule === 'metricas' || activeModule === 'inicio') && (
        <MetricsDashboard role="jefe_taller" />
      )}

      {/* MÓDULO: HISTORIAL DE ÓRDENES Y CIERRE DE REPARACIONES */}
      {activeModule === 'historial' && (
        <HistorialOrdenesModule forcedRole="jefe_taller" />
      )}

      {/* MÓDULO: CENTRO DE NOTIFICACIONES Y ALERTAS */}
      {activeModule === 'notificaciones' && (
        <NotificationsModule />
      )}

      {/* MÓDULO: RECEPCIÓN DE UNIDADES */}
      {activeModule === 'recepcion_unidades' && (
        <UnitReceptionManager />
      )}

      {/* MÓDULO: CLIENTES Y EMPRESAS */}
      {activeModule === 'clientes' && (
        <ClientesEmpresasManager />
      )}

      {/* ======================================================== */}
      {/* MODAL DE ASIGNACIÓN OPERATIVA DE TÉCNICO                  */}
      {/* ======================================================== */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#040057]">
                    Asignar Técnico al Reporte
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Folio {assigningOrder.folio} • {assigningOrder.unitNumber || assigningOrder.vehicle.plates}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-4 text-xs">
              
              {/* Resumen de la Avería */}
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">Falla a Atender:</span>
                <div className="font-bold text-slate-800">{assigningOrder.vehicle.failureDescription}</div>
                <div className="text-slate-600 text-[11px] flex items-center gap-1 pt-1">
                  <MapPin className="w-3 h-3 text-rose-600" />
                  <span className="truncate">{assigningOrder.vehicle.location}</span>
                </div>
              </div>

              {/* Lista de Selección de Técnicos */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Seleccionar Técnico Operativo Responsable *
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {technicians.map((tech) => (
                    <label
                      key={tech.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                        selectedTechId === tech.id
                          ? 'border-[#040057] bg-indigo-50/70 font-semibold ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="technician"
                          value={tech.id}
                          checked={selectedTechId === tech.id}
                          onChange={() => setSelectedTechId(tech.id)}
                          className="text-[#040057] focus:ring-[#040057]"
                        />
                        <div>
                          <div className="font-extrabold text-slate-800 text-sm">{tech.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{tech.specialty} • {tech.zone}</div>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        tech.status === 'disponible' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tech.status.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prioridad de Atención */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Ajustar Nivel de Prioridad
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#040057] bg-white font-semibold text-slate-800"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente (¡Atención Inmediata!)</option>
                </select>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedTechId}
                  className="px-5 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-black shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Confirmar y Notificar Asignación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Zoom Foto de Evidencia */}
      {zoomPhotoUrl && (
        <div 
          onClick={() => setZoomPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer animate-fadeIn"
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] rounded-3xl overflow-hidden bg-slate-900 border-2 border-white/20">
            <button
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoomPhotoUrl} alt="Evidencia ampliada" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

    </div>
  );
};
