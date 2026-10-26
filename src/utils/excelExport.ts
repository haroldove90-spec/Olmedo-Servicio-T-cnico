import * as XLSX from 'xlsx';
import { ServiceOrder } from '../types';
import { getStatusSemaphore } from './statusSemaphore';

export interface ExportExcelOptions {
  filenamePrefix?: string;
  sheetName?: string;
  businessName?: string;
  companyName?: string;
}

/**
 * Formatea el Tipo de Servicio Solicitado según la captura de Excel del usuario:
 * - "Ingreso a Taller"
 * - "Asistencia Vial"
 * - "Rescate"
 */
export function formatTipoServicioSolicitado(order: ServiceOrder): string {
  if (order.requiresRescue || order.serviceType === 'rescate') {
    return 'Rescate';
  }
  if (order.serviceType === 'asistencia') {
    return 'Asistencia Vial';
  }
  return 'Ingreso a Taller';
}

/**
 * Formatea la fecha de creación en formato DD/MM/YYYY idéntico al Excel del usuario
 */
export function formatFechaCreacionExcel(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Genera y descarga el archivo Excel (.xlsx) con la estructura EXACTA de la captura de pantalla:
 * Banner Coral: "Historial de Reporte de falla"
 * Metadata: Empresa, Fecha Descarga, Estatus de Factura: normal, Año: 2026
 * Columnas:
 * 1. Fecha de Creacion
 * 2. Unidad/Económico
 * 3. Operador
 * 4. Kilometraje/Hubodómetro
 * 5. Tipo de Servicio Solicitado
 * 6. Falla Reportada
 * 7. Ubicación
 */
export function exportHistorialReporteFallaExcel(
  ordersToExport: ServiceOrder[],
  options: {
    companyName?: string;
    downloadDate?: string;
    year?: string;
    filenamePrefix?: string;
  } = {}
): boolean {
  if (!ordersToExport || ordersToExport.length === 0) {
    return false;
  }

  const firstOrder = ordersToExport[0];
  const companyName = 
    options.companyName || 
    firstOrder.clientCompany || 
    firstOrder.clientName || 
    'GRUPO SATI S.A. DE C.V.';

  const now = new Date();
  const dayName = now.toLocaleDateString('es-MX', { weekday: 'long' });
  const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const monthName = now.toLocaleDateString('es-MX', { month: 'long' });
  const monthNameCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const formattedDownloadDate = options.downloadDate || `${dayNameCap} ${now.getDate()} de ${monthNameCap} del ${now.getFullYear()}`;
  const yearStr = options.year || String(now.getFullYear());

  // Construir matriz bidimensional (AOA) para respetar las filas de banner y metadatos
  const sheetRows: any[][] = [
    // Fila 1: Banner Superior
    ['Historial de Reporte de falla', '', '', '', '', '', ''],
    // Fila 2: Empresa
    ['Empresa:', companyName, '', '', '', '', ''],
    // Fila 3: Fecha Descarga
    ['Fecha Descarga:', formattedDownloadDate, '', '', '', '', ''],
    // Fila 4: Estatus de Factura
    ['Estatus de Factura:', 'normal', '', '', '', '', ''],
    // Fila 5: Año
    ['Año:', yearStr, '', '', '', '', ''],
    // Fila 6: Separador
    ['', '', '', '', '', '', ''],
    // Fila 7: Cabeceras de tabla idénticas a la captura
    [
      'Fecha de Creacion',
      'Unidad/Económico',
      'Operador',
      'Kilometraje',
      'Tipo de Servicio Solicitado',
      'Falla Reportada',
      'Ubicación'
    ]
  ];

  // Filas de datos (Filas 8 en adelante)
  ordersToExport.forEach(o => {
    const fecha = formatFechaCreacionExcel(o.createdAt);
    
    // Unidad / Económico: Priorizar número económico (ej. ECO 01, ECO 023)
    const economico = o.vehicle?.economicNumber || o.unitNumber || 'S/E';
    
    // Operador: Nombre y teléfono si existe
    const opName = o.operatorName || o.userOperatorName || o.vehicle?.driverContact || 'Operador en turno';
    const opPhone = o.operatorPhone ? ` (${o.operatorPhone})` : '';
    const operador = `${opName}${opPhone}`;

    // Kilometraje / Hubodómetro
    const km = o.vehicle?.odometerReading || o.vehicle?.mileage || 'S/K';

    // Tipo de Servicio Solicitado
    const tipoServicio = formatTipoServicioSolicitado(o);

    // Falla Reportada
    const falla = o.vehicle?.failureDescription || o.initialDiagnosis || 'Revisión técnica general';

    // Ubicación
    const ubicacion = o.vehicle?.location || 'Laborando';

    sheetRows.push([
      fecha,
      economico,
      operador,
      km,
      tipoServicio,
      falla,
      ubicacion
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);

  // Combinar celda del banner superior (A1:G1)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }
  ];

  // Ancho óptimo de columnas
  ws['!cols'] = [
    { wch: 18 }, // Fecha de Creacion
    { wch: 22 }, // Unidad/Económico
    { wch: 32 }, // Operador
    { wch: 25 }, // Kilometraje/Hubodómetro
    { wch: 28 }, // Tipo de Servicio Solicitado
    { wch: 48 }, // Falla Reportada
    { wch: 35 }  // Ubicación
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Historial de Reporte de falla');

  const prefix = options.filenamePrefix || 'Historial_Reporte_Falla';
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStamp = now.toISOString().slice(0, 10);
  const filename = `Historial_Reporte_Falla_${cleanPrefix}_${dateStamp}.xlsx`;

  XLSX.writeFile(wb, filename);
  return true;
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
