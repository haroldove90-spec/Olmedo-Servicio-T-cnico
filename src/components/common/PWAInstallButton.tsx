import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  // If already running in standalone mode, show a subtle active badge or hide
  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        App Instalada
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowGenericGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Instalar Olemdo Servicio Técnico en tu dispositivo"
        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#040057] text-white hover:bg-[#070085] shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
        <span className="hidden xs:inline">Instalar</span>
        <span className="hidden sm:inline"> App</span>
      </button>

      {/* Modal Guía iOS */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#040057]" />
                <h3 className="text-base font-bold text-[#040057]">Instalar en iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#040057] text-white text-xs font-bold shrink-0">1</span>
                <div>
                  En Safari, toca el botón <strong>Compartir</strong> <Share className="inline w-4 h-4 mx-1 text-blue-600" /> en la barra de navegación.
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#040057] text-white text-xs font-bold shrink-0">2</span>
                <div>
                  Desplázate hacia abajo y selecciona <strong>Agregar a pantalla de inicio</strong> <PlusSquare className="inline w-4 h-4 mx-1 text-slate-800" />.
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#040057] text-white text-xs font-bold shrink-0">3</span>
                <div>
                  Toca <strong>Agregar</strong> en la esquina superior derecha. ¡Listo! La app funcionará a pantalla completa sin barra de navegación.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#040057] py-2.5 text-sm font-semibold text-white hover:bg-[#070085] transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal Guía Android / PC */}
      {showGenericGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#040057]" />
                <h3 className="text-base font-bold text-[#040057]">Instalar Olemdo ST</h3>
              </div>
              <button
                onClick={() => setShowGenericGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>
                Para instalar <strong>Olemdo Servicio Técnico</strong> como aplicación nativa en tu navegador (Chrome, Edge o Android):
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-2">
                <div>• En <strong>Chrome / Edge (PC)</strong>: Haz clic en el ícono de instalar en la barra de direcciones o en el menú ⋮ &gt; "Instalar Olemdo Servicio Técnico".</div>
                <div>• En <strong>Android Chrome</strong>: Toca el menú de tres puntos ⋮ y presiona <strong>"Instalar aplicación"</strong> o "Agregar a la pantalla principal".</div>
              </div>
            </div>
            <button
              onClick={() => setShowGenericGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#040057] py-2.5 text-sm font-semibold text-white hover:bg-[#070085] transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
