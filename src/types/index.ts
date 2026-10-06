export type UserRole = 'cliente' | 'jefe_taller' | 'tecnico' | 'gerencia';

export type ServiceType = 'taller' | 'asistencia' | 'rescate';

export type VehicleType = 'auto' | 'camion' | 'bus' | 'tractocamion';

export type ServiceStatus = 
  | 'solicitado'                // A: Cliente genera solicitud
  | 'asignado'                  // B: Jefe de taller asigna técnico
  | 'en_diagnostico_trabajo'    // C: Técnico abre OS e inicia labores
  | 'evidencias_en_revision'    // D: Técnico subió evidencias fotográficas e insumos
  | 'evidencias_rechazadas'     // F: Administración solicitó corregir evidencias
  | 'liberacion_autorizada'     // G: Administración autorizó servicio y liberación
  | 'unidad_liberada'           // Técnico ejecutó la entrega física
  | 'cotizacion_pendiente'      // H: Gerencia generó cotización para el cliente
  | 'cotizacion_aprobada'       // I: Cliente autorizó la cotización
  | 'facturado'                 // J: Gerencia realizó la facturación final
  | 'cerrado';

export interface VehicleInfo {
  type: VehicleType;
  plates: string;
  economicNumber: string;
  brandModel?: string;
  location: string;
  failureDescription: string;
  driverContact?: string;
  // Campos del formato oficial de reporte técnico
  chassisSerialNumber?: string; // Número de Serie de Chasis
  engineModelTransmission?: string; // Modelo de Motor/Transmisión
  engineSeriesTransmission?: string; // Serie del Motor/Transmisión
  odometerReading?: string; // Odómetro / Horómetro (ej. 130618 KM)
}

export interface EvidencePhoto {
  id: string;
  phase: 'antes' | 'durante' | 'despues';
  url: string;
  title: string;
  notes?: string;
  timestamp: string;
}

export interface PartUsed {
  id: string;
  partNumber: string;
  description: string;
  quantity: number | string;
  unitPrice: number;
  providedByClient?: boolean; // ej. PROPORCIONADAS POR CLIENTE
  position?: string; // ej. POS 3y4, POS 5y6
}

export interface Quotation {
  id: string;
  createdAt: string;
  laborHours: number;
  laborRatePerHour: number;
  parts: PartUsed[];
  expensesAndTowing: number; // Viáticos / grúa
  notes?: string;
  subtotal: number;
  tax: number; // 16% IVA
  total: number;
  status: 'borrador' | 'enviada' | 'aprobada' | 'rechazada';
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Invoice {
  id: string;
  fiscalFolio: string;
  issueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: 'pendiente' | 'pagada';
  pdfUrl?: string;
  notes?: string;
}

export interface ServiceOrder {
  id: string;
  folio: string; // ej. OS-2026-0104
  createdAt: string;
  clientName: string;
  clientContact: string;
  clientCompany?: string;
  serviceType: ServiceType;
  vehicle: VehicleInfo;
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  status: ServiceStatus;
  
  // Asignación de taller
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedAt?: string;
  
  // Datos del técnico
  startTime?: string;
  initialDiagnosis?: string;
  evidences: EvidencePhoto[];
  partsUsed: PartUsed[];
  technicianCompletedAt?: string;
  physicalReleaseDate?: string;
  releasedBy?: string;
  receivedByDriver?: string;

  // Datos del formato oficial de Reporte Técnico
  reportNumber?: string; // ej. "023" -> REPORTE TÉCNICO 023
  userOperatorName?: string; // ej. "OMAR BALDERAS"
  maintenanceNature?: 'correctivo' | 'preventivo'; // [X] CORRECTIVO / [ ] PREVENTIVO
  preventiveInspectionNotes?: string; // INSPECCIÓN PREVENTIVA
  workPerformedDetail?: string; // SERVICIO REALIZADO
  technicianSignature?: string; // FIRMA DEL TÉCNICO
  clientSignature?: string; // FIRMA DEL CLIENTE
  clientSignatureDate?: string;

  // Validación administrativa
  adminReviewNotes?: string;
  adminApprovedAt?: string;
  adminApprovedBy?: string;
  
  // Cotización y Facturación
  quotation?: Quotation;
  invoice?: Invoice;
}

export interface Technician {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  zone: string;
  status: 'disponible' | 'en_campo' | 'en_taller' | 'ocupado';
  currentOrderId?: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  lastSync?: string;
}
