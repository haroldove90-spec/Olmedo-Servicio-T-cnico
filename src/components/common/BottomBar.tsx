import React from 'react';
import { 
  FilePlus, 
  ListFilter, 
  CheckSquare, 
  FileText, 
  Wrench, 
  Camera, 
  Key, 
  DollarSign, 
  Receipt,
  Clock,
  Users
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
  const { currentRole, activeModule, setActiveModule, orders } = useApp();

  if (!currentRole) return null;

  // Items según el rol
  const getNavItems = (role: UserRole): NavItem[] => {
    switch (role) {
      case 'cliente':
        const pendingQuotes = orders.filter(o => o.quotation?.status === 'enviada').length;
        return [
          {
            id: 'mis_solicitudes',
            label: 'Solicitudes',
            icon: <ListFilter className="w-5 h-5" />,
          },
          {
            id: 'nueva_solicitud',
            label: 'Nueva',
            icon: <FilePlus className="w-5 h-5" />,
          },
          {
            id: 'cotizaciones',
            label: 'Cotizaciones',
            icon: <DollarSign className="w-5 h-5" />,
            badge: pendingQuotes > 0 ? pendingQuotes : undefined,
          },
          {
            id: 'historial',
            label: 'Historial',
            icon: <FileText className="w-5 h-5" />,
          },
        ];

      case 'jefe_taller':
        const unassigned = orders.filter(o => o.status === 'solicitado').length;
        return [
          {
            id: 'bandeja_solicitudes',
            label: 'Bandeja',
            icon: <ListFilter className="w-5 h-5" />,
            badge: unassigned > 0 ? unassigned : undefined,
          },
          {
            id: 'asignacion_tecnicos',
            label: 'Asignar',
            icon: <Users className="w-5 h-5" />,
          },
          {
            id: 'monitoreo_piso',
            label: 'Monitoreo',
            icon: <Clock className="w-5 h-5" />,
          },
        ];

      case 'tecnico':
        const techOrders = orders.filter(o => 
          o.status === 'asignado' || 
          o.status === 'en_diagnostico_trabajo' || 
          o.status === 'evidencias_rechazadas' ||
          o.status === 'liberacion_autorizada'
        ).length;
        return [
          {
            id: 'mis_tareas',
            label: 'Tareas',
            icon: <Wrench className="w-5 h-5" />,
            badge: techOrders > 0 ? techOrders : undefined,
          },
          {
            id: 'evidencias',
            label: 'Evidencias',
            icon: <Camera className="w-5 h-5" />,
          },
          {
            id: 'liberacion',
            label: 'Liberación',
            icon: <Key className="w-5 h-5" />,
          },
        ];

      case 'gerencia':
        const pendingReview = orders.filter(o => o.status === 'evidencias_en_revision').length;
        return [
          {
            id: 'validacion_evidencias',
            label: 'Validación',
            icon: <CheckSquare className="w-5 h-5" />,
            badge: pendingReview > 0 ? pendingReview : undefined,
          },
          {
            id: 'reportes_excel',
            label: 'Reportes',
            icon: <FileText className="w-5 h-5" />,
          },
          {
            id: 'cotizaciones',
            label: 'Cotizador',
            icon: <DollarSign className="w-5 h-5" />,
          },
          {
            id: 'facturacion',
            label: 'Facturas',
            icon: <Receipt className="w-5 h-5" />,
          },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems(currentRole);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-2xl lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = activeModule === item.id || (item.id === 'validacion_evidencias' && activeModule === 'registros_tecnicos');
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer ${
                isActive 
                  ? 'text-[#040057] font-bold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 leading-tight tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-[#040057] rounded-b-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
