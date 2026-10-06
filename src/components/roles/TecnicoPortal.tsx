import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, EvidencePhoto, PartUsed } from '../../types';

export const TecnicoPortal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    orders, 
    startTechnicianWork, 
    addEvidencePhoto, 
    removeEvidencePhoto, 
    addPartUsed, 
    removePartUsed, 
    submitEvidencesForReview, 
    correctAndResubmitEvidences, 
    releaseVehiclePhysical 
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

  // Evidence upload form
  const [evidencePhase, setEvidencePhase] = useState<'antes' | 'durante' | 'despues'>('antes');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [showAddEvidence, setShowAddEvidence] = useState(false);

  // Part used form
  const [partNumber, setPartNumber] = useState('');
  const [partDescription, setPartDescription] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);
  const [partPrice, setPartPrice] = useState(0);
  const [showAddPart, setShowAddPart] = useState(false);

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

  const handleStartWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !initialDiagnosisText.trim()) return;
    startTechnicianWork(currentOrder.id, initialDiagnosisText.trim());
    setShowStartModal(false);
    setInitialDiagnosisText('');
  };

  const handleAddEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !evidenceTitle.trim()) return;

    // Default sample image if empty
    const defaultSamplePhotos = {
      antes: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
      durante: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
      despues: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80',
    };

    addEvidencePhoto(currentOrder.id, {
      phase: evidencePhase,
      title: evidenceTitle.trim(),
      notes: evidenceNotes.trim() || undefined,
      url: evidenceUrl.trim() || defaultSamplePhotos[evidencePhase],
    });

    setEvidenceTitle('');
    setEvidenceNotes('');
    setEvidenceUrl('');
    setShowAddEvidence(false);
  };

  const handleAddPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !partDescription.trim()) return;

    addPartUsed(currentOrder.id, {
      partNumber: partNumber.trim() || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      description: partDescription.trim(),
      quantity: Number(partQuantity) || 1,
      unitPrice: Number(partPrice) || 0,
    });

    setPartNumber('');
    setPartDescription('');
    setPartQuantity(1);
    setPartPrice(0);
    setShowAddPart(false);
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
    <div className="space-y-6 pb-20 lg:pb-8">
      
      {/* Encabezado del Portal del Técnico */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057]">
                App / Portal del Técnico en Campo y Taller
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Apertura de OS • Evidencias Obligatorias (Antes/Durante/Después) • Insumos • Liberación de Unidades
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#040057] border border-blue-200 text-xs font-bold flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              {myAssignedOrders.length} Tareas Asignadas
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Orden Activa */}
      {myAssignedOrders.length > 0 && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trabajando en Orden:</span>
            <select
              value={currentOrder?.id}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-[#040057] text-xs sm:text-sm bg-slate-50 focus:ring-2 focus:ring-[#040057]"
            >
              {myAssignedOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.folio} — {o.vehicle.type.toUpperCase()} ({o.vehicle.plates}) • {o.status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
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
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-xs animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-rose-900">
                Observación Administrativa: Evidencias Rechazadas / Requieren Corrección (Paso F)
              </h3>
              <p className="text-xs text-rose-800 font-medium">
                Gerencia Administrativa ha devuelto esta orden solicitando correcciones o fotos adicionales antes de autorizar la liberación física:
              </p>
              <div className="mt-2 p-3 bg-white rounded-xl border border-rose-200 text-xs font-semibold text-slate-800">
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
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-[#040057]">{currentOrder.folio}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#040057] font-semibold">
                  {currentOrder.serviceType.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Cliente: <strong className="text-slate-800">{currentOrder.clientName}</strong> ({currentOrder.clientContact})
              </div>
            </div>

            {/* Estado de Apertura de OS */}
            <div>
              {currentOrder.status === 'asignado' ? (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 animate-bounce"
                >
                  <Clock className="w-4 h-4" />
                  <span>Abrir Orden de Servicio e Iniciar Trabajo (Paso C)</span>
                </button>
              ) : currentOrder.startTime ? (
                <div className="text-right text-xs">
                  <span className="text-emerald-700 font-bold flex items-center gap-1 justify-end">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Unidad</span>
              <div className="font-bold text-[#040057] text-sm">
                {currentOrder.vehicle.type.toUpperCase()} • Placas: {currentOrder.vehicle.plates}
              </div>
              <div className="text-slate-600">Económico: {currentOrder.vehicle.economicNumber}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Ubicación y Operador</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span className="truncate">{currentOrder.vehicle.location}</span>
              </div>
              <div className="text-slate-500">{currentOrder.vehicle.driverContact || 'Sin chofer reportado'}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Falla Reportada por Cliente</span>
              <p className="text-slate-700 line-clamp-2">{currentOrder.vehicle.failureDescription}</p>
            </div>
          </div>

          {/* Diagnóstico técnico registrado */}
          {currentOrder.initialDiagnosis && (
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs">
              <span className="font-bold text-[#040057]">Diagnóstico Técnico en Sitio / Taller: </span>
              <span className="text-slate-800">{currentOrder.initialDiagnosis}</span>
            </div>
          )}

          {/* SECCIÓN OBLIGATORIA: EVIDENCIAS FOTOGRÁFICAS (Antes, Durante, Después) */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <h3 className="font-bold text-[#040057] text-sm sm:text-base flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  Carga Obligatoria de Evidencias Fotográficas (Paso D)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Captura obligatoria de fotos y notas clasificadas: ANTES (falla inicial), DURANTE (proceso/desarme) y DESPUÉS (reparación concluida).
                </p>
              </div>

              <button
                onClick={() => setShowAddEvidence(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Foto de Evidencia</span>
              </button>
            </div>

            {/* Clasificación en 3 columnas: ANTES / DURANTE / DESPUÉS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* 1. ANTES */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> 1. ANTES
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {currentOrder.evidences.filter(e => e.phase === 'antes').length} fotos
                  </span>
                </div>

                <div className="space-y-2">
                  {currentOrder.evidences.filter(e => e.phase === 'antes').map(ev => (
                    <div key={ev.id} className="bg-white rounded-lg p-2 border border-slate-200 shadow-2xs space-y-1 text-xs">
                      <img src={ev.url} alt={ev.title} className="w-full h-28 object-cover rounded-md" />
                      <div className="font-bold text-slate-800 line-clamp-1">{ev.title}</div>
                      {ev.notes && <div className="text-[11px] text-slate-500 line-clamp-2">{ev.notes}</div>}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                        <span>{new Date(ev.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                        <button
                          onClick={() => removeEvidencePhoto(currentOrder.id, ev.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {currentOrder.evidences.filter(e => e.phase === 'antes').length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs border border-dashed rounded-lg">
                      Sin fotos de fase "Antes"
                    </div>
                  )}
                </div>
              </div>

              {/* 2. DURANTE */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> 2. DURANTE
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {currentOrder.evidences.filter(e => e.phase === 'durante').length} fotos
                  </span>
                </div>

                <div className="space-y-2">
                  {currentOrder.evidences.filter(e => e.phase === 'durante').map(ev => (
                    <div key={ev.id} className="bg-white rounded-lg p-2 border border-slate-200 shadow-2xs space-y-1 text-xs">
                      <img src={ev.url} alt={ev.title} className="w-full h-28 object-cover rounded-md" />
                      <div className="font-bold text-slate-800 line-clamp-1">{ev.title}</div>
                      {ev.notes && <div className="text-[11px] text-slate-500 line-clamp-2">{ev.notes}</div>}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                        <span>{new Date(ev.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                        <button
                          onClick={() => removeEvidencePhoto(currentOrder.id, ev.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {currentOrder.evidences.filter(e => e.phase === 'durante').length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs border border-dashed rounded-lg">
                      Sin fotos de fase "Durante"
                    </div>
                  )}
                </div>
              </div>

              {/* 3. DESPUÉS */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 3. DESPUÉS
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {currentOrder.evidences.filter(e => e.phase === 'despues').length} fotos
                  </span>
                </div>

                <div className="space-y-2">
                  {currentOrder.evidences.filter(e => e.phase === 'despues').map(ev => (
                    <div key={ev.id} className="bg-white rounded-lg p-2 border border-slate-200 shadow-2xs space-y-1 text-xs">
                      <img src={ev.url} alt={ev.title} className="w-full h-28 object-cover rounded-md" />
                      <div className="font-bold text-slate-800 line-clamp-1">{ev.title}</div>
                      {ev.notes && <div className="text-[11px] text-slate-500 line-clamp-2">{ev.notes}</div>}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                        <span>{new Date(ev.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                        <button
                          onClick={() => removeEvidencePhoto(currentOrder.id, ev.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {currentOrder.evidences.filter(e => e.phase === 'despues').length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs border border-dashed rounded-lg">
                      Sin fotos de fase "Después"
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* SECCIÓN DE REFACCIONES E INSUMOS UTILIZADOS */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  Insumos y Refacciones Empleadas
                </h4>
                <p className="text-[11px] text-slate-500">
                  Registra piezas, partes, fluidos y consumibles utilizados para el costeo de la cotización formal.
                </p>
              </div>

              <button
                onClick={() => setShowAddPart(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
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
              <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 text-xs">
                <table className="w-full text-left">
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
                        <td className="p-2.5 text-right font-medium">${part.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
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
            )}
          </div>

          {/* BOTÓN DE ENVÍO A REVISIÓN ADMINISTRATIVA */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {currentOrder.status === 'evidencias_en_revision' ? (
                <span className="text-indigo-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Evidencias enviadas a revisión. En espera del dictamen de Gerencia Administrativa.
                </span>
              ) : (
                <span>Asegúrate de incluir fotos de las 3 fases antes de remitir a validación.</span>
              )}
            </div>

            {currentOrder.status === 'en_diagnostico_trabajo' && (
              <button
                onClick={() => submitEvidencesForReview(currentOrder.id)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Notificar Término y Enviar a Revisión Administrativa (Paso D → E)</span>
              </button>
            )}
          </div>

          {/* SECCIÓN: LIBERACIÓN FÍSICA DE LA UNIDAD */}
          <div className="mt-6 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[#040057]">
                <Key className="w-5 h-5 text-indigo-600" />
                Liberación Física de la Unidad (Entrega a Operador / Chofer)
              </div>

              {currentOrder.physicalReleaseDate ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Unidad Entregada
                </span>
              ) : currentOrder.status === 'liberacion_autorizada' ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Autorizado por Gerencia
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
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
                <Key className="w-4 h-4" />
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

      {/* MODAL PARA CARGAR EVIDENCIA FOTOGRÁFICA */}
      {showAddEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-[#040057] mb-1">
              Carga de Evidencia Fotográfica
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Asigna la fase obligatoria correspondiente a la fotografía.
            </p>

            <form onSubmit={handleAddEvidenceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fase de la Evidencia *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'antes', label: '1. ANTES' },
                    { id: 'durante', label: '2. DURANTE' },
                    { id: 'despues', label: '3. DESPUÉS' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setEvidencePhase(f.id as any)}
                      className={`py-2 rounded-lg font-bold border transition ${
                        evidencePhase === f.id
                          ? 'bg-[#040057] text-white border-[#040057]'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Título de la Foto / Componente *
                </label>
                <input
                  type="text"
                  required
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  placeholder="Ej. Desgaste en balatas / Prueba de presión a 120 PSI"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas Técnicas de Observación
                </label>
                <textarea
                  rows={2}
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Detalles de torque, número de serie de repuesto o medición..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL de Imagen (o dejar vacío para usar muestra predefinida de alta resolución)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEvidence(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#040057] text-white font-bold shadow-xs"
                >
                  Guardar Evidencia
                </button>
              </div>
            </form>
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
                    type="number"
                    min="1"
                    required
                    value={partQuantity}
                    onChange={(e) => setPartQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Precio Unitario ($ MXN) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={partPrice}
                    onChange={(e) => setPartPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#040057]"
                  />
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
