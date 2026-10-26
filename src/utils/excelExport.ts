import * as XLSX from 'xlsx';
import { ServiceOrder } from '../types';
import { getStatusSemaphore } from './statusSemaphore';

export interface ExportExcelOptions {
  filenamePrefix?: string;
  sheetName?: string;
  businessName?: string;
}

/**
 * Genera y descarga un archivo .xlsx nativo de Excel con el historial de reportes de falla y órdenes de servicio.
 * Soporta descarga uno por uno, seleccionados o el historial completo.
 * Incluye dos hojas:
 *  1. "Historial de Reportes": Vista completa y estructurada de cada orden
 *  2. "Refacciones Utilizadas": Desglose individual de piezas y refacciones instaladas
 */
export function exportOrdersToExcel(
  ordersToExport: ServiceOrder[],
  options: ExportExcelOptions = {}
): boolean {
  if (!ordersToExport || ordersToExport.length === 0) {
    return false;
  }

  const businessName = options.businessName || 'Servicio Técnico Olmedo';
  const prefix = options.filenamePrefix || 'Historial_Reportes';

  // Hoja 1: Resumen y Datos Principales de Reportes de Falla
  const mainData = ordersToExport.map((o) => {
    const partsCount = (o.partsUsed || []).length;
    const partsSummary = (o.partsUsed || [])
      .map((p) => {
        const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 0);
        return `${q}x [${p.partNumber || 'S/N'}] ${p.description}`;
      })
      .join('; ');

    const partsTotal = (o.partsUsed || []).reduce((acc, p) => {
      const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 0);
      const pr = typeof p.unitPrice === 'number' ? p.unitPrice : (parseFloat(String(p.unitPrice)) || 0);
      return acc + (q * pr);
    }, 0);

    const formattedCreation = o.createdAt
      ? new Date(o.createdAt).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    const formattedClosed = o.closedAt
      ? new Date(o.closedAt).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    const anyOrder = o as any;
    const vehicleYear = anyOrder.vehicle?.year || '';
    const phone = o.operatorPhone || o.vehicle.driverContact || anyOrder.clientPhone || '';

    return {
      'Taller / Negocio': businessName,
      'Folio de Orden': o.folio,
      'No. Reporte': o.reportNumber || 'S/N',
      'Fecha Creación': formattedCreation,
      'Estatus': getStatusSemaphore(o.status).label,
      'Tipo Servicio': o.serviceType ? o.serviceType.toUpperCase() : 'TALLER',
      'Prioridad': o.priority ? o.priority.toUpperCase() : 'NORMAL',
      'Cliente': o.clientCompany || o.clientName || 'Sin especificar',
      'Contacto Cliente': o.clientContact || '',
      'Teléfono Contacto / Chofer': phone,
      'Operador / Chofer': o.userOperatorName || o.operatorName || o.receivedByDriver || o.vehicle.driverContact || '',
      'Placas': o.vehicle.plates || 'S/P',
      'No. Económico': o.vehicle.economicNumber || 'S/E',
      'Marca': o.vehicle.brand || '',
      'Modelo': o.vehicle.model || '',
      'Año': vehicleYear,
      'Odómetro / KM': o.vehicle.odometerReading || o.vehicle.mileage || '',
      'Serie Chasis (VIN)': o.vehicle.chassisSerialNumber || '',
      'Motor / Transmisión': o.vehicle.engineModelTransmission || '',
      'Ubicación': o.vehicle.location || 'En Taller Matriz',
      'Falla Reportada por Cliente': o.vehicle.failureDescription || '',
      'Diagnóstico Técnico Inicial': o.initialDiagnosis || '',
      'Trabajo / Correctivo Realizado': o.workPerformedDetail || '',
      'Técnico Asignado': o.assignedTechnicianName || 'Por asignar',
      'Fotos Evidencia': (o.evidences || []).length,
      'Total Refacciones (Pzas)': partsCount,
      'Detalle de Refacciones': partsSummary || 'Ninguna registrada',
      'Costo Total Refacciones ($)': partsTotal,
      'Fecha de Cierre': formattedClosed || 'En proceso',
      'Cerrado Por': o.closedBy || '',
      'Dictamen Final de Cierre': o.closingNotes || '',
      'Chofer que Recibió Unidad': o.receivedByDriver || '',
      'KM al Cierre': o.finalKilometers || '',
      'Total Cotizado ($)': o.quotation?.total || 0,
      'Total Facturado ($)': o.invoice?.total || 0,
    };
  });

  // Hoja 2: Desglose de Refacciones
  const partsData: Array<{
    'Folio Orden': string;
    'No. Reporte': string;
    'Cliente': string;
    'Económico': string;
    'Placas': string;
    'No. de Parte': string;
    'Descripción Refacción': string;
    'Cantidad': number;
    'Precio Unitario ($)': number;
    'Subtotal ($)': number;
  }> = [];

  ordersToExport.forEach((o) => {
    (o.partsUsed || []).forEach((p) => {
      const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 0);
      const pr = typeof p.unitPrice === 'number' ? p.unitPrice : (parseFloat(String(p.unitPrice)) || 0);
      partsData.push({
        'Folio Orden': o.folio,
        'No. Reporte': o.reportNumber || 'S/N',
        'Cliente': o.clientCompany || o.clientName || '',
        'Económico': o.vehicle.economicNumber || '',
        'Placas': o.vehicle.plates || '',
        'No. de Parte': p.partNumber || 'S/N',
        'Descripción Refacción': p.description,
        'Cantidad': q,
        'Precio Unitario ($)': pr,
        'Subtotal ($)': q * pr,
      });
    });
  });

  // Crear libro de trabajo (Workbook)
  const workbook = XLSX.utils.book_new();

  // 1. Hoja principal
  const mainWorksheet = XLSX.utils.json_to_sheet(mainData);

  // Autoajuste de anchos de columna para Hoja 1
  const colWidths = [
    { wch: 24 }, // Taller / Negocio
    { wch: 14 }, // Folio
    { wch: 14 }, // No. Reporte
    { wch: 18 }, // Fecha Creación
    { wch: 55 }, // Estatus
    { wch: 14 }, // Tipo Servicio
    { wch: 12 }, // Prioridad
    { wch: 28 }, // Cliente
    { wch: 20 }, // Contacto Cliente
    { wch: 18 }, // Teléfono Contacto / Chofer
    { wch: 22 }, // Operador
    { wch: 12 }, // Placas
    { wch: 14 }, // No. Económico
    { wch: 14 }, // Marca
    { wch: 16 }, // Modelo
    { wch: 8 },  // Año
    { wch: 16 }, // Odómetro
    { wch: 22 }, // VIN
    { wch: 22 }, // Motor
    { wch: 24 }, // Ubicación
    { wch: 38 }, // Falla Reportada
    { wch: 35 }, // Diagnóstico
    { wch: 38 }, // Trabajo Realizado
    { wch: 24 }, // Técnico Asignado
    { wch: 14 }, // Fotos Evidencia
    { wch: 14 }, // Refacciones Pzas
    { wch: 45 }, // Detalle Refacciones
    { wch: 16 }, // Costo Refacciones
    { wch: 18 }, // Fecha Cierre
    { wch: 24 }, // Cerrado Por
    { wch: 38 }, // Dictamen Cierre
    { wch: 22 }, // Chofer Recibió
    { wch: 14 }, // KM Cierre
    { wch: 14 }, // Cotizado
    { wch: 14 }, // Facturado
  ];
  mainWorksheet['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(workbook, mainWorksheet, options.sheetName || 'Reportes de Falla');

  // 2. Hoja de Refacciones (si hay partidas o si se exportan múltiples órdenes)
  if (partsData.length > 0) {
    const partsWorksheet = XLSX.utils.json_to_sheet(partsData);
    partsWorksheet['!cols'] = [
      { wch: 14 }, // Folio Orden
      { wch: 14 }, // No. Reporte
      { wch: 26 }, // Cliente
      { wch: 14 }, // Económico
      { wch: 12 }, // Placas
      { wch: 18 }, // No. de Parte
      { wch: 35 }, // Descripción
      { wch: 10 }, // Cantidad
      { wch: 16 }, // Precio Unitario
      { wch: 16 }, // Subtotal
    ];
    XLSX.utils.book_append_sheet(workbook, partsWorksheet, 'Refacciones Utilizadas');
  }

  // Generar y descargar archivo binario .xlsx
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Servicio_Tecnico_Olmedo_${cleanPrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
  return true;
}
