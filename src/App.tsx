import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomBar } from './components/common/BottomBar';
import { RoleSelector } from './components/common/RoleSelector';
import { ClientePortal } from './components/roles/ClientePortal';
import { JefeTallerPortal } from './components/roles/JefeTallerPortal';
import { TecnicoPortal } from './components/roles/TecnicoPortal';
import { GerenciaPortal } from './components/roles/GerenciaPortal';
import { SupabaseModal } from './components/common/SupabaseModal';
import { WorkflowModal } from './components/common/WorkflowModal';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { currentRole, toasts, removeToast } = useApp();
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  // Pantalla inicial: Selector de roles limpio
  // Cuadrícula 2 Columnas Móvil / 4 Columnas Escritorio. Sin header, sin descripciones, solo nombre del rol.
  if (!currentRole) {
    return (
      <>
        <RoleSelector />
        
        {/* Toast Container */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-3.5 rounded-xl shadow-xl border pointer-events-auto flex items-start gap-2.5 text-xs animate-slideIn ${
                toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <div className="font-bold">{toast.title}</div>
                <div className="text-[11px] opacity-90">{toast.message}</div>
              </div>
              <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Dashboard del rol activo
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-[#282829] w-full max-w-full overflow-x-hidden">
      
      {/* Cabecera Institucional Unificada */}
      <Header
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenWorkflowModal={() => setIsWorkflowModalOpen(true)}
      />

      {/* Cuerpo principal con Sidebar en escritorio */}
      <div className="flex flex-1 overflow-hidden w-full max-w-full min-w-0">
        
        {/* Menú Lateral Desplegable en Escritorio */}
        <Sidebar />

        {/* Área de Trabajo Principal - Sin Pestañas Horizontales Repetitivas */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-slate-50/80 min-w-0 max-w-full">
          <div className="max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
            {currentRole === 'cliente' && <ClientePortal />}
            {currentRole === 'jefe_taller' && <JefeTallerPortal />}
            {currentRole === 'tecnico' && <TecnicoPortal />}
            {currentRole === 'gerencia' && <GerenciaPortal />}
          </div>
        </main>
      </div>

      {/* Navegación Móvil y Tablet (Bottom Bar táctil) */}
      <BottomBar />

      {/* Modales globales de apoyo */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
      />

      {/* Notificaciones flotantes tipo Toast */}
      <div className="fixed bottom-20 lg:bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-xl shadow-xl border pointer-events-auto flex items-start gap-2.5 text-xs animate-slideIn ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
              toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' :
              toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
              'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <div className="font-bold">{toast.title}</div>
              <div className="text-[11px] opacity-90">{toast.message}</div>
            </div>
            <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
