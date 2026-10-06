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
  PhoneCall
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, ServiceType, Technician } from '../../types';

export const JefeTallerPortal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    orders, 
    technicians, 
    assignTechnician 
  } = useApp();

  const [selectedServiceType, setSelectedServiceType] = useState<string>('todos');
  const [assigningOrder, setAssigningOrder] = useState<ServiceOrder | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>('alta');

  // Filter incoming orders (solicitado)
  const incomingOrders = orders.filter(o => o.status === 'solicitado');
  const activeFloorOrders = orders.filter(o => 
    o.status === 'asignado' || 
    o.status === 'en_diagnostico_trabajo' || 
    o.status === 'evidencias_en_revision' ||
    o.status === 'evidencias_rechazadas' ||
    o.status === 'liberacion_autorizada'
  );

  const filteredIncoming = incomingOrders.filter(o => {
    if (selectedServiceType === 'todos') return true;
    return o.serviceType === selectedServiceType;
  });

  const handleOpenAssignModal = (order: ServiceOrder) => {
    setAssigningOrder(order);
    setSelectedPriority(order.priority);
    // Suggest first available technician
    const available = technicians.find(t => t.status === 'disponible');
    if (available) setSelectedTechId(available.id);
    else if (technicians.length > 0) setSelectedTechId(technicians[0].id);
  };

  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrder || !selectedTechId) return;

    assignTechnician(assigningOrder.id, selectedTechId, selectedPriority);
    setAssigningOrder(null);
  };

  const calculateElapsedTime = (startDateStr: string) => {
    const start = new Date(startDateStr).getTime();
    const now = Date.now();
    const diffMin = Math.floor((now - start) / (1000 * 60));
    if (diffMin < 60) return `${diffMin} min`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      
      {/* Resumen Superior de Operaciones */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057]">
                Jefe de Taller y Operaciones
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Despacho Operativo • Priorización de Rescates y Asistencias • Asignación de Cuadrillas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              {incomingOrders.length} por Asignar
            </span>

            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#040057] border border-blue-200 text-xs font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              {activeFloorOrders.length} en Piso / Campo
            </span>
          </div>
        </div>
      </div>

      {/* MÓDULO 1: BANDEJA DE SOLICITUDES ENTRANTES */}
      {(activeModule === 'bandeja_solicitudes' || activeModule === 'inicio') && (
        <div className="space-y-4">
          
          {/* Filtros de Tipo de Solicitud */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="font-bold text-slate-400 uppercase text-[10px] mr-2">Filtrar por:</span>
              {[
                { id: 'todos', label: 'Todas las Solicitudes' },
                { id: 'rescate', label: 'Rescates en Carretera', badge: incomingOrders.filter(o => o.serviceType === 'rescate').length },
                { id: 'asistencia', label: 'Asistencia Vial', badge: incomingOrders.filter(o => o.serviceType === 'asistencia').length },
                { id: 'taller', label: 'Visita a Taller', badge: incomingOrders.filter(o => o.serviceType === 'taller').length },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedServiceType(btn.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedServiceType === btn.id
                      ? 'bg-[#040057] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{btn.label}</span>
                  {btn.badge !== undefined && btn.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                      {btn.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {filteredIncoming.length} pendientes
            </div>
          </div>

          {filteredIncoming.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-700">Bandeja al día</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No hay solicitudes entrantes pendientes de asignación en este filtro.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredIncoming.map((order) => (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition shadow-xs ${
                    order.serviceType === 'rescate' ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-[#040057]">{order.folio}</span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        order.serviceType === 'rescate' ? 'bg-rose-600 text-white animate-pulse' :
                        order.serviceType === 'asistencia' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
                      }`}>
                        {order.serviceType === 'rescate' ? 'Rescate en Carretera' :
                         order.serviceType === 'asistencia' ? 'Asistencia Vial' : 'Visita a Taller'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        order.priority === 'urgente' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        order.priority === 'alta' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        Prioridad {order.priority}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reportado hace {calculateElapsedTime(order.createdAt)}</span>
                    </div>
                  </div>

                  {/* Ficha técnica y avería */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Cliente y Contacto</span>
                      <div className="font-bold text-slate-800">{order.clientName}</div>
                      <div className="text-slate-500">{order.clientContact}</div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Ficha de la Unidad</span>
                      <div className="font-bold text-[#040057]">
                        {order.vehicle.type.toUpperCase()} • Placas: {order.vehicle.plates}
                      </div>
                      <div className="text-slate-600">
                        Económico: <span className="font-bold text-slate-800">{order.vehicle.economicNumber}</span>
                        {order.vehicle.brandModel && ` (${order.vehicle.brandModel})`}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Ubicación y Operador</span>
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">{order.vehicle.location}</span>
                      </div>
                      <div className="text-slate-500">{order.vehicle.driverContact || 'Sin chofer reportado'}</div>
                    </div>
                  </div>

                  {/* Detalle de Avería */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 mb-3">
                    <span className="font-bold text-[#040057]">Avería Reportada: </span>
                    {order.vehicle.failureDescription}
                  </div>

                  {/* Botón Asignar */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenAssignModal(order)}
                      className="px-4 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>Asignar Técnico Calificado</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MÓDULO 2: ASIGNACIÓN Y CATÁLOGO DE TÉCNICOS */}
      {(activeModule === 'asignacion_tecnicos' || activeModule === 'catalogo_tecnicos') && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200">
            <h2 className="text-lg font-bold text-[#040057] flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Disponibilidad Operativa de Técnicos
            </h2>
            <p className="text-xs text-slate-500">
              Supervisa la carga de trabajo, zonas y especialidades de los técnicos de taller y cuadrillas móviles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {technicians.map((tech) => {
              const currentOrder = orders.find(o => o.id === tech.currentOrderId);
              return (
                <div key={tech.id} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        tech.status === 'disponible' ? 'bg-emerald-100 text-emerald-800' :
                        tech.status === 'en_campo' ? 'bg-blue-100 text-[#040057]' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tech.status.replace('_', ' ')}
                      </span>
                      <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    <h3 className="font-bold text-[#040057] text-sm">{tech.name}</h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{tech.specialty}</p>

                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-500">
                      <div>Zona: <span className="text-slate-800 font-semibold">{tech.zone}</span></div>
                      <div>Tel: <span className="text-slate-800">{tech.phone}</span></div>
                    </div>
                  </div>

                  {currentOrder && (
                    <div className="mt-3 p-2 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px]">
                      <span className="font-bold text-[#040057]">Orden Asignada: </span>
                      <span>{currentOrder.folio} ({currentOrder.vehicle.plates})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MÓDULO 3: MONITOREO DE PISO Y CAMPO */}
      {activeModule === 'monitoreo_piso' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200">
            <h2 className="text-lg font-bold text-[#040057] flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Monitoreo de Piso y Cuadrillas en Campo
            </h2>
            <p className="text-xs text-slate-500">
              Supervisión de tiempos de respuesta, avances en diagnóstico y estado de órdenes en progreso.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeFloorOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-[#040057] text-base">{order.folio}</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#040057]">
                      {order.status === 'asignado' ? 'Asignado (Técnico por iniciar)' :
                       order.status === 'en_diagnostico_trabajo' ? 'En Diagnóstico / Reparación' :
                       order.status === 'evidencias_en_revision' ? 'Evidencias en Revisión de Gerencia' :
                       order.status === 'evidencias_rechazadas' ? 'Evidencias Observadas (Corrigiendo)' : 'Liberación Autorizada'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Tiempo transcurrido: {calculateElapsedTime(order.createdAt)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Técnico a Cargo</span>
                    <div className="font-bold text-[#040057] text-sm">{order.assignedTechnicianName || 'Por asignar'}</div>
                    <div className="text-slate-500">Asignado: {order.assignedAt ? new Date(order.assignedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Unidad y Ubicación</span>
                    <div className="font-bold text-slate-800">{order.vehicle.type.toUpperCase()} • {order.vehicle.plates}</div>
                    <div className="text-slate-500 truncate">{order.vehicle.location}</div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Avance Técnico</span>
                    <div className="font-semibold text-slate-700">
                      {order.evidences.length} fotos cargadas • {order.partsUsed.length} refacciones
                    </div>
                    {order.initialDiagnosis && (
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">Diag: {order.initialDiagnosis}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE ASIGNACIÓN OPERATIVA */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base sm:text-lg font-bold text-[#040057] mb-1">
              Asignar Técnico Calificado
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Orden {assigningOrder.folio} • {assigningOrder.vehicle.type.toUpperCase()} ({assigningOrder.vehicle.plates})
            </p>

            <form onSubmit={handleConfirmAssignment} className="space-y-4 text-xs">
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">Avería: {assigningOrder.vehicle.failureDescription}</div>
                <div className="text-slate-500">Ubicación: {assigningOrder.vehicle.location}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Seleccionar Técnico Operativo *
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {technicians.map((tech) => (
                    <label
                      key={tech.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        selectedTechId === tech.id
                          ? 'border-[#040057] bg-blue-50/70 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="technician"
                          value={tech.id}
                          checked={selectedTechId === tech.id}
                          onChange={() => setSelectedTechId(tech.id)}
                          className="text-[#040057] focus:ring-[#040057]"
                        />
                        <div>
                          <div className="font-bold text-slate-800">{tech.name}</div>
                          <div className="text-[11px] text-slate-500">{tech.specialty} • {tech.zone}</div>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        tech.status === 'disponible' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tech.status.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ajustar Prioridad Operativa
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057] bg-white"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente (Prioridad Máxima)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedTechId}
                  className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  Confirmar Asignación (Paso B)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
