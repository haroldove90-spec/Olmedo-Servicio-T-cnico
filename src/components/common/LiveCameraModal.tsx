import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Video, 
  X, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Play, 
  Square, 
  RotateCcw,
  Sparkles,
  Smartphone
} from 'lucide-react';

export interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (mediaUrl: string, mediaType?: 'image' | 'video', duration?: number) => void;
  title?: string;
  defaultMode?: 'photo' | 'video';
  requireVideoSeconds?: number;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Cámara Móvil - Evidencias en Vivo',
  defaultMode = 'photo',
  requireVideoSeconds = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);
  
  const photoFallbackRef = useRef<HTMLInputElement | null>(null);
  const videoFallbackRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<'photo' | 'video'>(defaultMode);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Capture states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);
  const [capturedDuration, setCapturedDuration] = useState<number>(0);

  // Video recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  const stopStream = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error deteniendo mediaRecorder:', e);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  // Solicitar permisos nativos al dispositivo móvil para cámara trasera y micrófono según el modo
  const requestDeviceStream = async (targetMode: 'photo' | 'video', facing: 'environment' | 'user') => {
    setIsLoading(true);
    setErrorMessage(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La captura de video en vivo no es compatible directamente con este navegador web. Utiliza el selector nativo de la cámara del celular.');
      }

      // Configuración de restricciones para cámara trasera ideal
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: targetMode === 'video', // Solicitar micrófono únicamente si estamos en modo video
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasCameraPermission(true);
      if (targetMode === 'video') {
        setHasMicPermission(true);
      } else {
        setHasMicPermission(null);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err: any) {
      console.warn('Error solicitando permisos de dispositivo:', err);
      setIsLoading(false);
      setHasCameraPermission(false);
      if (targetMode === 'video') setHasMicPermission(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          targetMode === 'video'
            ? 'Permisos de cámara de video y micrófono denegados. Por favor autoriza el acceso a la cámara y al micrófono en los ajustes de tu navegador o celular.'
            : 'Permiso de cámara fotográfica trasera denegado. Por favor concede acceso a la cámara en tu navegador o utiliza la app de cámara nativa.'
        );
      } else {
        setErrorMessage(err.message || 'No fue posible inicializar los sensores de cámara del dispositivo móvil.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setCapturedImage(null);
      setCapturedVideoUrl(null);
      setCapturedDuration(0);
      setIsRecording(false);
      setRecordingSeconds(0);
      requestDeviceStream(defaultMode, facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen]);

  // Manejar cambio de modo (Foto ⇄ Video)
  const handleChangeMode = (newMode: 'photo' | 'video') => {
    if (mode === newMode) return;
    setMode(newMode);
    setCapturedImage(null);
    setCapturedVideoUrl(null);
    setCapturedDuration(0);
    setIsRecording(false);
    setRecordingSeconds(0);
    requestDeviceStream(newMode, facingMode);
  };

  // Alternar entre cámara trasera y delantera
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    requestDeviceStream(mode, nextFacing);
  };

  // Capturar Fotografía
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setCapturedImage(dataUrl);
      }
    } catch (err: any) {
      alert('Error capturando fotografía: ' + err.message);
    }
  };

  // Iniciar Grabación de Video
  const handleStartVideoRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      let recorder: MediaRecorder;
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        recorder = new MediaRecorder(streamRef.current, options);
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/mp4' });
      } else {
        recorder = new MediaRecorder(streamRef.current);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        setCapturedVideoUrl(videoUrl);
      };

      recorder.start(250); // Emitir chunks cada 250ms
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err: any) {
      alert('No se pudo iniciar la grabación de video: ' + err.message);
    }
  };

  // Detener Grabación de Video
  const handleStopVideoRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setCapturedDuration(recordingSeconds);
  };

  // Confirmar y Enviar al Padre
  const handleConfirmCaptured = () => {
    if (mode === 'photo' && capturedImage) {
      onCapture(capturedImage, 'image');
      onClose();
    } else if (mode === 'video' && capturedVideoUrl) {
      onCapture(capturedVideoUrl, 'video', capturedDuration || recordingSeconds || 15);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedVideoUrl(null);
    setCapturedDuration(0);
    setRecordingSeconds(0);
    requestDeviceStream(mode, facingMode);
  };

  // Fallback nativo: foto desde app de cámara del celular
  const handleFallbackPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onCapture(dataUrl, 'image');
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  // Fallback nativo: video desde app de cámara del celular
  const handleFallbackVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const videoUrl = URL.createObjectURL(file);
    onCapture(videoUrl, 'video', 15);
    onClose();
  };

  if (!isOpen) return null;

  const isPreviewing = Boolean(capturedImage || capturedVideoUrl);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
      {/* Inputs nativos de respaldo para dispositivos móviles (Android / iOS) */}
      <input
        type="file"
        ref={photoFallbackRef}
        accept="image/*"
        capture="environment"
        onChange={handleFallbackPhoto}
        className="hidden"
      />
      <input
        type="file"
        ref={videoFallbackRef}
        accept="video/*"
        capture="environment"
        onChange={handleFallbackVideo}
        className="hidden"
      />

      <div className="w-full max-w-xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Barra Superior con Selector de Modo y Permisos */}
        <div className="p-3 sm:p-4 bg-slate-950/90 text-white flex flex-col gap-2.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mode === 'photo' ? (
                <Camera className="w-5 h-5 text-emerald-400" />
              ) : (
                <Video className="w-5 h-5 text-rose-500" />
              )}
              <span className="font-bold text-xs sm:text-sm truncate">{title}</span>
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

          {/* Selector de Modo: Foto Trasera vs Video Trasero */}
          {!isPreviewing && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex rounded-xl bg-slate-800/90 p-1 border border-slate-700/60 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleChangeMode('photo')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'photo'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Foto Trasera</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChangeMode('video')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'video'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Trasero</span>
                </button>
              </div>

              {/* Botón de voltear lente */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                title="Alternar entre cámara trasera y delantera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{facingMode === 'environment' ? 'Lente Trasero' : 'Frontal'}</span>
              </button>
            </div>
          )}

          {/* Feedback de Permisos del Dispositivo */}
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
            <div className="flex items-center gap-1.5">
              {hasCameraPermission === true ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Permiso Cámara Trasera Activo
                </span>
              ) : hasCameraPermission === false ? (
                <span className="text-rose-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Permiso Cámara Denegado
                </span>
              ) : (
                <span>Solicitando permisos al dispositivo...</span>
              )}
            </div>

            {mode === 'video' && (
              <span className={`text-[10px] font-semibold ${hasMicPermission ? 'text-emerald-400' : 'text-slate-500'}`}>
                {hasMicPermission ? '• Micrófono Activo ✓' : '• Micrófono requerido'}
              </span>
            )}
          </div>
        </div>

        {/* Visor de Cámara en Vivo o Previsualización */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[360px] max-h-[60vh] overflow-hidden">
          
          {/* Caso 1: Foto Capturada */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Foto Capturada"
              className="w-full h-full object-contain"
            />
          )}

          {/* Caso 2: Video Capturado */}
          {capturedVideoUrl && (
            <video
              src={capturedVideoUrl}
              controls
              playsInline
              autoPlay
              className="w-full h-full object-contain"
            />
          )}

          {/* Caso 3: Permiso Denegado */}
          {!isPreviewing && hasCameraPermission === false && (
            <div className="p-6 text-center max-w-md space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 mx-auto flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-rose-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm sm:text-base">Permiso del Dispositivo Requerido</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {errorMessage || 'Tu dispositivo o navegador bloqueó los permisos de la cámara. Autoriza el acceso o pulsa el botón directo para usar la app de cámara nativa de tu teléfono.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
                <button
                  type="button"
                  onClick={() => requestDeviceStream(mode, facingMode)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reintentar Permiso</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'photo') photoFallbackRef.current?.click();
                    else videoFallbackRef.current?.click();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Abrir Cámara Nativa del Celular</span>
                </button>
              </div>
            </div>
          )}

          {/* Caso 4: Transmisión en Vivo */}
          {!isPreviewing && hasCameraPermission !== false && (
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
                  <span className="text-xs font-semibold">Activando cámara trasera y sensores...</span>
                </div>
              )}

              {/* Guía visual HUD estilo visor técnico */}
              <div className="absolute inset-3 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400/90 uppercase">
                  <span className="bg-black/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    HD LIVE {mode === 'video' ? '• AUDIO ON' : ''}
                  </span>
                  <span className="bg-black/50 px-2 py-0.5 rounded-md">
                    {facingMode === 'environment' ? 'LENTE TRASERO' : 'FRONTAL'}
                  </span>
                </div>

                {/* Banner de grabación activa */}
                {isRecording && (
                  <div className="self-center bg-rose-600/90 text-white px-4 py-1.5 rounded-full font-mono font-bold text-xs flex items-center gap-2 shadow-lg animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                    <span>GRABANDO VIDEO: {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}</span>
                  </div>
                )}

                <div className="text-center text-[11px] text-white/80 bg-black/50 py-1 px-3 rounded-full self-center backdrop-blur-xs">
                  {mode === 'photo' 
                    ? 'Enfoca la avería / refacción y presiona el obturador' 
                    : isRecording 
                    ? 'Grabando evidencia... presiona detener al concluir' 
                    : 'Presiona el botón rojo para iniciar la grabación de video'}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Barra de Controles Inferior */}
        <div className="p-3 sm:p-4 bg-slate-950 text-white flex items-center justify-between shrink-0 gap-3 border-t border-slate-800">
          {isPreviewing ? (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tomar de Nuevo</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmCaptured}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Usar Esta Evidencia ({mode === 'photo' ? 'Foto' : 'Video'})</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              {/* Botón abrir app nativa del celular */}
              <button
                type="button"
                onClick={() => {
                  if (mode === 'photo') photoFallbackRef.current?.click();
                  else videoFallbackRef.current?.click();
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition cursor-pointer text-center flex items-center gap-1.5"
                title="Abrir app de cámara nativa del celular"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Cámara Nativa</span>
              </button>

              {/* Obturador Principal */}
              {mode === 'photo' ? (
                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  disabled={!hasCameraPermission || isLoading}
                  className="w-16 h-16 rounded-full bg-white hover:bg-slate-200 border-4 border-emerald-500 shadow-xl flex items-center justify-center transition active:scale-95 disabled:opacity-40 cursor-pointer"
                  title="Capturar Fotografía"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </button>
              ) : (
                !isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartVideoRecording}
                    disabled={!hasCameraPermission || isLoading}
                    className="w-16 h-16 rounded-full bg-white hover:bg-slate-200 border-4 border-rose-500 shadow-xl flex items-center justify-center transition active:scale-95 disabled:opacity-40 cursor-pointer"
                    title="Iniciar Grabación de Video"
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white">
                      <Video className="w-5 h-5" />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopVideoRecording}
                    className="w-16 h-16 rounded-full bg-white hover:bg-slate-200 border-4 border-rose-600 shadow-xl flex items-center justify-center transition active:scale-95 cursor-pointer animate-pulse"
                    title="Detener Grabación de Video"
                  >
                    <div className="w-10 h-10 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                      <Square className="w-5 h-5 fill-white" />
                    </div>
                  </button>
                )
              )}

              {/* Botón de voltear lente (móvil) */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Cambiar lente (trasero / delantero)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
