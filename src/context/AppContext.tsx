import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, 
  ServiceOrder, 
  Technician, 
  EvidencePhoto, 
  PartUsed, 
  Quotation, 
  Invoice,
  SupabaseConfig,
  ServiceType,
  VehicleInfo
} from '../types';
import { INITIAL_ORDERS, INITIAL_TECHNICIANS } from '../data/mockData';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  // Rol y navegación
  currentRole: UserRole | null;
  setCurrentRole: (role: UserRole | null) => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  
  // Órdenes y Técnicos
  orders: ServiceOrder[];
  technicians: Technician[];
  
  // Flujo completo del sistema (Graph TD)
  createServiceOrder: (data: {
    clientName: string;
    clientContact: string;
    clientCompany?: string;
    serviceType: ServiceType;
    priority: 'baja' | 'media' | 'alta' | 'urgente';
    vehicle: VehicleInfo;
  }) => ServiceOrder;
  
  assignTechnician: (orderId: string, technicianId: string, priority?: 'baja' | 'media' | 'alta' | 'urgente') => void;
  startTechnicianWork: (orderId: string, initialDiagnosis: string) => void;
  addEvidencePhoto: (orderId: string, photo: Omit<EvidencePhoto, 'id' | 'timestamp'>) => void;
  addBatchEvidences: (orderId: string, photos: Omit<EvidencePhoto, 'id' | 'timestamp'>[]) => void;
  updateEvidencePhoto: (orderId: string, photoId: string, updates: Partial<EvidencePhoto>) => void;
  removeEvidencePhoto: (orderId: string, photoId: string) => void;
  updateOrderGeneral: (orderId: string, updates: Partial<ServiceOrder>) => void;
  addPartUsed: (orderId: string, part: Omit<PartUsed, 'id'>) => void;
  removePartUsed: (orderId: string, partId: string) => void;
  submitEvidencesForReview: (orderId: string) => void;
  reviewEvidences: (orderId: string, approved: boolean, notes: string, reviewerName: string) => void;
  correctAndResubmitEvidences: (orderId: string, explanationNotes: string) => void;
  releaseVehiclePhysical: (orderId: string, releasedBy: string, receivedByDriver: string) => void;
  saveQuotation: (orderId: string, quotationData: {
    laborHours: number;
    laborRatePerHour: number;
    parts: PartUsed[];
    expensesAndTowing: number;
    notes?: string;
  }) => void;
  clientRespondQuotation: (orderId: string, approved: boolean, approvedBy: string, notes?: string) => void;
  emitInvoice: (orderId: string, notes?: string) => void;
  
  // Formato oficial de Reporte Técnico
  updateTechnicalReport: (orderId: string, reportData: {
    maintenanceNature?: 'correctivo' | 'preventivo';
    preventiveInspectionNotes?: string;
    workPerformedDetail?: string;
    technicianSignature?: string;
    userOperatorName?: string;
    vehicleUpdates?: {
      chassisSerialNumber?: string;
      engineModelTransmission?: string;
      engineSeriesTransmission?: string;
      odometerReading?: string;
      brandModel?: string;
    };
  }) => void;
  clientSignReport: (orderId: string, clientNameSignature: string) => void;
  
  // Gestión de datos de muestra y Supabase
  isSampleDataCleared: boolean;
  clearAllSampleData: () => void;
  restoreSampleData: () => void;
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: Partial<SupabaseConfig>) => void;
  clearSupabaseRecords: () => Promise<boolean>;

  // Notificaciones
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_ORDERS_KEY = 'olmedo_orders_data';
const STORAGE_TECHS_KEY = 'olmedo_technicians_data';
const STORAGE_HIDE_SAMPLE_KEY = 'olmedo_hide_sample_data';
const STORAGE_SUPABASE_KEY = 'olmedo_supabase_config';
const STORAGE_ROLE_KEY = 'olmedo_current_role';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if user previously decided to delete/hide sample data
  const hideSample = localStorage.getItem(STORAGE_HIDE_SAMPLE_KEY) === 'true';

  const [isSampleDataCleared, setIsSampleDataCleared] = useState<boolean>(hideSample);
  const [currentRole, setCurrentRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem(STORAGE_ROLE_KEY);
    return (saved as UserRole) || null;
  });

  const [activeModule, setActiveModule] = useState<string>('inicio');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initialize orders
  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    if (hideSample) return [];
    try {
      const saved = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_ORDERS;
  });

  // Initialize technicians
  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    if (hideSample) return [];
    try {
      const saved = localStorage.getItem(STORAGE_TECHS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_TECHNICIANS;
  });

  // Supabase config
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SUPABASE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      supabaseUrl: '',
      supabaseAnonKey: '',
      isConnected: false,
    };
  });

  // Persist orders
  useEffect(() => {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  // Persist technicians
  useEffect(() => {
    localStorage.setItem(STORAGE_TECHS_KEY, JSON.stringify(technicians));
  }, [technicians]);

  // Persist role
  const setCurrentRole = (role: UserRole | null) => {
    setCurrentRoleState(role);
    if (role) {
      localStorage.setItem(STORAGE_ROLE_KEY, role);
      // set sensible default module per role
      if (role === 'cliente') setActiveModule('mis_solicitudes');
      else if (role === 'jefe_taller') setActiveModule('bandeja_solicitudes');
      else if (role === 'tecnico') setActiveModule('mis_tareas');
      else if (role === 'gerencia') setActiveModule('validacion_evidencias');
    } else {
      localStorage.removeItem(STORAGE_ROLE_KEY);
      setActiveModule('inicio');
    }
  };

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Clear all sample data permanently and prevent browser from reloading sample data
  const clearAllSampleData = () => {
    localStorage.setItem(STORAGE_HIDE_SAMPLE_KEY, 'true');
    localStorage.removeItem(STORAGE_ORDERS_KEY);
    localStorage.removeItem(STORAGE_TECHS_KEY);
    setOrders([]);
    setTechnicians([]);
    setIsSampleDataCleared(true);
    addToast('success', 'Datos de Muestra Eliminados', 'El sistema ha sido limpiado por completo. El navegador no volverá a cargar datos de muestra.');
  };

  // Option to restore mock data if desired
  const restoreSampleData = () => {
    localStorage.removeItem(STORAGE_HIDE_SAMPLE_KEY);
    setOrders(INITIAL_ORDERS);
    setTechnicians(INITIAL_TECHNICIANS);
    setIsSampleDataCleared(false);
    addToast('info', 'Datos de Muestra Restaurados', 'Se han restablecido los registros de ejemplo del flujo.');
  };

  const updateSupabaseConfig = (cfg: Partial<SupabaseConfig>) => {
    const updated = { ...supabaseConfig, ...cfg };
    setSupabaseConfig(updated);
    localStorage.setItem(STORAGE_SUPABASE_KEY, JSON.stringify(updated));
    addToast('success', 'Configuración de Supabase Guardada', 'Parámetros actualizados localmente.');
  };

  const clearSupabaseRecords = async (): Promise<boolean> => {
    if (!supabaseConfig.supabaseUrl || !supabaseConfig.supabaseAnonKey) {
      addToast('error', 'Supabase No Configurado', 'Ingresa la URL y el Anon Key de Supabase para ejecutar el borrado remoto.');
      return false;
    }
    try {
      // Intentar borrado vía REST de supabase
      const url = supabaseConfig.supabaseUrl.replace(/\/$/, '');
      const headers = {
        'apikey': supabaseConfig.supabaseAnonKey,
        'Authorization': `Bearer ${supabaseConfig.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      };
      
      // Intentar borrar en tabla orders
      await fetch(`${url}/rest/v1/service_orders`, {
        method: 'DELETE',
        headers,
      }).catch(() => null);

      clearAllSampleData();
      addToast('success', 'Registros Limpiados en Supabase', 'Se ejecutó la instrucción de vaciado en tablas remotas y locales.');
      return true;
    } catch {
      clearAllSampleData();
      addToast('warning', 'Aviso de Supabase', 'Tablas locales vaciadas. Verifica políticas RLS si la tabla remota no permitió DELETE.');
      return true;
    }
  };

  // PASO A: Cliente genera Solicitud
  const createServiceOrder = (data: {
    clientName: string;
    clientContact: string;
    clientCompany?: string;
    serviceType: ServiceType;
    priority: 'baja' | 'media' | 'alta' | 'urgente';
    vehicle: VehicleInfo;
  }): ServiceOrder => {
    const now = new Date();
    const folioNum = String(orders.length + 1).padStart(3, '0');
    const newOrder: ServiceOrder = {
      id: `ord-${Date.now()}`,
      folio: `OS-2026-${folioNum}`,
      createdAt: now.toISOString(),
      clientName: data.clientName,
      clientContact: data.clientContact,
      clientCompany: data.clientCompany,
      serviceType: data.serviceType,
      priority: data.priority,
      status: 'solicitado',
      vehicle: data.vehicle,
      evidences: [],
      partsUsed: [],
    };

    setOrders(prev => [newOrder, ...prev]);
    addToast('success', 'Solicitud Registrada con Éxito', `Folio ${newOrder.folio} creado para ${data.vehicle.type.toUpperCase()} placas ${data.vehicle.plates}.`);
    return newOrder;
  };

  // PASO B: Jefe de Taller recibe y asigna Técnico
  const assignTechnician = (orderId: string, technicianId: string, priority?: 'baja' | 'media' | 'alta' | 'urgente') => {
    const tech = technicians.find(t => t.id === technicianId);
    if (!tech) return;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'asignado',
          assignedTechnicianId: tech.id,
          assignedTechnicianName: tech.name,
          assignedAt: new Date().toISOString(),
          priority: priority || o.priority,
        };
      }
      return o;
    }));

    // Actualizar estatus del técnico
    setTechnicians(prev => prev.map(t => {
      if (t.id === technicianId) {
        return { ...t, status: 'en_campo', currentOrderId: orderId };
      }
      return t;
    }));

    addToast('info', 'Técnico Asignado Operativamente', `${tech.name} ha sido asignado a la orden.`);
  };

  // PASO C: Técnico abre Orden de Servicio e inicia trabajo
  const startTechnicianWork = (orderId: string, initialDiagnosis: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'en_diagnostico_trabajo',
          startTime: now,
          initialDiagnosis,
        };
      }
      return o;
    }));
    addToast('info', 'Orden de Servicio Iniciada', 'Hora de inicio y diagnóstico en sitio registrados.');
  };

  // PASO D: Técnico sube evidencias fotográficas e insumos
  const addEvidencePhoto = (orderId: string, photo: Omit<EvidencePhoto, 'id' | 'timestamp'>) => {
    const newEvidence: EvidencePhoto = {
      ...photo,
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          evidences: [...o.evidences, newEvidence],
        };
      }
      return o;
    }));
    addToast('success', 'Evidencia Fotográfica Cargada', `Fase: ${photo.phase.toUpperCase()} - ${photo.title}`);
  };

  const removeEvidencePhoto = (orderId: string, photoId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          evidences: o.evidences.filter(e => e.id !== photoId),
        };
      }
      return o;
    }));
  };

  const addBatchEvidences = (orderId: string, photos: Omit<EvidencePhoto, 'id' | 'timestamp'>[]) => {
    const newItems: EvidencePhoto[] = photos.map((p, idx) => ({
      ...p,
      id: `ev-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    }));

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          evidences: [...o.evidences, ...newItems],
        };
      }
      return o;
    }));
    addToast('success', `${newItems.length} Evidencias Guardadas`, 'Se agregaron las fotografías y notas a la orden.');
  };

  const updateEvidencePhoto = (orderId: string, photoId: string, updates: Partial<EvidencePhoto>) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          evidences: o.evidences.map(e => {
            if (e.id === photoId) {
              return { ...e, ...updates };
            }
            return e;
          }),
        };
      }
      return o;
    }));
    addToast('success', 'Evidencia Actualizada', 'Los datos y observaciones fueron guardados exitosamente.');
  };

  const updateOrderGeneral = (orderId: string, updates: Partial<ServiceOrder>) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          ...updates,
          vehicle: updates.vehicle ? { ...o.vehicle, ...updates.vehicle } : o.vehicle,
        };
      }
      return o;
    }));
    addToast('success', 'Registro Actualizado', 'La información técnica fue corregida y guardada.');
  };

  const addPartUsed = (orderId: string, part: Omit<PartUsed, 'id'>) => {
    const newPart: PartUsed = {
      ...part,
      id: `pu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          partsUsed: [...o.partsUsed, newPart],
        };
      }
      return o;
    }));
    addToast('info', 'Insumo/Refacción Agregado', `${part.description} (${part.quantity} pza)`);
  };

  const removePartUsed = (orderId: string, partId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          partsUsed: o.partsUsed.filter(p => p.id !== partId),
        };
      }
      return o;
    }));
  };

  // Técnico envía a revisión administrativa
  const submitEvidencesForReview = (orderId: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'evidencias_en_revision',
          technicianCompletedAt: now,
        };
      }
      return o;
    }));
    addToast('success', 'Evidencias Enviadas a Gerencia', 'Se notificó al área administrativa para validación e inspección.');
  };

  // PASO E & F: Área Administrativa valida servicio y evidencias
  const reviewEvidences = (orderId: string, approved: boolean, notes: string, reviewerName: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        if (approved) {
          // PASO G: Autoriza liberación y habilita reporte formal
          return {
            ...o,
            status: 'liberacion_autorizada',
            adminReviewNotes: notes || 'Servicio y evidencias fotográficas aprobados satisfactoriamente.',
            adminApprovedAt: now,
            adminApprovedBy: reviewerName || 'Gerencia Administrativa',
          };
        } else {
          // PASO F: Rechaza / Observaciones -> Regresa al técnico
          return {
            ...o,
            status: 'evidencias_rechazadas',
            adminReviewNotes: notes,
          };
        }
      }
      return o;
    }));

    if (approved) {
      addToast('success', 'Evidencias Aprobadas', 'Liberación física de la unidad autorizada y reporte habilitado.');
    } else {
      addToast('warning', 'Evidencias Observadas / Rechazadas', 'Se regresó la orden al técnico con notas de corrección.');
    }
  };

  // Técnico atiende observaciones y reenvía
  const correctAndResubmitEvidences = (orderId: string, explanationNotes: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'evidencias_en_revision',
          adminReviewNotes: `[RE-ENVIADO POR TÉCNICO]: ${explanationNotes} | Ant. nota: ${o.adminReviewNotes || ''}`,
        };
      }
      return o;
    }));
    addToast('info', 'Evidencias Reenviadas a Revisión', 'Correcciones enviadas a Gerencia Administrativa.');
  };

  // Liberación física de la unidad ejecutada por el técnico
  const releaseVehiclePhysical = (orderId: string, releasedBy: string, receivedByDriver: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: o.quotation ? o.status : 'unidad_liberada',
          physicalReleaseDate: now,
          releasedBy,
          receivedByDriver,
        };
      }
      return o;
    }));
    addToast('success', 'Unidad Liberada Físicamente', `Entrega completada a ${receivedByDriver}.`);
  };

  // PASO H: Gerencia Administrativa genera Cotización
  const saveQuotation = (orderId: string, quotationData: {
    laborHours: number;
    laborRatePerHour: number;
    parts: PartUsed[];
    expensesAndTowing: number;
    notes?: string;
  }) => {
    const laborSubtotal = quotationData.laborHours * quotationData.laborRatePerHour;
    const partsSubtotal = quotationData.parts.reduce((acc, p) => {
      const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1);
      return acc + (q * p.unitPrice);
    }, 0);
    const subtotal = laborSubtotal + partsSubtotal + (quotationData.expensesAndTowing || 0);
    const tax = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    const quotation: Quotation = {
      id: `cot-${Date.now()}`,
      createdAt: new Date().toISOString(),
      laborHours: quotationData.laborHours,
      laborRatePerHour: quotationData.laborRatePerHour,
      parts: quotationData.parts,
      expensesAndTowing: quotationData.expensesAndTowing || 0,
      notes: quotationData.notes,
      subtotal,
      tax,
      total,
      status: 'enviada',
    };

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          quotation,
          status: 'cotizacion_pendiente',
        };
      }
      return o;
    }));
    addToast('success', 'Cotización Generada y Enviada', `Presupuesto de $${total.toLocaleString('es-MX')} enviado al Portal del Cliente.`);
  };

  // PASO I: Cliente recibe y Autoriza (o rechaza) Cotización
  const clientRespondQuotation = (orderId: string, approved: boolean, approvedBy: string, notes?: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId && o.quotation) {
        return {
          ...o,
          status: approved ? 'cotizacion_aprobada' : o.status,
          quotation: {
            ...o.quotation,
            status: approved ? 'aprobada' : 'rechazada',
            approvedAt: approved ? now : undefined,
            approvedBy: approved ? approvedBy : undefined,
            rejectionReason: !approved ? notes : undefined,
          },
        };
      }
      return o;
    }));

    if (approved) {
      addToast('success', 'Cotización Aprobada por el Cliente', `Autorizada por ${approvedBy}. Listo para emisión de Factura.`);
    } else {
      addToast('warning', 'Cotización Rechazada por el Cliente', notes || 'El cliente ha devuelto la cotización con observaciones.');
    }
  };

  // PASO J: Gerencia realiza Facturación
  const emitInvoice = (orderId: string, notes?: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder || !targetOrder.quotation) {
      addToast('error', 'Error en Facturación', 'Se requiere una cotización aprobada para emitir factura.');
      return;
    }

    const now = new Date().toISOString();
    const invoiceNum = String(Math.floor(1000 + Math.random() * 9000));
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      fiscalFolio: `OLM-CFDI-2026-${invoiceNum}`,
      issueDate: now,
      subtotal: targetOrder.quotation.subtotal,
      tax: targetOrder.quotation.tax,
      total: targetOrder.quotation.total,
      paymentStatus: 'pendiente',
      notes: notes || 'Factura emitida conforme a orden de servicio autorizada.',
    };

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          invoice,
          status: 'facturado',
        };
      }
      return o;
    }));

    addToast('success', 'Factura Emitida Exitosamente', `Folio fiscal: ${invoice.fiscalFolio} por $${invoice.total.toLocaleString('es-MX')}`);
  };

  // Actualizar datos del formato oficial de Reporte Técnico
  const updateTechnicalReport = (orderId: string, reportData: {
    maintenanceNature?: 'correctivo' | 'preventivo';
    preventiveInspectionNotes?: string;
    workPerformedDetail?: string;
    technicianSignature?: string;
    userOperatorName?: string;
    vehicleUpdates?: {
      chassisSerialNumber?: string;
      engineModelTransmission?: string;
      engineSeriesTransmission?: string;
      odometerReading?: string;
      brandModel?: string;
    };
  }) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          maintenanceNature: reportData.maintenanceNature || o.maintenanceNature || 'correctivo',
          preventiveInspectionNotes: reportData.preventiveInspectionNotes ?? o.preventiveInspectionNotes,
          workPerformedDetail: reportData.workPerformedDetail ?? o.workPerformedDetail,
          technicianSignature: reportData.technicianSignature ?? o.technicianSignature,
          userOperatorName: reportData.userOperatorName ?? o.userOperatorName,
          vehicle: {
            ...o.vehicle,
            ...(reportData.vehicleUpdates || {}),
          },
        };
      }
      return o;
    }));
    addToast('success', 'Formato de Reporte Actualizado', 'Ficha técnica y detalle del servicio guardados.');
  };

  // Firma del cliente de conformidad
  const clientSignReport = (orderId: string, clientNameSignature: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          clientSignature: clientNameSignature,
          clientSignatureDate: now,
        };
      }
      return o;
    }));
    addToast('success', 'Reporte Técnico Firmado de Conformidad', `Firma registrada para ${clientNameSignature}.`);
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        activeModule,
        setActiveModule,
        orders,
        technicians,
        createServiceOrder,
        assignTechnician,
        startTechnicianWork,
        addEvidencePhoto,
        addBatchEvidences,
        updateEvidencePhoto,
        removeEvidencePhoto,
        updateOrderGeneral,
        addPartUsed,
        removePartUsed,
        submitEvidencesForReview,
        reviewEvidences,
        correctAndResubmitEvidences,
        releaseVehiclePhysical,
        saveQuotation,
        clientRespondQuotation,
        emitInvoice,
        updateTechnicalReport,
        clientSignReport,
        isSampleDataCleared,
        clearAllSampleData,
        restoreSampleData,
        supabaseConfig,
        updateSupabaseConfig,
        clearSupabaseRecords,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
