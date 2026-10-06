import React, { useState } from 'react';
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
  Users, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Layers
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
  const { currentRole, setCurrentRole, activeModule, setActiveModule, orders, technicians } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  if (!currentRole) return null;

  const getRoleItems = (role: UserRole): { section: string; items: SidebarItem[] }[] => {
    switch (role) {
      case 'cliente':
        const pendingQuotes = orders.filter(o => o.quotation?.status === 'enviada').length;
        const myActiveOrders = orders.filter(o => o.status !== 'facturado' && o.status !== 'cerrado').length;
        return [
          {
            section: 'Gestión de Solicitudes',
            items: [
              {
                id: 'mis_solicitudes',
                label: 'Mis Solicitudes Activas',
                icon: <ListFilter className="w-5 h-5" />,
                badge: myActiveOrders > 0 ? myActiveOrders : undefined,
              },
              {
                id: 'nueva_solicitud',
                label: 'Nueva Solicitud (Taller/Asistencia/Rescate)',
                icon: <FilePlus className="w-5 h-5" />,
              },
            ],
          },
          {
            section: 'Finanzas y Seguimiento',
            items: [
              {
                id: 'cotizaciones',
                label: 'Revisión y Aprobación de Cotizaciones',
                icon: <DollarSign className="w-5 h-5" />,
                badge: pendingQuotes > 0 ? pendingQuotes : undefined,
                badgeColor: 'bg-amber-500',
              },
              {
                id: 'historial',
                label: 'Historial de Servicios y Facturas',
                icon: <FileText className="w-5 h-5" />,
              },
            ],
          },
        ];

      case 'jefe_taller':
        const unassigned = orders.filter(o => o.status === 'solicitado').length;
        const inProgress = orders.filter(o => o.status === 'asignado' || o.status === 'en_diagnostico_trabajo').length;
        return [
          {
            section: 'Operaciones de Taller',
            items: [
              {
                id: 'bandeja_solicitudes',
                label: 'Bandeja de Solicitudes Entrantes',
                icon: <ListFilter className="w-5 h-5" />,
                badge: unassigned > 0 ? unassigned : undefined,
                badgeColor: 'bg-rose-600',
              },
              {
                id: 'asignacion_tecnicos',
                label: 'Asignación Operativa a Técnicos',
                icon: <Users className="w-5 h-5" />,
              },
              {
                id: 'monitoreo_piso',
                label: 'Monitoreo de Piso y Campo',
                icon: <Clock className="w-5 h-5" />,
                badge: inProgress > 0 ? inProgress : undefined,
                badgeColor: 'bg-blue-600',
              },
            ],
          },
          {
            section: 'Recursos Humanos',
            items: [
              {
                id: 'catalogo_tecnicos',
                label: 'Disponibilidad de Técnicos',
                icon: <Users className="w-5 h-5" />,
                badge: technicians.length,
              },
            ],
          },
        ];

      case 'tecnico':
        const myTasks = orders.filter(o => 
          o.status === 'asignado' || 
          o.status === 'en_diagnostico_trabajo' || 
          o.status === 'evidencias_rechazadas'
        ).length;
        const rejected = orders.filter(o => o.status === 'evidencias_rechazadas').length;
        const authorized = orders.filter(o => o.status === 'liberacion_autorizada').length;
        return [
          {
            section: 'Trabajo de Campo y Taller',
            items: [
              {
                id: 'mis_tareas',
                label: 'Recepción de Tareas Asignadas',
                icon: <Wrench className="w-5 h-5" />,
                badge: myTasks > 0 ? myTasks : undefined,
                badgeColor: 'bg-blue-600',
              },
              {
                id: 'evidencias',
                label: 'Carga de Evidencias (1. Antes / 2. Correctivo)',
                icon: <Camera className="w-5 h-5" />,
                badge: rejected > 0 ? rejected : undefined,
                badgeColor: 'bg-rose-600',
              },
              {
                id: 'liberacion',
                label: 'Liberación Física de la Unidad',
                icon: <Key className="w-5 h-5" />,
                badge: authorized > 0 ? authorized : undefined,
                badgeColor: 'bg-emerald-600',
              },
            ],
          },
        ];

      case 'gerencia':
        const pendingReview = orders.filter(o => o.status === 'evidencias_en_revision').length;
        const pendingQuoteCreate = orders.filter(o => o.status === 'liberacion_autorizada' && !o.quotation).length;
        const approvedQuotes = orders.filter(o => o.status === 'cotizacion_aprobada' && !o.invoice).length;
        return [
          {
            section: 'Validación e Inspección',
            items: [
              {
                id: 'validacion_evidencias',
                label: 'Validación de Evidencias y Servicio',
                icon: <CheckSquare className="w-5 h-5" />,
                badge: pendingReview > 0 ? pendingReview : undefined,
                badgeColor: 'bg-amber-600',
              },
              {
                id: 'registros_tecnicos',
                label: 'Registros y Evidencias del Técnico',
                icon: <Camera className="w-5 h-5" />,
              },
              {
                id: 'reportes_excel',
                label: 'Consolidación y Exportación Excel',
                icon: <FileText className="w-5 h-5" />,
              },
            ],
          },
          {
            section: 'Facturación y Finanzas',
            items: [
              {
                id: 'cotizaciones',
                label: 'Generador de Cotizaciones',
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
                const isActive = activeModule === item.id;
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
