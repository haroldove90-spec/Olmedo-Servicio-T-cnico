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
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, PartUsed, Quotation } from '../../types';

export const GerenciaPortal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    orders, 
    reviewEvidences, 
    saveQuotation, 
    emitInvoice 
  } = useApp();

  // Modal inspection of evidences
  const [inspectOrder, setInspectOrder] = useState<ServiceOrder | null>(null);
  const [reviewerName, setReviewerName] = useState('Lic. Laura Méndez (Gerencia Administrativa)');
  const [approvalNotes, setApprovalNotes] = useState('Servicio y evidencias validados satisfactoriamente. Se autoriza la liberación de la unidad.');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

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
    const partsSubtotal = (order.quotation?.parts || []).reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);
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
        csvContent += `"${p.partNumber}","${p.description.replace(/"/g, '""')}",${p.quantity},${p.unitPrice},${p.quantity * p.unitPrice}\n`;
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
    <div className="space-y-6 pb-20 lg:pb-8">
      
      {/* Encabezado del Portal de Gerencia */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057]">
                Gerencia Administrativa y Facturación
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Inspección de Evidencias (Antes/Durante/Después) • Autorización de Liberación • Cotizador • Facturación Fiscal
            </p>
          </div>

          <div className="flex items-center gap-2">
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

      {/* MÓDULO 1: VALIDACIÓN DE EVIDENCIAS Y SERVICIO (Paso E en Graph TD) */}
      {(activeModule === 'validacion_evidencias' || activeModule === 'inicio') && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#040057] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                Módulo de Inspección y Validación de Evidencias (Paso E)
              </h2>
              <p className="text-xs text-slate-500">
                Revisa exhaustivamente las fotos subidas por el técnico antes de autorizar la liberación física de la unidad o regresar la orden con observaciones.
              </p>
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              {pendingReviewOrders.length} esperando resolución
            </div>
          </div>

          {pendingReviewOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-700">Sin inspecciones pendientes</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Todas las evidencias han sido aprobadas o los técnicos aún están ejecutando labores en sitio.
              </p>
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

                  {/* Vistas previas de las fotos */}
                  <div className="flex gap-2 py-2 overflow-x-auto">
                    {order.evidences.map((ev) => (
                      <div key={ev.id} className="w-24 shrink-0 bg-slate-50 p-1 rounded-lg border text-[10px]">
                        <img src={ev.url} alt={ev.title} className="w-full h-16 object-cover rounded" />
                        <span className="font-bold uppercase text-[9px] block text-slate-600 mt-0.5">{ev.phase}</span>
                      </div>
                    ))}
                  </div>

                  {/* Botones de Inspección */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
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
              
              {/* Resumen de servicio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-[#040057]">Falla Reportada Inicial:</span>
                  <p className="text-slate-700">{inspectOrder.vehicle.failureDescription}</p>
                </div>
                <div>
                  <span className="font-bold text-[#040057]">Diagnóstico Registrado por Técnico:</span>
                  <p className="text-slate-700">{inspectOrder.initialDiagnosis || 'Diagnóstico de taller'}</p>
                </div>
              </div>

              {/* Galería completa clasificada: ANTES / DURANTE / DESPUÉS */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  Inspección Fotográfica Obligatoria
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['antes', 'durante', 'despues'].map((phaseKey) => {
                    const photos = inspectOrder.evidences.filter(e => e.phase === phaseKey);
                    return (
                      <div key={phaseKey} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-800 uppercase flex items-center justify-between pb-1 border-b border-slate-200">
                          <span>Fase: {phaseKey}</span>
                          <span className="text-[10px] text-slate-500">{photos.length} fotos</span>
                        </div>

                        {photos.map(p => (
                          <div key={p.id} className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                            <img src={p.url} alt={p.title} className="w-full h-32 object-cover rounded" />
                            <div className="font-bold text-slate-800">{p.title}</div>
                            {p.notes && <div className="text-slate-500 text-[11px]">{p.notes}</div>}
                          </div>
                        ))}

                        {photos.length === 0 && (
                          <div className="py-6 text-center text-rose-500 border border-dashed border-rose-300 rounded-lg">
                            ⚠️ Falta evidencia en esta fase
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    <div key={p.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border">
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={p.partNumber}
                          onChange={(e) => handleUpdateQuotePart(p.id, 'partNumber', e.target.value)}
                          placeholder="No. Parte"
                          className="w-full px-2 py-1 border rounded text-[11px]"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={p.description}
                          onChange={(e) => handleUpdateQuotePart(p.id, 'description', e.target.value)}
                          placeholder="Descripción"
                          className="w-full px-2 py-1 border rounded text-[11px]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={p.quantity}
                          onChange={(e) => handleUpdateQuotePart(p.id, 'quantity', Number(e.target.value))}
                          placeholder="Cant"
                          className="w-full px-2 py-1 border rounded text-[11px]"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={p.unitPrice}
                          onChange={(e) => handleUpdateQuotePart(p.id, 'unitPrice', Number(e.target.value))}
                          placeholder="$ Unit"
                          className="w-full px-2 py-1 border rounded text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveQuotePart(p.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-right font-bold text-slate-700 pt-1">
                  Subtotal Refacciones: ${quoteParts.reduce((a, b) => a + (b.quantity * b.unitPrice), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
                const partsSub = quoteParts.reduce((a, b) => a + (b.quantity * b.unitPrice), 0);
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
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-[#040057] text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Reporte Técnico Formal de Servicio</h3>
                <p className="text-xs text-blue-200">{reportOrder.folio} • {reportOrder.clientName}</p>
              </div>
              <button onClick={() => setReportOrder(null)} className="text-slate-300 hover:text-white">✕</button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-sm font-bold text-[#040057]">Ficha de la Unidad y Dictamen</div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>Unidad: {reportOrder.vehicle.type.toUpperCase()}</div>
                  <div>Placas: {reportOrder.vehicle.plates} (Económico {reportOrder.vehicle.economicNumber})</div>
                  <div>Ubicación: {reportOrder.vehicle.location}</div>
                  <div>Técnico: {reportOrder.assignedTechnicianName}</div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-800 mb-2">Evidencias Fotográficas Consolidadas:</div>
                <div className="grid grid-cols-3 gap-3">
                  {reportOrder.evidences.map(ev => (
                    <div key={ev.id} className="border rounded-lg p-2 text-center">
                      <img src={ev.url} alt={ev.title} className="w-full h-24 object-cover rounded mb-1" />
                      <span className="font-bold uppercase text-[10px] text-slate-700">{ev.phase}</span>
                      <p className="text-[10px] text-slate-500 truncate">{ev.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setReportOrder(null)}
                className="px-4 py-2 rounded-xl border text-slate-700 font-semibold text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleExportToExcel(reportOrder)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Descargar en Excel</span>
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

    </div>
  );
};
