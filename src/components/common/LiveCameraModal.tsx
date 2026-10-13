import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Capturar Fotografía con Cámara Móvil',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (facing: 'environment' | 'user') => {
    setIsLoading(true);
    setErrorMessage(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara en vivo no está soportada directamente en este navegador. Puedes usar el botón de captura nativo.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err: any) {
      console.warn('Error accediendo a cámara en vivo:', err);
      setIsLoading(false);
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Permiso de cámara denegado. Por favor autoriza el acceso a la cámara en tu navegador o dispositivo para continuar.');
      } else {
        setErrorMessage(err.message || 'No fue posible iniciar la cámara en vivo.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
      }
    } catch (err: any) {
      alert('Error capturando foto: ' + err.message);
    }
  };

  const handleConfirmCaptured = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onCapture(dataUrl);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
      {/* Input nativo de cámara móvil como respaldo infalible */}
      <input
        type="file"
        ref={fileFallbackRef}
        accept="image/*"
        capture="environment"
        onChange={handleFallbackFile}
        className="hidden"
      />

      <div className="w-full max-w-xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Barra Superior */}
        <div className="p-3 sm:p-4 bg-slate-950/80 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-xs sm:text-sm">{title}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Cerrar cámara"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visor de Cámara o Error de Permisos */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] max-h-[65vh] overflow-hidden">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Foto Capturada"
              className="w-full h-full object-contain"
            />
          ) : hasPermission === false ? (
            <div className="p-6 text-center max-w-md space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 mx-auto flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-rose-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm sm:text-base">Permiso de Cámara Requerido</h4>
                <p className="text-xs text-slate-300">
                  {errorMessage || 'Tu dispositivo o navegador bloqueó el acceso a la cámara. Concede los permisos o utiliza el selector de cámara nativo de tu celular.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reintentar Permiso</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Abrir Cámara Nativa del Celular</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover sm:object-contain"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2">
                  <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Iniciando cámara del dispositivo...</span>
                </div>
              )}
            </>
          )}

          {/* Guía visual en esquinas estilo visor fotográfico profesional */}
          {!capturedImage && hasPermission && (
            <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-2">
              <div className="flex justify-between text-[10px] font-mono text-emerald-400/80 uppercase">
                <span>HD • LIVE</span>
                <span>{facingMode === 'environment' ? 'Lente Trasero' : 'Frontal'}</span>
              </div>
              <div className="text-center text-[11px] text-white/70 bg-black/40 py-1 px-3 rounded-full self-center backdrop-blur-xs">
                Enfoca la refacción, componente o avería y presiona el obturador
              </div>
            </div>
          )}
        </div>

        {/* Barra de Controles Inferior */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between shrink-0 gap-3">
          {capturedImage ? (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tomar de Nuevo</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmCaptured}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Usar Esta Fotografía</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              {/* Botón cambiar lente */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Cambiar entre cámara trasera y delantera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Botón Obturador Principal */}
              <button
                type="button"
                onClick={handleTakeSnapshot}
                disabled={!hasPermission || isLoading}
                className="w-16 h-16 rounded-full bg-white hover:bg-slate-200 border-4 border-emerald-500 shadow-xl flex items-center justify-center transition active:scale-95 disabled:opacity-40 cursor-pointer"
                title="Tomar Foto"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600"></div>
              </button>

              {/* Opción alternativa a cámara nativa */}
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition cursor-pointer text-center"
                title="Abrir app de cámara nativa"
              >
                Cámara Nativa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
