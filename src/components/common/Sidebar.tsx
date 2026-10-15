import React, { useState } from 'react';
import { 
  FilePlus, 
  ListFilter, 
  DollarSign, 
  Receipt, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  ClipboardCheck,
  Truck,
  Key,
  BarChart3,
  Bell,
  Wrench,
  LogOut,
  Archive,
  ClipboardList,
  Home
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { 
    currentRole, 
    setCurrentRole,
    activeModule, 
    setActiveModule, 
    orders, 
    technicians, 
    services,
    unreadNotificationsCount 
  } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  if (!currentRole) return null;

  const getRoleItems = (role: UserRole): { section: string; items: SidebarItem[] }[] => {
    const unreadNotifs = unreadNotificationsCount(role);

    switch (role) {
      case 'cliente':
        return [
          {
            section: 'Navegación',
            items: [
              {
                id: 'inicio',
                label: 'Inicio (Panel)',
                icon: <Home className="w-5 h-5" />,
              },
              {
                id: 'listado_reportes',
                label: 'Mis Reportes',
                icon: <ListFilter className="w-5 h-5" />,
              },
            ],
          },
        ];

      case 'jefe_taller':
        const unassigned = orders.filter(o => o.status === 'solicitado' || o.status === 'por_atender').length;
        return [
          {
            section: 'Panel Principal (Inicio)',
            items: [
              {
                id: 'metricas',
                label: 'Métricas de Taller (Inicio)',
                icon: <BarChart3 className="w-5 h-5" />,
              },
            ],
          },
          {
            section: 'Despacho y Operaciones',
            items: [
              {
                id: 'reportes',
                label: 'Reportes (Asignar a Técnicos)',
                icon: <ClipboardList className="w-5 h-5" />,
                badge: unassigned > 0 ? unassigned : undefined,
                badgeColor: 'bg-rose-600',
              },
              {
                id: 'recepcion_unidades',
                label: 'Recepción de Unidades',
                icon: <ClipboardCheck className="w-5 h-5" />,
              },
              {
                id: 'historial',
                label: 'Historial de Reparaciones (Cierre)',
                icon: <Archive className="w-5 h-5" />,
              },
            ],
          },
          {
            section: 'Comunicación y Alertas',
            items: [
              {
                id: 'notificaciones',
                label: 'Centro de Notificaciones',
                icon: <Bell className="w-5 h-5" />,
                badge: unreadNotifs > 0 ? unreadNotifs : undefined,
                badgeColor: 'bg-rose-600',
              },
            ],
          },
        ];

      case 'tecnico':
        const assignedUnits = orders.filter(o => 
          o.status === 'asignado' || 
          o.status === 'en_diagnostico_trabajo' || 
          o.status === 'evidencias_rechazadas'
        ).length;
        return [
          {
            section: 'Métricas y Desempeño',
            items: [
              {
                id: 'metricas',
                label: 'Métricas del Técnico',
                icon: <BarChart3 className="w-5 h-5" />,
              },
            ],
          },
          {
            section: 'Trabajo Operativo en Taller',
            items: [
              {
                id: 'unidades_asignadas',
                label: 'Unidades Asignadas',
                icon: <Truck className="w-5 h-5" />,
                badge: assignedUnits > 0 ? assignedUnits : undefined,
                badgeColor: 'bg-blue-600',
              },
              {
                id: 'historial',
                label: 'Historial de Reparaciones y Cierre',
                icon: <Archive className="w-5 h-5" />,
              },
            ],
          },
          {
            section: 'Avisos y Alertas',
            items: [
              {
                id: 'notificaciones',
                label: 'Notificaciones y Asignaciones',
                icon: <Bell className="w-5 h-5" />,
                badge: unreadNotifs > 0 ? unreadNotifs : undefined,
                badgeColor: 'bg-rose-600',
              },
            ],
          },
        ];

      case 'gerencia':
        const pendingQuoteCreate = orders.filter(o => o.status === 'liberacion_autorizada' && !o.quotation).length;
        const approvedQuotes = orders.filter(o => o.status === 'cotizacion_aprobada' && !o.invoice).length;
        return [
          {
            section: 'Métricas y Dirección',
            items: [
              {
                id: 'metricas',
                label: 'Métricas y KPIs Ejecutivos',
                icon: <BarChart3 className="w-5 h-5" />,
              },
            ],
          },
          {
            section: 'Operación y Personal',
            items: [
              {
                id: 'recepcion_unidades',
                label: 'Recepción de Unidades',
                icon: <ClipboardCheck className="w-5 h-5" />,
              },
              {
                id: 'gestion_personal',
                label: 'Registro de Empleados',
                icon: <Users className="w-5 h-5" />,
                badge: technicians.length > 0 ? technicians.length : undefined,
                badgeColor: 'bg-indigo-600',
              },
            ],
          },
          {
            section: 'Catálogo y Finanzas',
            items: [
              {
                id: 'servicios',
                label: 'Productos (Catálogo)',
                icon: <Wrench className="w-5 h-5" />,
                badge: services.length > 0 ? services.length : undefined,
                badgeColor: 'bg-indigo-600',
              },
              {
                id: 'cotizaciones',
                label: 'Cotizaciones y Presupuestos',
                icon: <DollarSign className="w-5 h-5" />,
                badge: pendingQuoteCreate > 0 ? pendingQuoteCreate : undefined,
                badgeColor: 'bg-blue-600',
              },
              {
                id: 'facturacion',
                label: 'Emisión y Facturación Fiscal',
                icon: <Receipt className="w-5 h-5" />,
                badge: approvedQuotes > 0 ? approvedQuotes : undefined,
                badgeColor: 'bg-emerald-600',
              },
            ],
          },
          {
            section: 'Auditoría y Archivo',
            items: [
              {
                id: 'historial',
                label: 'Historial de Órdenes y Servicios',
                icon: <Archive className="w-5 h-5" />,
              },
            ],
          },
          {
            section: 'Avisos y Alertas',
            items: [
              {
                id: 'notificaciones',
                label: 'Notificaciones y Alertas',
                icon: <Bell className="w-5 h-5" />,
                badge: unreadNotifs > 0 ? unreadNotifs : undefined,
                badgeColor: 'bg-rose-600',
              },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const sections = getRoleItems(currentRole);

  return (
    <aside
      className={`hidden lg:flex flex-col bg-white border-r border-slate-200/90 transition-all duration-200 select-none ${
        collapsed ? 'w-20' : 'w-64 xl:w-72'
      }`}
    >
      {/* Botón colapsar / expandir */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#040057]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Módulos del Sistema
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer mx-auto"
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Lista de Módulos */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {sections.map((sec, secIdx) => (
          <div key={secIdx}>
            {!collapsed && (
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {sec.section}
              </div>
            )}
            <div className="space-y-1">
              {sec.items.map((item) => {
                const isActive = activeModule === item.id || 
                  (item.id === 'reportes' && (activeModule === 'bandeja_solicitudes' || activeModule === 'solicitudes')) ||
                  (item.id === 'metricas' && activeModule === 'inicio');
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-[#040057] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`}>
                      {item.icon}
                    </div>

                    {!collapsed && (
                      <div className="flex-1 truncate">
                        {item.label}
                      </div>
                    )}

                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold text-white shrink-0 ${
                          item.badgeColor || (isActive ? 'bg-white/20' : 'bg-[#040057]')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pie del menú lateral */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Órdenes registradas</span>
              <span className="font-bold text-[#040057]">{orders.length}</span>
            </div>
            <button
              onClick={() => setCurrentRole(null)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cambiar / Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCurrentRole(null)}
            className="w-full flex items-center justify-center p-2 rounded-xl text-rose-700 hover:bg-rose-50 transition cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};
