import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  PlusCircle, 
  ListFilter, 
  Camera, 
  Video, 
  MapPin, 
  Phone, 
  User, 
  Truck, 
  Gauge, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Search, 
  Filter, 
  CheckCircle2, 
  X, 
  Edit3, 
  Save, 
  ChevronRight, 
  ArrowLeft,
  FileText,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Upload,
  Info,
  Lock,
  ShieldAlert,
  Smartphone,
  LayoutGrid,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, ServiceStatus, EvidencePhoto, VideoEvidence, VehicleType } from '../../types';
import { SAMPLE_OPERATORS, OperatorOption } from '../../data/mockData';
import { StatusSemaphoreBadge } from '../common/StatusSemaphoreBadge';
import { LiveCameraModal } from '../common/LiveCameraModal';
import { EvidenceLockWarningModal } from '../common/EvidenceLockWarningModal';
import { ClientReportPdfModal } from '../common/ClientReportPdfModal';
import { ConsolidatedReportsLogView } from '../common/ConsolidatedReportsLogView';

type ClientViewMode = 'home' | 'nuevo_reporte' | 'listado_reportes' | 'modificar_reporte';

// Helper para calcular el proceso en tiempo real del reporte de falla para el cliente
export interface ProcessStepInfo {
  step: number;
  totalSteps: number;
  label: string;
  badge: string;
  description: string;
  isFinished: boolean;
  color: string;
}

export const getOrderProcessInfo = (status: ServiceStatus, assignedTech?: string): ProcessStepInfo => {
  switch (status) {
    case 'solicitado':
    case 'por_atender':
      return {
        step: 1,
        totalSteps: 5,
        label: '1. Reporte Recibido',
        badge: 'Fase 1 de 5: Reporte Recibido',
        description: 'Tu solicitud de falla ha sido recibida en taller. En espera de asignación de técnico especialista.',
        isFinished: false,
        color: 'amber'
      };
    case 'asignado':
      return {
        step: 2,
        totalSteps: 5,
        label: '2. Técnico Asignado',
        badge: `Fase 2 de 5: Asignado a ${assignedTech || 'Técnico Especialista'}`,
        description: `Se asignó al técnico ${assignedTech || 'especialista'} para la atención y despacho de tu unidad.`,
        isFinished: false,
        color: 'blue'
      };
    case 'en_proceso':
    case 'en_diagnostico_trabajo':
    case 'evidencias_rechazadas':
      return {
        step: 3,
        totalSteps: 5,
        label: '3. En Diagnóstico y Reparación',
        badge: 'Fase 3 de 5: En Diagnóstico y Reparación',
        description: 'El técnico especialista se encuentra revisando los sistemas mecánicos y realizando las reparaciones necesarias en la unidad.',
        isFinished: false,
        color: 'indigo'
      };
    case 'evidencias_en_revision':
      return {
        step: 3,
        totalSteps: 5,
        label: '3. Evidencias en Revisión',
        badge: 'Fase 3 de 5: Evidencias en Revisión de Calidad',
        description: 'El técnico documentó fotográficamente la reparación y el dictamen está en revisión operativa para control de calidad.',
        isFinished: false,
        color: 'indigo'
      };
    case 'pendiente_refacciones':
      return {
        step: 4,
        totalSteps: 5,
        label: '4. Esperando Refacciones',
        badge: 'Fase 4 de 5: Esperando Suministro de Refacciones',
        description: 'Se diagnosticaron piezas requeridas. En proceso de suministro y montaje para habilitar la unidad.',
        isFinished: false,
        color: 'purple'
      };
    case 'validando_pruebas':
      return {
        step: 4,
        totalSteps: 5,
        label: '4. Pruebas y Validación',
        badge: 'Fase 4 de 5: Pruebas Operativas y de Rodaje',
        description: 'Se están realizando pruebas de encendido, calibración y control de calidad final.',
        isFinished: false,
        color: 'sky'
      };
    case 'habilitada':
    case 'liberacion_autorizada':
    case 'unidad_liberada':
      return {
        step: 5,
        totalSteps: 5,
        label: '5. Servicio Terminado',
        badge: 'Fase 5 de 5: Servicio Terminado • Unidad Habilitada',
        description: '¡El trabajo ha concluido con éxito! Unidad probada y habilitada. El reporte oficial en PDF ya está disponible para su descarga.',
        isFinished: true,
        color: 'emerald'
      };
    case 'cerrado':
    case 'facturado':
      return {
        step: 5,
        totalSteps: 5,
        label: '5. Concluido y Cerrado',
        badge: 'Fase 5 de 5: Servicio Terminado y Cerrado',
        description: 'Servicio concluido, documentado y archivado. Reporte en PDF disponible.',
        isFinished: true,
        color: 'slate'
      };
    default:
      return {
        step: 3,
        totalSteps: 5,
        label: 'En Proceso',
        badge: 'En Atención Operativa',
        description: 'Servicio técnico en desarrollo.',
        isFinished: false,
        color: 'blue'
      };
  }
};

