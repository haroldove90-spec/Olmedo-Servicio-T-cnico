import React from 'react';
import { 
  FilePlus, 
  ListFilter, 
  Key, 
  DollarSign, 
  Receipt, 
  Users, 
  ClipboardCheck, 
  Truck,
  BarChart3,
  Bell,
  Archive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const BottomBar: React.FC = () => {
  const { currentRole, activeModule, setActiveModule, orders, technicians, services, unreadNotificationsCount } = useApp();

  if (!currentRole) return null;

  // Items según el rol con todos sus módulos correspondientes
  const getNavItems = (role: UserRole): NavItem[] => {
    const unread = unreadNotificationsCount(role);

    switch (role) {
      case 'cliente':
        return [
          {
            id: 'listado_reportes',
            label: 'Mis Reportes',
            icon: <ListFilter className="w-5 h-5" />,
            badge: orders.length > 0 ? orders.length : undefined,
          },
        ];

      case 'jefe_taller':
        const unassigned = orders.filter(o => o.status === 'solicitado').length;
        return [
          {
            id: 'metricas',
            label: 'Métricas',
            icon: <BarChart3 className="w-5 h-5" />,
          },
          {
            id: 'recepcion_unidades',
            label: 'Recepción',
            icon: <ClipboardCheck className="w-5 h-5" />,
          },
          {
            id: 'bandeja_solicitudes',
            label: 'Bandeja',
            icon: <ListFilter className="w-5 h-5" />,
            badge: unassigned > 0 ? unassigned : undefined,
          },
          {
            id: 'historial',
            label: 'Historial',
            icon: <Archive className="w-5 h-5" />,
          },
          {
            id: 'notificaciones',
            label: 'Avisos',
            icon: <Bell className="w-5 h-5" />,
            badge: unread > 0 ? unread : undefined,
          },
        ];

      case 'tecnico':
        const assignedCount = orders.filter(o => 
          o.status === 'asignado' || 
          o.status === 'en_diagnostico_trabajo' || 
          o.status === 'evidencias_rechazadas'
        ).length;
        return [
          {
            id: 'metricas',
            label: 'Métricas',
            icon: <BarChart3 className="w-5 h-5" />,
          },
          {
            id: 'unidades_asignadas',
            label: 'Unidades',
            icon: <Truck className="w-5 h-5" />,
            badge: assignedCount > 0 ? assignedCount : undefined,
          },
          {
            id: 'historial',
            label: 'Historial',
            icon: <Archive className="w-5 h-5" />,
          },
          {
            id: 'notificaciones',
            label: 'Avisos',
            icon: <Bell className="w-5 h-5" />,
            badge: unread > 0 ? unread : undefined,
          },
        ];

      case 'gerencia':
        const pendingQuoteCreate = orders.filter(o => o.status === 'liberacion_autorizada' && !o.quotation).length;
        return [
          {
            id: 'metricas',
            label: 'Métricas',
            icon: <BarChart3 className="w-5 h-5" />,
          },
          {
            id: 'recepcion_unidades',
            label: 'Recepción',
            icon: <ClipboardCheck className="w-5 h-5" />,
          },
          {
            id: 'cotizaciones',
            label: 'Cotizar',
            icon: <DollarSign className="w-5 h-5" />,
            badge: pendingQuoteCreate > 0 ? pendingQuoteCreate : undefined,
          },
          {
            id: 'historial',
            label: 'Historial',
            icon: <Archive className="w-5 h-5" />,
          },
          {
            id: 'notificaciones',
            label: 'Avisos',
            icon: <Bell className="w-5 h-5" />,
            badge: unread > 0 ? unread : undefined,
          },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems(currentRole);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-2xl lg:hidden safe-area-bottom">
      <div className="flex items-center justify-start sm:justify-around h-16 px-1 overflow-x-auto no-scrollbar scroll-smooth">
        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[60px] sm:min-w-0 flex-1 h-full py-1 px-1 text-center transition-all cursor-pointer shrink-0 ${
                isActive 
                  ? 'text-[#040057] font-bold bg-blue-50/50 sm:bg-transparent' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white leading-none shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1 leading-tight tracking-tight truncate max-w-[68px] sm:max-w-none">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 sm:w-12 h-1 bg-[#040057] rounded-b-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
