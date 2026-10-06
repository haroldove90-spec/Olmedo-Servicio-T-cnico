import React, { useState } from 'react';
import { 
  CheckSquare, 
  FileText, 
  DollarSign, 
  Receipt, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Eye, 
  Plus, 
  Trash2, 
  Send, 
  Camera, 
  Truck, 
  ShieldCheck, 
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  Printer,
  Edit3,
  Search,
  Sparkles,
  Layers,
  Wrench
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, PartUsed, Quotation, EvidencePhoto } from '../../types';
import { TechnicalReportDocument } from '../common/TechnicalReportDocument';
import { GerenciaEvidenceEditModal } from '../common/GerenciaEvidenceEditModal';

export const GerenciaPortal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    orders, 
    reviewEvidences, 
    saveQuotation, 
    emitInvoice,
    updateEvidencePhoto,
    updateOrderGeneral,
    updateTechnicalReport
  } = useApp();

  // Modal inspection of evidences
  const [inspectOrder, setInspectOrder] = useState<ServiceOrder | null>(null);
  const [reviewerName, setReviewerName] = useState('Lic. Laura Méndez (Gerencia Administrativa)');
  const [approvalNotes, setApprovalNotes] = useState('Servicio y evidencias validados satisfactoriamente. Se autoriza la liberación de la unidad.');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Editor and Correction states (Editorial de Gerencia para ortografía y datos técnicos)
  const [editingEvidencePhoto, setEditingEvidencePhoto] = useState<EvidencePhoto | null>(null);
  const [editingTargetOrder, setEditingTargetOrder] = useState<ServiceOrder | null>(null);
  const [showEditTechDataModal, setShowEditTechDataModal] = useState<boolean>(false);
  const [zoomPhoto, setZoomPhoto] = useState<{ url: string; title: string; notes?: string; phase: string } | null>(null);

  // Sub-tab de Validación y Registros del Técnico
  const [activeValidationTab, setActiveValidationTab] = useState<'inspecciones' | 'registros_tecnicos'>('inspecciones');
  const [recordSearchTerm, setRecordSearchTerm] = useState('');
  const [selectedRecordOrderId, setSelectedRecordOrderId] = useState<string>('');

  // Formal Report & Excel Modal
  const [reportOrder, setReportOrder] = useState<ServiceOrder | null>(null);

  // Quotation Generator States
  const [quoteOrder, setQuoteOrder] = useState<ServiceOrder | null>(null);
  const [laborHours, setLaborHours] = useState(3.5);
  const [laborRate, setLaborRate] = useState(650);
  const [quoteParts, setQuoteParts] = useState<PartUsed[]>([]);
  const [expensesAndTowing, setExpensesAndTowing] = useState(0);
  const [quoteNotes, setQuoteNotes] = useState('');

  // Invoice Emission Modal
  const [invoiceOrder, setInvoiceOrder] = useState<ServiceOrder | null>(null);
  const [invoiceNotes, setInvoiceNotes] = useState('Factura generada conforme a cotización aprobada por el cliente.');

  // List of orders waiting for evidence review (Paso E)
  const pendingReviewOrders = orders.filter(o => o.status === 'evidencias_en_revision');

  // Orders authorized for quote creation
  const readyForQuoteOrders = orders.filter(o => 
    o.status === 'liberacion_autorizada' || 
    o.status === 'unidad_liberada' ||
    o.status === 'cotizacion_pendiente'
  );

  // Orders approved by client ready for invoice
  const readyForInvoiceOrders = orders.filter(o => 
    o.status === 'cotizacion_aprobada' || 
    o.status === 'facturado'
  );

  const handleOpenInspect = (order: ServiceOrder) => {
    setInspectOrder(order);
    setShowRejectForm(false);
    setRejectionNotes('');
  };

  const handleOpenEditEvidence = (order: ServiceOrder, ev: EvidencePhoto) => {
    setEditingTargetOrder(order);
    setEditingEvidencePhoto(ev);
  };

  const handleOpenEditTechData = (order: ServiceOrder) => {
    setEditingTargetOrder(order);
    setShowEditTechDataModal(true);
  };

  const handleSaveEditedEvidence = (photoId: string, updates: Partial<EvidencePhoto>) => {
    if (!editingTargetOrder) return;
    updateEvidencePhoto(editingTargetOrder.id, photoId, updates);

    // Update in memory if inspecting
    if (inspectOrder && inspectOrder.id === editingTargetOrder.id) {
      setInspectOrder({
        ...inspectOrder,
        evidences: inspectOrder.evidences.map(e => e.id === photoId ? { ...e, ...updates } : e)
      });
    }

    setEditingEvidencePhoto(null);
  };

  const handleSaveEditedTechData = (updates: any) => {
    if (!editingTargetOrder) return;

    updateOrderGeneral(editingTargetOrder.id, {
      initialDiagnosis: updates.initialDiagnosis,
      workPerformedDetail: updates.workPerformedDetail,
      preventiveInspectionNotes: updates.preventiveInspectionNotes,
      vehicle: {
        ...editingTargetOrder.vehicle,
        chassisSerialNumber: updates.chassisSerialNumber,
        engineModelTransmission: updates.engineModelTransmission,
        engineSeriesTransmission: updates.engineSeriesTransmission,
        odometerReading: updates.odometerReading,
      }
    });

    updateTechnicalReport(editingTargetOrder.id, {
      workPerformedDetail: updates.workPerformedDetail,
      preventiveInspectionNotes: updates.preventiveInspectionNotes,
      vehicleUpdates: {
        chassisSerialNumber: updates.chassisSerialNumber,
        engineModelTransmission: updates.engineModelTransmission,
        engineSeriesTransmission: updates.engineSeriesTransmission,
        odometerReading: updates.odometerReading,
      }
    });

    // Update in memory if inspecting
    if (inspectOrder && inspectOrder.id === editingTargetOrder.id) {
      setInspectOrder({
        ...inspectOrder,
        initialDiagnosis: updates.initialDiagnosis,
        workPerformedDetail: updates.workPerformedDetail,
        preventiveInspectionNotes: updates.preventiveInspectionNotes,
        vehicle: {
          ...inspectOrder.vehicle,
          chassisSerialNumber: updates.chassisSerialNumber,
          engineModelTransmission: updates.engineModelTransmission,
          engineSeriesTransmission: updates.engineSeriesTransmission,
          odometerReading: updates.odometerReading,
        }
      });
    }

    setShowEditTechDataModal(false);
  };

  const handleApproveInspection = () => {
    if (!inspectOrder) return;
    reviewEvidences(inspectOrder.id, true, approvalNotes, reviewerName);
    setInspectOrder(null);
  };

  const handleRejectInspection = () => {
    if (!inspectOrder || !rejectionNotes.trim()) {
      alert('Debes ingresar las observaciones y razones específicas del rechazo.');
      return;
    }
    reviewEvidences(inspectOrder.id, false, rejectionNotes.trim(), reviewerName);
    setInspectOrder(null);
    setShowRejectForm(false);
  };

  const handleOpenQuotation = (order: ServiceOrder) => {
    setQuoteOrder(order);
    if (order.quotation) {
      setLaborHours(order.quotation.laborHours);
      setLaborRate(order.quotation.laborRatePerHour);
      setQuoteParts([...order.quotation.parts]);
      setExpensesAndTowing(order.quotation.expensesAndTowing);
      setQuoteNotes(order.quotation.notes || '');
    } else {
      // Default from technician parts
      setLaborHours(order.serviceType === 'rescate' ? 4.0 : 2.5);
      setLaborRate(650);
      setQuoteParts([...order.partsUsed]);
      setExpensesAndTowing(order.serviceType === 'rescate' ? 1200 : order.serviceType === 'asistencia' ? 500 : 0);
      setQuoteNotes(`Garantía de servicio por 90 días en mano de obra técnica para unidad ${order.vehicle.plates}.`);
    }
  };

  const handleSaveQuotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteOrder) return;

    saveQuotation(quoteOrder.id, {
      laborHours: Number(laborHours),
      laborRatePerHour: Number(laborRate),
      parts: quoteParts,
      expensesAndTowing: Number(expensesAndTowing) || 0,
      notes: quoteNotes,
    });

    setQuoteOrder(null);
  };

  const handleAddPartToQuote = () => {
    const newPart: PartUsed = {
      id: `qp-${Date.now()}`,
      partNumber: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      description: 'Refacción adicional / Insumo lubricante',
      quantity: 1,
      unitPrice: 500,
    };
    setQuoteParts(prev => [...prev, newPart]);
  };

  const handleUpdateQuotePart = (id: string, field: keyof PartUsed, val: any) => {
    setQuoteParts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: val };
      }
      return p;
    }));
  };

  const handleRemoveQuotePart = (id: string) => {
    setQuoteParts(prev => prev.filter(p => p.id !== id));
  };

  const handleEmitInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceOrder) return;
    emitInvoice(invoiceOrder.id, invoiceNotes);
    setInvoiceOrder(null);
  };

  // Generador real de archivo Excel (.csv con UTF-8 BOM para soporte completo en Microsoft Excel)
  const handleExportToExcel = (order: ServiceOrder) => {
    const laborSubtotal = (order.quotation?.laborHours || 0) * (order.quotation?.laborRatePerHour || 0);
    const partsSubtotal = (order.quotation?.parts || []).reduce((acc, p) => {
      const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1);
      return acc + (q * p.unitPrice);
    }, 0);
    const expenses = order.quotation?.expensesAndTowing || 0;
    const subtotal = order.quotation?.subtotal || (laborSubtotal + partsSubtotal + expenses);
    const tax = order.quotation?.tax || +(subtotal * 0.16).toFixed(2);
    const total = order.quotation?.total || +(subtotal + tax).toFixed(2);

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'REPORTE FORMAL Y CONSOLIDACIÓN DE SERVICIO TÉCNICO - OLEMDO SERVICIO TÉCNICO\n';
    csvContent += `Folio de Orden:,"${order.folio}"\n`;
    csvContent += `Fecha de Solicitud:,"${new Date(order.createdAt).toLocaleString('es-MX')}"\n`;
    csvContent += `Cliente:,"${order.clientName}"\n`;
    csvContent += `Contacto:,"${order.clientContact}"\n`;
    csvContent += `Tipo de Atención:,"${order.serviceType.toUpperCase()}"\n`;
    csvContent += `Tipo de Unidad:,"${order.vehicle.type.toUpperCase()}"\n`;
    csvContent += `Placas:,"${order.vehicle.plates}"\n`;
    csvContent += `No. Económico:,"${order.vehicle.economicNumber}"\n`;
    csvContent += `Ubicación:,"${order.vehicle.location}"\n`;
    csvContent += `Avería Reportada:,"${order.vehicle.failureDescription.replace(/"/g, '""')}"\n`;
    csvContent += `Diagnóstico Técnico:,"${(order.initialDiagnosis || 'Diagnóstico en taller').replace(/"/g, '""')}"\n`;
    csvContent += `Técnico Asignado:,"${order.assignedTechnicianName || 'N/A'}"\n`;
    csvContent += `Aprobado por Gerencia:,"${order.adminApprovedBy || 'Lic. Laura Méndez'}"\n`;
    csvContent += `Fecha Aprobación:,"${order.adminApprovedAt ? new Date(order.adminApprovedAt).toLocaleString('es-MX') : 'N/A'}"\n\n`;

    csvContent += 'DESGLOSE DE MANO DE OBRA Y TIEMPOS\n';
    csvContent += 'Concepto,Horas,Tarifa por Hora,Importe MXN\n';
    csvContent += `"Mano de Obra Calificada - Especialista en ${order.vehicle.type}",${order.quotation?.laborHours || 3},${order.quotation?.laborRatePerHour || 650},${laborSubtotal}\n\n`;

    csvContent += 'DESGLOSE DE REFACCIONES E INSUMOS\n';
    csvContent += 'No. Parte,Descripción de Refacción,Cantidad,Precio Unitario,Total MXN\n';
    if (order.partsUsed.length > 0) {
      order.partsUsed.forEach(p => {
        const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1);
        csvContent += `"${p.partNumber}","${p.description.replace(/"/g, '""')}",${p.quantity},${p.unitPrice},${q * p.unitPrice}\n`;
      });
    } else {
      csvContent += 'N/A,Sin refacciones facturadas,0,0,0\n';
    }
    csvContent += '\n';

    csvContent += 'RESUMEN FINANCIERO Y LIQUIDACIÓN\n';
    csvContent += `Subtotal Mano de Obra,${laborSubtotal}\n`;
    csvContent += `Subtotal Refacciones,${partsSubtotal}\n`;
    csvContent += `Viáticos / Rescate en Autopista o Grúa,${expenses}\n`;
    csvContent += `Subtotal Neto,${subtotal}\n`;
    csvContent += `IVA (16%),${tax}\n`;
    csvContent += `TOTAL GENERAL MXN,${total}\n\n`;

    csvContent += 'EVIDENCIAS FOTOGRÁFICAS INSPECCIONADAS\n';
    csvContent += 'Fase,Título,Notas,Fecha / Hora\n';
    order.evidences.forEach(ev => {
      csvContent += `"${ev.phase.toUpperCase()}","${ev.title.replace(/"/g, '""')}","${(ev.notes || '').replace(/"/g, '""')}","${new Date(ev.timestamp).toLocaleString('es-MX')}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Olemdo_${order.folio}_Reporte_Consolidado.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8 w-full max-w-full min-w-0 overflow-x-hidden">
      
      {/* Encabezado del Portal de Gerencia */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057] truncate">
                Gerencia Administrativa y Facturación
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Inspección de Evidencias (Antes/Durante/Después) • Autorización de Liberación • Cotizador • Facturación Fiscal
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-amber-600" />
              {pendingReviewOrders.length} por Validar
            </span>

            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-600" />
              {readyForInvoiceOrders.length} en Facturación
            </span>
          </div>
        </div>
      </div>

      {/* MÓDULO 1: VALIDACIÓN DE EVIDENCIAS Y SERVICIO + REGISTROS DEL TÉCNICO */}
      {(activeModule === 'validacion_evidencias' || activeModule === 'inicio' || activeModule === 'registros_tecnicos') && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#040057] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span>Inspección, Validación y Edición Editorial de Evidencias</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Valida servicios de campo, aprueba o rechaza órdenes, y corrige faltas de ortografía o redacción en los reportes del técnico antes de facturar.
              </p>
            </div>

            {/* Pestañas de Navegación del Módulo */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveValidationTab('inspecciones')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeValidationTab === 'inspecciones'
                    ? 'bg-[#040057] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Inspecciones Pendientes</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeValidationTab === 'inspecciones' ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {pendingReviewOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveValidationTab('registros_tecnicos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeValidationTab === 'registros_tecnicos'
                    ? 'bg-[#040057] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Registros y Evidencias del Técnico</span>
              </button>
            </div>
          </div>

          {/* SUB-PESTAÑA 1: INSPECCIONES PENDIENTES DE DICTAMEN (PASO E) */}
          {activeValidationTab === 'inspecciones' && (
            <div>
              {pendingReviewOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-slate-700">Sin inspecciones pendientes de dictamen</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Todas las evidencias han sido aprobadas o los técnicos aún están ejecutando labores en sitio.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveValidationTab('registros_tecnicos')}
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-50 text-[#040057] border border-blue-200 hover:bg-blue-100 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-amber-500" />
                    <span>Explorar Todos los Registros Técnicos y Corregir Ortografía</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingReviewOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-extrabold text-[#040057]">{order.folio}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                            En Revisión de Gerencia
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            Técnico: <strong>{order.assignedTechnicianName}</strong>
                          </span>
                        </div>

                        <div className="text-xs text-slate-500">
                          Terminado el: {order.technicianCompletedAt ? new Date(order.technicianCompletedAt).toLocaleTimeString('es-MX') : 'Recién notificado'}
                        </div>
                      </div>

                      {/* Ficha y resumen de evidencias */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Cliente y Unidad</span>
                          <div className="font-bold text-slate-800">{order.clientName}</div>
                          <div className="text-slate-600">{order.vehicle.type.toUpperCase()} • Placas: {order.vehicle.plates}</div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Diagnóstico Técnico</span>
                          <div className="text-slate-700 italic">{order.initialDiagnosis || 'Diagnóstico reportado'}</div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Conteo de Evidencias</span>
                          <div className="font-semibold text-slate-800">
                            {order.evidences.length} fotografías • {order.partsUsed.length} refacciones instaladas
                          </div>
                        </div>
                      </div>

                      {/* Vistas previas de las fotos con botón rápido de zoom y edición */}
                      <div className="flex gap-2 py-2 overflow-x-auto">
                        {order.evidences.map((ev) => (
                          <div 
                            key={ev.id} 
                            className="w-28 shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-[10px] space-y-1 hover:border-indigo-300 transition"
                          >
                            <img 
                              src={ev.url} 
                              alt={ev.title} 
                              className="w-full h-16 object-cover rounded-lg cursor-pointer bg-slate-900" 
                              onClick={() => setZoomPhoto(ev)}
                            />
                            <div className="font-bold truncate text-slate-800" title={ev.title}>{ev.title}</div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold uppercase text-[9px] text-[#040057]">
                                {ev.phase === 'antes' ? '1. Antes' : '2. Correctivo'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditEvidence(order, ev)}
                                className="text-blue-600 hover:text-blue-800 p-0.5"
                                title="Corregir ortografía"
                              >
                                <Edit3 className="w-3 h-3 text-amber-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Botones de Inspección */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTechData(order)}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                          <span>Corregir Ficha y Ortografía</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenInspect(order)}
                          className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Abrir Módulo de Inspección y Dictamen (Aprobar / Rechazar)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-PESTAÑA 2: REGISTROS Y EVIDENCIAS DEL TÉCNICO (EXPLORADOR Y EDICIÓN EDITORIAL) */}
          {activeValidationTab === 'registros_tecnicos' && (
            <div className="space-y-4">
              {/* Buscador de Órdenes */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={recordSearchTerm}
                    onChange={(e) => setRecordSearchTerm(e.target.value)}
                    placeholder="Buscar por Folio, Cliente, Placas o Técnico..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#040057] bg-slate-50/50"
                  />
                </div>

                <div className="text-xs text-slate-500 font-medium self-start sm:self-auto">
                  {orders.filter(o => o.evidences.length > 0 || o.initialDiagnosis).length} órdenes con registro técnico
                </div>
              </div>

              {/* Contenedor Principal: Selector de Orden y Ficha Detallada */}
              {(() => {
                const filteredOrders = orders.filter(o => {
                  if (!recordSearchTerm.trim()) return true;
                  const term = recordSearchTerm.toLowerCase();
                  return (
                    o.folio.toLowerCase().includes(term) ||
                    o.clientName.toLowerCase().includes(term) ||
                    o.vehicle.plates.toLowerCase().includes(term) ||
                    (o.assignedTechnicianName && o.assignedTechnicianName.toLowerCase().includes(term))
                  );
                });

                const targetOrder = filteredOrders.find(o => o.id === selectedRecordOrderId) || filteredOrders[0];

                if (!targetOrder) {
                  return (
                    <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
                      No se encontraron órdenes con registros técnicos que coincidan con la búsqueda.
                    </div>
                  );
                }

                const antesPhotos = targetOrder.evidences.filter(e => e.phase === 'antes');
                const correctivoPhotos = targetOrder.evidences.filter(e => 
                  e.phase === 'correctivo_realizado' || e.phase === 'durante' || e.phase === 'despues'
                );

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Columna Izquierda: Lista de Órdenes */}
                    <div className="lg:col-span-4 space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block px-1">
                        Selecciona una Orden ({filteredOrders.length})
                      </span>

                      {filteredOrders.map(o => (
                        <div
                          key={o.id}
                          onClick={() => setSelectedRecordOrderId(o.id)}
                          className={`p-3 rounded-xl border-2 transition cursor-pointer text-xs space-y-1.5 ${
                            (selectedRecordOrderId === o.id || (!selectedRecordOrderId && filteredOrders[0]?.id === o.id))
                              ? 'bg-blue-50/70 border-[#040057] shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[#040057]">{o.folio}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                              {o.evidences.length} fotos
                            </span>
                          </div>

                          <div className="font-bold text-slate-800 truncate">{o.clientName}</div>
                          <div className="text-slate-500 text-[11px] flex justify-between">
                            <span>{o.vehicle.type.toUpperCase()} ({o.vehicle.plates})</span>
                            <span className="font-semibold text-slate-700">{o.assignedTechnicianName || 'Sin técnico'}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Columna Derecha: Ficha Editorial Completa de la Orden Seleccionada */}
                    <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5 text-xs">
                      
                      {/* Cabecera de la Orden Seleccionada */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-[#040057]">
                              Expediente Técnico: {targetOrder.folio}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-[#040057] font-bold">
                              {targetOrder.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Cliente: <strong>{targetOrder.clientName}</strong> • {targetOrder.vehicle.type.toUpperCase()} ({targetOrder.vehicle.plates}) • Técnico: <strong>{targetOrder.assignedTechnicianName || 'N/A'}</strong>
                          </p>
                        </div>

                        {/* Botón para abrir edición general */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditTechData(targetOrder)}
                          className="px-3.5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                        >
                          <Edit3 className="w-4 h-4 text-amber-400" />
                          <span>Corregir Información / Ficha Técnica (Ortografía)</span>
                        </button>
                      </div>

                      {/* Resumen de Datos Técnicos Editables */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <span className="font-bold text-[#040057] uppercase text-[10px] block">
                            Diagnóstico Técnico en Sitio:
                          </span>
                          <p className="text-slate-800 mt-0.5 leading-relaxed">
                            {targetOrder.initialDiagnosis || <span className="text-slate-400 italic">Sin diagnóstico capturado</span>}
                          </p>
                        </div>

                        <div>
                          <span className="font-bold text-[#040057] uppercase text-[10px] block">
                            Servicio Realizado Detallado (Técnico):
                          </span>
                          <p className="text-slate-800 mt-0.5 leading-relaxed">
                            {targetOrder.workPerformedDetail || targetOrder.vehicle.failureDescription || <span className="text-slate-400 italic">Sin detalle capturado</span>}
                          </p>
                        </div>

                        <div className="md:col-span-2 pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Serie VIN:</span>
                            <strong className="font-mono">{targetOrder.vehicle.chassisSerialNumber || 'No registrada'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Odómetro:</span>
                            <strong>{targetOrder.vehicle.odometerReading || 'No registrado'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Modelo Motor:</span>
                            <strong>{targetOrder.vehicle.engineModelTransmission || 'No registrado'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Serie Motor:</span>
                            <strong className="font-mono">{targetOrder.vehicle.engineSeriesTransmission || 'No registrada'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Galería Fotográfica 1. Antes y 2. Correctivo Realizado */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-[#040057]" />
                            <span>Evidencias Fotográficas ({targetOrder.evidences.length} en total)</span>
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Haz clic en "✏️ Corregir" en cualquier foto para arreglar faltas de ortografía o notas.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Columna: 1. Antes */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                              <span className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                <span>1. ANTES ({antesPhotos.length} fotos)</span>
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              {antesPhotos.map(p => (
                                <div key={p.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                                  <div className="relative group rounded-lg overflow-hidden bg-slate-900 cursor-pointer" onClick={() => setZoomPhoto(p)}>
                                    <img src={p.url} alt={p.title} className="w-full h-32 object-contain bg-slate-950 rounded-lg" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                      <Eye className="w-4 h-4" />
                                      <span>Ver en tamaño completo</span>
                                    </div>
                                  </div>

                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-slate-900 line-clamp-1">{p.title}</div>
                                      {p.notes && <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{p.notes}</p>}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditEvidence(targetOrder, p)}
                                      className="px-2 py-1 rounded-md bg-blue-50 text-[#040057] hover:bg-blue-100 font-bold text-[10px] border border-blue-200 flex items-center gap-1 cursor-pointer shrink-0"
                                      title="Editar título y notas para corregir ortografía"
                                    >
                                      <Edit3 className="w-3 h-3 text-amber-500" />
                                      <span>Corregir</span>
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {antesPhotos.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-xs border border-dashed rounded-lg bg-white">
                                  Sin fotografías en la fase 1. Antes
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Columna: 2. Correctivo Realizado */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                              <span className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                <span>2. CORRECTIVO REALIZADO ({correctivoPhotos.length} fotos)</span>
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              {correctivoPhotos.map(p => (
                                <div key={p.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                                  <div className="relative group rounded-lg overflow-hidden bg-slate-900 cursor-pointer" onClick={() => setZoomPhoto(p)}>
                                    <img src={p.url} alt={p.title} className="w-full h-32 object-contain bg-slate-950 rounded-lg" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                      <Eye className="w-4 h-4" />
                                      <span>Ver en tamaño completo</span>
                                    </div>
                                  </div>

                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-slate-900 line-clamp-1">{p.title}</div>
                                      {p.notes && <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{p.notes}</p>}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditEvidence(targetOrder, p)}
                                      className="px-2 py-1 rounded-md bg-blue-50 text-[#040057] hover:bg-blue-100 font-bold text-[10px] border border-blue-200 flex items-center gap-1 cursor-pointer shrink-0"
                                      title="Editar título y notas para corregir ortografía"
                                    >
                                      <Edit3 className="w-3 h-3 text-amber-500" />
                                      <span>Corregir</span>
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {correctivoPhotos.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-xs border border-dashed rounded-lg bg-white">
                                  Sin fotografías en la fase 2. Correctivo realizado
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      )}

      {/* MÓDULO 2: CONSOLIDACIÓN Y EXPORTACIÓN A EXCEL */}
      {activeModule === 'reportes_excel' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200">
            <h2 className="text-lg font-bold text-[#040057] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Consolidación y Exportación Formal a Excel
            </h2>
            <p className="text-xs text-slate-500">
              Genera reportes técnicos y descarga el archivo Excel desglosado con horas de trabajo, refacciones, costos y evidencia fotográfica.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {orders.filter(o => o.adminApprovedAt || o.quotation || o.invoice).map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#040057] text-base">{order.folio}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      Liberación Aprobada
                    </span>
                  </div>

                  <div className="text-xs text-slate-700">
                    Cliente: <strong>{order.clientName}</strong> • Unidad: {order.vehicle.type.toUpperCase()} ({order.vehicle.plates})
                  </div>

                  <div className="text-xs text-slate-500">
                    Aprobado por: {order.adminApprovedBy || 'Gerencia'} el {order.adminApprovedAt ? new Date(order.adminApprovedAt).toLocaleDateString('es-MX') : 'Fecha de hoy'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportOrder(order)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#040057]" />
                    <span>Ver Reporte Formal</span>
                  </button>

                  <button
                    onClick={() => handleExportToExcel(order)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar a Excel (.CSV / .XLS)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MÓDULO 3: GENERADOR DE COTIZACIONES (Paso H en Graph TD) */}
      {activeModule === 'cotizaciones' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200">
            <h2 className="text-lg font-bold text-[#040057] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Generador de Cotizaciones y Presupuestos (Paso H)
            </h2>
            <p className="text-xs text-slate-500">
              Elabora presupuestos desglosados (Mano de obra + Refacciones + Viáticos/Grúa + IVA 16%) y envíalos digitalmente al cliente para su autorización.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {readyForQuoteOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#040057] text-base">{order.folio}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      order.quotation?.status === 'aprobada' ? 'bg-emerald-100 text-emerald-800' :
                      order.quotation?.status === 'enviada' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#040057]'
                    }`}>
                      {order.quotation ? `Cotización ${order.quotation.status.toUpperCase()}` : 'Sin Cotización'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700">
                    Cliente: <strong>{order.clientName}</strong> • {order.vehicle.type.toUpperCase()} ({order.vehicle.plates})
                  </div>

                  {order.quotation && (
                    <div className="text-xs font-semibold text-slate-800">
                      Total presupuestado: ${order.quotation.total.toLocaleString('es-MX')} MXN
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenQuotation(order)}
                    className="px-4 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>{order.quotation ? 'Editar / Reenviar Cotización' : 'Generar Cotización Desglosada'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MÓDULO 4: FACTURACIÓN FISCAL (Paso J en Graph TD) */}
      {activeModule === 'facturacion' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200">
            <h2 className="text-lg font-bold text-[#040057] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Módulo de Emisión y Facturación Fiscal (Paso J)
            </h2>
            <p className="text-xs text-slate-500">
              Emite facturas fiscales automáticas una vez que el cliente haya aprobado la cotización digitalmente.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {readyForInvoiceOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#040057] text-base">{order.folio}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      order.invoice ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-[#040057]'
                    }`}>
                      {order.invoice ? `Facturado: ${order.invoice.fiscalFolio}` : 'Listo para Facturar'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700">
                    Cliente: <strong>{order.clientName}</strong> • Total a facturar: ${order.quotation?.total.toLocaleString('es-MX')} MXN
                  </div>

                  <div className="text-xs text-slate-500">
                    Autorizado por: {order.quotation?.approvedBy || 'Cliente'} el {order.quotation?.approvedAt ? new Date(order.quotation.approvedAt).toLocaleDateString('es-MX') : 'Reciente'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!order.invoice ? (
                    <button
                      onClick={() => {
                        setInvoiceOrder(order);
                        setInvoiceNotes(`Factura de servicio técnico orden ${order.folio} placas ${order.vehicle.plates}`);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Emitir Factura Fiscal (Paso J)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleExportToExcel(order)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Comprobante CFDI</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE INSPECCIÓN DETALLADA DE EVIDENCIAS */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[#040057] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  Módulo de Inspección Técnica: {inspectOrder.folio}
                </h3>
                <p className="text-xs text-blue-200">
                  Unidad {inspectOrder.vehicle.type.toUpperCase()} • Placas: {inspectOrder.vehicle.plates} • Técnico: {inspectOrder.assignedTechnicianName}
                </p>
              </div>
              <button
                onClick={() => setInspectOrder(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Resumen de servicio con botón editorial */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <span className="font-bold text-[#040057] uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Datos y Diagnóstico Reportados por el Técnico</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenEditTechData(inspectOrder)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-[#040057] font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Corregir Ortografía y Datos Técnicos</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block text-[11px] uppercase text-slate-400">Falla Reportada Inicial:</span>
                    <p className="text-slate-800 mt-0.5">{inspectOrder.vehicle.failureDescription}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block text-[11px] uppercase text-slate-400">Diagnóstico en Sitio (Técnico):</span>
                    <p className="text-slate-800 mt-0.5 font-medium">{inspectOrder.initialDiagnosis || 'Diagnóstico de taller'}</p>
                  </div>
                </div>

                {inspectOrder.workPerformedDetail && (
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase text-slate-400">Servicio Realizado Detallado:</span>
                    <p className="text-slate-800 mt-0.5 leading-relaxed">{inspectOrder.workPerformedDetail}</p>
                  </div>
                )}
              </div>

              {/* Galería completa clasificada: 1. ANTES y 2. CORRECTIVO REALIZADO */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Inspección Fotográfica Obligatoria (2 Pasos)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Puedes hacer clic en "✏️ Corregir" en cualquier foto para rectificar errores ortográficos en el título y notas.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fase 1: 1. ANTES */}
                  {(() => {
                    const antesPhotos = inspectOrder.evidences.filter(e => e.phase === 'antes');
                    return (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
                        <div className="font-bold text-slate-800 uppercase flex items-center justify-between pb-1.5 border-b border-slate-200">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span>1. ANTES (Falla Inicial)</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            antesPhotos.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {antesPhotos.length > 0 ? `${antesPhotos.length} fotos` : '⚠️ Sin evidencias'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {antesPhotos.map(p => (
                            <div key={p.id} className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                              <div className="relative group rounded-lg overflow-hidden bg-slate-900 cursor-pointer" onClick={() => setZoomPhoto(p)}>
                                <img src={p.url} alt={p.title} className="w-full h-36 object-contain bg-slate-950 rounded-lg" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                  <Eye className="w-4 h-4" />
                                  <span>Ver en tamaño completo</span>
                                </div>
                              </div>

                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 line-clamp-1">{p.title}</div>
                                  {p.notes && <div className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">{p.notes}</div>}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditEvidence(inspectOrder, p)}
                                  className="px-2 py-1 rounded-md bg-blue-50 text-[#040057] hover:bg-blue-100 font-bold text-[10px] border border-blue-200 flex items-center gap-1 cursor-pointer shrink-0"
                                  title="Corregir ortografía de la evidencia"
                                >
                                  <Edit3 className="w-3 h-3 text-amber-500" />
                                  <span>Corregir</span>
                                </button>
                              </div>
                            </div>
                          ))}

                          {antesPhotos.length === 0 && (
                            <div className="py-8 text-center text-rose-500 border border-dashed border-rose-300 rounded-xl bg-white">
                              ⚠️ Falta evidencia obligatoria en fase "1. Antes"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Fase 2: 2. CORRECTIVO REALIZADO */}
                  {(() => {
                    const correctivoPhotos = inspectOrder.evidences.filter(e => 
                      e.phase === 'correctivo_realizado' || e.phase === 'durante' || e.phase === 'despues'
                    );
                    return (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
                        <div className="font-bold text-slate-800 uppercase flex items-center justify-between pb-1.5 border-b border-slate-200">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>2. CORRECTIVO REALIZADO</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            correctivoPhotos.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {correctivoPhotos.length > 0 ? `${correctivoPhotos.length} fotos` : '⚠️ Sin evidencias'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {correctivoPhotos.map(p => (
                            <div key={p.id} className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                              <div className="relative group rounded-lg overflow-hidden bg-slate-900 cursor-pointer" onClick={() => setZoomPhoto(p)}>
                                <img src={p.url} alt={p.title} className="w-full h-36 object-contain bg-slate-950 rounded-lg" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                  <Eye className="w-4 h-4" />
                                  <span>Ver en tamaño completo</span>
                                </div>
                              </div>

                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 line-clamp-1">{p.title}</div>
                                  {p.notes && <div className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">{p.notes}</div>}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditEvidence(inspectOrder, p)}
                                  className="px-2 py-1 rounded-md bg-blue-50 text-[#040057] hover:bg-blue-100 font-bold text-[10px] border border-blue-200 flex items-center gap-1 cursor-pointer shrink-0"
                                  title="Corregir ortografía de la evidencia"
                                >
                                  <Edit3 className="w-3 h-3 text-amber-500" />
                                  <span>Corregir</span>
                                </button>
                              </div>
                            </div>
                          ))}

                          {correctivoPhotos.length === 0 && (
                            <div className="py-8 text-center text-rose-500 border border-dashed border-rose-300 rounded-xl bg-white">
                              ⚠️ Falta evidencia obligatoria en fase "2. Correctivo realizado"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Insumos cargados por técnico */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                  Refacciones e Insumos Reportados por el Técnico
                </h4>
                {inspectOrder.partsUsed.length === 0 ? (
                  <div className="text-slate-400 italic">Sin refacciones reportadas.</div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2">No. Parte</th>
                          <th className="p-2">Descripción</th>
                          <th className="p-2 text-center">Cantidad</th>
                          <th className="p-2 text-right">Precio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {inspectOrder.partsUsed.map(p => (
                          <tr key={p.id}>
                            <td className="p-2 font-mono">{p.partNumber}</td>
                            <td className="p-2 font-semibold">{p.description}</td>
                            <td className="p-2 text-center">{p.quantity}</td>
                            <td className="p-2 text-right">${p.unitPrice.toLocaleString('es-MX')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Formulario de Dictamen */}
              {showRejectForm ? (
                <div className="p-4 bg-rose-50 rounded-xl border-2 border-rose-300 space-y-3">
                  <div className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Acción: Rechazar / Observar Servicio (Regresar al Técnico)
                  </div>
                  <p className="text-rose-700">
                    Especifica claramente qué evidencias o correcciones debe completar el técnico.
                  </p>
                  <textarea
                    rows={3}
                    required
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Ej. Faltan fotos nítidas de la prueba a 120 PSI en la fase DESPUÉS y especificar número de serie del componente..."
                    className="w-full px-3 py-2 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectInspection}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                      Confirmar Rechazo y Notificar al Técnico
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 space-y-2">
                  <div className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Acción: Aprobar Servicio y Autorizar Liberación
                  </div>
                  <p className="text-emerald-700">
                    Al validar, se habilita la entrega física de la unidad en el portal del técnico y se habilita la generación de reportes y cotización formal.
                  </p>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notas de Aprobación:</label>
                    <input
                      type="text"
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setInspectOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                {!showRejectForm && (
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs cursor-pointer"
                  >
                    Rechazar / Observar (Paso F)
                  </button>
                )}

                <button
                  onClick={handleApproveInspection}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aprobar y Autorizar Liberación (Paso G)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE GENERADOR DE COTIZACIONES */}
      {quoteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            <div className="p-4 sm:p-5 bg-[#040057] text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Generador de Cotización: {quoteOrder.folio}</h3>
                <p className="text-xs text-blue-200">Cliente: {quoteOrder.clientName} • Unidad placas {quoteOrder.vehicle.plates}</p>
              </div>
              <button onClick={() => setQuoteOrder(null)} className="text-slate-300 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveQuotationSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Mano de obra */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-[#040057] uppercase text-[11px]">1. Mano de Obra Técnica Especializada</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Horas Invertidas:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={laborHours}
                      onChange={(e) => setLaborHours(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tarifa por Hora ($ MXN):</label>
                    <input
                      type="number"
                      step="50"
                      min="100"
                      required
                      value={laborRate}
                      onChange={(e) => setLaborRate(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="text-right font-bold text-slate-700 pt-1">
                  Subtotal Mano de Obra: ${(laborHours * laborRate).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Refacciones */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#040057] uppercase text-[11px]">2. Refacciones e Insumos</span>
                  <button
                    type="button"
                    onClick={handleAddPartToQuote}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 font-semibold text-[11px] hover:bg-slate-300"
                  >
                    + Agregar Partida
                  </button>
                </div>

                <div className="space-y-2">
                  {quoteParts.map(p => (
                    <div key={p.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border min-w-0">
                      <div className="sm:col-span-3 min-w-0">
                        <input
                          type="text"
                          value={p.partNumber}
                          onChange={(e) => handleUpdateQuotePart(p.id, 'partNumber', e.target.value)}
                          placeholder="No. Parte"
                          className="w-full px-2 py-1.5 border rounded text-[11px]"
                        />
                      </div>
                      <div className="sm:col-span-5 min-w-0">
                        <input
                          type="text"
                          value={p.description}
                          onChange={(e) => handleUpdateQuotePart(p.id, 'description', e.target.value)}
                          placeholder="Descripción"
                          className="w-full px-2 py-1.5 border rounded text-[11px]"
                        />
                      </div>
                      <div className="grid grid-cols-12 gap-2 sm:col-span-4 items-center min-w-0">
                        <div className="col-span-5 min-w-0">
                          <input
                            type="number"
                            min="1"
                            value={p.quantity}
                            onChange={(e) => handleUpdateQuotePart(p.id, 'quantity', Number(e.target.value))}
                            placeholder="Cant"
                            className="w-full px-2 py-1.5 border rounded text-[11px]"
                          />
                        </div>
                        <div className="col-span-5 min-w-0">
                          <input
                            type="number"
                            min="0"
                            value={p.unitPrice}
                            onChange={(e) => handleUpdateQuotePart(p.id, 'unitPrice', Number(e.target.value))}
                            placeholder="$ Unit"
                            className="w-full px-2 py-1.5 border rounded text-[11px]"
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveQuotePart(p.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer font-bold text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-right font-bold text-slate-700 pt-1">
                  Subtotal Refacciones: ${quoteParts.reduce((a, b) => {
                    const q = typeof b.quantity === 'number' ? b.quantity : (parseFloat(String(b.quantity)) || 1);
                    return a + (q * b.unitPrice);
                  }, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Viáticos / Grúa */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-[#040057] uppercase text-[11px]">3. Viáticos / Asistencia / Servicio de Grúa</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={expensesAndTowing}
                  onChange={(e) => setExpensesAndTowing(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>

              {/* Totales calculados */}
              {(() => {
                const laborSub = laborHours * laborRate;
                const partsSub = quoteParts.reduce((a, b) => {
                  const q = typeof b.quantity === 'number' ? b.quantity : (parseFloat(String(b.quantity)) || 1);
                  return a + (q * b.unitPrice);
                }, 0);
                const sub = laborSub + partsSub + Number(expensesAndTowing || 0);
                const tax = +(sub * 0.16).toFixed(2);
                const total = +(sub + tax).toFixed(2);
                return (
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal Neto:</span>
                      <span>${sub.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA Trasladado (16%):</span>
                      <span>${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm text-[#040057] pt-1 border-t border-blue-200">
                      <span>Total Presupuesto:</span>
                      <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuoteOrder(null)}
                  className="px-4 py-2 rounded-xl border text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Guardar y Enviar al Cliente (Paso H → I)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE REPORTE FORMAL */}
      {reportOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-[#040057] text-white flex justify-between items-center print:hidden">
              <div>
                <h3 className="text-base font-bold">REPORTE TÉCNICO {reportOrder.reportNumber || '023'} (Formato Oficial)</h3>
                <p className="text-xs text-blue-200">{reportOrder.folio} • {reportOrder.clientName}</p>
              </div>
              <button onClick={() => setReportOrder(null)} className="text-slate-300 hover:text-white">✕</button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <TechnicalReportDocument order={reportOrder} />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center print:hidden">
              <button
                onClick={() => handleExportToExcel(reportOrder)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Consolidado a Excel (.CSV)</span>
              </button>

              <button
                onClick={() => setReportOrder(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EMISIÓN DE FACTURA */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-emerald-800 mb-1">
              Emisión de Factura Fiscal (Paso J)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Orden {invoiceOrder.folio} • Cliente {invoiceOrder.clientName}
            </p>

            <form onSubmit={handleEmitInvoiceSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <div className="flex justify-between font-bold text-emerald-950">
                  <span>Monto Total a Facturar:</span>
                  <span>${invoiceOrder.quotation?.total.toLocaleString('es-MX')} MXN</span>
                </div>
                <div className="text-emerald-700 text-[11px]">
                  Autorizado previamente por: {invoiceOrder.quotation?.approvedBy || 'Cliente'}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas / Observaciones de Factura
                </label>
                <input
                  type="text"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(null)}
                  className="px-4 py-2 rounded-xl border text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Generar Folio y Timbrar CFDI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITORIAL PARA GERENCIA (Corregir ortografía y evidencias del técnico) */}
      {editingTargetOrder && (editingEvidencePhoto || showEditTechDataModal) && (
        <GerenciaEvidenceEditModal
          isOpen={Boolean(editingEvidencePhoto || showEditTechDataModal)}
          onClose={() => {
            setEditingEvidencePhoto(null);
            setShowEditTechDataModal(false);
          }}
          order={editingTargetOrder}
          evidenceToEdit={editingEvidencePhoto}
          onSaveEvidence={handleSaveEditedEvidence}
          onSaveTechnicalData={handleSaveEditedTechData}
        />
      )}

      {/* MODAL LIGHTBOX PARA VISUALIZACIÓN EN ALTA RESOLUCIÓN */}
      {zoomPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn"
          onClick={() => setZoomPhoto(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[92vh] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3.5 bg-black/60 flex items-center justify-between text-white shrink-0">
              <div className="min-w-0 pr-4">
                <span className="font-bold text-sm block truncate">{zoomPhoto.title}</span>
                <span className="text-[11px] text-slate-300">
                  Fase: {zoomPhoto.phase === 'antes' ? '1. Antes' : '2. Correctivo realizado'}
                </span>
              </div>
              <button
                onClick={() => setZoomPhoto(null)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white cursor-pointer"
                title="Cerrar vista previa"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-3 bg-black">
              <img
                src={zoomPhoto.url}
                alt={zoomPhoto.title}
                className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
            {zoomPhoto.notes && (
              <div className="p-3 bg-slate-950 text-slate-200 text-xs border-t border-slate-800">
                <strong className="text-amber-400">Observaciones técnicas del técnico: </strong>
                <span>{zoomPhoto.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
