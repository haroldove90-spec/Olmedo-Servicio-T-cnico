import React, { useState } from 'react';
import { LogOut, Trash2, Database, GitBranch, ChevronDown, CheckCircle2, Bell, Truck, AlertTriangle, ShieldCheck, CheckCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenSupabaseModal: () => void;
  onOpenWorkflowModal: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  gerencia: 'Gerencia',
  jefe_taller: 'Jefe de taller',
  tecnico: 'Técnico',
  cliente: 'Portal clientes',
};

const ROLE_SHORT_LABELS: Record<UserRole, string> = {
  gerencia: 'Gerencia',
  jefe_taller: 'Jefe de taller',
  tecnico: 'Técnico',
  cliente: 'Clientes',
};

export const Header: React.FC<HeaderProps> = ({ onOpenSupabaseModal, onOpenWorkflowModal }) => {
  const { 
    currentRole, 
    setCurrentRole, 
    isSampleDataCleared, 
    clearAllSampleData,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveModule
  } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = currentRole ? unreadNotificationsCount(currentRole) : 0;
  const roleNotifs = currentRole 
    ? notifications.filter(n => n.targetRole === currentRole || n.targetRole === 'all').slice(0, 5)
    : [];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-xs w-full max-w-full overflow-hidden">
        <div className="w-full px-2 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 max-w-full">
          
          {/* Logotipo del sistema - Grande y distinguido en móvil y escritorio */}
          <div className="flex items-center shrink-0 min-w-0">
            <button 
              onClick={() => setCurrentRole(null)}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              title="Volver a selección de rol"
            >
              <img
                src="https://appdesignproyectos.com/olmedologo.png"
                alt="Servicio Técnico Olmedo"
                className="h-10 xs:h-12 sm:h-14 md:h-16 w-auto object-contain block shrink-0"
              />
              <span className="font-black text-sm sm:text-base md:text-lg text-[#040057] tracking-tight uppercase hidden xs:inline-block">
                Servicio Técnico Olmedo
              </span>
            </button>
          </div>

          {/* Acciones e identificación del rol activo */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Identificación del Rol Activo */}
            {currentRole && (
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#040057] text-[11px] sm:text-xs font-bold transition border border-slate-200 cursor-pointer"
                  title="Cambiar de Rol"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="hidden sm:inline truncate max-w-[180px] md:max-w-none">
                    {ROLE_LABELS[currentRole]}
                  </span>
                  <span className="sm:hidden font-bold">
                    {ROLE_SHORT_LABELS[currentRole]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
                </button>

                {/* Dropdown rápido de roles */}
                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                      Cambiar de Rol Activo
                    </div>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setCurrentRole(r);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          currentRole === r ? 'text-[#040057] font-bold bg-blue-50/70' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{ROLE_LABELS[r]}</span>
                        {currentRole === r && <CheckCircle2 className="w-4 h-4 text-[#040057]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Campanita de Notificaciones en el Header con Contador y Dropdown (Oculta para cliente) */}
            {currentRole && currentRole !== 'cliente' && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  title="Ver notificaciones y avisos"
                  className="relative p-1.5 sm:px-2 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Bell className="w-4 h-4 text-[#040057]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                  <span className="hidden sm:inline font-semibold text-slate-700">
                    Avisos
                  </span>
                </button>

                {/* Dropdown flotante al dar click a la campanita */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn text-xs">
                    <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-[#040057]" />
                        <span className="font-bold text-[#040057] text-xs">
                          Notificaciones ({unreadCount} no leídas)
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsAsRead(currentRole)}
                          className="text-[10px] font-semibold text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Marcar leídas</span>
                        </button>
                      )}
                    </div>

                    {/* Lista corta de avisos recientes */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {roleNotifs.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs">
                          No tienes notificaciones pendientes.
                        </div>
                      ) : (
                        roleNotifs.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              setShowNotifMenu(false);
                              setActiveModule('notificaciones');
                            }}
                            className={`p-3 hover:bg-slate-50 transition cursor-pointer flex items-start gap-2.5 ${
                              !n.read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                              n.type === 'assignment' ? 'bg-indigo-100 text-indigo-800' :
                              n.type === 'alert' ? 'bg-rose-100 text-rose-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {n.type === 'assignment' ? <Truck className="w-3.5 h-3.5" /> :
                               n.type === 'alert' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                               <Bell className="w-3.5 h-3.5" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-800 truncate">
                                  {n.title}
                                </span>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pie del menú: enlace al módulo completo de notificaciones */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                      <button
                        onClick={() => {
                          setShowNotifMenu(false);
                          setActiveModule('notificaciones');
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>Ver todas las notificaciones completas</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ver Diagrama de Flujo (Graph TD) */}
            <button
              onClick={onOpenWorkflowModal}
              title="Ver flujo operativo del sistema"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#040057]" />
              <span>Flujo</span>
            </button>

            {/* Botón Gestión de Datos y Supabase */}
            <button
              onClick={onOpenSupabaseModal}
              title="Configuración de Supabase y Base de Datos"
              className="inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Supabase</span>
            </button>

            {/* Botón Borrar Datos de Muestra */}
            <button
              onClick={() => setShowClearConfirm(true)}
              title="Borrar datos de muestra y dejar el sistema limpio"
              className={`inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                isSampleDataCleared
                  ? 'bg-slate-100 text-slate-500 border border-slate-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isSampleDataCleared ? 'Muestra Borrada' : 'Borrar Muestra'}
              </span>
            </button>

            {/* Botón de Instalación Rápida PWA */}
            <PWAInstallButton />

            {/* Botón de Cierre de Sesión */}
            <button
              onClick={() => setCurrentRole(null)}
              title="Cerrar sesión y volver al selector de roles"
              className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Confirmación para Borrar Datos de Muestra */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-[#040057]">¿Borrar Datos de Muestra?</h3>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Esta acción eliminará todas las órdenes y técnicos de demostración. 
              <strong> El navegador recordará esta preferencia para que nunca más aparezcan datos de muestra</strong> al recargar la página.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 mb-5 space-y-1">
              <div>✓ Tablas locales quedarán 100% en blanco.</div>
              <div>✓ Podrás ingresar tus registros reales o conectar Supabase para almacenar la información.</div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  clearAllSampleData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-xs transition"
              >
                Sí, Borrar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
