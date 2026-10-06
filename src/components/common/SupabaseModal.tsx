import React, { useState } from 'react';
import { X, Database, Trash2, CheckCircle2, RefreshCw, Key, Globe, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { 
    supabaseConfig, 
    updateSupabaseConfig, 
    clearSupabaseRecords, 
    isSampleDataCleared, 
    clearAllSampleData, 
    restoreSampleData 
  } = useApp();

  const [url, setUrl] = useState(supabaseConfig.supabaseUrl || '');
  const [key, setKey] = useState(supabaseConfig.supabaseAnonKey || '');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig({
      supabaseUrl: url.trim(),
      supabaseAnonKey: key.trim(),
      isConnected: Boolean(url.trim() && key.trim()),
    });
  };

  const handleClearSupabase = async () => {
    setIsDeleting(true);
    await clearSupabaseRecords();
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#040057] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold">Gestión de Datos y Supabase</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-6 text-sm">
          
          {/* Sección 1: Borrado Permanente de Datos de Muestra */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#040057] flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Estado de Datos de Muestra en Navegador
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isSampleDataCleared ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#040057]'
              }`}>
                {isSampleDataCleared ? 'Muestra Oculta / Vacía' : 'Muestra Activa'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Al borrar los datos de muestra, se almacena una marca permanente en el navegador para que <strong>nunca se vuelvan a cargar automáticamente</strong> al refrescar o iniciar sesión.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={clearAllSampleData}
                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                Borrar Datos de Muestra del Todo el Sistema
              </button>

              {isSampleDataCleared && (
                <button
                  type="button"
                  onClick={restoreSampleData}
                  className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restaurar Muestra de Prueba
                </button>
              )}
            </div>
          </div>

          {/* Sección 2: Configuración de Conexión a Supabase */}
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-[#040057] text-sm">Conexión con Proyecto Supabase</h3>
              <p className="text-xs text-slate-500">
                Configura tus credenciales de Supabase para sincronizar y limpiar tablas de base de datos directamente desde esta interfaz.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#040057]" />
                Supabase Project URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-[#040057]" />
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#040057]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-xs">
                {supabaseConfig.isConnected ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Supabase Configurado
                  </span>
                ) : (
                  <span className="text-slate-500">Sin credenciales activas</span>
                )}
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#040057] text-white text-xs font-semibold hover:bg-[#070085] transition"
              >
                Guardar Configuración
              </button>
            </div>
          </form>

          {/* Sección 3: Borrar registros en Supabase */}
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Borrado Remoto de Registros en Supabase
            </div>
            <p className="text-xs text-rose-700">
              Al presionar este botón, se enviará la petición de vaciado a la tabla remota en Supabase configurada y se reseteará el almacenamiento local.
            </p>
            <button
              type="button"
              onClick={handleClearSupabase}
              disabled={isDeleting}
              className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? 'Borrando registros...' : 'Borrar Registros en Supabase y Limpiar Sistema'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