export const ClientePortal: React.FC = () => {
  const { 
    orders, 
    units, 
    createClientFaultReport, 
    addClientObservation,
    activeModule,
    setActiveModule,
    addToast
  } = useApp();

  // Vista activa dentro del portal del cliente
  const [viewMode, setViewMode] = useState<ClientViewMode>('home');
  // Ventana flotante que muestra los 2 botones al dar click a "Reportar falla"
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  // Sincronizar con activeModule si viene desde el Sidebar o cambio de rol
  useEffect(() => {
    if (activeModule === 'inicio' || activeModule === 'home' || !activeModule) {
      setViewMode('home');
    } else if (activeModule === 'reportar_falla' || activeModule === 'nueva_solicitud') {
      setViewMode('nuevo_reporte');
    } else if (activeModule === 'listado_reportes') {
      setViewMode('listado_reportes');
    }
  }, [activeModule]);

  // ==========================================
  // ESTADOS DEL FORMULARIO "NUEVO REPORTE"
  // ==========================================
  
  // 1. Unidad y Kilometraje
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [odometer, setOdometer] = useState<string>(units[0]?.defaultOdometer || '120,500 KM');
  const [reportDate, setReportDate] = useState<string>('');

  // 2. Operador y Teléfono
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(SAMPLE_OPERATORS[0].id);
  const [operatorName, setOperatorName] = useState<string>(SAMPLE_OPERATORS[0].name);
  const [operatorPhone, setOperatorPhone] = useState<string>(SAMPLE_OPERATORS[0].phone);

  // 3. Falla y Ubicación
  const [failureDescription, setFailureDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  // 4. Evidencias Multimedia (Fotos y Video 15s)
  const [capturedPhotos, setCapturedPhotos] = useState<Array<{ id: string; url: string; title: string; timestamp: string }>>([]);
  const [capturedVideos, setCapturedVideos] = useState<VideoEvidence[]>([]);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const videoTimerRef = useRef<any>(null);

  // Cámara móvil en vivo y candado de fotos
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [liveCameraMode, setLiveCameraMode] = useState<'photo' | 'video'>('photo');
  const [showPhotoWarningModal, setShowPhotoWarningModal] = useState(false);

  // 5. ¿Unidad requiere rescate por no estar operable?
  const [requiresRescue, setRequiresRescue] = useState<boolean>(false);
  const [rescueLocationUrl, setRescueLocationUrl] = useState<string>('');

  // ==========================================
  // ESTADOS DEL LISTADO Y BÚSQUEDA INTELIGENTE
  // ==========================================
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('en_proceso');
  const [reportListFormat, setReportListFormat] = useState<'tarjetas' | 'bitacora'>('tarjetas');
  const [viewingPdfOrder, setViewingPdfOrder] = useState<ServiceOrder | null>(null);

  // ==========================================
  // ESTADO DE MODIFICACIÓN DE REPORTE
  // ==========================================
  const [orderToModify, setOrderToModify] = useState<ServiceOrder | null>(null);
  const [newObservationText, setNewObservationText] = useState('');
  const [modifiedOdometer, setModifiedOdometer] = useState('');
  const [additionalPhotos, setAdditionalPhotos] = useState<EvidencePhoto[]>([]);

  // Actualizar fecha automáticamente
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setReportDate(now.toLocaleString('es-MX', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Al cambiar la unidad seleccionada en el desplegable
  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      if (unit.defaultOdometer) {
        setOdometer(unit.defaultOdometer);
      }
    }
  };

  // Al cambiar el operador seleccionado en el desplegable (Operador 1 a 10)
  const handleOperatorChange = (opId: string) => {
    setSelectedOperatorId(opId);
    const op = SAMPLE_OPERATORS.find(o => o.id === opId);
    if (op) {
      setOperatorName(op.name);
      setOperatorPhone(op.phone);
    }
  };

  // Obtener ubicación GPS en vivo con navegador
  const handleGetLiveGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
          setLocation(`Coordenadas GPS: ${lat}, ${lng} (Ubicación GPS en vivo detectada)`);
          if (requiresRescue) {
            setRescueLocationUrl(mapsLink);
          }
          addToast('success', 'Ubicación GPS Obtenida', `Coordenadas: ${lat}, ${lng}`);
        },
        () => {
          setLocation('Autopista México-Querétaro Km 43.5, pasando Caseta Tepotzotlán');
          if (requiresRescue) {
            setRescueLocationUrl('https://maps.google.com/?q=19.7144,-99.2241');
          }
        }
      );
    } else {
      setLocation('Autopista México-Querétaro Km 43.5, pasando Caseta Tepotzotlán');
    }
  };

  // Subir o tomar foto
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setCapturedPhotos(prev => [
          ...prev,
          {
            id: `photo-${Date.now()}-${index}`,
            url,
            title: `Evidencia Fotográfica ${prev.length + index + 1}`,
            timestamp: new Date().toISOString(),
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Grabar o simular video de al menos 15 segundos
  const handleStartVideoRecording = () => {
    setIsRecordingVideo(true);
    setVideoSeconds(0);

    videoTimerRef.current = setInterval(() => {
      setVideoSeconds(sec => {
        const nextSec = sec + 1;
        if (nextSec >= 15) {
          // Ya cumplió el mínimo de 15 segundos
        }
        return nextSec;
      });
    }, 1000);
  };

  const handleStopVideoRecording = () => {
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
    }
    setIsRecordingVideo(false);

    if (videoSeconds < 15) {
      addToast('warning', 'Duración Mínima Requerida', 'El video debe durar por lo menos 15 segundos para documentar la falla.');
    }

    const duration = Math.max(videoSeconds, 15);
    // Video de muestra de inspección vehicular para previsualización inmediata
    const newVideo: VideoEvidence = {
      id: `vid-${Date.now()}`,
      url: 'https://assets.mixkit.co/videos/preview/mixkit-car-mechanic-checking-the-engine-of-a-car-42795-large.mp4',
      duration,
      timestamp: new Date().toISOString(),
      title: `Video de Evidencia Operativa (${duration}s)`,
      notes: `Video de ${duration} segundos grabado por el operador para diagnóstico de la falla.`
    };

    setCapturedVideos(prev => [...prev, newVideo]);
    addToast('success', 'Video Grabado Exitosamente', `Video de ${duration} segundos registrado.`);
  };

  // Manejar captura directa con cámara móvil trasera (Foto o Video)
  const handleLiveMediaCaptured = (mediaUrl: string, mediaType?: 'image' | 'video', duration?: number) => {
    if (mediaType === 'video') {
      const newVideo: VideoEvidence = {
        id: `vid-${Date.now()}`,
        url: mediaUrl,
        duration: duration || 15,
        timestamp: new Date().toISOString(),
        title: `Video con Cámara Trasera (${duration || 15}s)`,
        notes: `Video grabado desde dispositivo móvil para documentar la falla.`
      };
      setCapturedVideos(prev => [...prev, newVideo]);
      addToast('success', 'Video Adjuntado', 'El video capturado con la cámara del celular se ha guardado.');
    } else {
      setCapturedPhotos(prev => [
        ...prev,
        {
          id: `photo-${Date.now()}-${prev.length}`,
          url: mediaUrl,
          title: `Fotografía Cámara Trasera ${prev.length + 1}`,
          timestamp: new Date().toISOString()
        }
      ]);
      addToast('success', 'Fotografía Adjuntada', 'Foto capturada con la cámara fotográfica trasera guardada.');
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleRemoveVideo = (vidId: string) => {
    setCapturedVideos(prev => prev.filter(v => v.id !== vidId));
  };

  // Enviar el formulario de Nuevo Reporte
  const handleSubmitNewReport = (e: React.FormEvent) => {
    e.preventDefault();

    const currentUnit = units.find(u => u.id === selectedUnitId) || units[0];

    // CANDADO OBLIGATORIO: El cliente no puede enviar su reporte de falla sin enviar al menos una foto
    if (capturedPhotos.length === 0) {
      setShowPhotoWarningModal(true);
      addToast('warning', 'Fotografía Obligatoria', 'No puedes enviar tu reporte sin adjuntar al menos una fotografía de la avería.');
      return;
    }

    if (!failureDescription.trim()) {
      addToast('warning', 'Campo Faltante', 'Por favor describe la falla reportada de la unidad.');
      return;
    }

    if (!location.trim()) {
      addToast('warning', 'Campo Faltante', 'Por favor indica la ubicación o referencias donde se encuentra la unidad.');
      return;
    }

    if (requiresRescue && !rescueLocationUrl.trim()) {
      addToast('warning', 'Enlace Requerido', 'Si la unidad requiere rescate, pega la ubicación de Google Maps o enlace GPS.');
      return;
    }

    createClientFaultReport({
      unitNumber: currentUnit?.unitNumber || 'Unidad 1',
      plates: currentUnit?.plates || '45-AB-1X',
      economicNumber: currentUnit?.economicNumber || 'ECO-001',
      brandModel: currentUnit ? `${currentUnit.brand} ${currentUnit.model}` : 'Tractocamión Kenworth T680',
      vehicleType: currentUnit?.type || 'tractocamion',
      odometer: odometer.trim() || '120,000 KM',
      operatorName: operatorName.trim() || 'Operador',
      operatorPhone: operatorPhone.trim() || '55 1234 5678',
      failureDescription: failureDescription.trim(),
      location: location.trim(),
      requiresRescue,
      rescueLocationUrl: requiresRescue ? rescueLocationUrl.trim() : undefined,
      photos: capturedPhotos,
      videos: capturedVideos,
      clientName: 'Flotillas Express S.A. de C.V.',
      clientCompany: 'Flotillas Express S.A.',
    });

    // Resetear formulario
    setFailureDescription('');
    setLocation('');
    setRequiresRescue(false);
    setRescueLocationUrl('');
    setCapturedPhotos([]);
    setCapturedVideos([]);
    
    // Cambiar vista al listado de reportes
    setViewMode('listado_reportes');
  };

  // ==========================================
  // FILTRADO INTELIGENTE DE REPORTES
  // ==========================================
  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      (order.unitNumber || '').toLowerCase().includes(term) ||
      (order.vehicle.plates || '').toLowerCase().includes(term) ||
      (order.vehicle.economicNumber || '').toLowerCase().includes(term) ||
      (order.vehicle.brandModel || '').toLowerCase().includes(term) ||
      (order.operatorName || '').toLowerCase().includes(term) ||
      (order.clientContact || '').toLowerCase().includes(term) ||
      (order.vehicle.failureDescription || '').toLowerCase().includes(term) ||
      (order.vehicle.location || '').toLowerCase().includes(term) ||
      (order.status || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (statusFilter === 'en_proceso') {
      const inProcessStatuses = [
        'en_proceso',
        'asignado',
        'en_diagnostico_trabajo',
        'solicitado',
        'por_atender',
        'evidencias_en_revision',
        'pendiente_refacciones',
        'validando_pruebas',
        'evidencias_rechazadas'
      ];
      if (!inProcessStatuses.includes(order.status)) return false;
    } else if (statusFilter === 'concluidos') {
      const finishedStatuses = [
        'habilitada',
        'liberacion_autorizada',
        'unidad_liberada',
        'cerrado',
        'facturado'
      ];
      if (!finishedStatuses.includes(order.status)) return false;
    }

    return true;
  });

  // Abrir vista de Modificar Reporte / Agregar Observación
  const handleOpenModify = (order: ServiceOrder) => {
    setOrderToModify(order);
    setNewObservationText('');
    setModifiedOdometer(order.vehicle.odometerReading || order.vehicle.mileage || '');
    setAdditionalPhotos([]);
    setViewMode('modificar_reporte');
  };

  // Guardar nueva falla u observación en reporte existente
  const handleSaveObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToModify) return;

    if (!newObservationText.trim()) {
      addToast('warning', 'Observación Vacía', 'Por favor escribe la nueva falla u observación que deseas reportar.');
      return;
    }

    addClientObservation(
      orderToModify.id,
      newObservationText.trim(),
      operatorName || 'Cliente / Operador',
      additionalPhotos
    );

    setNewObservationText('');
    setAdditionalPhotos([]);
    setViewMode('listado_reportes');
  };

  const selectedUnit = units.find(u => u.id === selectedUnitId) || units[0];

  return (
    <div className="space-y-6 pb-24 lg:pb-8 w-full max-w-full min-w-0 overflow-x-hidden">
      
      {/* ======================================================== */}
      {/* CABECERA PRINCIPAL DEL PORTAL CLIENTE */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#040057] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Portal de Clientes</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#040057] leading-tight">
                Flotillas Express S.A. de C.V.
              </h1>
            </div>
          </div>

          {/* Botón de retorno al inicio cuando no se está en home */}
          <div className="flex items-center gap-2 shrink-0">
            {viewMode !== 'home' && (
              <button
                type="button"
                onClick={() => {
                  setViewMode('home');
                  setActiveModule('inicio');
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Inicio</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: HOME CON LOS BOTONES PRINCIPALES */}
      {/* ======================================================== */}
      {viewMode === 'home' && (
        <div className="flex flex-col items-center justify-center min-h-[55vh] p-4 sm:p-6 text-center animate-fadeIn">
          <div className="max-w-lg w-full space-y-4 sm:space-y-5">
            
            {/* BOTÓN 1: REPORTAR FALLA */}
            <button
              type="button"
              onClick={() => setIsOptionsModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-3.5 px-8 py-6 rounded-3xl bg-[#040057] hover:bg-[#070085] text-white text-xl sm:text-2xl font-black shadow-xl hover:shadow-2xl hover:shadow-indigo-900/30 transform hover:-translate-y-1 active:translate-y-0 transition cursor-pointer ring-4 ring-indigo-100 group"
            >
              <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Reportar Falla</span>
            </button>

            {/* BOTÓN 2: MIS REPORTES (SIMILAR A REPORTAR FALLA) */}
            <button
              type="button"
              onClick={() => {
                setViewMode('listado_reportes');
                setActiveModule('listado_reportes');
              }}
              className="w-full inline-flex items-center justify-center gap-3.5 px-8 py-6 rounded-3xl bg-[#040057] hover:bg-[#070085] text-white text-xl sm:text-2xl font-black shadow-xl hover:shadow-2xl hover:shadow-indigo-900/30 transform hover:-translate-y-1 active:translate-y-0 transition cursor-pointer ring-4 ring-indigo-100 group"
            >
              <ListFilter className="w-8 h-8 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Mis Reportes</span>
            </button>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VENTANA FLOTANTE: 1. NUEVO REPORTE Y 2. ACTUALIZAR REPORTE */}
      {/* ======================================================== */}
      {isOptionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base sm:text-lg text-[#040057]">
                  Reportar Falla
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOptionsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Selecciona una opción para dar seguimiento a tu unidad:
            </p>

            <div className="space-y-3 pt-1">
              {/* Botón 1: 1. Nuevo reporte de falla */}
              <button
                type="button"
                onClick={() => {
                  setIsOptionsModalOpen(false);
                  setViewMode('nuevo_reporte');
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#040057] hover:bg-[#070085] text-white shadow-lg transition transform hover:scale-[1.01] active:scale-100 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
                    <PlusCircle className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm sm:text-base">1. Nuevo Reporte de Falla</div>
                    <div className="text-[11px] text-indigo-200 font-medium">Formulario con datos de unidad, operador, fotos y video</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/70" />
              </button>

              {/* Botón 2: 2. Actualizar reporte existente */}
              <button
                type="button"
                onClick={() => {
                  setIsOptionsModalOpen(false);
                  setViewMode('listado_reportes');
                  setActiveModule('listado_reportes');
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-200 hover:border-[#040057] hover:bg-slate-50 text-slate-800 shadow-xs transition transform hover:scale-[1.01] active:scale-100 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    <ListFilter className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm sm:text-base text-[#040057]">2. Actualizar Reporte Existente</div>
                    <div className="text-[11px] text-slate-500 font-medium">Consultar estatus y agregar nuevas observaciones</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsOptionsModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: FORMULARIO "NUEVO REPORTE" (EN SECCIONES SEPARADAS) */}
      {/* ======================================================== */}
      {viewMode === 'nuevo_reporte' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('home')}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#040057] flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-rose-600" />
                  Formulario: Nuevo Reporte de Falla
                </h2>
                <p className="text-xs text-slate-500">
                  Completa las secciones ordenadas para despachar la atención técnica de inmediato.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('listado_reportes')}
              className="text-xs font-bold text-slate-600 hover:text-[#040057] flex items-center gap-1 cursor-pointer"
            >
              <ListFilter className="w-4 h-4" />
              <span>Ver mis reportes</span>
            </button>
          </div>

          <form onSubmit={handleSubmitNewReport} className="space-y-6">

            {/* SECCIÓN 1: UNIDAD Y ODÓMETRO */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#040057]">
                      Ficha de la Unidad y Kilometraje
                    </h3>
                    <p className="text-xs text-slate-400">
                      Selecciona la unidad registrada por el administrador y su odómetro actual.
                    </p>
                  </div>
                </div>

                {/* Campo de Fecha Automática */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha Automática:</span>
                    <span className="font-bold text-slate-800">{reportDate}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Botón Desplegable: Unidad (Unidad 1 a Unidad 50) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Unidad (Seleccionar número de unidad de ejemplo 1 a 50) *
                  </label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] focus:border-[#040057] transition"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitNumber} • Placas: {u.plates} • Eco: {u.economicNumber} • {u.brand} {u.model} ({u.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sincronizado con el catálogo de flota dado de alta por la administración.
                  </p>
                </div>

                {/* Campo para registrar Km / Odómetro */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kilometraje / Odómetro Actual *
                  </label>
                  <div className="relative">
                    <Gauge className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      placeholder="ej. 145,200 KM"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Registra la lectura del tablero al momento de presentarse la avería.
                  </p>
                </div>

              </div>



            </div>

            {/* SECCIÓN 2: OPERADOR Y TELÉFONO */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#040057]">
                    Datos del Operador de la Unidad
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecciona el operador (1 a 10) y verifica su número de contacto.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Botón desplegable para poder seleccionar Operador 1 a 10 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Operador (Desplegable muestra Operador 1 a 10) *
                  </label>
                  <select
                    value={selectedOperatorId}
                    onChange={(e) => handleOperatorChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                  >
                    {SAMPLE_OPERATORS.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.label}: {op.name} ({op.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campo de teléfono de operador (sincronizado) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Teléfono Celular del Operador *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={operatorPhone}
                      onChange={(e) => setOperatorPhone(e.target.value)}
                      placeholder="ej. 55 1234 5678"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Número para coordinar con la cuadrilla técnica y enviar enlace de geolocalización.
                  </p>
                </div>

              </div>
            </div>

            {/* SECCIÓN 3: DETALLE DE AVERÍA Y UBICACIÓN */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#040057]">
                    Detalle de la Falla y Ubicación
                  </h3>
                  <p className="text-xs text-slate-400">
                    Describe los síntomas mecánicos y el lugar exacto con referencias.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Falla Reportada por el Operador *
                </label>
                <textarea
                  rows={3}
                  value={failureDescription}
                  onChange={(e) => setFailureDescription(e.target.value)}
                  placeholder="Describe con claridad la avería (ej. Pérdida súbita de potencia en subida, fuga de aire en manguera de frenos traseros, calentamiento de motor a más de 105°C con testigo encendido)..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-normal text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Ubicación (Dirección manual con referencias del lugar) *
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLiveGps}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Usar mi GPS en vivo</span>
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ej. Carretera México-Querétaro Km 43.5, pasando caseta Tepotzotlán frente a gasolinera Pemex"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                  />
                </div>
              </div>

            </div>

            {/* SECCIÓN 4: EVIDENCIAS FOTOGRÁFICAS (CÁMARA TRASERA Y GALERÍA) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#040057]">
                    Evidencias Visuales (Fotografías de Avería)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Abre la cámara del dispositivo para capturar fotos de la falla o adjúntalas desde tu galería.
                  </p>
                </div>
              </div>

              {/* Banner de Candado Obligatorio */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition ${
                capturedPhotos.length === 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <div className="flex items-center gap-2.5">
                  {capturedPhotos.length === 0 ? (
                    <div className="p-1.5 rounded-xl bg-amber-200/80 text-amber-900">
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-xl bg-emerald-200/80 text-emerald-900">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <span className="font-extrabold uppercase tracking-wide text-[10px] block">
                      {capturedPhotos.length === 0 ? '🔒 Candado Activo Requerido' : '✓ Candado de Evidencia Cumplido'}
                    </span>
                    <span>
                      {capturedPhotos.length === 0
                        ? 'Debes capturar o adjuntar al menos 1 fotografía de la avería para poder enviar tu reporte. (Fotos: 0/1)'
                        : `Excelente: Has registrado ${capturedPhotos.length} fotografía(s) de la falla. Reporte listo para enviar.`}
                    </span>
                  </div>
                </div>

                {capturedPhotos.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setLiveCameraMode('photo');
                      setIsLiveCameraOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    Tomar Foto Ahora
                  </button>
                )}
              </div>

              {/* Botones de acción multimedia con solicitud de permisos al celular */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* 1. Activar Cámara Fotográfica Trasera con solicitud de permisos */}
                <button
                  type="button"
                  onClick={() => {
                    setLiveCameraMode('photo');
                    setIsLiveCameraOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span>Activar Cámara Trasera (Foto)</span>
                </button>

                {/* 2. Selector de archivo / galería */}
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Subir Fotos de Galería</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

              </div>

              {/* Grabador / Contador visual de 15 segundos */}
              {isRecordingVideo && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-rose-700 font-extrabold text-sm sm:text-base">
                    <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
                    <span>Grabando video de evidencia con la cámara...</span>
                  </div>
                  <div className="w-full bg-rose-200 h-3 rounded-full overflow-hidden max-w-md mx-auto">
                    <div 
                      className="bg-rose-600 h-full transition-all duration-300"
                      style={{ width: `${Math.min((videoSeconds / 15) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-bold text-rose-800">
                    {videoSeconds < 15 
                      ? `Llevas ${videoSeconds}s (Requerido: al menos 15 segundos)` 
                      : `¡Mínimo de 15 segundos alcanzado! (${videoSeconds}s) Puedes detener la grabación.`}
                  </div>
                </div>
              )}

              {/* Galería de fotos y videos tomados */}
              {(capturedPhotos.length > 0 || capturedVideos.length > 0) && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-700">
                    Evidencias listas para adjuntar ({capturedPhotos.length} fotos, {capturedVideos.length} videos):
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {capturedPhotos.map((photo) => (
                      <div key={photo.id} className="relative rounded-2xl overflow-hidden border border-slate-200 group aspect-video bg-slate-100">
                        <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <Camera className="w-2.5 h-2.5" /> Foto
                        </span>
                      </div>
                    ))}

                    {capturedVideos.map((video) => (
                      <div key={video.id} className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-900 group">
                        <video src={video.url} controls className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(video.id)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1.5 left-1.5 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
                          <Video className="w-3 h-3" /> {video.duration || 15}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* SECCIÓN 5: ¿UNIDAD REQUIERE RESCATE POR NO ESTAR OPERABLE? (SI / NO) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-sm">
                  5
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#040057]">
                    Condición de Operabilidad y Rescate en Carretera
                  </h3>
                  <p className="text-xs text-slate-400">
                    Indica si el vehículo puede rodar o si requiere grúa / cuadrilla de rescate en ruta.
                  </p>
                </div>
              </div>

              {/* SELECCIÓN: ¿Unidad requiere rescate por no estar operable? SI - NO */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800">
                  ¿Unidad requiere rescate por no estar operable? *
                </label>
                
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  
                  {/* OPCIÓN SÍ */}
                  <button
                    type="button"
                    onClick={() => {
                      setRequiresRescue(true);
                      if (!rescueLocationUrl) {
                        setRescueLocationUrl('https://maps.google.com/?q=19.7144,-99.2241');
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 text-center font-black text-sm sm:text-base transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      requiresRescue
                        ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-md ring-2 ring-rose-600/30'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <span className="text-xl">🚨 SÍ</span>
                    <span className="text-[11px] font-medium text-rose-800">
                      Unidad inoperable / Varada en ruta
                    </span>
                  </button>

                  {/* OPCIÓN NO */}
                  <button
                    type="button"
                    onClick={() => {
                      setRequiresRescue(false);
                      setRescueLocationUrl('');
                    }}
                    className={`p-4 rounded-2xl border-2 text-center font-black text-sm sm:text-base transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      !requiresRescue
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-2 ring-blue-600/30'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <span className="text-xl">✅ NO</span>
                    <span className="text-[11px] font-medium text-blue-800">
                      Unidad operable / Taller o patio
                    </span>
                  </button>

                </div>

                {/* Si selecciona "SI": se podrá ver un campo para que el cliente pegue la ubicación o link de Google Maps */}
                {requiresRescue ? (
                  <div className="pt-3 border-t border-rose-200 animate-fadeIn space-y-2">
                    <label className="block text-xs font-extrabold text-rose-900">
                      Pega aquí la ubicación exacta / Link de Google Maps o cualquier app de geolocalización *
                    </label>
                    <div className="relative">
                      <ExternalLink className="w-4 h-4 text-rose-500 absolute left-3.5 top-3" />
                      <input
                        type="url"
                        value={rescueLocationUrl}
                        onChange={(e) => setRescueLocationUrl(e.target.value)}
                        placeholder="https://maps.app.goo.gl/... o https://www.google.com/maps?q=..."
                        required={requiresRescue}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-rose-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 transition"
                      />
                    </div>
                    <p className="text-[11px] text-rose-700 font-medium">
                      El jefe de taller y administración recibirán esta coordenada con una ventana emergente y sonido de alerta en vivo.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 pt-1">
                    Al seleccionar "NO", la solicitud se registrará como ingreso a taller o asistencia preventiva.
                  </p>
                )}

              </div>

              {/* Botón final del formulario: Enviar solicitud */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('home')}
                  className="px-5 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  onClick={(e) => {
                    if (capturedPhotos.length === 0) {
                      e.preventDefault();
                      setShowPhotoWarningModal(true);
                      addToast('warning', 'Fotografía Obligatoria', 'Debes adjuntar al menos una fotografía de la avería para enviar el reporte.');
                    }
                  }}
                  className={`px-8 py-3.5 rounded-2xl text-white font-black text-sm sm:text-base shadow-xl transition transform hover:scale-[1.01] active:scale-100 cursor-pointer flex items-center gap-2 ${
                    capturedPhotos.length === 0
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-linear-to-r from-[#040057] to-indigo-700 hover:from-[#070085] hover:to-indigo-800'
                  }`}
                  title={capturedPhotos.length === 0 ? 'Candado: Debes adjuntar al menos 1 foto' : 'Enviar reporte de falla'}
                >
                  {capturedPhotos.length === 0 ? (
                    <>
                      <Lock className="w-5 h-5 text-amber-200" />
                      <span>Enviar solicitud (Requiere Foto)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Enviar solicitud</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </form>

        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: LISTADO DE REPORTES ENVIADOS (SEGUNDO BOTÓN) */}
      {/* ======================================================== */}
      {viewMode === 'listado_reportes' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewMode('home')}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#040057] flex items-center gap-2">
                    <ListFilter className="w-5 h-5 text-indigo-600" />
                    Reporte de falla
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('nuevo_reporte')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Nuevo Reporte</span>
              </button>
            </div>

            {/* BUSCADOR INTELIGENTE REQUERIDO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscador inteligente: busca por número de unidad, placas, falla, operador, estatus o ubicación..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filtrar por estatus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-xs sm:text-sm font-bold text-[#040057] focus:ring-2 focus:ring-[#040057] transition cursor-pointer shadow-xs"
                >
                  <option value="en_proceso">En Proceso / Diagnóstico</option>
                  <option value="concluidos">Servicios Terminados (PDF Listo)</option>
                  <option value="todos">Todos los Reportes</option>
                </select>
              </div>
            </div>

            {/* Alternar formato: Tarjetas vs Bitácora Consolidada del Cliente */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500">
                Formato de visualización del listado:
              </span>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setReportListFormat('tarjetas')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    reportListFormat === 'tarjetas'
                      ? 'bg-[#040057] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Vista Tarjetas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportListFormat('bitacora')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    reportListFormat === 'bitacora'
                      ? 'bg-[#040057] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Bitácora Consolidada (Formato Cliente)</span>
                </button>
              </div>
            </div>

          </div>

          {/* VISTA SEGÚN FORMATO SELECCIONADO */}
          {reportListFormat === 'bitacora' ? (
            <ConsolidatedReportsLogView 
              orders={filteredOrders}
              title="BITÁCORA DE REPORTES DE FALLA Y SERVICIOS"
              showFilters={false}
            />
          ) : (
            <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-700">
                  No se encontraron reportes con ese criterio de búsqueda
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Verifica el folio, número de unidad o prueba cambiando el filtro de estatus.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setStatusFilter('todos'); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isRescue = order.requiresRescue || order.serviceType === 'rescate';

                // Helpers de formato de estatus visual según la imagen solicitada
                const getStatusPill = (st: ServiceStatus) => {
                  switch (st) {
                    case 'por_atender':
                    case 'solicitado':
                      return { text: 'Por Atender', color: 'bg-amber-100 text-amber-900 border-amber-300' };
                    case 'en_proceso':
                    case 'asignado':
                    case 'en_diagnostico_trabajo':
                      return { text: 'En Proceso / Diagnóstico', color: 'bg-blue-100 text-blue-900 border-blue-300' };
                    case 'pendiente_refacciones':
                      return { text: 'Pendiente Refacciones', color: 'bg-purple-100 text-purple-900 border-purple-300' };
                    case 'validando_pruebas':
                    case 'evidencias_en_revision':
                      return { text: 'Validando / Pruebas', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
                    case 'habilitada':
                    case 'liberacion_autorizada':
                    case 'unidad_liberada':
                      return { text: 'Habilitada / Lista', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
                    case 'cerrado':
                    case 'facturado':
                      return { text: 'Cerrado / Concluido', color: 'bg-slate-200 text-slate-800 border-slate-400' };
                    default:
                      return { text: st, color: 'bg-slate-100 text-slate-700 border-slate-300' };
                  }
                };

                const statusInfo = getStatusPill(order.status);

                const processInfo = getOrderProcessInfo(order.status, order.assignedTechnicianName);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-4"
                  >
                    
                    {/* Cabecera del reporte (SIN FOLIO, IDENTIFICACIÓN DE UNIDAD Y PROCESO ACTUAL) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Identificación de Unidad principal sin folio */}
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-900 text-xs sm:text-sm font-black border border-slate-200 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-indigo-600" />
                          <span>{order.unitNumber || `Unidad ${order.vehicle.economicNumber}`}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-700 font-bold">{order.vehicle.plates}</span>
                        </span>
                        
                        {/* Badge de fase actual del proceso */}
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                          processInfo.isFinished
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-blue-100 text-blue-900 border-blue-300'
                        }`}>
                          {processInfo.badge}
                        </span>

                        {isRescue ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase flex items-center gap-1 shadow-xs animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Requiere Rescate
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                            Taller / Asistencia
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    {/* SEGUIMIENTO EN TIEMPO REAL: ¿EN QUÉ PROCESO VA SU REPORTE DE FALLA? */}
                    <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                            Estatus del Proceso Técnico
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200 self-start sm:self-auto">
                          Paso {processInfo.step} de {processInfo.totalSteps}
                        </span>
                      </div>

                      {/* Línea de 5 pasos */}
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1">
                        {[
                          { num: 1, title: 'Reportado' },
                          { num: 2, title: 'Asignado' },
                          { num: 3, title: 'En Trabajo' },
                          { num: 4, title: 'Pruebas' },
                          { num: 5, title: 'Terminado' }
                        ].map((stepItem) => {
                          const isDone = stepItem.num < processInfo.step;
                          const isCurrent = stepItem.num === processInfo.step;

                          return (
                            <div key={stepItem.num} className="flex flex-col items-center gap-1.5 text-center">
                              <div className="w-full flex items-center">
                                <div
                                  className={`h-2.5 w-full rounded-full transition-all duration-300 ${
                                    isDone
                                      ? 'bg-emerald-500'
                                      : isCurrent
                                      ? (processInfo.isFinished ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-blue-600 ring-2 ring-blue-300 animate-pulse')
                                      : 'bg-slate-200'
                                  }`}
                                />
                              </div>
                              <span
                                className={`text-[9.5px] sm:text-xs font-bold uppercase truncate max-w-full ${
                                  isCurrent
                                    ? 'text-[#040057] font-black'
                                    : isDone
                                    ? 'text-emerald-700 font-extrabold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {stepItem.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Detalle descriptivo de la etapa actual */}
                      <div className="flex items-start gap-2 pt-1 border-t border-slate-200/80 text-xs text-slate-700">
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="font-semibold leading-relaxed">
                          {processInfo.description}
                        </p>
                      </div>
                    </div>

                    {/* Ficha simplificada: Operador y Falla (Sin tarjeta de Unidad y Kilometraje) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      
                      {/* Operador y Ubicación */}
                      <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Operador y Ubicación
                        </span>
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.operatorName || order.clientContact}</span>
                        </div>
                        {order.operatorPhone && (
                          <div className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{order.operatorPhone}</span>
                          </div>
                        )}
                        <div className="text-slate-600 font-medium flex items-start gap-1 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{order.vehicle.location}</span>
                        </div>
                        {order.rescueLocationUrl && (
                          <a
                            href={order.rescueLocationUrl.startsWith('http') ? order.rescueLocationUrl : `https://${order.rescueLocationUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px] pt-1"
                          >
                            <span>Abrir enlace de Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Falla Reportada */}
                      <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Falla Reportada Inicial
                        </span>
                        <p className="text-slate-800 font-medium line-clamp-3 leading-relaxed">
                          {order.vehicle.failureDescription}
                        </p>
                        {order.assignedTechnicianName && (
                          <div className="pt-1 text-slate-500 font-semibold">
                            Técnico asignado: <strong className="text-indigo-700">{order.assignedTechnicianName}</strong>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Evidencias adjuntas (miniaturas) */}
                    {((order.evidences && order.evidences.length > 0) || (order.videoEvidences && order.videoEvidences.length > 0)) && (
                      <div className="flex items-center gap-2 overflow-x-auto py-1">
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">Evidencias:</span>
                        {order.evidences.slice(0, 4).map((ev, i) => (
                          <div key={i} className="w-14 h-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative">
                            <img src={ev.url} alt="ev" className="w-full h-full object-cover" />
                            <Camera className="w-2.5 h-2.5 text-white absolute bottom-1 right-1" />
                          </div>
                        ))}
                        {order.videoEvidences?.map((vid, i) => (
                          <div key={i} className="w-16 h-10 rounded-xl bg-slate-900 border border-slate-200 text-white flex items-center justify-center gap-1 text-[9px] font-bold shrink-0">
                            <Video className="w-3 h-3 text-rose-500" />
                            <span>{vid.duration || 15}s</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Historial de Observaciones Agregadas por el Cliente */}
                    {order.clientObservationsHistory && order.clientObservationsHistory.length > 0 && (
                      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                          Observaciones / Nuevas Fallas Agregadas por el Cliente ({order.clientObservationsHistory.length}):
                        </span>
                        {order.clientObservationsHistory.map((obs) => (
                          <div key={obs.id} className="text-xs text-slate-800 bg-white p-2.5 rounded-xl border border-amber-200/80 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-bold text-slate-600">{obs.author}</span>
                              <span>{new Date(obs.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                            <p className="font-medium">{obs.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ACCIONES: Descargar PDF (solo si el servicio ha concluido) y Modificar Reporte */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                      {processInfo.isFinished ? (
                        <button
                          type="button"
                          onClick={() => setViewingPdfOrder(order)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-emerald-300" />
                          <span>Descargar Reporte en PDF</span>
                        </button>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <button
                            type="button"
                            disabled
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs sm:text-sm border border-slate-200 cursor-not-allowed opacity-80"
                            title="No se podrá descargar el PDF hasta que el proceso no se haya terminado (Fase 5)."
                          >
                            <Lock className="w-4 h-4 text-slate-400" />
                            <span>Descargar Reporte en PDF (Bloqueado)</span>
                          </button>
                          <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            🔒 Disponible al concluir servicio
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenModify(order)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-indigo-600" />
                        <span>Modificar Reporte y Agregar Observación</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 4: MODIFICAR REPORTE Y AGREGAR OBSERVACIÓN (NO FLOTANTE) */}
      {/* ======================================================== */}
      {viewMode === 'modificar_reporte' && orderToModify && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewMode('listado_reportes')}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#040057] flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-amber-500" />
                    Actualizar Reporte: {orderToModify.folio}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Unidad: {orderToModify.unitNumber || orderToModify.vehicle.economicNumber} • Placas: {orderToModify.vehicle.plates}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('listado_reportes')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Volver al listado
              </button>
            </div>

            {/* Resumen del reporte actual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Falla Registrada Previamente:</span>
                <p className="text-slate-800 font-semibold mt-1">
                  {orderToModify.vehicle.failureDescription}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Ubicación y Operador:</span>
                <div className="text-slate-700 mt-1">
                  <strong>{orderToModify.vehicle.location}</strong>
                </div>
                <div className="text-slate-500 mt-0.5">
                  Operador: {orderToModify.operatorName || orderToModify.clientContact}
                </div>
              </div>
            </div>

            {/* Formulario de actualización (en sección separada, NO ventana flotante) */}
            <form onSubmit={handleSaveObservation} className="space-y-4 pt-2">
              
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Agregar Nueva Falla, Síntoma Adicional u Observación *
                </label>
                <textarea
                  rows={4}
                  value={newObservationText}
                  onChange={(e) => setNewObservationText(e.target.value)}
                  placeholder="Escribe aquí la nueva falla u observación que acabas de detectar en la unidad (ej. Además del calentamiento de motor, se detectó fuga de anticongelante en manguera inferior y la batería no retiene carga)..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Esta actualización quedará registrada en el historial del reporte y notificará de inmediato al jefe de taller y administración.
                </p>
              </div>

              {/* Botón para tomar fotos adicionales */}
              <div>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs sm:text-sm transition cursor-pointer w-fit">
                  <Camera className="w-4 h-4 text-indigo-700" />
                  <span>Tomar o Adjuntar Foto Adicional</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      Array.from(files).forEach((file, idx) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const url = ev.target?.result as string;
                          setAdditionalPhotos(prev => [
                            ...prev,
                            {
                              id: `obs-photo-${Date.now()}-${idx}`,
                              phase: 'antes',
                              url,
                              title: `Foto Adicional ${prev.length + 1}`,
                              timestamp: new Date().toISOString(),
                              uploadedBy: 'cliente' as any,
                              uploaderName: operatorName || 'Operador',
                            }
                          ]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                    className="hidden"
                  />
                </label>

                {additionalPhotos.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    {additionalPhotos.map((p) => (
                      <div key={p.id} className="w-16 h-12 rounded-xl overflow-hidden border border-slate-200 relative">
                        <img src={p.url} alt="adicional" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAdditionalPhotos(prev => prev.filter(x => x.id !== p.id))}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewMode('listado_reportes')}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Guardar Observación y Actualizar Reporte</span>
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

      {/* MODAL DE CÁMARA MÓVIL EN VIVO CON SOLICITUD DE PERMISOS NATIVOS */}
      <LiveCameraModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onCapture={handleLiveMediaCaptured}
        title={liveCameraMode === 'photo' ? 'Cámara Fotográfica Trasera' : 'Cámara de Video Trasera'}
        defaultMode={liveCameraMode}
      />

      {/* MODAL DE ADVERTENCIA: FOTO OBLIGATORIA */}
      <EvidenceLockWarningModal
        isOpen={showPhotoWarningModal}
        onClose={() => {
          setShowPhotoWarningModal(false);
          setLiveCameraMode('photo');
          setIsLiveCameraOpen(true);
        }}
        type="client_photo"
      />

      {/* MODAL OFICIAL PARA DESCARGA E IMPRESIÓN DE REPORTE EN PDF */}
      <ClientReportPdfModal
        order={viewingPdfOrder}
        onClose={() => setViewingPdfOrder(null)}
      />

    </div>
  );
};
