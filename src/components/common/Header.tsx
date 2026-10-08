import React, { useState } from 'react';
import { LogOut, Trash2, Database, GitBranch, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenSupabaseModal: () => void;
  onOpenWorkflowModal: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  cliente: 'Portal del Cliente (Flotillas / Particulares)',
  jefe_taller: 'Jefe de Taller / Operaciones',
  tecnico: 'App / Portal del Técnico',
  gerencia: 'Gerencia Administrativa y Facturación',
};

const ROLE_SHORT_LABELS: Record<UserRole, string> = {
  cliente: 'Cliente',
  jefe_taller: 'Jefe Taller',
  tecnico: 'Técnico',
  gerencia: 'Gerencia',
};

export const Header: React.FC<HeaderProps> = ({ onOpenSupabaseModal, onOpenWorkflowModal }) => {
  const { currentRole, setCurrentRole, isSampleDataCleared, clearAllSampleData } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-xs w-full max-w-full overflow-hidden">
        <div className="w-full px-2 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 max-w-full">
          
          {/* Logotipo del sistema - Grande y distinguido en móvil y escritorio */}
          <div className="flex items-center shrink-0 min-w-0">
            <button 
              onClick={() => setCurrentRole(null)}
              className="flex items-center cursor-pointer hover:opacity-90 transition-opacity"
              title="Volver a selección de rol"
            >
              <img
                src="https://appdesignproyectos.com/olmedologo.png"
                alt="Olmedo Servicio Técnico"
                className="h-12 xs:h-14 sm:h-16 md:h-18 lg:h-20 w-auto object-contain block max-w-[190px] xs:max-w-[240px] sm:max-w-[320px] md:max-w-none"
              />
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
