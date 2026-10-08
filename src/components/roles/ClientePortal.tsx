import React, { useState } from 'react';
import { 
  FilePlus, 
  Truck, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileText, 
  Wrench, 
  ShieldCheck, 
  XCircle, 
  Download,
  Car,
  Bus,
  Search,
  Filter,
  PenTool,
  Printer
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceType, VehicleType, ServiceOrder } from '../../types';
import { TechnicalReportDocument } from '../common/TechnicalReportDocument';
import { StatusSemaphoreBadge } from '../common/StatusSemaphoreBadge';

export const ClientePortal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    orders, 
    createServiceOrder, 
    clientRespondQuotation,
    clientSignReport
  } = useApp();

  // Form states
  const [clientName, setClientName] = useState('Flotillas Express S.A. de C.V.');
  const [clientContact, setClientContact] = useState('Ing. Arturo Olmedo (55 4421 8899)');
  const [clientCompany, setClientCompany] = useState('Flotillas Express S.A.');
  const [serviceType, setServiceType] = useState<ServiceType>('taller');
  const [vehicleType, setVehicleType] = useState<VehicleType>('tractocamion');
  const [plates, setPlates] = useState('');
  const [economicNumber, setEconomicNumber] = useState('');
  const [unitBrand, setUnitBrand] = useState('');
  const [unitModel, setUnitModel] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [location, setLocation] = useState('');
  const [failureDescription, setFailureDescription] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [priority, setPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>('alta');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Quotation authorization modal
  const [selectedQuoteOrder, setSelectedQuoteOrder] = useState<ServiceOrder | null>(null);
  const [authorizerName, setAuthorizerName] = useState('Ing. Arturo Olmedo');
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Invoice viewer modal
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<ServiceOrder | null>(null);

  // Technical Report modal & signature
  const [selectedReportOrder, setSelectedReportOrder] = useState<ServiceOrder | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [clientSignName, setClientSignName] = useState('Omar Balderas (Operador)');

  const handleSubmitNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plates || !economicNumber || !location || !failureDescription) {
      alert('Por favor completa todos los campos requeridos de la unidad y avería.');
      return;
    }

    createServiceOrder({
      clientName,
      clientContact,
      clientCompany,
      serviceType,
      priority,
      vehicle: {
        type: vehicleType,
        plates: plates.toUpperCase(),
        economicNumber: economicNumber.toUpperCase(),
        brand: unitBrand.trim() || undefined,
        model: unitModel.trim() || undefined,
        brandModel: (unitBrand.trim() && unitModel.trim()) 
          ? `${unitBrand.trim()} ${unitModel.trim()}` 
          : (unitBrand.trim() || unitModel.trim() || brandModel || undefined),
        location,
        failureDescription,
        driverContact: driverContact || undefined,
      },
    });

    // Reset form
    setPlates('');
    setEconomicNumber('');
    setUnitBrand('');
    setUnitModel('');
    setBrandModel('');
    setLocation('');
    setFailureDescription('');
    setDriverContact('');
    setActiveModule('mis_solicitudes');
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`Coordenadas: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (Ubicación GPS en vivo)`);
        },
        () => {
          setLocation('Autopista México-Querétaro Km 43.5, Caseta Tepotzotlán');
        }
      );
    } else {
      setLocation('Autopista México-Querétaro Km 43.5, Caseta Tepotzotlán');
    }
  };

  const handleApproveQuote = () => {
    if (!selectedQuoteOrder) return;
    clientRespondQuotation(selectedQuoteOrder.id, true, authorizerName);
    setSelectedQuoteOrder(null);
  };

  const handleRejectQuote = () => {
    if (!selectedQuoteOrder) return;
    clientRespondQuotation(selectedQuoteOrder.id, false, authorizerName, rejectNotes || 'Rechazada por presupuesto excedido.');
    setSelectedQuoteOrder(null);
    setShowRejectInput(false);
  };

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    const brand = (o.vehicle.brand || o.vehicle.brandModel?.split(' ')[0] || '').toLowerCase();
    const model = (o.vehicle.model || o.vehicle.brandModel || '').toLowerCase();
    return (
      o.folio.toLowerCase().includes(term) ||
      o.vehicle.plates.toLowerCase().includes(term) ||
      o.vehicle.economicNumber.toLowerCase().includes(term) ||
      brand.includes(term) ||
      model.includes(term) ||
      o.vehicle.failureDescription.toLowerCase().includes(term)
    );
  });

  const quotesPending = orders.filter(o => o.quotation && o.quotation.status === 'enviada');

  return (
    <div className="space-y-6 pb-24 lg:pb-8 w-full max-w-full min-w-0 overflow-x-hidden">
      
      {/* Resumen del Cliente y Selector de Empresa */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057] truncate">
                Portal del Cliente
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Atención a Flotillas y Particulares • Solicitudes, Diagnósticos en Vivo y Facturación
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveModule('nueva_solicitud')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>Nueva Solicitud</span>
            </button>
          </div>
        </div>
      </div>

      {/* MÓDULO: NUEVA SOLICITUD */}
      {activeModule === 'nueva_solicitud' && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs animate-fadeIn">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h2 className="text-lg font-bold text-[#040057] flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-indigo-600" />
              Creación de Solicitud de Servicio
            </h2>
            <p className="text-xs text-slate-500">
              Registra la atención para taller, asistencia vial o rescate en carretera con la ficha de la unidad.
            </p>
          </div>

          <form onSubmit={handleSubmitNewOrder} className="space-y-6">
            
            {/* 1. Tipo de Atención */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                1. Tipo de Atención Requerida *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setServiceType('taller')}
                  className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                    serviceType === 'taller'
                      ? 'border-[#040057] bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#040057]">Visita a Taller</span>
                    <Wrench className="w-5 h-5 text-[#040057]" />
                  </div>
                  <p className="text-xs text-slate-600">
                    Ingreso programado a instalaciones para mantenimiento mayor o diagnóstico.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceType('asistencia')}
                  className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                    serviceType === 'asistencia'
                      ? 'border-[#040057] bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#040057]">Asistencia Vial</span>
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs text-slate-600">
                    Atención técnica rápida en sitio, patio de maniobras o CEDIS.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceType('rescate')}
                  className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                    serviceType === 'rescate'
                      ? 'border-rose-600 bg-rose-50/80 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-rose-700">Rescate en Carretera</span>
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  </div>
                  <p className="text-xs text-rose-800">
                    Unidad varada en autopista / carretera con máxima prioridad de auxilio.
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Ficha de la Unidad */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                2. Ficha de la Unidad *
              </label>
              
              {/* Selector de Tipo de Vehículo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[
                  { id: 'tractocamion', label: 'Tractocamión', icon: <Truck className="w-4 h-4" /> },
                  { id: 'camion', label: 'Camión', icon: <Truck className="w-4 h-4" /> },
                  { id: 'bus', label: 'Autobús / Bus', icon: <Bus className="w-4 h-4" /> },
                  { id: 'auto', label: 'Automóvil / Pickup', icon: <Car className="w-4 h-4" /> },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicleType(v.id as VehicleType)}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      vehicleType === v.id
                        ? 'bg-[#040057] text-white border-[#040057]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {v.icon}
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Placas de la Unidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={plates}
                    onChange={(e) => setPlates(e.target.value)}
                    placeholder="Ej. 82-AF-9K"
                    className="w-full px-3 py-2 text-xs uppercase border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número Económico *
                  </label>
                  <input
                    type="text"
                    required
                    value={economicNumber}
                    onChange={(e) => setEconomicNumber(e.target.value)}
                    placeholder="Ej. ECO-402"
                    className="w-full px-3 py-2 text-xs uppercase border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marca de la Unidad
                  </label>
                  <input
                    type="text"
                    value={unitBrand}
                    onChange={(e) => setUnitBrand(e.target.value)}
                    placeholder="Ej. Kenworth, Freightliner..."
                    className="w-full px-3 py-2 text-xs uppercase border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modelo y Año
                  </label>
                  <input
                    type="text"
                    value={unitModel}
                    onChange={(e) => setUnitModel(e.target.value)}
                    placeholder="Ej. T680 2023, M2 106..."
                    className="w-full px-3 py-2 text-xs uppercase border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Ubicación y Avería */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Ubicación Exacta / Dirección *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Detectar Ubicación GPS
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej. Autopista México-Querétaro Km 89 acotamiento derecho / Patio Tultitlán"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Avería / Falla Reportada Detallada *
                </label>
                <textarea
                  required
                  rows={3}
                  value={failureDescription}
                  onChange={(e) => setFailureDescription(e.target.value)}
                  placeholder="Describe los síntomas observados: códigos en tablero, fugas de aire, ruidos en transmisión, sobrecalentamiento, etc."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre y Teléfono del Operador en Sitio
                  </label>
                  <input
                    type="text"
                    value={driverContact}
                    onChange={(e) => setDriverContact(e.target.value)}
                    placeholder="Ej. Juan Pérez - 55 9988 7766"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridad de Atención
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057] bg-white"
                  >
                    <option value="baja">Baja (Mantenimiento preventivo)</option>
                    <option value="media">Media (Puede rodar despacio)</option>
                    <option value="alta">Alta (Unidad detenida en patio)</option>
                    <option value="urgente">Urgente (Rescate carretero / Carga en riesgo)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModule('mis_solicitudes')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Generar Solicitud de Servicio
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MÓDULO: MIS SOLICITUDES / SEGUIMIENTO EN TIEMPO REAL */}
      {(activeModule === 'mis_solicitudes' || activeModule === 'inicio') && (
        <div className="space-y-4">
          
          {/* Barra de búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por placas, económico, folio..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium self-end sm:self-auto">
              Total: {filteredOrders.length} solicitudes registradas
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-700">No hay solicitudes activas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                No tienes solicitudes en proceso. Genera una nueva solicitud de servicio para iniciar el flujo técnico.
              </p>
              <button
                onClick={() => setActiveModule('nueva_solicitud')}
                className="px-4 py-2 rounded-xl bg-[#040057] text-white text-xs font-semibold shadow-xs"
              >
                Registrar Solicitud Ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => {
                const getStatusInfo = (status: string) => {
                  switch (status) {
                    case 'solicitado':
                      return { text: 'Paso A: Solicitado (En Espera de Asignación)', color: 'bg-amber-100 text-amber-900 border-amber-200' };
                    case 'asignado':
                      return { text: 'Paso B: Técnico Asignado', color: 'bg-blue-100 text-[#040057] border-blue-200' };
                    case 'en_diagnostico_trabajo':
                      return { text: 'Paso C: En Diagnóstico y Trabajo', color: 'bg-indigo-100 text-indigo-900 border-indigo-200' };
                    case 'evidencias_en_revision':
                      return { text: 'Paso D/E: Evidencias en Revisión de Gerencia', color: 'bg-purple-100 text-purple-900 border-purple-200' };
                    case 'evidencias_rechazadas':
                      return { text: 'Paso F: Evidencias Observadas / En Corrección', color: 'bg-rose-100 text-rose-900 border-rose-200' };
                    case 'liberacion_autorizada':
                      return { text: 'Paso G: Liberación de Unidad Autorizada', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
                    case 'unidad_liberada':
                      return { text: 'Unidad Entregada / Liberada Físicamente', color: 'bg-teal-100 text-teal-900 border-teal-200' };
                    case 'cotizacion_pendiente':
                      return { text: 'Paso H: Cotización Pendiente de Tu Autorización', color: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' };
                    case 'cotizacion_aprobada':
                      return { text: 'Paso I: Cotización Aprobada por Cliente', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
                    case 'facturado':
                      return { text: 'Paso J: Servicio Concluido y Facturado', color: 'bg-slate-100 text-slate-800 border-slate-300' };
                    default:
                      return { text: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
                  }
                };

                const statusInfo = getStatusInfo(order.status);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-extrabold text-[#040057]">
                          {order.folio}
                        </span>
                        <StatusSemaphoreBadge 
                          status={order.status} 
                          priority={order.priority} 
                          quotationStatus={order.quotation?.status}
                          showCategoryHint
                        />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                          order.priority === 'urgente' ? 'bg-rose-600 text-white' :
                          order.priority === 'alta' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {order.priority}
                        </span>
                      </div>
                    </div>

                    {/* Ficha de la Unidad y avería */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Datos de la Unidad</span>
                        <div className="font-bold text-[#040057] text-sm">
                          {order.vehicle.type.toUpperCase()} • Placas: {order.vehicle.plates}
                        </div>
                        <div className="text-slate-600 font-medium">
                          Económico: <span className="text-slate-800 font-bold">{order.vehicle.economicNumber}</span>
                          {(order.vehicle.brand || order.vehicle.brandModel) && (
                            <span className="ml-1 text-[#040057] font-bold">
                              • {order.vehicle.brand || order.vehicle.brandModel?.split(' ')[0]} {order.vehicle.model || ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Atención y Ubicación</span>
                        <div className="font-semibold text-slate-800 capitalize flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{order.vehicle.location}</span>
                        </div>
                        <div className="text-slate-500">
                          Servicio: <span className="font-semibold capitalize text-slate-700">{order.serviceType}</span>
                          {order.assignedTechnicianName && ` • Técnico: ${order.assignedTechnicianName}`}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avería Reportada</span>
                        <p className="text-slate-700 line-clamp-2">
                          {order.vehicle.failureDescription}
                        </p>
                      </div>
                    </div>

                    {/* Barra de progreso de flujo (Graph TD) */}
                    <div className="mt-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5 overflow-x-auto">
                        <span className={order.status ? 'text-[#040057] font-bold' : ''}>1. Solicitud</span>
                        <span className={order.assignedTechnicianId ? 'text-[#040057] font-bold' : ''}>2. Asignación</span>
                        <span className={order.startTime ? 'text-[#040057] font-bold' : ''}>3. Diagnóstico</span>
                        <span className={order.evidences.length > 0 ? 'text-[#040057] font-bold' : ''}>4. Evidencias</span>
                        <span className={order.adminApprovedAt ? 'text-emerald-700 font-bold' : ''}>5. Liberación</span>
                        <span className={order.quotation?.status === 'aprobada' ? 'text-emerald-700 font-bold' : ''}>6. Cotización</span>
                        <span className={order.invoice ? 'text-emerald-700 font-bold' : ''}>7. Factura</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#040057] h-full transition-all duration-300"
                          style={{
                            width: 
                              order.status === 'facturado' ? '100%' :
                              order.status === 'cotizacion_aprobada' ? '85%' :
                              order.status === 'cotizacion_pendiente' ? '70%' :
                              order.status === 'liberacion_autorizada' || order.status === 'unidad_liberada' ? '60%' :
                              order.status === 'evidencias_en_revision' ? '45%' :
                              order.status === 'en_diagnostico_trabajo' ? '30%' :
                              order.status === 'asignado' ? '18%' : '8%'
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Acciones del Cliente */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {order.evidences.length > 0 && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {order.evidences.length} evidencias fotográficas registradas
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* Botón para ver Reporte Técnico Oficial (Hoja de Servicio) */}
                        <button
                          onClick={() => {
                            setSelectedReportOrder(order);
                            setClientSignName(order.userOperatorName || order.vehicle.driverContact || 'Omar Balderas (Operador)');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#040057]" />
                          <span>Reporte Técnico {order.reportNumber ? `#${order.reportNumber}` : ''}</span>
                          {order.clientSignature && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>

                        {/* Botón de acción para revisar cotización */}
                        {order.quotation && order.quotation.status === 'enviada' && (
                          <button
                            onClick={() => setSelectedQuoteOrder(order)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 animate-pulse"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Revisar y Autorizar Cotización (${order.quotation.total.toLocaleString('es-MX')})</span>
                          </button>
                        )}

                        {/* Botón para ver factura */}
                        {order.invoice && (
                          <button
                            onClick={() => setViewInvoiceOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Consultar Factura ({order.invoice.fiscalFolio})</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MÓDULO: COTIZACIONES PENDIENTES */}
      {activeModule === 'cotizaciones' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200">
            <h2 className="text-lg font-bold text-[#040057] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              Revisión y Aprobación de Presupuestos
            </h2>
            <p className="text-xs text-slate-500">
              Autoriza digitalmente los presupuestos desglosados de mano de obra, refacciones y viáticos enviados por el taller.
            </p>
          </div>

          {quotesPending.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-700">Sin cotizaciones pendientes de revisión</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Todas las cotizaciones han sido respondidas o aún están siendo elaboradas por el área administrativa.
              </p>
            </div>
          ) : (
            quotesPending.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#040057]">{order.folio}</span>
                    <h3 className="text-base font-bold text-slate-800">
                      Unidad {order.vehicle.type.toUpperCase()} • Placas: {order.vehicle.plates} (Económico {order.vehicle.economicNumber})
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Monto Total a Autorizar:</span>
                    <div className="text-xl font-extrabold text-[#040057]">
                      ${order.quotation?.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </div>
                  </div>
                </div>

                {/* Desglose de cotización */}
                <div className="py-3 text-xs space-y-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Mano de Obra ({order.quotation?.laborHours} hrs @ ${order.quotation?.laborRatePerHour}/hr):</span>
                      <span className="font-semibold text-slate-800">
                        ${((order.quotation?.laborHours || 0) * (order.quotation?.laborRatePerHour || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600">Refacciones e Insumos ({order.quotation?.parts.length} partidas):</span>
                      <span className="font-semibold text-slate-800">
                        ${order.quotation?.parts.reduce((a, b) => {
                          const q = typeof b.quantity === 'number' ? b.quantity : (parseFloat(String(b.quantity)) || 1);
                          return a + (q * b.unitPrice);
                        }, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600">Viáticos de Asistencia / Rescate o Grúa:</span>
                      <span className="font-semibold text-slate-800">
                        ${(order.quotation?.expensesAndTowing || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-[#040057]">
                      <span>Total con IVA (16%):</span>
                      <span>${order.quotation?.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                    </div>
                  </div>

                  {order.quotation?.notes && (
                    <div className="text-slate-600 text-xs italic">
                      Nota del taller: {order.quotation.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedQuoteOrder(order);
                      setShowRejectInput(true);
                    }}
                    className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                  >
                    Rechazar con Notas
                  </button>
                  <button
                    onClick={() => {
                      setSelectedQuoteOrder(order);
                      setShowRejectInput(false);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Cotización Digitalmente</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MÓDULO: HISTORIAL DE SERVICIOS Y FACTURAS */}
      {activeModule === 'historial' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200">
            <h2 className="text-lg font-bold text-[#040057] flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Historial de Servicios y Facturas Emitidas
            </h2>
            <p className="text-xs text-slate-500">
              Consulta las órdenes concluidas y descarga comprobantes fiscales emitidos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {orders.filter(o => o.invoice || o.status === 'facturado' || o.status === 'unidad_liberada').map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#040057] text-sm">{order.folio}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {order.invoice ? 'Facturado' : 'Completado'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    Unidad: <strong>{order.vehicle.type.toUpperCase()}</strong> ({order.vehicle.plates} - {order.vehicle.economicNumber})
                  </div>
                  <div className="text-xs text-slate-500">
                    Fecha de servicio: {new Date(order.createdAt).toLocaleDateString('es-MX')}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {order.invoice && (
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Total Facturado</span>
                      <div className="text-base font-extrabold text-emerald-700">
                        ${order.invoice.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )}

                  {order.invoice && (
                    <button
                      onClick={() => setViewInvoiceOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-[#040057] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#070085]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ver Factura</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE AUTORIZACIÓN DE COTIZACIÓN */}
      {selectedQuoteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base sm:text-lg font-bold text-[#040057] mb-1">
              {showRejectInput ? 'Rechazar Presupuesto de Servicio' : 'Aprobación Digital de Cotización'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Orden {selectedQuoteOrder.folio} • Unidad placas {selectedQuoteOrder.vehicle.plates}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4 space-y-1">
              <div className="flex justify-between font-bold text-slate-800 text-sm">
                <span>Monto a autorizar:</span>
                <span className="text-[#040057]">${selectedQuoteOrder.quotation?.total.toLocaleString('es-MX')} MXN</span>
              </div>
              <div className="text-slate-500">
                Incluye mano de obra, insumos y viáticos con desglose tributario de IVA al 16%.
              </div>
            </div>

            {showRejectInput ? (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo de Rechazo u Observaciones *
                </label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Explica qué partidas o costos requieren ajuste..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Responsable que Autoriza Digitalmente *
                </label>
                <input
                  type="text"
                  value={authorizerName}
                  onChange={(e) => setAuthorizerName(e.target.value)}
                  placeholder="Nombre y cargo de quien autoriza"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedQuoteOrder(null);
                  setShowRejectInput(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              {showRejectInput ? (
                <button
                  onClick={handleRejectQuote}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
                >
                  Confirmar Rechazo
                </button>
              ) : (
                <button
                  onClick={handleApproveQuote}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                >
                  Firmar y Autorizar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZACIÓN DE FACTURA */}
      {viewInvoiceOrder && viewInvoiceOrder.invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <img
                  src="https://appdesignproyectos.com/olmedologo.png"
                  alt="Olmedo Servicio Técnico"
                  className="h-10 w-auto mb-2"
                />
                <span className="text-xs font-bold text-slate-500">Comprobante Fiscal Digital (CFDI)</span>
                <div className="text-base font-extrabold text-[#040057]">
                  Folio: {viewInvoiceOrder.invoice.fiscalFolio}
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                <div>Fecha: {new Date(viewInvoiceOrder.invoice.issueDate).toLocaleDateString('es-MX')}</div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold mt-1">
                  Estatus: {viewInvoiceOrder.invoice.paymentStatus.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-bold text-slate-700">Receptor:</div>
                <div className="text-slate-800">{viewInvoiceOrder.clientName}</div>
                <div className="text-slate-500">{viewInvoiceOrder.clientContact}</div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-2.5 bg-slate-100 font-bold text-slate-700 flex justify-between">
                  <span>Concepto / Unidad</span>
                  <span>Monto</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Servicio Técnico y Reparación ({viewInvoiceOrder.folio})</div>
                      <div className="text-slate-500 text-[11px]">Unidad: {viewInvoiceOrder.vehicle.type.toUpperCase()} Placas {viewInvoiceOrder.vehicle.plates}</div>
                    </div>
                    <span className="font-bold text-slate-800">${viewInvoiceOrder.invoice.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>${viewInvoiceOrder.invoice.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA Trasladado (16%):</span>
                    <span>${viewInvoiceOrder.invoice.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm text-[#040057] pt-1 border-t border-slate-200">
                    <span>Total CFDI:</span>
                    <span>${viewInvoiceOrder.invoice.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewInvoiceOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  alert(`Descargando representación digital PDF para folio ${viewInvoiceOrder.invoice?.fiscalFolio}...`);
                }}
                className="px-4 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar PDF / XML</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZACIÓN DEL REPORTE TÉCNICO OFICIAL */}
      {selectedReportOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-[#040057] text-white flex justify-between items-center print:hidden">
              <div>
                <h3 className="text-base font-bold">REPORTE TÉCNICO {selectedReportOrder.reportNumber || '023'}</h3>
                <p className="text-xs text-blue-200">Hoja oficial de servicio • {selectedReportOrder.clientName}</p>
              </div>
              <button onClick={() => setSelectedReportOrder(null)} className="text-slate-300 hover:text-white">✕</button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <TechnicalReportDocument
                order={selectedReportOrder}
                showSignButton={true}
                onSignClient={() => setShowSignDialog(true)}
              />
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end print:hidden">
              <button
                onClick={() => setSelectedReportOrder(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 text-slate-800 font-semibold text-xs hover:bg-slate-300"
              >
                Cerrar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FIRMA DIGITAL DEL CLIENTE */}
      {showSignDialog && selectedReportOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-[#040057]">
              <PenTool className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold">Firma de Conformidad del Cliente</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Al estampar tu firma, confirmas la recepción y conformidad con los trabajos y refacciones asentados en el <strong>REPORTE TÉCNICO {selectedReportOrder.reportNumber || '023'}</strong>.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!clientSignName.trim()) return;
              clientSignReport(selectedReportOrder.id, clientSignName.trim());
              setShowSignDialog(false);
            }} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre Completo / Firma de Quien Recibe la Unidad *
                </label>
                <input
                  type="text"
                  required
                  value={clientSignName}
                  onChange={(e) => setClientSignName(e.target.value)}
                  placeholder="Ej. Omar Balderas (Operador) / Ing. Arturo Ramírez"
                  className="w-full px-3 py-2 border rounded-lg font-serif italic text-sm focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowSignDialog(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Confirmar y Firmar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
