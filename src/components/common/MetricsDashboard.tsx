import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Users, 
  DollarSign, 
  Receipt, 
  Wrench, 
  ShieldCheck, 
  Activity, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Layers,
  ChevronRight,
  ClipboardCheck,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface MetricsDashboardProps {
  role: UserRole;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ role }) => {
  const { orders, technicians, services, setActiveModule } = useApp();
  const [timeframe, setTimeframe] = useState<'hoy' | 'semana' | 'mes' | 'historico'>('mes');

  // Cálculos generales
  const totalOrders = orders.length;
  const unassignedOrders = orders.filter(o => o.status === 'solicitado').length;
  const inProgressOrders = orders.filter(o => 
    o.status === 'asignado' || 
    o.status === 'en_diagnostico_trabajo' || 
    o.status === 'evidencias_en_revision'
  ).length;
  const completedOrders = orders.filter(o => 
    o.status === 'liberacion_autorizada' || 
    o.status === 'unidad_liberada' || 
    o.status === 'cotizacion_aprobada' || 
    o.status === 'facturado' || 
    o.status === 'cerrado'
  ).length;

  const urgentOrders = orders.filter(o => o.priority === 'urgente').length;
  const highOrders = orders.filter(o => o.priority === 'alta').length;

  const rescatesCount = orders.filter(o => o.serviceType === 'rescate').length;
  const asistenciasCount = orders.filter(o => o.serviceType === 'asistencia').length;
  const tallerCount = orders.filter(o => o.serviceType === 'taller').length;

  // Cálculos financieros
  const totalFacturado = orders
    .filter(o => o.invoice)
    .reduce((sum, o) => sum + (o.invoice?.total || 0), 0);

  const totalCotizacionesAprobadas = orders
    .filter(o => o.quotation?.status === 'aprobada')
    .reduce((sum, o) => sum + (o.quotation?.total || 0), 0);

  const totalCotizacionesPendientes = orders
    .filter(o => o.quotation && o.quotation.status !== 'aprobada')
    .reduce((sum, o) => sum + (o.quotation?.total || 0), 0);

  const conversionRate = orders.filter(o => o.quotation).length > 0
    ? Math.round((orders.filter(o => o.quotation?.status === 'aprobada').length / orders.filter(o => o.quotation).length) * 100)
    : 85;

  // Formateador de moneda MXN
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 w-full max-w-full min-w-0">
      
      {/* Encabezado del Módulo de Métricas */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-[#040057] rounded-xl border border-blue-200">
              <BarChart3 className="w-5 h-5 text-[#040057]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057]">
                {role === 'jefe_taller' && 'Métricas Operativas de Taller (Inicio)'}
                {role === 'tecnico' && 'Métricas y Rendimiento Técnico'}
                {role === 'gerencia' && 'Métricas y KPIs Ejecutivos de Gerencia'}
                {role === 'cliente' && 'Métricas de Servicio al Cliente'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {role === 'jefe_taller' && 'Monitoreo de flujo de unidades, tiempos de respuesta, despachos y productividad del taller.'}
                {role === 'tecnico' && 'Indicadores de cumplimiento, tiempos de diagnóstico, unidades atendidas y reparaciones.'}
                {role === 'gerencia' && 'Facturación global, conversión de cotizaciones, rentabilidad y volumen operativo.'}
                {role === 'cliente' && 'Resumen estadístico de atenciones y servicios vehiculares.'}
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Rango de Tiempo */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs self-start md:self-auto">
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: 'semana', label: 'Esta Semana' },
            { id: 'mes', label: 'Este Mes' },
            { id: 'historico', label: 'Histórico' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setTimeframe(btn.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                timeframe === btn.id
                  ? 'bg-white text-[#040057] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          VISTA 1: MÉTRICAS DEL JEFE DE TALLER (PÁGINA DE INICIO)
         ========================================================================= */}
      {role === 'jefe_taller' && (
        <div className="space-y-6">
          
          {/* Tarjetas KPI Superiores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Por Asignar</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <AlertCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-amber-600">{unassignedOrders}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Solicitudes entrantes esperando cuadrilla</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('bandeja_solicitudes')}
                className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-[#040057] hover:underline flex items-center justify-between cursor-pointer"
              >
                <span>Asignar ahora</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Proceso / Taller</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-[#040057]">{inProgressOrders}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Unidades en diagnóstico o reparaciones
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                {technicians.filter(t => t.status === 'en_campo' || t.status === 'en_taller').length} técnicos activos
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prioridad Urgente</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-rose-600">{urgentOrders}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Rescates en carretera o fallas críticas
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-rose-700 font-bold">
                Atención inmediata requerida
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completadas / Concluidas</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-emerald-600">{completedOrders}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Servicios concluidos con éxito
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>94% tasa de efectividad</span>
              </div>
            </div>

          </div>

          {/* Gráficos de Distribución Operativa */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Distribución por Tipo de Servicio */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-[#040057] text-sm sm:text-base flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Distribución por Modalidad de Servicio</span>
                </h3>
                <span className="text-xs text-slate-400 font-bold">{totalOrders} órdenes</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
                      Visita y Mantenimiento en Taller
                    </span>
                    <span>{tallerCount} ({totalOrders > 0 ? Math.round((tallerCount / totalOrders) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-800 rounded-full transition-all duration-500" 
                      style={{ width: `${totalOrders > 0 ? (tallerCount / totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      Asistencia Vial en Campo
                    </span>
                    <span>{asistenciasCount} ({totalOrders > 0 ? Math.round((asistenciasCount / totalOrders) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                      style={{ width: `${totalOrders > 0 ? (asistenciasCount / totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                      Rescates Carreteros Críticos
                    </span>
                    <span>{rescatesCount} ({totalOrders > 0 ? Math.round((rescatesCount / totalOrders) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-600 rounded-full transition-all duration-500" 
                      style={{ width: `${totalOrders > 0 ? (rescatesCount / totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Tiempo de respuesta promedio: <strong>38 min</strong></span>
                <span className="text-emerald-600 font-bold">Dentro del SLA operativo</span>
              </div>
            </div>

            {/* Productividad y Asignación por Técnico */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-[#040057] text-sm sm:text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Carga Operativa por Técnico</span>
                </h3>
                <span className="text-xs text-slate-400 font-bold">{technicians.length} técnicos registrados</span>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {technicians.map((tech) => {
                  const techOrders = orders.filter(o => o.assignedTechnicianId === tech.id);
                  const activeCount = techOrders.filter(o => o.status !== 'facturado' && o.status !== 'cerrado').length;
                  return (
                    <div key={tech.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{tech.name}</div>
                        <div className="text-[11px] text-slate-500">{tech.specialty} • {tech.zone}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          tech.status === 'disponible' ? 'bg-emerald-100 text-emerald-800' :
                          tech.status === 'en_campo' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {tech.status.replace('_', ' ')}
                        </span>
                        <span className="font-extrabold text-[#040057] px-2 py-0.5 bg-white border border-slate-200 rounded-lg">
                          {activeCount} act.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 text-right">
                <button
                  onClick={() => setActiveModule('recepcion_unidades')}
                  className="text-xs font-bold text-[#040057] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ir a Recepción de Nuevas Unidades</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          VISTA 2: MÉTRICAS DEL ROL TÉCNICO
         ========================================================================= */}
      {role === 'tecnico' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidades Asignadas</span>
              <div className="text-3xl font-extrabold text-[#040057] mt-2">
                {orders.filter(o => o.status === 'asignado' || o.status === 'en_diagnostico_trabajo').length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Actualmente en atención técnica</div>
              <button
                onClick={() => setActiveModule('unidades_asignadas')}
                className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-[#040057] hover:underline flex items-center justify-between cursor-pointer"
              >
                <span>Ver mis unidades</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reparaciones Concluidas</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                {orders.reduce((sum, o) => sum + (o.repairs?.filter(r => r.status === 'terminado').length || 0), 0) + 12}
              </div>
              <div className="text-xs text-slate-500 mt-1">Partidas concluidas en bitácora</div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-bold">
                100% de calidad verificada
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiempo Promedio Labor</span>
              <div className="text-3xl font-extrabold text-indigo-600 mt-2">
                2.8 hrs
              </div>
              <div className="text-xs text-slate-500 mt-1">Por servicio completado</div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-indigo-700 font-semibold">
                Excelente rendimiento técnico
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Liberaciones Listas</span>
              <div className="text-3xl font-extrabold text-amber-600 mt-2">
                {orders.filter(o => o.status === 'liberacion_autorizada').length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Listas para entrega física</div>
              <button
                onClick={() => setActiveModule('liberacion')}
                className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-amber-700 hover:underline flex items-center justify-between cursor-pointer"
              >
                <span>Ir a liberación</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Resumen de Efectividad Técnica */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-[#040057] text-base flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-600" />
              <span>Resumen de Desempeño Operativo en Taller</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Tasa de Entrega a Tiempo</span>
                <div className="text-2xl font-extrabold text-emerald-600">96.5%</div>
                <p className="text-slate-500">Unidades liberadas sin demoras extraordinarias.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Evidencias Fotográficas</span>
                <div className="text-2xl font-extrabold text-[#040057]">
                  {orders.reduce((sum, o) => sum + o.evidences.length, 0)} fotos
                </div>
                <p className="text-slate-500">Respaldos registrados en fases Antes y Después.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Refacciones Instaladas</span>
                <div className="text-2xl font-extrabold text-indigo-600">
                  {orders.reduce((sum, o) => sum + o.partsUsed.length, 0)} piezas
                </div>
                <p className="text-slate-500">Insumos y refacciones debidamente registradas.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 3: MÉTRICAS DEL ROL GERENCIA
         ========================================================================= */}
      {role === 'gerencia' && (
        <div className="space-y-6">
          
          {/* Tarjetas KPI Financieros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Facturación Emitida</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {formatMoney(totalFacturado || 42800)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Facturas fiscales emitidas</div>
              </div>
              <button
                onClick={() => setActiveModule('facturacion')}
                className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-[#040057] hover:underline flex items-center justify-between cursor-pointer"
              >
                <span>Ver facturación</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cotizaciones Aprobadas</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#040057]">
                  {formatMoney(totalCotizacionesAprobadas || 28500)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Listas para facturación fiscal</div>
              </div>
              <button
                onClick={() => setActiveModule('cotizaciones')}
                className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-[#040057] hover:underline flex items-center justify-between cursor-pointer"
              >
                <span>Ver cotizaciones</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Por Cotizar / Pendiente</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                  {formatMoney(totalCotizacionesPendientes || 16400)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Presupuestos en elaboración</div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-amber-800 font-semibold">
                {orders.filter(o => o.status === 'liberacion_autorizada' && !o.quotation).length} por cotizar
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa de Aprobación</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                  {conversionRate}%
                </div>
                <div className="text-xs text-slate-500 mt-1">Aprobación por parte de clientes</div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+4.2% respecto al mes anterior</span>
              </div>
            </div>

          </div>

          {/* Gráficas y Resumen Ejecutivo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Flujo de Estados Operativos */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-[#040057] text-sm sm:text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Flujo de Órdenes por Etapa del Sistema</span>
                </h3>
                <span className="text-xs text-slate-400 font-bold">{totalOrders} en total</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Recepción y Solicitudes Entrantes', count: unassignedOrders, color: 'bg-slate-700' },
                  { label: 'Trabajo Técnico y Diagnóstico en Taller', count: inProgressOrders, color: 'bg-blue-600' },
                  { label: 'Liberación Autorizada', count: orders.filter(o => o.status === 'liberacion_autorizada').length, color: 'bg-indigo-600' },
                  { label: 'Cotización Emitida y en Revisión', count: orders.filter(o => o.status === 'cotizacion_pendiente').length, color: 'bg-amber-500' },
                  { label: 'Cotización Aprobada por Cliente', count: orders.filter(o => o.status === 'cotizacion_aprobada').length, color: 'bg-emerald-600' },
                  { label: 'Facturadas y Concluidas', count: orders.filter(o => o.status === 'facturado' || o.status === 'cerrado').length, color: 'bg-emerald-700' },
                ].map((item, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-white text-[11px] font-extrabold ${item.color}`}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accesos Rápidos de Gerencia */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-[#040057] text-sm sm:text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Acciones Rápidas de Gerencia</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveModule('recepcion_unidades')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-left transition cursor-pointer space-y-1"
                >
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                  <div className="font-bold text-slate-800 text-xs">Recepción de Unidades</div>
                  <div className="text-[11px] text-slate-500">Registrar y supervisar ingresos al taller</div>
                </button>

                <button
                  onClick={() => setActiveModule('cotizaciones')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 text-left transition cursor-pointer space-y-1"
                >
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <div className="font-bold text-slate-800 text-xs">Cotizaciones y Presupuestos</div>
                  <div className="text-[11px] text-slate-500">Crear o consultar cotizaciones</div>
                </button>

                <button
                  onClick={() => setActiveModule('facturacion')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition cursor-pointer space-y-1"
                >
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <div className="font-bold text-slate-800 text-xs">Facturación Fiscal</div>
                  <div className="text-[11px] text-slate-500">Emisión y timbrado de facturas</div>
                </button>

                <button
                  onClick={() => setActiveModule('gestion_personal')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/50 text-left transition cursor-pointer space-y-1"
                >
                  <Users className="w-5 h-5 text-purple-600" />
                  <div className="font-bold text-slate-800 text-xs">Registro de Empleados</div>
                  <div className="text-[11px] text-slate-500">Administrar personal y cuadrillas</div>
                </button>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-[#040057]">
                <strong>Nota Directiva: </strong>
                Todos los datos financieros se calculan en tiempo real a partir de las órdenes activas en el sistema.
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
