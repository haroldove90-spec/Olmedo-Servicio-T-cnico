import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Camera, 
  Key, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Upload, 
  Truck, 
  MapPin, 
  Send, 
  ShieldCheck, 
  FileCheck, 
  PackageCheck,
  AlertCircle,
  FileSpreadsheet,
  PenTool,
  Eye,
  FileText,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, EvidencePhoto, PartUsed } from '../../types';
import { TechnicalReportDocument } from '../common/TechnicalReportDocument';
import { EvidenceCaptureModal } from '../common/EvidenceCaptureModal';

export const TecnicoPortal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    orders, 
    startTechnicianWork, 
    addEvidencePhoto,
    addBatchEvidences, 
    removeEvidencePhoto, 
    addPartUsed, 
    removePartUsed, 
    submitEvidencesForReview, 
    correctAndResubmitEvidences, 
    releaseVehiclePhysical,
    updateTechnicalReport,
    services
  } = useApp();

  // Selected active order for working on
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    // Pick first active order assigned or in progress
    const active = orders.find(o => 
      o.status === 'asignado' || 
      o.status === 'en_diagnostico_trabajo' || 
      o.status === 'evidencias_rechazadas' ||
      o.status === 'liberacion_autorizada'
    );
    return active ? active.id : (orders[0]?.id || '');
  });

  // Start work dialog
  const [initialDiagnosisText, setInitialDiagnosisText] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);

  // Evidence upload modal state (Mobile Camera & Multi-card up to 15)
  const [showEvidenceCaptureModal, setShowEvidenceCaptureModal] = useState(false);
  const [captureInitialPhase, setCaptureInitialPhase] = useState<'antes' | 'correctivo_realizado'>('antes');
  const [lightboxPhoto, setLightboxPhoto] = useState<EvidencePhoto | null>(null);

  // Part used form
  const [partNumber, setPartNumber] = useState('');
  const [partDescription, setPartDescription] = useState('');
  const [partQuantity, setPartQuantity] = useState<number | string>(1);
  const [partPrice, setPartPrice] = useState(0);
  const [partProvidedByClient, setPartProvidedByClient] = useState(false);
  const [partPosition, setPartPosition] = useState('');
  const [showAddPart, setShowAddPart] = useState(false);

  // Technical Report Official Form State
  const [showReportFormModal, setShowReportFormModal] = useState(false);
  const [showReportPreviewModal, setShowReportPreviewModal] = useState(false);
  const [reportMaintenanceNature, setReportMaintenanceNature] = useState<'correctivo' | 'preventivo'>('correctivo');
  const [reportPreventiveNotes, setReportPreventiveNotes] = useState('');
  const [reportChassisSerial, setReportChassisSerial] = useState('');
  const [reportEngineModel, setReportEngineModel] = useState('');
  const [reportEngineSeries, setReportEngineSeries] = useState('');
  const [reportOdometer, setReportOdometer] = useState('');
  const [reportWorkDetail, setReportWorkDetail] = useState('');
  const [reportTechSignature, setReportTechSignature] = useState('');
  const [reportUserOperator, setReportUserOperator] = useState('');

  // Correction response dialog
  const [correctionExplanation, setCorrectionExplanation] = useState('');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // Physical release dialog
  const [releasedByName, setReleasedByName] = useState('Carlos Mendoza (Técnico Titular)');
  const [receivedByDriverName, setReceivedByDriverName] = useState('');
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  // Filter orders relevant to technician
  const myAssignedOrders = orders.filter(o => 
    o.status === 'asignado' || 
    o.status === 'en_diagnostico_trabajo' || 
    o.status === 'evidencias_en_revision' || 
    o.status === 'evidencias_rechazadas' || 
    o.status === 'liberacion_autorizada' ||
    o.status === 'unidad_liberada'
  );

  const currentOrder = orders.find(o => o.id === selectedOrderId) || myAssignedOrders[0] || orders[0];

  // Filtro de fases según la nueva regla (1. Antes y 2. Correctivo realizado)
  const antesEvidences = currentOrder?.evidences.filter(e => e.phase === 'antes') || [];
  const correctivoEvidences = currentOrder?.evidences.filter(e => 
    e.phase === 'correctivo_realizado' || e.phase === 'durante' || e.phase === 'despues'
  ) || [];

  const handleSubmitForReview = () => {
    if (!currentOrder) return;
    if (antesEvidences.length === 0) {
      alert('⚠️ Paso 1 Requerido: Debes cargar al menos 1 evidencia fotográfica en "1. Antes" antes de enviar a revisión.');
      return;
    }
    if (correctivoEvidences.length === 0) {
      alert('⚠️ Paso 2 Requerido: Debes cargar al menos 1 evidencia fotográfica en "2. Correctivo realizado" antes de enviar a revisión.');
      return;
    }
    submitEvidencesForReview(currentOrder.id);
  };

  // Sync report state whenever currentOrder changes
  useEffect(() => {
    if (currentOrder) {
      setReportMaintenanceNature(currentOrder.maintenanceNature || 'correctivo');
      setReportPreventiveNotes(currentOrder.preventiveInspectionNotes || currentOrder.vehicle.failureDescription || '');
      setReportChassisSerial(currentOrder.vehicle.chassisSerialNumber || '');
      setReportEngineModel(currentOrder.vehicle.engineModelTransmission || '');
      setReportEngineSeries(currentOrder.vehicle.engineSeriesTransmission || '');
      setReportOdometer(currentOrder.vehicle.odometerReading || '');
      setReportWorkDetail(currentOrder.workPerformedDetail || '');
      setReportTechSignature(currentOrder.technicianSignature || (currentOrder.assignedTechnicianName ? `${currentOrder.assignedTechnicianName} - Técnico` : 'Carlos Mendoza - Técnico'));
      setReportUserOperator(currentOrder.userOperatorName || currentOrder.vehicle.driverContact || '');
    }
  }, [currentOrder?.id]);

  const handleStartWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !initialDiagnosisText.trim()) return;
    startTechnicianWork(currentOrder.id, initialDiagnosisText.trim());
    setShowStartModal(false);
    setInitialDiagnosisText('');
  };

  const handleOpenEvidenceCapture = (phase: 'antes' | 'correctivo_realizado' = 'antes') => {
    // If attempting to open in step 2 but no photos in antes, block with alert
    const antesCount = currentOrder?.evidences.filter(e => e.phase === 'antes').length || 0;
    if (phase === 'correctivo_realizado' && antesCount === 0) {
      alert('⚠️ Paso Bloqueado: Debes tomar o subir al menos 1 fotografía en "1. Antes" antes de poder registrar evidencias en "2. Correctivo realizado".');
      setCaptureInitialPhase('antes');
      setShowEvidenceCaptureModal(true);
      return;
    }

    setCaptureInitialPhase(phase);
    setShowEvidenceCaptureModal(true);
  };

  const handleSaveBatchEvidences = (photos: Omit<EvidencePhoto, 'id' | 'timestamp'>[]) => {
    if (!currentOrder || photos.length === 0) return;
    addBatchEvidences(currentOrder.id, photos);
  };

  const handleAddPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !partDescription.trim()) return;

    let fullDesc = partDescription.trim();
    if (partPosition.trim()) {
      fullDesc += ` (${partPosition.trim()})`;
    }
    if (partProvidedByClient) {
      fullDesc += ` (PROPORCIONADAS POR CLIENTE)`;
    }

    addPartUsed(currentOrder.id, {
      partNumber: partNumber.trim() || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      description: fullDesc,
      quantity: partQuantity,
      unitPrice: partProvidedByClient ? 0 : (Number(partPrice) || 0),
      providedByClient: partProvidedByClient,
      position: partPosition.trim() || undefined,
    });

    setPartNumber('');
    setPartDescription('');
    setPartQuantity(1);
    setPartPrice(0);
    setPartProvidedByClient(false);
    setPartPosition('');
    setShowAddPart(false);
  };

  const handleSaveReportData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;

    updateTechnicalReport(currentOrder.id, {
      maintenanceNature: reportMaintenanceNature,
      preventiveInspectionNotes: reportPreventiveNotes,
      workPerformedDetail: reportWorkDetail,
      technicianSignature: reportTechSignature,
      userOperatorName: reportUserOperator,
      vehicleUpdates: {
        chassisSerialNumber: reportChassisSerial,
        engineModelTransmission: reportEngineModel,
        engineSeriesTransmission: reportEngineSeries,
        odometerReading: reportOdometer,
      },
    });

    setShowReportFormModal(false);
  };

  const handleResubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !correctionExplanation.trim()) return;
    correctAndResubmitEvidences(currentOrder.id, correctionExplanation.trim());
    setShowCorrectionModal(false);
    setCorrectionExplanation('');
  };

  const handleConfirmRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !receivedByDriverName.trim()) return;
    releaseVehiclePhysical(currentOrder.id, releasedByName, receivedByDriverName.trim());
    setShowReleaseModal(false);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8 w-full max-w-full min-w-0 overflow-x-hidden">
      
      {/* Encabezado del Portal del Técnico */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs max-w-full min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057] truncate">
                App / Portal del Técnico
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Apertura de OS • Evidencias Obligatorias (Antes/Durante/Después) • Insumos • Liberación de Unidades
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#040057] border border-blue-200 text-xs font-bold flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              {myAssignedOrders.length} Tareas Asignadas
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Orden Activa */}
      {myAssignedOrders.length > 0 && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">Orden:</span>
            <select
              value={currentOrder?.id}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-[#040057] text-xs sm:text-sm bg-slate-50 focus:ring-2 focus:ring-[#040057] truncate max-w-full min-w-0"
            >
              {myAssignedOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.folio} — {o.vehicle.type.toUpperCase()} ({o.vehicle.plates}) • {o.status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
            {currentOrder && (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Prioridad: <strong className="uppercase text-rose-600">{currentOrder.priority}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ALERTA DE OBSERVACIONES / RECHAZO DE GERENCIA ADMINISTRATIVA (Paso F en Graph TD) */}
      {currentOrder && currentOrder.status === 'evidencias_rechazadas' && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-xs animate-pulse min-w-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-rose-900">
                Observación Administrativa: Evidencias Rechazadas / Requieren Corrección (Paso F)
              </h3>
              <p className="text-xs text-rose-800 font-medium">
                Gerencia Administrativa ha devuelto esta orden solicitando correcciones o fotos adicionales antes de autorizar la liberación física:
              </p>
              <div className="mt-2 p-3 bg-white rounded-xl border border-rose-200 text-xs font-semibold text-slate-800 break-words">
                "{currentOrder.adminReviewNotes}"
              </div>
              
              <div className="pt-2">
                <button
                  onClick={() => setShowCorrectionModal(true)}
                  className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Aclarar / Corregir y Reenviar a Gerencia</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO: DETALLE DE ORDEN Y APERTURA DE OS (Paso C) */}
      {currentOrder && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-5 min-w-0 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-extrabold text-[#040057]">{currentOrder.folio}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#040057] font-semibold">
                  {currentOrder.serviceType.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">
                Cliente: <strong className="text-slate-800">{currentOrder.clientName}</strong> ({currentOrder.clientContact})
              </div>
            </div>

            {/* Estado de Apertura de OS */}
            <div className="shrink-0">
              {currentOrder.status === 'asignado' ? (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 animate-bounce"
                >
                  <Clock className="w-4 h-4" />
                  <span>Abrir Orden de Servicio e Iniciar Trabajo (Paso C)</span>
                </button>
              ) : currentOrder.startTime ? (
                <div className="text-left sm:text-right text-xs">
                  <span className="text-emerald-700 font-bold flex items-center gap-1 sm:justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" /> OS Iniciada
                  </span>
                  <span className="text-slate-500">
                    Hora inicio: {new Date(currentOrder.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Ficha de la unidad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs min-w-0">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase text-slate-400">Unidad</span>
              <div className="font-bold text-[#040057] text-sm break-words">
                {currentOrder.vehicle.type.toUpperCase()} • Placas: {currentOrder.vehicle.plates}
              </div>
              <div className="text-slate-600">
                Económico: <strong>{currentOrder.vehicle.economicNumber}</strong>
                {(currentOrder.vehicle.brand || currentOrder.vehicle.brandModel) && (
                  <span className="ml-1 text-[#040057] font-bold">
                    • {currentOrder.vehicle.brand || currentOrder.vehicle.brandModel?.split(' ')[0]} {currentOrder.vehicle.model || ''}
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase text-slate-400">Ubicación y Operador</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">{currentOrder.vehicle.location}</span>
              </div>
              <div className="text-slate-500 truncate">{currentOrder.vehicle.driverContact || 'Sin chofer reportado'}</div>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase text-slate-400">Falla Reportada por Cliente</span>
              <p className="text-slate-700 line-clamp-2 break-words">{currentOrder.vehicle.failureDescription}</p>
            </div>
          </div>

          {/* Diagnóstico técnico registrado */}
          {currentOrder.initialDiagnosis && (
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs min-w-0">
              <span className="font-bold text-[#040057]">Diagnóstico Técnico en Sitio / Taller: </span>
              <span className="text-slate-800 break-words">{currentOrder.initialDiagnosis}</span>
            </div>
          )}

          {/* SECCIÓN DEL FORMATO OFICIAL DE REPORTE TÉCNICO (Imagen oficial Arcinux / Olmedo) */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border-2 border-indigo-200 space-y-3 min-w-0 max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-[#040057] shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-[#040057] truncate">
                    Formato Oficial: REPORTE TÉCNICO {currentOrder.reportNumber || '023'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Captura los datos del formato físico: Chasis, Motor, Odómetro, Tipo de Servicio (Correctivo/Preventivo) y Detalle Realizado.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReportPreviewModal(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-[#040057]" />
                  <span>Ver Formato Impreso</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReportFormModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Llenar / Editar Formato Oficial</span>
                </button>
              </div>
            </div>

            {/* Resumen de los datos capturados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs min-w-0">
              <div className="bg-white p-2 rounded-lg border min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Tipo Servicio:</span>
                <span className="font-bold text-slate-800 uppercase truncate block">{currentOrder.maintenanceNature || 'Correctivo'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Odómetro/Horómetro:</span>
                <span className="font-bold text-slate-800 truncate block">{currentOrder.vehicle.odometerReading || 'Sin registrar'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Serie Chasis (VIN):</span>
                <span className="font-mono text-slate-800 text-[11px] truncate block">{currentOrder.vehicle.chassisSerialNumber || 'Sin registrar'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Motor/Transmisión:</span>
                <span className="font-bold text-slate-800 text-[11px] truncate block">{currentOrder.vehicle.engineModelTransmission || 'Sin registrar'}</span>
              </div>
            </div>

            {currentOrder.workPerformedDetail && (
              <div className="bg-white p-2.5 rounded-lg border text-xs text-slate-700 min-w-0">
                <span className="font-bold text-[#040057]">Servicio Realizado: </span>
                <span className="line-clamp-2 break-words">{currentOrder.workPerformedDetail}</span>
              </div>
            )}
          </div>

          {/* SECCIÓN OBLIGATORIA: EVIDENCIAS FOTOGRÁFICAS (2 PASOS OBLIGATORIOS) */}
          <div className="space-y-4 pt-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 min-w-0">
              <div className="min-w-0">
                <h3 className="font-bold text-[#040057] text-sm sm:text-base flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>Carga Obligatoria de Evidencias Fotográficas</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-[#040057] font-bold">
                    {currentOrder.evidences.length} de 15 máx
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Toma fotos con la cámara móvil o sube archivos. Debes completar <strong>1. Antes</strong> (mínimo 1) para poder avanzar a <strong>2. Correctivo realizado</strong>.
                </p>
              </div>

              {/* Botón principal de apertura de cámara */}
              <button
                type="button"
                onClick={() => handleOpenEvidenceCapture('antes')}
                className="px-4 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Tomar Fotos con Cámara (1 a 15)</span>
              </button>
            </div>

            {/* Cuadrícula de 2 Pasos: 1. ANTES y 2. CORRECTIVO REALIZADO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
              
              {/* PASO 1: 1. ANTES */}
              <div className="bg-slate-50/90 rounded-2xl p-4 border-2 border-slate-200 hover:border-slate-300 transition space-y-3 min-w-0">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase">
                      1. ANTES (Falla Inicial)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      antesEvidences.length > 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {antesEvidences.length > 0 ? `✓ ${antesEvidences.length} foto(s)` : '⚠️ Mínimo 1 obligatoria'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Evidencia de componentes dañados y falla detectada en sitio</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEvidenceCapture('antes')}
                    className="text-[#040057] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tomar / Subir</span>
                  </button>
                </div>

                {/* Listado de evidencias de Antes */}
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {antesEvidences.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-2 text-xs min-w-0 hover:border-indigo-300 transition"
                    >
                      <div className="relative group rounded-lg overflow-hidden bg-slate-900 cursor-pointer" onClick={() => setLightboxPhoto(ev)}>
                        <img
                          src={ev.url}
                          alt={ev.title}
                          className="w-full h-36 object-contain bg-slate-950 rounded-lg group-hover:scale-102 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Eye className="w-4 h-4" />
                          <span>Ver en tamaño completo</span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 line-clamp-1 break-words">{ev.title}</div>
                          {ev.notes && (
                            <div className="text-[11px] text-slate-600 line-clamp-2 break-words mt-0.5">
                              {ev.notes}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeEvidencePhoto(currentOrder.id, ev.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                          title="Eliminar evidencia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{new Date(ev.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Fase 1: Antes</span>
                      </div>
                    </div>
                  ))}

                  {antesEvidences.length === 0 && (
                    <div className="p-6 text-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 space-y-2">
                      <Camera className="w-8 h-8 text-amber-600 mx-auto" />
                      <div className="font-bold text-amber-900 text-xs">Sin evidencias de "1. Antes"</div>
                      <p className="text-[11px] text-amber-700 max-w-xs mx-auto">
                        Captura mínimo 1 fotografía con la cámara para poder continuar al paso 2 (Correctivo realizado).
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenEvidenceCapture('antes')}
                        className="mt-2 px-4 py-1.5 rounded-lg bg-[#040057] text-white font-bold text-xs hover:bg-[#070085] cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tomar Foto del Antes</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* PASO 2: 2. CORRECTIVO REALIZADO */}
              <div className={`rounded-2xl p-4 border-2 transition space-y-3 min-w-0 ${
                antesEvidences.length === 0
                  ? 'bg-slate-100/80 border-slate-300/80'
                  : 'bg-slate-50/90 border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    {antesEvidences.length === 0 ? (
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                    )}
                    <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase">
                      2. CORRECTIVO REALIZADO
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      antesEvidences.length === 0
                        ? 'bg-slate-200 text-slate-600'
                        : correctivoEvidences.length > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {antesEvidences.length === 0
                        ? 'Bloqueado'
                        : correctivoEvidences.length > 0
                        ? `✓ ${correctivoEvidences.length} foto(s)`
                        : '⚠️ Mínimo 1 obligatoria'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Reparación efectuada, refacciones nuevas montadas y pruebas</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEvidenceCapture('correctivo_realizado')}
                    className="text-[#040057] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tomar / Subir</span>
                  </button>
                </div>

                {/* Listado de evidencias de Correctivo Realizado */}
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {antesEvidences.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border-2 border-dashed border-slate-300 bg-white/70 space-y-2">
                      <Lock className="w-8 h-8 text-amber-500 mx-auto" />
                      <div className="font-bold text-slate-700 text-xs">Paso 2 Bloqueado</div>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Debes capturar y guardar al menos 1 fotografía en <strong>"1. Antes"</strong> para habilitar este paso.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenEvidenceCapture('antes')}
                        className="mt-2 px-3.5 py-1.5 rounded-lg border border-[#040057] text-[#040057] font-bold text-xs hover:bg-blue-50 cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Ir a Paso 1 (Antes)</span>
                      </button>
                    </div>
                  ) : correctivoEvidences.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <div className="font-bold text-emerald-900 text-xs">Paso 1 Completado</div>
                      <p className="text-[11px] text-emerald-700 max-w-xs mx-auto">
                        Ahora captura mínimo 1 fotografía del trabajo correctivo finalizado y pruebas.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenEvidenceCapture('correctivo_realizado')}
                        className="mt-2 px-4 py-1.5 rounded-lg bg-[#040057] text-white font-bold text-xs hover:bg-[#070085] cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tomar Foto de Correctivo</span>
                      </button>
                    </div>
                  ) : (
                    correctivoEvidences.map((ev) => (
                      <div
                        key={ev.id}
                        className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-2 text-xs min-w-0 hover:border-emerald-300 transition"
                      >
                        <div className="relative group rounded-lg overflow-hidden bg-slate-900 cursor-pointer" onClick={() => setLightboxPhoto(ev)}>
                          <img
                            src={ev.url}
                            alt={ev.title}
                            className="w-full h-36 object-contain bg-slate-950 rounded-lg group-hover:scale-102 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Eye className="w-4 h-4" />
                            <span>Ver en tamaño completo</span>
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 line-clamp-1 break-words">{ev.title}</div>
                            {ev.notes && (
                              <div className="text-[11px] text-slate-600 line-clamp-2 break-words mt-0.5">
                                {ev.notes}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeEvidencePhoto(currentOrder.id, ev.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                            title="Eliminar evidencia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>{new Date(ev.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Fase 2: Correctivo</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* SECCIÓN DE REFACCIONES E INSUMOS UTILIZADOS */}
          <div className="space-y-3 pt-3 border-t border-slate-100 min-w-0 max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  Insumos y Refacciones Empleadas
                </h4>
                <p className="text-[11px] text-slate-500">
                  Registra piezas, partes, fluidos y consumibles utilizados para el costeo de la cotización formal.
                </p>
              </div>

              <button
                onClick={() => setShowAddPart(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1 self-start sm:self-auto shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Pieza</span>
              </button>
            </div>

            {currentOrder.partsUsed.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-2">
                No se han registrado insumos para esta orden todavía.
              </div>
            ) : (
              <>
                {/* Vista móvil: Tarjetas limpias responsivas sin desbordamiento lateral */}
                <div className="sm:hidden space-y-2.5">
                  {currentOrder.partsUsed.map((part) => (
                    <div key={part.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[10px] text-slate-500 block truncate">{part.partNumber}</span>
                          <span className="font-semibold text-slate-800 text-xs block break-words">{part.description}</span>
                        </div>
                        <button
                          onClick={() => removePartUsed(currentOrder.id, part.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg shrink-0 cursor-pointer"
                          title="Eliminar partida"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                        <span className="text-slate-600 font-medium">Cant: <strong className="text-slate-900">{part.quantity}</strong></span>
                        <span className="text-[#040057] font-bold">
                          {part.providedByClient ? 'Cliente ($0.00)' : `$${part.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vista tablet / desktop: Tabla con scroll horizontal interno */}
                <div className="hidden sm:block bg-slate-50 rounded-xl overflow-x-auto border border-slate-200 text-xs max-w-full">
                  <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">No. Parte</th>
                        <th className="p-2.5">Descripción de Refacción</th>
                        <th className="p-2.5 text-center">Cantidad</th>
                        <th className="p-2.5 text-right">Precio Unitario</th>
                        <th className="p-2.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentOrder.partsUsed.map((part) => (
                        <tr key={part.id}>
                          <td className="p-2.5 font-mono text-slate-700">{part.partNumber}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{part.description}</td>
                          <td className="p-2.5 text-center">{part.quantity}</td>
                          <td className="p-2.5 text-right font-medium">
                            {part.providedByClient ? 'Por Cliente ($0.00)' : `$${part.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => removePartUsed(currentOrder.id, part.id)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* BOTÓN DE ENVÍO A REVISIÓN ADMINISTRATIVA */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 min-w-0">
            <div className="text-xs text-slate-500 min-w-0 text-center sm:text-left">
              {currentOrder.status === 'evidencias_en_revision' ? (
                <span className="text-indigo-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  Evidencias enviadas a revisión. En espera del dictamen de Gerencia Administrativa.
                </span>
              ) : (
                <span>Asegúrate de incluir fotos de las 3 fases antes de remitir a validación.</span>
              )}
            </div>

            {currentOrder.status === 'en_diagnostico_trabajo' && (
              <button
                onClick={() => submitEvidencesForReview(currentOrder.id)}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2 text-center"
              >
                <Send className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-center sm:text-left break-words">Notificar Término y Enviar a Revisión Administrativa (Paso D → E)</span>
              </button>
            )}
          </div>

          {/* SECCIÓN: LIBERACIÓN FÍSICA DE LA UNIDAD */}
          <div className="mt-6 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-3 min-w-0 max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 font-bold text-sm text-[#040057] min-w-0">
                <Key className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="break-words">Liberación Física de la Unidad (Entrega a Operador / Chofer)</span>
              </div>

              {currentOrder.physicalReleaseDate ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 self-start sm:self-auto shrink-0">
                  <ShieldCheck className="w-4 h-4" /> Unidad Entregada
                </span>
              ) : currentOrder.status === 'liberacion_autorizada' ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 animate-pulse self-start sm:self-auto shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Autorizado por Gerencia
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold self-start sm:self-auto shrink-0">
                  Bloqueado: Requiere Autorización
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600">
              Regla de seguridad: La unidad solo puede ser liberada físicamente y entregada al chofer 
              <strong> tras recibir la validación y autorización explícita de Gerencia Administrativa</strong>.
            </p>

            {currentOrder.physicalReleaseDate ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div>✓ Entrega completada por: <strong>{currentOrder.releasedBy}</strong></div>
                <div>✓ Recibido por el operador: <strong>{currentOrder.receivedByDriver}</strong></div>
                <div>✓ Fecha y hora: {new Date(currentOrder.physicalReleaseDate).toLocaleString('es-MX')}</div>
              </div>
            ) : currentOrder.status === 'liberacion_autorizada' ? (
              <button
                onClick={() => setShowReleaseModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4 shrink-0" />
                <span>Ejecutar Liberación Física de la Unidad</span>
              </button>
            ) : (
              <div className="text-xs text-slate-400 italic">
                El botón de liberación se habilitará de forma automática en cuanto Gerencia Administrativa apruebe las evidencias en el Paso E.
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL PARA INICIAR OS */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-[#040057] mb-1">
              Apertura de Orden de Servicio (Paso C)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Registra el diagnóstico inicial y la hora de inicio de labores en sitio o taller.
            </p>

            <form onSubmit={handleStartWork} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Diagnóstico Técnico Inicial *
                </label>
                <textarea
                  required
                  rows={3}
                  value={initialDiagnosisText}
                  onChange={(e) => setInitialDiagnosisText(e.target.value)}
                  placeholder="Describe el hallazgo físico en sitio: componentes dañados, lecturas de presión, códigos de escáner..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#040057] text-white font-bold shadow-xs"
                >
                  Registrar Hora e Iniciar Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA CARGAR EVIDENCIA FOTOGRÁFICA (Cámara móvil, galería, 1 a 15 fotos) */}
      {showEvidenceCaptureModal && currentOrder && (
        <EvidenceCaptureModal
          isOpen={showEvidenceCaptureModal}
          onClose={() => setShowEvidenceCaptureModal(false)}
          order={currentOrder}
          initialPhase={captureInitialPhase}
          onSave={handleSaveBatchEvidences}
        />
      )}

      {/* MODAL LIGHTBOX PARA VISUALIZACIÓN EN TAMAÑO COMPLETO */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn" 
          onClick={() => setLightboxPhoto(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[92vh] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3.5 bg-black/60 flex items-center justify-between text-white shrink-0">
              <div className="min-w-0 pr-4">
                <span className="font-bold text-sm block truncate">{lightboxPhoto.title}</span>
                <span className="text-[11px] text-slate-300">
                  Fase: {lightboxPhoto.phase === 'antes' ? '1. Antes' : '2. Correctivo realizado'} • {new Date(lightboxPhoto.timestamp).toLocaleString('es-MX')}
                </span>
              </div>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white cursor-pointer"
                title="Cerrar vista previa"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-3 bg-black">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
            {lightboxPhoto.notes && (
              <div className="p-3 bg-slate-950 text-slate-200 text-xs border-t border-slate-800">
                <strong className="text-blue-300">Notas de inspección: </strong>
                <span>{lightboxPhoto.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR INSUMO / REFACCIÓN */}
      {showAddPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-[#040057] mb-1">
              Registrar Insumo o Refacción Utilizada
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ingresa los datos de las piezas instaladas para costeo en la orden.
            </p>

            <form onSubmit={handleAddPartSubmit} className="space-y-4 text-xs">
              {/* Selector del Catálogo de Servicios */}
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1">
                <span className="font-bold text-[#040057] text-[11px] block">
                  ⚡ Seleccionar del Catálogo de Servicios y Refacciones
                </span>
                <select
                  onChange={(e) => {
                    const srv = services.find(s => s.id === e.target.value);
                    if (srv) {
                      setPartNumber(srv.code);
                      setPartDescription(srv.name);
                      setPartPrice(srv.basePrice);
                    }
                  }}
                  defaultValue=""
                  className="w-full px-2.5 py-1.5 rounded-lg border border-blue-300 bg-white text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Elige servicio para no capturar a mano --</option>
                  {services.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name} — ${s.basePrice.toLocaleString('es-MX')} MXN
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Número de Parte / Código
                </label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="Ej. VLV-AIR-3030 o dejar en blanco"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descripción de la Refacción *
                </label>
                <input
                  type="text"
                  required
                  value={partDescription}
                  onChange={(e) => setPartDescription(e.target.value)}
                  placeholder="Ej. Cámara de frenos Bendix Tipo 30/30"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={partQuantity}
                    onChange={(e) => setPartQuantity(e.target.value)}
                    placeholder="Ej. 1 JUEGO, 2 PIEZAS, 4..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Precio Unitario ($ MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={partProvidedByClient}
                    value={partPrice}
                    onChange={(e) => setPartPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057] disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Posición en la Unidad (Opcional)
                  </label>
                  <input
                    type="text"
                    value={partPosition}
                    onChange={(e) => setPartPosition(e.target.value)}
                    placeholder="Ej. POS 3y4, POS 5y6..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={partProvidedByClient}
                      onChange={(e) => {
                        setPartProvidedByClient(e.target.checked);
                        if (e.target.checked) setPartPrice(0);
                      }}
                      className="w-4 h-4 text-[#040057] rounded"
                    />
                    <span>Proporcionada por el Cliente ($0.00)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPart(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#040057] text-white font-bold shadow-xs"
                >
                  Agregar a la Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DEL REPORTE TÉCNICO OFICIAL */}
      {showReportFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-[#040057] text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Llenar Formato: REPORTE TÉCNICO {currentOrder.reportNumber || '023'}</h3>
                <p className="text-xs text-blue-200">Ficha técnica detallada, series, odómetro y servicio realizado</p>
              </div>
              <button onClick={() => setShowReportFormModal(false)} className="text-slate-300 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveReportData} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Tipo de Servicio */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-2 uppercase text-[11px]">
                  1. Servicio Solicitado *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer font-bold ${
                    reportMaintenanceNature === 'correctivo' ? 'bg-[#040057] text-white border-[#040057]' : 'bg-white text-slate-800'
                  }`}>
                    <input
                      type="radio"
                      name="maintNature"
                      checked={reportMaintenanceNature === 'correctivo'}
                      onChange={() => setReportMaintenanceNature('correctivo')}
                      className="hidden"
                    />
                    <span>[X] CORRECTIVO</span>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer font-bold ${
                    reportMaintenanceNature === 'preventivo' ? 'bg-[#040057] text-white border-[#040057]' : 'bg-white text-slate-800'
                  }`}>
                    <input
                      type="radio"
                      name="maintNature"
                      checked={reportMaintenanceNature === 'preventivo'}
                      onChange={() => setReportMaintenanceNature('preventivo')}
                      className="hidden"
                    />
                    <span>[ ] PREVENTIVO</span>
                  </label>
                </div>
              </div>

              {/* Inspección preventiva y Operador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Inspección Preventiva (Falla Inicial) *
                  </label>
                  <input
                    type="text"
                    required
                    value={reportPreventiveNotes}
                    onChange={(e) => setReportPreventiveNotes(e.target.value)}
                    placeholder="Ej. UNIDAD PRESENTA FALLA EN FRENOS, FALTA DE TUERCAS"
                    className="w-full px-3 py-2 border rounded-lg uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Usuario / Operador en Sitio *
                  </label>
                  <input
                    type="text"
                    required
                    value={reportUserOperator}
                    onChange={(e) => setReportUserOperator(e.target.value)}
                    placeholder="Ej. OMAR BALDERAS"
                    className="w-full px-3 py-2 border rounded-lg uppercase"
                  />
                </div>
              </div>

              {/* Ficha técnica del equipo (Series y odómetro) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-[#040057] uppercase text-[11px] block">
                  2. Ficha Técnica del Equipo y Conjunto Mecánico
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Número de Serie de Chasis (VIN) *
                    </label>
                    <input
                      type="text"
                      required
                      value={reportChassisSerial}
                      onChange={(e) => setReportChassisSerial(e.target.value)}
                      placeholder="Ej. LA83J1PK5SA100693"
                      className="w-full px-3 py-2 border rounded-lg font-mono uppercase bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Odómetro / Horómetro Actual *
                    </label>
                    <input
                      type="text"
                      required
                      value={reportOdometer}
                      onChange={(e) => setReportOdometer(e.target.value)}
                      placeholder="Ej. 130618 KM"
                      className="w-full px-3 py-2 border rounded-lg uppercase bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Modelo de Motor / Transmisión
                    </label>
                    <input
                      type="text"
                      value={reportEngineModel}
                      onChange={(e) => setReportEngineModel(e.target.value)}
                      placeholder="Ej. WP7NG260E61"
                      className="w-full px-3 py-2 border rounded-lg uppercase bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Serie del Motor / Transmisión
                    </label>
                    <input
                      type="text"
                      value={reportEngineSeries}
                      onChange={(e) => setReportEngineSeries(e.target.value)}
                      placeholder="Ej. 1625A000221"
                      className="w-full px-3 py-2 border rounded-lg font-mono uppercase bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Servicio Realizado Detallado */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Servicio Realizado Detallado *
                  </label>
                  <span className="text-[10px] text-slate-400">Incluye posiciones (POS 3y4, POS 5y6, etc.)</span>
                </div>

                {/* Autollenado desde Catálogo */}
                <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-200">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-bold text-[#040057]">
                    <span>⚡ Insertar Servicio desde Catálogo:</span>
                    <span className="text-[10px] text-slate-500 font-normal">Autocompleta descripción</span>
                  </div>
                  <select
                    onChange={(e) => {
                      const srv = services.find(s => s.id === e.target.value);
                      if (srv) {
                        const addition = `CORRECTIVO REALIZADO: ${srv.name}. ${srv.description}`;
                        setReportWorkDetail(prev => prev ? `${prev}\n\n• ${addition}` : addition);
                      }
                    }}
                    defaultValue=""
                    className="w-full px-2 py-1 rounded border border-indigo-300 bg-white text-xs text-slate-800"
                  >
                    <option value="">-- Seleccionar servicio ofrecido para insertar --</option>
                    {services.filter(s => s.isActive).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  rows={4}
                  required
                  value={reportWorkDetail}
                  onChange={(e) => setReportWorkDetail(e.target.value)}
                  placeholder="Ej. CORRECTIVO REALIZADO: se brinda servicio de rescate/asistencia vial, se reemplazan balatas (POS 3y4) y (POS 5y6) (PROPORCIONADAS POR CLIENTE), se instalan los mismos tambores (no tenían daño), se reemplaza matraca de freno (POS 3y4) y (POS 5y6), se reemplaza sensor MAT y sensor MAP, se realiza escaneo y reestablecimiento de parámetros, se instalan llantas (POS 3y4) y (POS 5y6), y se instalan 4 tuercas UNEMON (POS 5y6) y 4 tuercas UNEMON (POS 3y4)."
                  className="w-full px-3 py-2 border rounded-lg uppercase text-xs leading-relaxed"
                />
              </div>

              {/* Firma del técnico */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Firma / Nombre del Técnico Responsable *
                </label>
                <input
                  type="text"
                  required
                  value={reportTechSignature}
                  onChange={(e) => setReportTechSignature(e.target.value)}
                  placeholder="Ej. Carlos Mendoza - Técnico Titular"
                  className="w-full px-3 py-2 border rounded-lg font-serif italic"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowReportFormModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold shadow-xs"
                >
                  Guardar Formato de Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA IMPRESA DEL REPORTE */}
      {showReportPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
            <div className="p-4 bg-[#040057] text-white flex justify-between items-center print:hidden">
              <div className="font-bold text-sm">Vista Previa: REPORTE TÉCNICO {currentOrder.reportNumber || '023'}</div>
              <button onClick={() => setShowReportPreviewModal(false)} className="text-slate-300 hover:text-white">✕</button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              <TechnicalReportDocument order={currentOrder} />
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end print:hidden">
              <button
                onClick={() => setShowReportPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-semibold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ACLARACIÓN / CORRECCIÓN DE EVIDENCIAS (Paso F → D) */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-rose-800 mb-1">
              Aclaración y Reenvío de Evidencias a Gerencia
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Indica cómo se atendieron las observaciones de la administración.
            </p>

            <form onSubmit={handleResubmitCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Explicación de las Correcciones Realizadas *
                </label>
                <textarea
                  required
                  rows={4}
                  value={correctionExplanation}
                  onChange={(e) => setCorrectionExplanation(e.target.value)}
                  placeholder="Ej. Se agregaron 2 fotos adicionales con el manómetro marcando 120 PSI y foto de la placa de identificación del retén nuevo..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
                >
                  Reenviar a Gerencia (Paso F → D)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE LIBERACIÓN FÍSICA */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-emerald-800 mb-1">
              Registro de Liberación y Entrega Física
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Registra a la persona que retira la unidad autorizada.
            </p>

            <form onSubmit={handleConfirmRelease} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre del Técnico que Entrega *
                </label>
                <input
                  type="text"
                  required
                  value={releasedByName}
                  onChange={(e) => setReleasedByName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre y Firma del Operador / Chofer que Recibe la Unidad *
                </label>
                <input
                  type="text"
                  required
                  value={receivedByDriverName}
                  onChange={(e) => setReceivedByDriverName(e.target.value)}
                  placeholder="Ej. Operador Miguel Ángel Torres (Identificación INE)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReleaseModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Firmar Entrega y Liberar Unidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
