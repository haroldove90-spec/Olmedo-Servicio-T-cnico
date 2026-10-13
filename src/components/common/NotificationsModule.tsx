import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Clock, 
  Truck, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Eye, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification, UserRole } from '../../types';

export const NotificationsModule: React.FC = () => {
  const { 
    currentRole, 
    notifications, 
    unreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification,
    addNotification,
    setActiveModule,
    orders,
    technicians
  } = useApp();

  const [filterType, setFilterType] = useState<'todas' | 'no_leidas' | 'assignment' | 'alert'>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  if (!currentRole) return null;

  // Filtrar notificaciones para el rol actual (o dirigidas a 'all')
  const roleNotifications = notifications.filter(n => 
    n.targetRole === currentRole || n.targetRole === 'all'
  );

  const filteredNotifications = roleNotifications.filter(n => {
    if (filterType === 'no_leidas' && n.read) return false;
    if (filterType === 'assignment' && n.type !== 'assignment') return false;
    if (filterType === 'alert' && n.type !== 'alert') return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchMsg = n.message.toLowerCase().includes(q);
      const matchFolio = n.folio?.toLowerCase().includes(q);
      const matchPlates = n.metadata?.vehiclePlates?.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchFolio || matchPlates;
    }
    return true;
  });

  const unreadCount = unreadNotificationsCount(currentRole);

  const calculateTimeAgo = (timestampStr: string) => {
    const diff = Math.floor((Date.now() - new Date(timestampStr).getTime()) / 1000);
    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return new Date(timestampStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para simular una asignación en vivo y probar la campana / notificaciones
  const handleSimulateAssignment = () => {
    const randomOrder = orders[0] || { folio: 'OS-2026-001', vehicle: { type: 'tractocamion', plates: '45-AA-12' }, priority: 'urgente' };
    const randomTech = technicians[0] || { name: 'Roberto Gómez' };

    // Notificación al Técnico
    addNotification({
      title: `¡Nueva Unidad Asignada! ${randomOrder.folio}`,
      message: `El Jefe de Taller te ha asignado la unidad ${randomOrder.vehicle.type.toUpperCase()} (${randomOrder.vehicle.plates}). Prioridad: ${randomOrder.priority.toUpperCase()}.`,
      type: 'assignment',
      targetRole: 'tecnico',
      targetOrderId: randomOrder.id,
      folio: randomOrder.folio,
      metadata: {
        technicianName: randomTech.name,
        vehiclePlates: randomOrder.vehicle.plates,
        vehicleType: randomOrder.vehicle.type,
        priority: randomOrder.priority,
        assignedBy: 'Jefe de Taller',
      },
    });

    // Notificación a Gerencia
    addNotification({
      title: `Asignación de Unidad: ${randomOrder.folio}`,
      message: `Jefe de Taller asignó la orden ${randomOrder.folio} (${randomOrder.vehicle.plates}) al técnico ${randomTech.name}. Prioridad: ${randomOrder.priority.toUpperCase()}.`,
      type: 'assignment',
      targetRole: 'gerencia',
      targetOrderId: randomOrder.id,
      folio: randomOrder.folio,
      metadata: {
        technicianName: randomTech.name,
        vehiclePlates: randomOrder.vehicle.plates,
        vehicleType: randomOrder.vehicle.type,
        priority: randomOrder.priority,
        assignedBy: 'Jefe de Taller',
      },
    });

    // Notificación al Jefe de Taller
    addNotification({
      title: `Asignación Exitosa: ${randomOrder.folio}`,
      message: `Has asignado la unidad ${randomOrder.vehicle.plates} al técnico ${randomTech.name}.`,
      type: 'assignment',
      targetRole: 'jefe_taller',
      targetOrderId: randomOrder.id,
      folio: randomOrder.folio,
    });
  };

  const handleNavigateToOrder = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (currentRole === 'tecnico') {
      setActiveModule('unidades_asignadas');
    } else if (currentRole === 'jefe_taller') {
      setActiveModule('recepcion_unidades');
    } else if (currentRole === 'gerencia') {
      setActiveModule('cotizaciones');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 w-full max-w-full min-w-0">
      
      {/* Encabezado Principal */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-[#040057] rounded-xl border border-blue-200 relative">
            <Bell className="w-6 h-6 text-[#040057]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057]">
                Centro de Notificaciones y Alertas
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                Rol: {currentRole.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Avisos en tiempo real sobre asignación de unidades, despachos, órdenes de servicio y cambios de estatus.
            </p>
          </div>
        </div>

        {/* Acciones del Encabezado */}
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead(currentRole)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Marcar todas como leídas</span>
            </button>
          )}

          <button
            onClick={handleSimulateAssignment}
            title="Probar recepción de notificación de asignación de unidad"
            className="px-3.5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Simular Asignación de Unidad</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todas', label: 'Todas', badge: roleNotifications.length },
            { id: 'no_leidas', label: 'No Leídas', badge: unreadCount, badgeColor: 'bg-rose-500' },
            { id: 'assignment', label: 'Asignaciones', badge: roleNotifications.filter(n => n.type === 'assignment').length },
            { id: 'alert', label: 'Alertas', badge: roleNotifications.filter(n => n.type === 'alert').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-[#040057] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterType === tab.id ? 'bg-white/20 text-white' : tab.badgeColor ? `${tab.badgeColor} text-white` : 'bg-slate-300 text-slate-800'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar por folio, placa o texto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#040057] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Lista de Notificaciones */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700 text-base">No hay notificaciones</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterType === 'no_leidas' 
              ? 'Todas las notificaciones de tu rol han sido leídas.' 
              : 'No se encontraron notificaciones en este filtro.'}
          </p>
          <button
            onClick={handleSimulateAssignment}
            className="mt-2 px-4 py-2 rounded-xl bg-blue-50 text-[#040057] border border-blue-200 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-blue-100 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Generar una Notificación de Prueba</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                !notif.read 
                  ? 'border-blue-400 bg-blue-50/20 ring-1 ring-blue-200' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  notif.type === 'assignment' ? 'bg-indigo-100 text-[#040057]' :
                  notif.type === 'alert' ? 'bg-rose-100 text-rose-700' :
                  notif.type === 'reception' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {notif.type === 'assignment' ? <Truck className="w-5 h-5" /> :
                   notif.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> :
                   notif.type === 'reception' ? <ShieldCheck className="w-5 h-5" /> :
                   <Bell className="w-5 h-5" />}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base break-words">
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    )}
                    {notif.folio && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#040057] font-extrabold text-[10px]">
                        {notif.folio}
                      </span>
                    )}
                    {notif.metadata?.priority && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        notif.metadata.priority === 'urgente' ? 'bg-rose-100 text-rose-800' :
                        notif.metadata.priority === 'alta' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        Prioridad {notif.metadata.priority}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed break-words">
                    {notif.message}
                  </p>

                  {/* Metadatos adicionales */}
                  {notif.metadata && (
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                      {notif.metadata.technicianName && (
                        <span>Técnico: <strong className="text-slate-700">{notif.metadata.technicianName}</strong></span>
                      )}
                      {notif.metadata.vehiclePlates && (
                        <span>Placas: <strong className="text-slate-700">{notif.metadata.vehiclePlates}</strong></span>
                      )}
                      {notif.metadata.brandModel && (
                        <span>Modelo: <strong className="text-slate-700">{notif.metadata.brandModel}</strong></span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{calculateTimeAgo(notif.timestamp)}</span>
                    <span>•</span>
                    <span>{new Date(notif.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  onClick={() => handleNavigateToOrder(notif)}
                  className="px-3 py-1.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Detalle</span>
                </button>

                <div className="flex items-center gap-1">
                  {!notif.read ? (
                    <button
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold cursor-pointer"
                      title="Marcar como leída"
                    >
                      <CheckCheck className="w-4 h-4 text-emerald-600" />
                    </button>
                  ) : null}

                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Eliminar notificación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
