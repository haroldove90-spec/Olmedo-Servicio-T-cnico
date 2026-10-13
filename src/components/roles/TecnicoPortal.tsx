import React, { useState, useEffect, useRef } from 'react';
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
  Lock,
  Gauge,
  Fuel,
  Sparkles,
  Bell,
  Layers,
  Search,
  Columns,
  Check,
  CheckSquare,
  Edit3,
  MessageSquare,
  Image as ImageIcon,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, EvidencePhoto, PartUsed, RepairLog } from '../../types';
import { TechnicalReportDocument } from '../common/TechnicalReportDocument';
import { LiveCameraModal } from '../common/LiveCameraModal';
import { compressImageFile } from '../../utils/imageUtils';

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
    addRepairLog,
    updateRepairLog,
    removeRepairLog,
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

  // Evidence upload state (Inline sin ventana flotante)
  const [techEvidencePhase, setTechEvidencePhase] = useState<'antes' | 'correctivo_realizado'>('antes');
  const [draftEvidences, setDraftEvidences] = useState<Array<{
    id: string;
    url: string;
    title: string;
    notes: string;
    adminComments?: string;
  }>>([]);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [activeDraftIdxForCamera, setActiveDraftIdxForCamera] = useState<number | null>(null);
  const techCameraInputRef = useRef<HTMLInputElement | null>(null);
  const techGalleryInputRef = useRef<HTMLInputElement | null>(null);
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

  // Reparaciones registradas por el técnico
  const [showAddRepairModal, setShowAddRepairModal] = useState(false);
  const [repairTitle, setRepairTitle] = useState('');
  const [repairDescription, setRepairDescription] = useState('');
  const [repairStatus, setRepairStatus] = useState<'pendiente' | 'en_proceso' | 'terminado'>('en_proceso');
  const [editingRepairId, setEditingRepairId] = useState<string | null>(null);

  // Modal Comparativo Lado a Lado (Antes vs Después)
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Búsqueda en módulo de Unidades Asignadas
  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');

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

  // Evidencias subidas por el Jefe de Taller en recepción
  const jefeTallerEvidences = currentOrder?.evidences.filter(e => 
    e.uploadedBy === 'jefe_taller' || 
    e.commentAuthor?.toLowerCase().includes('jefe') ||
    e.notes?.toLowerCase().includes('recepción') ||
    e.notes?.toLowerCase().includes('recepcion') ||
    e.notes?.toLowerCase().includes('ingreso') ||
    e.title?.toLowerCase().includes('recepción') ||
    e.title?.toLowerCase().includes('ingreso') ||
    e.id.includes('recep')
  ) || [];

  // Evidencias subidas por el Técnico durante el servicio
  const tecnicoEvidences = currentOrder?.evidences.filter(e => 
    !jefeTallerEvidences.some(je => je.id === e.id)
  ) || [];

  // Filtro de fases según la nueva regla (1. Antes y 2. Correctivo realizado)
  const antesEvidences = currentOrder?.evidences.filter(e => e.phase === 'antes') || [];
  const correctivoEvidences = currentOrder?.evidences.filter(e => 
    e.phase === 'correctivo_realizado' || e.phase === 'durante' || e.phase === 'despues'
  ) || [];

  // Handlers para captura de evidencias inline del técnico
  const handleTriggerMobileCamera = (draftIdx?: number) => {
    if (draftIdx !== undefined && draftIdx < draftEvidences.length) {
      setActiveDraftIdxForCamera(draftIdx);
    } else {
      const newId = `tech-draft-${Date.now()}`;
      setDraftEvidences(prev => [
        ...prev,
        {
          id: newId,
          url: '',
          title: techEvidencePhase === 'antes' ? `Inspección de componente dañado #${prev.length + 1}` : `Correctivo y pieza montada #${prev.length + 1}`,
          notes: '',
        }
      ]);
      setActiveDraftIdxForCamera(draftEvidences.length);
    }
    setIsLiveCameraOpen(true);
  };

  const handleLiveCameraCaptured = (dataUrl: string) => {
    if (activeDraftIdxForCamera !== null && activeDraftIdxForCamera < draftEvidences.length) {
      setDraftEvidences(prev => prev.map((item, idx) => 
        idx === activeDraftIdxForCamera ? { ...item, url: dataUrl } : item
      ));
    } else {
      setDraftEvidences(prev => [
        ...prev,
        {
          id: `tech-draft-${Date.now()}`,
          url: dataUrl,
          title: techEvidencePhase === 'antes' ? `Inspección de componente #${prev.length + 1}` : `Correctivo concluido #${prev.length + 1}`,
          notes: '',
        }
      ]);
    }
    setIsLiveCameraOpen(false);
    setActiveDraftIdxForCamera(null);
  };

  const handleNativeCameraFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i]);
        if (activeDraftIdxForCamera !== null && i === 0 && activeDraftIdxForCamera < draftEvidences.length) {
          setDraftEvidences(prev => prev.map((item, idx) => 
            idx === activeDraftIdxForCamera ? { ...item, url: compressed } : item
          ));
        } else {
          setDraftEvidences(prev => [
            ...prev,
            {
              id: `tech-draft-${Date.now()}-${i}`,
              url: compressed,
              title: techEvidencePhase === 'antes' ? `Inspección de componente #${prev.length + 1}` : `Correctivo realizado #${prev.length + 1}`,
              notes: '',
            }
          ]);
        }
      }
    } catch (err: any) {
      alert(`Error al procesar la fotografía: ${err.message || 'Intente de nuevo'}`);
    } finally {
      if (e.target) e.target.value = '';
      setActiveDraftIdxForCamera(null);
    }
  };

  const handleAddNewDraftEvidence = () => {
    const num = draftEvidences.length + 1;
    setDraftEvidences(prev => [
      ...prev,
      {
        id: `tech-draft-${Date.now()}-${num}`,
        url: '',
        title: techEvidencePhase === 'antes' ? `Evidencia de daño #${num}` : `Evidencia de reparación #${num}`,
        notes: '',
      }
    ]);
  };

  const handleRemoveDraftEvidence = (index: number) => {
    setDraftEvidences(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateDraftEvidence = (index: number, field: 'title' | 'notes' | 'adminComments', value: string) => {
    setDraftEvidences(prev => prev.map((item, idx) => 
      idx === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveDraftEvidencesToOrder = () => {
    if (!currentOrder) return;
    const validDrafts = draftEvidences.filter(d => d.url.trim().length > 0 && d.title.trim().length > 0);
    if (validDrafts.length === 0) {
      alert('⚠️ Por favor toma o sube al menos 1 fotografía con su título antes de guardar.');
      return;
    }

    const batch: Omit<EvidencePhoto, 'id' | 'timestamp'>[] = validDrafts.map(d => ({
      phase: techEvidencePhase,
      url: d.url,
      title: d.title.trim(),
      notes: d.notes.trim() || undefined,
      adminComments: d.adminComments?.trim() || undefined,
      uploadedBy: 'tecnico',
      uploaderName: currentOrder.assignedTechnicianName || 'Técnico de Taller',
      commentAuthor: currentOrder.assignedTechnicianName || 'Técnico de Taller',
      commentUpdatedAt: new Date().toISOString(),
    }));

    addBatchEvidences(currentOrder.id, batch);
    setDraftEvidences([]);
  };

  const handleSubmitForReview = () => {
    if (!currentOrder) return;
    if (antesEvidences.length === 0) {
      alert('⚠️ Paso 1 Requerido: Debes registrar al menos 1 evidencia fotográfica en "1. Antes" antes de enviar a revisión.');
      return;
    }
    if (correctivoEvidences.length === 0) {
      alert('⚠️ Paso 2 Requerido: Debes registrar al menos 1 evidencia fotográfica en "2. Correctivo realizado" antes de enviar a revisión.');
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
    setTechEvidencePhase(phase);
    // Asegurar que haya al menos 1 tarjeta para trabajar
    if (draftEvidences.length === 0) {
      handleAddNewDraftEvidence();
    }
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

  // Handlers para el registro de reparaciones por el técnico
  const handleSaveRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !repairTitle.trim()) return;

    if (editingRepairId) {
      updateRepairLog(currentOrder.id, editingRepairId, {
        title: repairTitle.trim(),
        description: repairDescription.trim(),
        status: repairStatus,
        completedAt: repairStatus === 'terminado' ? new Date().toISOString() : undefined,
      });
    } else {
      addRepairLog(currentOrder.id, {
        title: repairTitle.trim(),
        description: repairDescription.trim(),
        status: repairStatus,
        completedAt: repairStatus === 'terminado' ? new Date().toISOString() : undefined,
        technicianName: currentOrder.assignedTechnicianName || 'Técnico',
      });
    }

    setShowAddRepairModal(false);
    setRepairTitle('');
    setRepairDescription('');
    setRepairStatus('en_proceso');
    setEditingRepairId(null);
  };

  const handleOpenAddRepair = () => {
    setEditingRepairId(null);
    setRepairTitle('');
    setRepairDescription('');
    setRepairStatus('en_proceso');
    setShowAddRepairModal(true);
  };

  const handleOpenEditRepair = (repair: RepairLog) => {
    setEditingRepairId(repair.id);
    setRepairTitle(repair.title);
    setRepairDescription(repair.description);
    setRepairStatus(repair.status);
    setShowAddRepairModal(true);
  };

  const handleToggleRepairStatus = (repair: RepairLog) => {
    if (!currentOrder) return;
    const nextStatus = repair.status === 'terminado' ? 'en_proceso' : 'terminado';
    updateRepairLog(currentOrder.id, repair.id, {
      status: nextStatus,
      completedAt: nextStatus === 'terminado' ? new Date().toISOString() : undefined,
    });
  };

  const newAssignedOrders = myAssignedOrders.filter(o => o.status === 'asignado');

  const filteredAssignedUnits = myAssignedOrders.filter(o => {
    const term = assignedSearchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      o.folio.toLowerCase().includes(term) ||
      (o.reportNumber || '').toLowerCase().includes(term) ||
      o.vehicle.plates.toLowerCase().includes(term) ||
      o.vehicle.economicNumber.toLowerCase().includes(term) ||
      (o.vehicle.brand || '').toLowerCase().includes(term) ||
      (o.vehicle.model || '').toLowerCase().includes(term) ||
      (o.clientName || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-24 lg:pb-8 w-full max-w-full min-w-0 overflow-x-hidden">
      
      {/* BANNER DE NOTIFICACIÓN DE NUEVAS UNIDADES ASIGNADAS */}
      {newAssignedOrders.length > 0 && (
        <div className="bg-gradient-to-r from-[#040057] via-indigo-900 to-[#070085] text-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-400 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slideIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider">
                  ¡Nueva Unidad Asignada!
                </span>
                <span className="text-xs text-blue-200">Recepción de Taller</span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white mt-1">
                Tienes {newAssignedOrders.length} {newAssignedOrders.length === 1 ? 'unidad asignada pendiente' : 'unidades asignadas pendientes'} de iniciar labores
              </h3>
              <p className="text-xs text-blue-200">
                Unidad {newAssignedOrders[0].vehicle.type.toUpperCase()} ({newAssignedOrders[0].vehicle.plates}) • Folio: {newAssignedOrders[0].folio} • Reporte Técnico: {newAssignedOrders[0].reportNumber || '023'}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedOrderId(newAssignedOrders[0].id);
              setActiveModule('unidades_asignadas');
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
          >
            <Truck className="w-4 h-4" />
            <span>Ver Unidades Asignadas</span>
          </button>
        </div>
      )}

      {/* Encabezado del Portal del Técnico */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs max-w-full min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057] truncate">
                Técnico
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Unidades Asignadas • Registro de Reparaciones • Evidencias Antes y Después • Entrega de Unidades
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#040057] border border-blue-200 text-xs font-bold flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              {myAssignedOrders.length} Unidades Asignadas
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Pestañas de Navegación del Técnico */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveModule('unidades_asignadas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeModule === 'unidades_asignadas' || activeModule === 'mis_tareas' || activeModule === 'inicio'
              ? 'bg-[#040057] text-white shadow-xs'
              : 'text-slate-700 hover:bg-white'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-400" />
          <span>Unidades Asignadas ({myAssignedOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('evidencias')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeModule === 'evidencias'
              ? 'bg-[#040057] text-white shadow-xs'
              : 'text-slate-700 hover:bg-white'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>Reparaciones y Evidencias de la Orden</span>
          {currentOrder && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#040057] text-[10px] font-extrabold">
              {currentOrder.folio}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('liberacion')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeModule === 'liberacion'
              ? 'bg-[#040057] text-white shadow-xs'
              : 'text-slate-700 hover:bg-white'
          }`}
        >
          <Key className="w-4 h-4 text-emerald-400" />
          <span>Liberación Física</span>
        </button>
      </div>

      {/* MÓDULO 1: UNIDADES ASIGNADAS (DASHBOARD COMPLETO) */}
      {(activeModule === 'unidades_asignadas' || activeModule === 'mis_tareas') && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#040057] flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>Unidades Asignadas a tu Cuadrilla</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona la unidad para abrir la orden de recepción e ir registrando los avances, reparaciones y evidencias fotográficas.
              </p>
            </div>

            <div className="relative sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={assignedSearchTerm}
                onChange={(e) => setAssignedSearchTerm(e.target.value)}
                placeholder="Buscar placas, eco, cliente, folio..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#040057]"
              />
            </div>
          </div>

          {filteredAssignedUnits.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-2">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Sin unidades asignadas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay unidades registradas con los filtros de búsqueda o el jefe de taller aún no ha asignado vehículos a tu cargo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignedUnits.map((order) => {
                const brand = order.vehicle.brand || order.vehicle.brandModel?.split(' ')[0] || 'Kenworth';
                const model = order.vehicle.model || order.vehicle.brandModel?.split(' ').slice(1).join(' ') || '';
                const fuel = order.vehicle.fuelLevel ?? 50;
                const km = order.vehicle.mileage || order.vehicle.odometerReading || 'Sin registrar';
                const repCount = (order.repairs || []).length;
                const photoCount = order.evidences.length;
                const isSelected = order.id === currentOrder?.id;

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border-2 shadow-xs transition space-y-3.5 ${
                      isSelected ? 'border-[#040057] ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-[#040057]">{order.folio}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#040057] font-bold">
                          RT {order.reportNumber || '023'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          order.status === 'asignado' ? 'bg-amber-100 text-amber-800' :
                          order.status === 'en_diagnostico_trabajo' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'evidencias_rechazadas' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        order.priority === 'urgente' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {order.priority}
                      </span>
                    </div>

                    {/* Unidad y Ficha */}
                    <div className="text-xs space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-extrabold text-sm text-[#040057]">
                          {brand} {model}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {order.vehicle.type}
                        </span>
                      </div>
                      <div className="text-slate-700">
                        Placas: <strong className="text-slate-900">{order.vehicle.plates}</strong> • Económico: <strong className="text-slate-900">{order.vehicle.economicNumber}</strong>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Cliente: <strong>{order.clientName}</strong> ({order.clientContact})
                      </div>
                    </div>

                    {/* Lecturas visuales: Odómetro y Nivel de Combustible con Gráfica */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                          Kilometraje
                        </span>
                        <div className="font-extrabold text-[#040057] font-mono text-xs mt-0.5">
                          {km}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                          <span className="flex items-center gap-1">
                            <Fuel className="w-3.5 h-3.5 text-amber-600" />
                            Combustible
                          </span>
                          <span className="font-mono text-[#040057]">{fuel}% {order.vehicle.fuelType || 'diésel'}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5 flex">
                          <div 
                            className={`h-full rounded-full ${fuel < 25 ? 'bg-rose-500' : fuel < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${fuel}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Falla inicial / inspección preventiva */}
                    <div className="text-xs p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/70 text-slate-800">
                      <span className="font-bold text-amber-950">Motivo / Falla: </span>
                      <span className="line-clamp-2">{order.preventiveInspectionNotes || order.vehicle.failureDescription}</span>
                    </div>

                    {/* Conteo de avances */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="font-semibold text-slate-700">{repCount} reparaciones en bitácora</span>
                      <span className="font-semibold text-slate-700">{photoCount} fotos de evidencias</span>
                    </div>

                    {/* Botón Abrir Orden */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setActiveModule('evidencias');
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                    >
                      <Wrench className="w-4 h-4 text-emerald-400" />
                      <span>Abrir Orden de Recepción y Comenzar Reparaciones</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MÓDULO 2: ESPACIO DE TRABAJO DE LA ORDEN ACTIVA (REPARACIONES Y EVIDENCIAS) */}
      {(activeModule === 'evidencias' || activeModule === 'inicio') && (
        <div className="space-y-5">
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
                <button
                  type="button"
                  onClick={() => setActiveModule('unidades_asignadas')}
                  className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ver Todas las Unidades</span>
                </button>
              </div>
            </div>
          )}


          {/* DETALLE DE ORDEN Y APERTURA DE OS (Paso C) */}
          {currentOrder && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-5 min-w-0 max-w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-extrabold text-[#040057]">{currentOrder.folio}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#040057] font-semibold">
                      {currentOrder.serviceType.toUpperCase()}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold">
                      REPORTE TÉCNICO {currentOrder.reportNumber || '023'}
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

              {/* Lectura de Tablero en Ficha: Kilometraje y Combustible */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Odómetro / Kilometraje al Ingreso</span>
                    <span className="font-extrabold text-[#040057] text-sm font-mono">
                      {currentOrder.vehicle.mileage || currentOrder.vehicle.odometerReading || 'Sin registrar'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Nivel de Combustible</span>
                      <span className="font-extrabold text-[#040057] text-xs font-mono">
                        {currentOrder.vehicle.fuelLevel ?? 50}% {currentOrder.vehicle.fuelType || 'diésel'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1 flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          (currentOrder.vehicle.fuelLevel ?? 50) < 25 ? 'bg-rose-500' : (currentOrder.vehicle.fuelLevel ?? 50) < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${currentOrder.vehicle.fuelLevel ?? 50}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnóstico técnico registrado */}
              {currentOrder.initialDiagnosis && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs min-w-0">
                  <span className="font-bold text-[#040057]">Diagnóstico Técnico en Sitio / Taller: </span>
                  <span className="text-slate-800 break-words">{currentOrder.initialDiagnosis}</span>
                </div>
              )}

              {/* SECCIÓN DE BITÁCORA Y REGISTRO DE REPARACIONES (NUEVO REQUERIMIENTO) */}
              <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border-2 border-slate-200 space-y-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-indigo-600 shrink-0" />
                      <h3 className="font-extrabold text-sm sm:text-base text-[#040057] truncate">
                        Bitácora de Reparaciones y Cambios Realizados
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#040057] text-xs font-bold shrink-0">
                        {(currentOrder.repairs || []).length} { (currentOrder.repairs || []).length === 1 ? 'partida' : 'partidas' }
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Registra cada una de las reparaciones, ajustes mecánicos y cambios efectuados a la unidad. Todos los cambios se guardan en tiempo real en la orden de recepción.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddRepair}
                    className="px-4 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Plus className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    <span>Registrar Reparación</span>
                  </button>
                </div>

                {/* Listado de reparaciones */}
                {(currentOrder.repairs || []).length === 0 ? (
                  <div className="p-6 text-center rounded-xl border-2 border-dashed border-slate-300 bg-white space-y-2">
                    <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="font-bold text-slate-700 text-xs">Sin reparaciones registradas todavía</div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Comienza registrando las reparaciones que vayas realizando a la unidad (ej. reemplazo de balatas, rectificado, cambio de mangueras, etc.).
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddRepair}
                      className="mt-1 px-4 py-1.5 rounded-lg bg-blue-50 text-[#040057] border border-blue-200 hover:bg-blue-100 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Agregar Primera Reparación</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(currentOrder.repairs || []).map((rep) => {
                      const isCompleted = rep.status === 'terminado';
                      return (
                        <div
                          key={rep.id}
                          className={`p-4 rounded-xl border transition space-y-2 ${
                            isCompleted 
                              ? 'bg-emerald-50/40 border-emerald-200' 
                              : rep.status === 'en_proceso' 
                              ? 'bg-blue-50/40 border-blue-200' 
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                                isCompleted 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : rep.status === 'en_proceso' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                                {rep.status === 'terminado' ? 'Terminada' : rep.status === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                              </span>
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                {rep.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleToggleRepairStatus(rep)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                  isCompleted 
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                                title={isCompleted ? 'Marcar en proceso' : 'Marcar como terminada'}
                              >
                                <Check className="w-3 h-3" />
                                <span>{isCompleted ? 'Reabrir' : 'Completar'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditRepair(rep)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                                title="Editar reparación"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeRepairLog(currentOrder.id, rep.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                title="Eliminar reparación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {rep.description}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <span>Registrado: {new Date(rep.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            {rep.completedAt && (
                              <span className="text-emerald-700 font-semibold">
                                Concluido el: {new Date(rep.completedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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
                      className="px-3 py-1.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
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

              {/* Inputs ocultos de archivo y disparador nativo de cámara móvil */}
              <input
                type="file"
                ref={techCameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleNativeCameraFileChange}
                className="hidden"
              />
              <input
                type="file"
                ref={techGalleryInputRef}
                accept="image/*"
                multiple
                onChange={handleNativeCameraFileChange}
                className="hidden"
              />

              {/* SECCIÓN 1: EVIDENCIAS SUBIDAS POR EL JEFE DE TALLER (RECEPCIÓN E INGRESO) */}
              <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border-2 border-slate-200/90 space-y-3.5 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#040057] text-sm sm:text-base flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                      <span>Evidencias Subidas por el Jefe de Taller (Recepción e Ingreso)</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#040057] font-bold">
                        {jefeTallerEvidences.length} fotos de recepción
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Fotografías registradas al momento de ingresar la unidad al taller. Las evidencias técnicas del trabajo se suben inmediatamente abajo.
                    </p>
                  </div>
                </div>

                {jefeTallerEvidences.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {jefeTallerEvidences.map((ev, idx) => (
                      <div
                        key={ev.id || idx}
                        className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-2 text-xs min-w-0 hover:border-blue-300 transition"
                      >
                        <div 
                          className="relative group rounded-lg overflow-hidden bg-slate-900 cursor-pointer aspect-video" 
                          onClick={() => setLightboxPhoto(ev)}
                        >
                          <img
                            src={ev.url}
                            alt={ev.title}
                            className="w-full h-full object-contain bg-slate-950 group-hover:scale-102 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Eye className="w-4 h-4" />
                            <span>Ver a tamaño completo</span>
                          </div>
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-bold">
                            Recepción #{idx + 1}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 line-clamp-1 break-words">
                            {ev.title}
                          </div>
                          {ev.notes && (
                            <div className="text-[11px] text-slate-600 line-clamp-2 break-words mt-0.5">
                              {ev.notes}
                            </div>
                          )}
                          {ev.adminComments && (
                            <div className="mt-1.5 p-1.5 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-900 line-clamp-2">
                              <strong>Comentario Admin:</strong> {ev.adminComments}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>{new Date(ev.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                          <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span>Jefe de Taller</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-white/70 text-center text-xs text-slate-500">
                    <p className="font-medium">No se registraron fotografías previas del Jefe de Taller en la recepción de esta unidad.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Puedes iniciar y cargar todas las evidencias técnicas correspondientes en el panel de abajo.</p>
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: SUBIDA DIRECTA DE EVIDENCIAS TÉCNICAS (ABAJO DE LAS DEL JEFE DE TALLER - SIN VENTANA FLOTANTE) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-indigo-200 shadow-xs space-y-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#040057] text-sm sm:text-base flex items-center gap-2">
                      <Camera className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Subir Evidencias Técnicas del Trabajo (Antes y Después)</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                        {tecnicoEvidences.length} fotos del técnico
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Toma fotos directamente con tu dispositivo móvil usando el ícono de cámara y agrega cuantas evidencias requieras con el botón (+).
                    </p>
                  </div>

                  {/* Botón comparador */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCompareModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#040057] border border-indigo-200 text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      title="Comparar evidencias de Antes vs Después lado a lado"
                    >
                      <Columns className="w-4 h-4 text-indigo-600" />
                      <span>Comparar Antes vs Después</span>
                    </button>
                  </div>
                </div>

                {/* Barra de Controles Rápidos: Selector de Fase + Cámara Móvil + Botón (+) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Selector de Fase: 1. Antes vs 2. Después */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        Fase a Subir:
                      </span>
                      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setTechEvidencePhase('antes')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            techEvidencePhase === 'antes'
                              ? 'bg-[#040057] text-white shadow-xs'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span>1. Antes ({tecnicoEvidences.filter(e => e.phase === 'antes').length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTechEvidencePhase('correctivo_realizado')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            techEvidencePhase === 'correctivo_realizado'
                              ? 'bg-[#040057] text-white shadow-xs'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>2. Después / Correctivo ({tecnicoEvidences.filter(e => e.phase !== 'antes').length})</span>
                        </button>
                      </div>
                    </div>

                    {/* Botones de Captura Directa con Cámara del Móvil y Botón (+) */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Botón Principal: Ícono de Cámara para dispositivo móvil */}
                      <button
                        type="button"
                        onClick={() => handleTriggerMobileCamera()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
                        title="Abrir cámara del dispositivo móvil para tomar foto"
                      >
                        <Camera className="w-4 h-4 text-white" />
                        <span>Tomar Foto con Cámara</span>
                      </button>

                      {/* Respaldo disparador nativo de cámara */}
                      <button
                        type="button"
                        onClick={() => techCameraInputRef.current?.click()}
                        className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                        title="Disparador nativo de la cámara del teléfono"
                      >
                        <Camera className="w-4 h-4 text-slate-600" />
                      </button>

                      {/* Botón (+) para agregar más evidencias */}
                      <button
                        type="button"
                        onClick={handleAddNewDraftEvidence}
                        className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#040057] border border-indigo-200 font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                        title="Agregar otra tarjeta de evidencia para capturar o redactar"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar Evidencia (+)</span>
                      </button>

                      {/* Subir desde galería del dispositivo */}
                      <button
                        type="button"
                        onClick={() => techGalleryInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                        title="Subir fotos existentes desde la galería"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Galería</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* FORMULARIO DIRECTO INLINE: Tarjetas de evidencias en borrador listas para guardar */}
                {draftEvidences.length > 0 && (
                  <div className="space-y-3 pt-1 border-t border-indigo-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>Nuevas Evidencias por Guardar ({draftEvidences.length})</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Fase asignada: <strong className="text-[#040057]">{techEvidencePhase === 'antes' ? '1. Antes' : '2. Después / Correctivo'}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {draftEvidences.map((draft, idx) => (
                        <div
                          key={draft.id}
                          className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/20 p-3.5 shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                            <span className="font-extrabold text-[#040057] text-xs flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-[#040057] text-white flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <span>Evidencia #{idx + 1}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftEvidence(idx)}
                              className="text-rose-600 hover:text-rose-800 text-xs font-bold p-1 rounded-lg hover:bg-rose-50 cursor-pointer flex items-center gap-1"
                              title="Descartar esta evidencia"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Quitar</span>
                            </button>
                          </div>

                          {/* Foto o Disparador de Cámara */}
                          <div>
                            {draft.url ? (
                              <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-300 group">
                                <img
                                  src={draft.url}
                                  alt={draft.title}
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute top-2 right-2">
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerMobileCamera(idx)}
                                    className="px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-[11px] font-bold shadow-md flex items-center gap-1 cursor-pointer"
                                  >
                                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Retomar</span>
                                  </button>
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Foto capturada</span>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTriggerMobileCamera(idx)}
                                className="w-full py-6 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
                              >
                                <div className="p-2 rounded-full bg-emerald-600 text-white">
                                  <Camera className="w-5 h-5" />
                                </div>
                                <span>Tocar aquí para tomar foto con la cámara</span>
                              </button>
                            )}
                          </div>

                          {/* Selector rápido del catálogo de servicios */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                              <span className="font-semibold text-slate-700">Autollenar con servicio del catálogo:</span>
                            </div>
                            <select
                              onChange={(e) => {
                                const srv = services.find(s => s.id === e.target.value);
                                if (srv) {
                                  handleUpdateDraftEvidence(idx, 'title', srv.name);
                                  handleUpdateDraftEvidence(idx, 'notes', `${srv.description} [Código: ${srv.code}]`);
                                }
                              }}
                              defaultValue=""
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#040057]"
                            >
                              <option value="">⚡ Seleccionar servicio para autocompletar título...</option>
                              {services.filter(s => s.isActive).map(s => (
                                <option key={s.id} value={s.id}>
                                  [{s.code}] {s.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Título de la Evidencia */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              Título de la Evidencia *
                            </label>
                            <input
                              type="text"
                              value={draft.title}
                              onChange={(e) => handleUpdateDraftEvidence(idx, 'title', e.target.value)}
                              placeholder="Ej. Desgaste en balatas de rueda 3 / Tuercas UNEMON torqueadas"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#040057]"
                            />
                          </div>

                          {/* Comentarios y Notas Técnicas */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              Comentarios y Notas de la Evidencia
                            </label>
                            <textarea
                              rows={2}
                              value={draft.notes}
                              onChange={(e) => handleUpdateDraftEvidence(idx, 'notes', e.target.value)}
                              placeholder="Observación técnica, mediciones, condición encontrada..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#040057]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Botón para Guardar Evidencias en la Orden */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={handleAddNewDraftEvidence}
                        className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-[#040057] font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Otra Evidencia (+)</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDraftEvidences([])}
                          className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                        >
                          Cancelar Borrador
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDraftEvidencesToOrder}
                          className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Guardar {draftEvidences.filter(d => d.url).length} Evidencia(s) en la Orden</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* CUADRÍCULA DE EVIDENCIAS YA REGISTRADAS DE LA ORDEN (1. ANTES Y 2. CORRECTIVO) */}
                <div className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                    
                    {/* COLUMNA 1: 1. ANTES */}
                    <div className="bg-slate-50/90 rounded-2xl p-4 border-2 border-slate-200 space-y-3 min-w-0">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase">
                            1. ANTES (Falla Inicial)
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          antesEvidences.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {antesEvidences.length > 0 ? `✓ ${antesEvidences.length} foto(s)` : '⚠️ Mínimo 1'}
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {antesEvidences.map((ev) => (
                          <div
                            key={ev.id}
                            className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-2 text-xs min-w-0 hover:border-indigo-300 transition"
                          >
                            <div 
                              className="relative group rounded-lg overflow-hidden bg-slate-900 cursor-pointer aspect-video" 
                              onClick={() => setLightboxPhoto(ev)}
                            >
                              <img
                                src={ev.url}
                                alt={ev.title}
                                className="w-full h-full object-contain bg-slate-950 group-hover:scale-102 transition duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="w-4 h-4" />
                                <span>Ver a tamaño completo</span>
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
                                {ev.adminComments && (
                                  <div className="mt-1 p-1.5 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-900">
                                    <strong>Admin:</strong> {ev.adminComments}
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
                              <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                {ev.uploadedBy === 'jefe_taller' ? 'Recepción' : 'Fase 1: Antes'}
                              </span>
                            </div>
                          </div>
                        ))}

                        {antesEvidences.length === 0 && (
                          <div className="p-6 text-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 space-y-2">
                            <Camera className="w-8 h-8 text-amber-600 mx-auto" />
                            <div className="font-bold text-amber-900 text-xs">Sin evidencias de "1. Antes"</div>
                            <p className="text-[11px] text-amber-700 max-w-xs mx-auto">
                              Presiona el botón de cámara para tomar fotos con tu dispositivo móvil.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* COLUMNA 2: 2. CORRECTIVO REALIZADO */}
                    <div className="bg-slate-50/90 rounded-2xl p-4 border-2 border-slate-200 space-y-3 min-w-0">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase">
                            2. CORRECTIVO REALIZADO (Después)
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          correctivoEvidences.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {correctivoEvidences.length > 0 ? `✓ ${correctivoEvidences.length} foto(s)` : 'Opcional / Pendiente'}
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {correctivoEvidences.map((ev) => (
                          <div
                            key={ev.id}
                            className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-2 text-xs min-w-0 hover:border-emerald-300 transition"
                          >
                            <div 
                              className="relative group rounded-lg overflow-hidden bg-slate-900 cursor-pointer aspect-video" 
                              onClick={() => setLightboxPhoto(ev)}
                            >
                              <img
                                src={ev.url}
                                alt={ev.title}
                                className="w-full h-full object-contain bg-slate-950 group-hover:scale-102 transition duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="w-4 h-4" />
                                <span>Ver a tamaño completo</span>
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
                                {ev.adminComments && (
                                  <div className="mt-1 p-1.5 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-900">
                                    <strong>Admin:</strong> {ev.adminComments}
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
                        ))}

                        {correctivoEvidences.length === 0 && (
                          <div className="p-6 text-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                            <div className="font-bold text-emerald-900 text-xs">Sin evidencias de Correctivo</div>
                            <p className="text-[11px] text-emerald-700 max-w-xs mx-auto">
                              Selecciona la fase "2. Después / Correctivo" y toma fotos del trabajo finalizado.
                            </p>
                          </div>
                        )}
                      </div>
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

      {/* Visor de Cámara en Vivo para Dispositivos Móviles (Activado únicamente al disparar foto) */}
      <LiveCameraModal
        isOpen={isLiveCameraOpen}
        onClose={() => {
          setIsLiveCameraOpen(false);
          setActiveDraftIdxForCamera(null);
        }}
        onCapture={handleLiveCameraCaptured}
        title={`Tomar Foto con Cámara Móvil (${techEvidencePhase === 'antes' ? '1. Antes' : '2. Correctivo'})`}
      />

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
            <div className="p-3 bg-slate-950 text-slate-200 text-xs border-t border-slate-800 space-y-1.5">
              {lightboxPhoto.notes && (
                <div>
                  <strong className="text-blue-300">Notas de inspección: </strong>
                  <span>{lightboxPhoto.notes}</span>
                </div>
              )}
              {lightboxPhoto.adminComments && (
                <div className="p-2 bg-amber-950/40 rounded-lg border border-amber-500/40 text-amber-200">
                  <strong className="text-amber-300">Comentario de Administración / Gerencia / Jefe de Taller: </strong>
                  <span>{lightboxPhoto.adminComments}</span>
                  {lightboxPhoto.commentAuthor && (
                    <span className="text-[10px] text-amber-400/80 block mt-0.5">
                      — {lightboxPhoto.commentAuthor}
                    </span>
                  )}
                </div>
              )}
            </div>
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
