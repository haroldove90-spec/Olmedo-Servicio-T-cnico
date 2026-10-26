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
  VehicleInfo,
  ServiceCatalogItem,
  RepairLog,
  Employee,
  AppNotification,
  UnitCatalogItem,
  VideoEvidence,
  ClientObservation,
  ServiceStatus,
  VehicleType,
  AssignmentAlertData,
  ClientCompany
} from '../types';
import { INITIAL_ORDERS, INITIAL_TECHNICIANS, INITIAL_SERVICES, INITIAL_NOTIFICATIONS, INITIAL_UNITS, INITIAL_CLIENTS } from '../data/mockData';
import { playEmergencyAlertSound, playAssignmentAlertSound } from '../utils/audioAlert';

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
  closeRepairOrder: (orderId: string, closingData: {
    closedBy: string;
    closedByRole: UserRole;
    closingNotes?: string;
    receivedByDriver?: string;
    finalKilometers?: string;
  }) => void;
  deleteOrder: (orderId: string) => void;
  saveQuotation: (orderId: string, quotationData: {
    laborHours: number;
    laborRatePerHour: number;
    parts: PartUsed[];
    expensesAndTowing: number;
    notes?: string;
  }) => void;
  clientRespondQuotation: (orderId: string, approved: boolean, approvedBy: string, notes?: string) => void;
  emitInvoice: (orderId: string, notes?: string) => void;
  
  // Formato oficial de Reporte Técnico y Recepción de Unidad
  createUnitReception: (data: {
    existingOrderId?: string;
    clientName: string;
    clientContact: string;
    clientCompany?: string;
    serviceType?: ServiceType;
    priority?: 'baja' | 'media' | 'alta' | 'urgente';
    vehicle: VehicleInfo;
    maintenanceNature: 'correctivo' | 'preventivo';
    preventiveInspectionNotes: string;
    userOperatorName: string;
    workPerformedDetail?: string;
    assignedTechnicianId?: string;
    receivedByStaffName?: string;
  }) => ServiceOrder;
  updateTechnicalReport: (orderId: string, reportData: {
    maintenanceNature?: 'correctivo' | 'preventivo';
    preventiveInspectionNotes?: string;
    workPerformedDetail?: string;
    technicianSignature?: string;
    userOperatorName?: string;
    vehicleUpdates?: {
      brand?: string;
      model?: string;
      brandModel?: string;
      plates?: string;
      economicNumber?: string;
      chassisSerialNumber?: string;
      engineModelTransmission?: string;
      engineSeriesTransmission?: string;
      odometerReading?: string;
    };
  }) => void;
  clientSignReport: (orderId: string, clientNameSignature: string) => void;

  // Gestión de Empleados (Técnicos, Jefes de taller, Admin, Gerencia)
  addEmployee: (employee: Omit<Technician, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Technician>) => void;
  deleteEmployee: (id: string) => void;

  // Reparaciones de la unidad
  addRepairLog: (orderId: string, repair: Omit<RepairLog, 'id' | 'createdAt'>) => void;
  updateRepairLog: (orderId: string, repairId: string, updates: Partial<RepairLog>) => void;
  removeRepairLog: (orderId: string, repairId: string) => void;
  
  // Catálogo de Servicios y Precios
  services: ServiceCatalogItem[];
  addServiceItem: (item: Omit<ServiceCatalogItem, 'id'>) => void;
  updateServiceItem: (id: string, updates: Partial<ServiceCatalogItem>) => void;
  deleteServiceItem: (id: string) => void;

  // Importar y adjuntar cotización en PDF
  attachQuotationPdf: (orderId: string, pdfUrl: string, fileName: string) => void;

  // Gestión de datos de muestra y Supabase
  isSampleDataCleared: boolean;
  clearAllSampleData: () => void;
  restoreSampleData: () => void;
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: Partial<SupabaseConfig>) => void;
  clearSupabaseRecords: () => Promise<boolean>;

  // Notificaciones y Alertas
  notifications: AppNotification[];
  unreadNotificationsCount: (role: UserRole) => number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (role: UserRole) => void;
  deleteNotification: (id: string) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Catálogo de Unidades dadas de alta por el admin
  units: UnitCatalogItem[];
  addUnit: (unit: Omit<UnitCatalogItem, 'id'>) => void;
  updateUnit: (id: string, updates: Partial<UnitCatalogItem>) => void;
  deleteUnit: (id: string) => void;

  // Catálogo y Expediente de Clientes / Empresas
  clients: ClientCompany[];
  addClient: (client: Omit<ClientCompany, 'id' | 'createdAt'>) => ClientCompany;
  updateClient: (id: string, updates: Partial<ClientCompany>) => void;
  deleteClient: (id: string) => void;

  // Reporte de Falla del Cliente
  createClientFaultReport: (data: {
    unitNumber: string;
    plates: string;
    economicNumber: string;
    brandModel?: string;
    vehicleType?: import('../types').VehicleType;
    odometer: string;
    operatorName: string;
    operatorPhone: string;
    failureDescription: string;
    location: string;
    serviceType?: import('../types').ServiceType;
    requiresRescue: boolean;
    rescueLocationUrl?: string;
    photos: Array<{ id: string; url: string; title: string; timestamp: string }>;
    videos?: VideoEvidence[];
    clientName?: string;
    clientCompany?: string;
  }) => ServiceOrder;

  addClientObservation: (orderId: string, observationText: string, author?: string, photos?: EvidencePhoto[]) => void;
  updateOrderStatus: (orderId: string, newStatus: ServiceStatus, notes?: string) => void;

  // Alerta emergente en vivo con sonido para Jefe de Taller y Admin
  incomingAlertOrder: ServiceOrder | null;
  dismissIncomingAlert: () => void;

  // Alerta emergente en vivo cuando Jefe de Taller asigna a un Técnico
  latestAssignmentAlert: AssignmentAlertData | null;
  dismissAssignmentAlert: () => void;
  triggerAssignmentAlert: (order: ServiceOrder, technician: Technician, priority?: 'baja' | 'media' | 'alta' | 'urgente', notes?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_ORDERS_KEY = 'olmedo_orders_data';
const STORAGE_TECHS_KEY = 'olmedo_technicians_data';
const STORAGE_SERVICES_KEY = 'olmedo_services_catalog';
const STORAGE_HIDE_SAMPLE_KEY = 'olmedo_hide_sample_data';
const STORAGE_SUPABASE_KEY = 'olmedo_supabase_config';
const STORAGE_ROLE_KEY = 'olmedo_current_role';
const STORAGE_NOTIFICATIONS_KEY = 'olmedo_notifications_data';
const STORAGE_UNITS_KEY = 'olmedo_units_catalog';
const STORAGE_CLIENTS_KEY = 'olmedo_clients_catalog_v1';

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

  // Alerta emergente en vivo con sonido para Jefe de Taller y Admin (Nuevo Reporte)
  const [incomingAlertOrder, setIncomingAlertOrder] = useState<ServiceOrder | null>(null);
  const dismissIncomingAlert = () => setIncomingAlertOrder(null);

  // Alerta emergente en vivo con sonido cuando Jefe de Taller asigna a un Técnico
  const [latestAssignmentAlert, setLatestAssignmentAlert] = useState<AssignmentAlertData | null>(null);
  const dismissAssignmentAlert = () => setLatestAssignmentAlert(null);
  const triggerAssignmentAlert = (order: ServiceOrder, technician: Technician, priority?: 'baja' | 'media' | 'alta' | 'urgente', notes?: string) => {
    setLatestAssignmentAlert({
      order,
      technician,
      assignedBy: 'Jefe de Taller',
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      priority: priority || order.priority || 'alta',
      notes,
    });
    playAssignmentAlertSound();
  };

  // Catálogo de Unidades (Unidad 1 a 50) dadas de alta por Admin
  const [units, setUnits] = useState<UnitCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_UNITS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_UNITS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(units));
  }, [units]);

  const addUnit = (unit: Omit<UnitCatalogItem, 'id'>) => {
    const newUnit: UnitCatalogItem = {
      ...unit,
      id: `unit-${Date.now()}`,
    };
    setUnits(prev => [newUnit, ...prev]);
    addToast('success', 'Unidad Registrada', `La ${newUnit.unitNumber} (${newUnit.plates}) fue dada de alta.`);
  };

  const updateUnit = (id: string, updates: Partial<UnitCatalogItem>) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    addToast('success', 'Unidad Actualizada', 'Los datos de la unidad han sido actualizados.');
  };

  const deleteUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    addToast('info', 'Unidad Eliminada', 'La unidad ha sido retirada del catálogo.');
  };

  // Catálogo y Registro de Clientes / Empresas
  const [clients, setClients] = useState<ClientCompany[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CLIENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CLIENTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

  const addClient = (clientData: Omit<ClientCompany, 'id' | 'createdAt'>): ClientCompany => {
    const newClient: ClientCompany = {
      ...clientData,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setClients(prev => [newClient, ...prev]);
    addToast('success', 'Empresa Registrada', `La empresa "${newClient.companyName}" ha sido dada de alta exitosamente.`);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<ClientCompany>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addToast('success', 'Cliente Actualizado', 'Los datos del cliente han sido actualizados.');
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    addToast('info', 'Cliente Eliminado', 'La empresa ha sido eliminada del catálogo.');
  };

  // Notificaciones del sistema
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (hideSample) return [];
    try {
      const saved = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Initialize services catalog
  const [services, setServices] = useState<ServiceCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SERVICES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_SERVICES;
  });

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

  // Persist notifications
  useEffect(() => {
    localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Persist orders
  useEffect(() => {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  // Persist technicians
  useEffect(() => {
    localStorage.setItem(STORAGE_TECHS_KEY, JSON.stringify(technicians));
  }, [technicians]);

  // Persist services catalog
  useEffect(() => {
    localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(services));
  }, [services]);

  // Persist role & set appropriate default modules
  const setCurrentRole = (role: UserRole | null) => {
    setCurrentRoleState(role);
    if (role) {
      localStorage.setItem(STORAGE_ROLE_KEY, role);
      // Asignar módulo de inicio según las especificaciones del usuario
      if (role === 'cliente') setActiveModule('inicio'); // Entra directamente al Home del cliente con los botones
      else if (role === 'jefe_taller') setActiveModule('metricas'); // PÁGINA DE INICIO: Módulo de Métricas
      else if (role === 'tecnico') setActiveModule('metricas'); // Módulo de Métricas del Técnico
      else if (role === 'gerencia') setActiveModule('metricas'); // Módulo de Métricas de Gerencia
    } else {
      localStorage.removeItem(STORAGE_ROLE_KEY);
      setActiveModule('inicio');
    }
  };

  // Helper de conteo de no leídas para un rol específico
  const unreadNotificationsCount = (role: UserRole): number => {
    return notifications.filter(n => !n.read && (n.targetRole === role || n.targetRole === 'all')).length;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = (role: UserRole) => {
    setNotifications(prev => prev.map(n => 
      (n.targetRole === role || n.targetRole === 'all') ? { ...n, read: true } : n
    ));
    addToast('info', 'Notificaciones al día', 'Todas las notificaciones han sido marcadas como leídas.');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
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

  // Recepción de Unidades en Taller y Formato Oficial de Reporte Técnico
  const createUnitReception = (data: {
    existingOrderId?: string;
    clientName: string;
    clientContact: string;
    clientCompany?: string;
    serviceType?: ServiceType;
    priority?: 'baja' | 'media' | 'alta' | 'urgente';
    vehicle: VehicleInfo;
    maintenanceNature: 'correctivo' | 'preventivo';
    preventiveInspectionNotes: string;
    userOperatorName: string;
    workPerformedDetail?: string;
    assignedTechnicianId?: string;
    receivedByStaffName?: string;
  }): ServiceOrder => {
    const now = new Date().toISOString();
    const tech = data.assignedTechnicianId ? technicians.find(t => t.id === data.assignedTechnicianId) : undefined;
    
    if (data.existingOrderId) {
      let updatedOrder: ServiceOrder | undefined;
      setOrders(prev => prev.map(o => {
        if (o.id === data.existingOrderId) {
          updatedOrder = {
            ...o,
            clientName: data.clientName || o.clientName,
            clientContact: data.clientContact || o.clientContact,
            clientCompany: data.clientCompany || o.clientCompany,
            serviceType: data.serviceType || o.serviceType,
            priority: data.priority || o.priority,
            vehicle: {
              ...o.vehicle,
              ...data.vehicle,
            },
            maintenanceNature: data.maintenanceNature,
            preventiveInspectionNotes: data.preventiveInspectionNotes,
            userOperatorName: data.userOperatorName,
            workPerformedDetail: data.workPerformedDetail !== undefined ? data.workPerformedDetail : o.workPerformedDetail,
            receptionDate: now,
            receivedByStaffName: data.receivedByStaffName || 'Jefe de Taller',
            assignedTechnicianId: tech ? tech.id : o.assignedTechnicianId,
            assignedTechnicianName: tech ? tech.name : o.assignedTechnicianName,
            assignedAt: tech ? now : o.assignedAt,
            status: o.status === 'solicitado' && tech ? 'asignado' : o.status,
          };
          return updatedOrder;
        }
        return o;
      }));
      
      if (tech) {
        setTechnicians(prev => prev.map(t => t.id === tech.id ? { ...t, status: 'en_taller', currentOrderId: data.existingOrderId } : t));
      }

      addToast('success', 'Recepción de Unidad Guardada', `Se actualizaron los datos técnicos y recepción para la orden.`);
      return updatedOrder || orders.find(o => o.id === data.existingOrderId)!;
    }

    // Nueva recepción directa en Taller
    const randomNum = Math.floor(100 + Math.random() * 900);
    const count = orders.length + 1;
    const reportNum = String(count < 100 ? (count < 10 ? `00${count}` : `0${count}`) : count);
    const newFolio = `OS-${new Date().getFullYear()}-${randomNum}`;
    
    const newOrder: ServiceOrder = {
      id: `ord-rec-${Date.now()}`,
      folio: newFolio,
      createdAt: now,
      receptionDate: now,
      receivedByStaffName: data.receivedByStaffName || 'Jefe de Taller',
      reportNumber: reportNum,
      clientName: data.clientName,
      clientContact: data.clientContact,
      clientCompany: data.clientCompany,
      serviceType: data.serviceType || 'taller',
      priority: data.priority || 'alta',
      status: tech ? 'asignado' : 'solicitado',
      assignedTechnicianId: tech?.id,
      assignedTechnicianName: tech?.name,
      assignedAt: tech ? now : undefined,
      vehicle: data.vehicle,
      maintenanceNature: data.maintenanceNature,
      preventiveInspectionNotes: data.preventiveInspectionNotes,
      userOperatorName: data.userOperatorName,
      workPerformedDetail: data.workPerformedDetail,
      technicianSignature: tech ? `${tech.name} - Técnico` : undefined,
      evidences: [],
      partsUsed: [],
    };

    setOrders(prev => [newOrder, ...prev]);

    if (tech) {
      setTechnicians(prev => prev.map(t => t.id === tech.id ? { ...t, status: 'en_taller', currentOrderId: newOrder.id } : t));
    }

    addToast('success', 'Recepción Registrada con Éxito', `Unidad recibida con Folio ${newFolio} y Reporte Técnico No. ${reportNum}.`);
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

    const targetOrder = orders.find(o => o.id === orderId);
    const folio = targetOrder?.folio || 'OS';
    const vehicleText = targetOrder ? `${targetOrder.vehicle.type.toUpperCase()} (${targetOrder.vehicle.plates})` : 'Unidad';
    const finalPriority = priority || targetOrder?.priority || 'alta';

    // 1. Notificación al Técnico asignado
    addNotification({
      title: `¡Nueva Unidad Asignada! ${folio}`,
      message: `El Jefe de Taller te ha asignado la unidad ${vehicleText}. Prioridad: ${finalPriority.toUpperCase()}.`,
      type: 'assignment',
      targetRole: 'tecnico',
      targetUserId: tech.id,
      targetOrderId: orderId,
      folio: folio,
      metadata: {
        technicianName: tech.name,
        vehiclePlates: targetOrder?.vehicle.plates,
        vehicleType: targetOrder?.vehicle.type,
        priority: finalPriority,
        clientName: targetOrder?.clientName,
        assignedBy: 'Jefe de Taller',
      },
    });

    // 2. Notificación a Gerencia
    addNotification({
      title: `Asignación de Unidad: ${folio}`,
      message: `Jefe de Taller asignó la orden ${folio} (${vehicleText}) al técnico ${tech.name}. Prioridad: ${finalPriority.toUpperCase()}.`,
      type: 'assignment',
      targetRole: 'gerencia',
      targetOrderId: orderId,
      folio: folio,
      metadata: {
        technicianName: tech.name,
        vehiclePlates: targetOrder?.vehicle.plates,
        vehicleType: targetOrder?.vehicle.type,
        priority: finalPriority,
        assignedBy: 'Jefe de Taller',
      },
    });

    // 3. Notificación al Jefe de Taller
    addNotification({
      title: `Asignación Exitosa: ${folio}`,
      message: `Has asignado correctamente la orden ${folio} (${vehicleText}) a ${tech.name}.`,
      type: 'assignment',
      targetRole: 'jefe_taller',
      targetOrderId: orderId,
      folio: folio,
    });

    // Ventana emergente flotante con sonido de asignación técnica para Jefe de Taller, Gerencia y Técnico
    if (targetOrder) {
      const assignedOrderObj: ServiceOrder = {
        ...targetOrder,
        status: 'asignado',
        assignedTechnicianId: tech.id,
        assignedTechnicianName: tech.name,
        assignedAt: new Date().toISOString(),
        priority: finalPriority,
      };

      setLatestAssignmentAlert({
        order: assignedOrderObj,
        technician: tech,
        assignedBy: 'Jefe de Taller',
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        priority: finalPriority,
      });
      playAssignmentAlertSound();
    }

    addToast('success', 'Técnico Asignado y Notificado', `Se ha asignado a ${tech.name} y se enviaron las notificaciones correspondientes.`);
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

  // Cierre Oficial de Orden de Reparación (Técnico, Jefe de Taller, Gerencia)
  const closeRepairOrder = (orderId: string, closingData: {
    closedBy: string;
    closedByRole: UserRole;
    closingNotes?: string;
    receivedByDriver?: string;
    finalKilometers?: string;
  }) => {
    const now = new Date().toISOString();
    let targetFolio = '';
    let techToFree: string | undefined;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        targetFolio = o.folio;
        techToFree = o.assignedTechnicianId;
        return {
          ...o,
          status: 'cerrado',
          closedAt: now,
          closedBy: closingData.closedBy,
          closedByRole: closingData.closedByRole,
          closingNotes: closingData.closingNotes || 'Orden de reparación concluida formalmente y archivada en el historial.',
          receivedByDriver: closingData.receivedByDriver || o.receivedByDriver,
          physicalReleaseDate: o.physicalReleaseDate || now,
          releasedBy: o.releasedBy || closingData.closedBy,
          vehicle: {
            ...o.vehicle,
            mileage: closingData.finalKilometers || o.vehicle.mileage,
            odometerReading: closingData.finalKilometers || o.vehicle.odometerReading,
          },
        };
      }
      return o;
    }));

    // Liberar técnico asignado si correspondía
    if (techToFree) {
      setTechnicians(prev => prev.map(t => {
        if (t.id === techToFree) {
          return { ...t, status: 'disponible', currentOrderId: undefined };
        }
        return t;
      }));
    }

    // Despacho de notificaciones
    const roleLabel = closingData.closedByRole === 'tecnico' ? 'El Técnico' :
                      closingData.closedByRole === 'jefe_taller' ? 'El Jefe de Taller' : 'La Gerencia';

    addNotification({
      title: `Orden Cerrada: ${targetFolio || orderId}`,
      message: `${roleLabel} (${closingData.closedBy}) dio por cerrada la orden de reparación. Disponible en el historial operativo.`,
      type: 'release',
      targetRole: 'gerencia',
      orderId,
      folio: targetFolio,
    });

    if (closingData.closedByRole !== 'jefe_taller') {
      addNotification({
        title: `Unidad Concluida: ${targetFolio || orderId}`,
        message: `${roleLabel} dio por concluida y cerrada la orden de reparación.`,
        type: 'release',
        targetRole: 'jefe_taller',
        orderId,
        folio: targetFolio,
      });
    }

    addToast('success', 'Orden de Reparación Cerrada', `La orden ${targetFolio || orderId} se cerró correctamente y ya está en el Historial.`);
  };

  // Eliminación de orden del historial
  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    addToast('info', 'Orden Eliminada', 'La orden de servicio fue eliminada del sistema.');
  };

  // PASO H: Gerencia Administrativa genera Cotización
  const saveQuotation = (orderId: string, quotationData: {
    laborHours: number;
    laborRatePerHour: number;
    parts: PartUsed[];
    expensesAndTowing: number;
    notes?: string;
  }) => {
    const hasLaborInParts = quotationData.parts.some(p => p.category === 'mano_obra');
    const hasViaticosInParts = quotationData.parts.some(p => p.category === 'viaticos');

    const laborSubtotal = hasLaborInParts 
      ? 0 
      : (quotationData.laborHours || 0) * (quotationData.laborRatePerHour || 0);
    const expensesTowing = hasViaticosInParts 
      ? 0 
      : (quotationData.expensesAndTowing || 0);

    const partsSubtotal = quotationData.parts.reduce((acc, p) => {
      const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1);
      return acc + (q * (p.unitPrice || 0));
    }, 0);

    const subtotal = laborSubtotal + partsSubtotal + expensesTowing;
    const tax = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    const laborItems = quotationData.parts.filter(p => p.category === 'mano_obra');
    const calculatedLaborHours = hasLaborInParts 
      ? laborItems.reduce((acc, p) => acc + (typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1)), 0)
      : quotationData.laborHours;
    const calculatedLaborRate = hasLaborInParts && laborItems.length > 0
      ? laborItems[0].unitPrice
      : quotationData.laborRatePerHour;

    const viaticosItems = quotationData.parts.filter(p => p.category === 'viaticos');
    const calculatedViaticos = hasViaticosInParts
      ? viaticosItems.reduce((acc, p) => {
          const q = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity)) || 1);
          return acc + (q * (p.unitPrice || 0));
        }, 0)
      : (quotationData.expensesAndTowing || 0);

    const quotation: Quotation = {
      id: `cot-${Date.now()}`,
      createdAt: new Date().toISOString(),
      laborHours: calculatedLaborHours || 0,
      laborRatePerHour: calculatedLaborRate || 0,
      parts: quotationData.parts,
      expensesAndTowing: calculatedViaticos || 0,
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
    operatorName?: string;
    operatorPhone?: string;
    serviceType?: ServiceType;
    vehicleUpdates?: {
      brand?: string;
      model?: string;
      brandModel?: string;
      plates?: string;
      economicNumber?: string;
      chassisSerialNumber?: string;
      engineModelTransmission?: string;
      engineSeriesTransmission?: string;
      odometerReading?: string;
      mileage?: string;
      location?: string;
      failureDescription?: string;
    };
  }) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          serviceType: reportData.serviceType || o.serviceType,
          operatorName: reportData.operatorName ?? o.operatorName,
          operatorPhone: reportData.operatorPhone ?? o.operatorPhone,
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

  // Gestión de Empleados (Técnicos, Jefes de taller, Admin, Gerencia)
  const addEmployee = (employee: Omit<Technician, 'id'>) => {
    const newEmp: Technician = {
      ...employee,
      id: `emp-${Date.now()}`,
      joinDate: new Date().toISOString().slice(0, 10),
    };
    setTechnicians(prev => [newEmp, ...prev]);
    addToast('success', 'Empleado Registrado', `${newEmp.name} ha sido registrado como ${newEmp.role.replace('_', ' ').toUpperCase()}.`);
  };

  const updateEmployee = (id: string, updates: Partial<Technician>) => {
    setTechnicians(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    addToast('info', 'Empleado Actualizado', 'La información del personal ha sido modificada.');
  };

  const deleteEmployee = (id: string) => {
    setTechnicians(prev => prev.filter(e => e.id !== id));
    addToast('warning', 'Empleado Removido', 'El registro del empleado ha sido eliminado.');
  };

  // Reparaciones registradas en la orden (progresivas por técnico/jefe/gerencia)
  const addRepairLog = (orderId: string, repair: Omit<RepairLog, 'id' | 'createdAt'>) => {
    const newRepair: RepairLog = {
      ...repair,
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const extraEvidences: EvidencePhoto[] = [];
        if (newRepair.evidenceBeforeUrl) {
          extraEvidences.push({
            id: `ev-rep-bef-${Date.now()}`,
            phase: 'antes',
            url: newRepair.evidenceBeforeUrl,
            title: newRepair.evidenceBeforeTitle || `[ANTES] ${newRepair.title}`,
            notes: newRepair.evidenceBeforeNotes || `Evidencia previa de ${newRepair.title}`,
            timestamp: newRepair.evidenceBeforeTimestamp || new Date().toISOString(),
            uploadedBy: 'tecnico',
            uploaderName: newRepair.technicianName || 'Técnico Asignado'
          });
        }
        if (newRepair.evidenceAfterUrl) {
          extraEvidences.push({
            id: `ev-rep-aft-${Date.now() + 1}`,
            phase: 'correctivo_realizado',
            url: newRepair.evidenceAfterUrl,
            title: newRepair.evidenceAfterTitle || `[DESPUÉS] ${newRepair.title}`,
            notes: newRepair.evidenceAfterNotes || `Evidencia posterior/correctivo de ${newRepair.title}`,
            timestamp: newRepair.evidenceAfterTimestamp || new Date().toISOString(),
            uploadedBy: 'tecnico',
            uploaderName: newRepair.technicianName || 'Técnico Asignado'
          });
        }

        return {
          ...o,
          repairs: [...(o.repairs || []), newRepair],
          evidences: [...o.evidences, ...extraEvidences]
        };
      }
      return o;
    }));
    addToast('success', 'Reparación Registrada', `Se registró: "${newRepair.title}" con sus 2 evidencias.`);
  };

  const updateRepairLog = (orderId: string, repairId: string, updates: Partial<RepairLog>) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          repairs: (o.repairs || []).map(r => r.id === repairId ? { ...r, ...updates } : r),
        };
      }
      return o;
    }));
    addToast('info', 'Reparación Actualizada', 'Los datos y evidencias de la reparación han sido actualizados.');
  };

  const removeRepairLog = (orderId: string, repairId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          repairs: (o.repairs || []).filter(r => r.id !== repairId),
        };
      }
      return o;
    }));
    addToast('warning', 'Reparación Eliminada', 'Se removió la partida de reparación.');
  };

  // Catálogo de Servicios y Precios
  const addServiceItem = (item: Omit<ServiceCatalogItem, 'id'>) => {
    const newItem: ServiceCatalogItem = {
      ...item,
      id: `srv-${Date.now()}`,
    };
    setServices(prev => [newItem, ...prev]);
    addToast('success', 'Servicio Registrado', `"${newItem.name}" agregado al catálogo con precio $${newItem.basePrice.toLocaleString('es-MX')}.`);
  };

  const updateServiceItem = (id: string, updates: Partial<ServiceCatalogItem>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    addToast('info', 'Servicio Actualizado', 'Los datos y precio del servicio han sido actualizados.');
  };

  const deleteServiceItem = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    addToast('warning', 'Servicio Eliminado', 'El servicio ha sido removido del catálogo.');
  };

  // Importar y adjuntar cotización en PDF
  const attachQuotationPdf = (orderId: string, pdfUrl: string, fileName: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const existingQuote = o.quotation || {
          id: `quote-${Date.now()}`,
          createdAt: now,
          laborHours: 2,
          laborRatePerHour: 650,
          parts: [],
          expensesAndTowing: 0,
          notes: 'Cotización importada en formato PDF.',
          subtotal: 1300,
          tax: 208,
          total: 1508,
          status: 'enviada' as const,
        };
        return {
          ...o,
          quotation: {
            ...existingQuote,
            pdfUrl,
            importedPdfName: fileName,
            importedPdfDate: now,
          },
        };
      }
      return o;
    }));
    addToast('success', 'Cotización en PDF Importada', `Se adjuntó exitosamente el archivo "${fileName}" a la orden.`);
  };

  // PASO CLIENTE: Reporte de falla específico con Unidad (1 a 50), Operador, Km, Falla, Fotos, Video 15s, Rescate y Alerta
  const createClientFaultReport = (data: {
    unitNumber: string;
    plates: string;
    economicNumber: string;
    brandModel?: string;
    vehicleType?: VehicleType;
    odometer: string;
    operatorName: string;
    operatorPhone: string;
    failureDescription: string;
    location: string;
    serviceType?: ServiceType;
    requiresRescue: boolean;
    rescueLocationUrl?: string;
    photos: Array<{ id: string; url: string; title: string; timestamp: string }>;
    videos?: VideoEvidence[];
    clientName?: string;
    clientCompany?: string;
  }): ServiceOrder => {
    const now = new Date();
    const folioNum = String(orders.length + 1).padStart(3, '0');
    const newFolio = `OS-2026-${folioNum}`;

    const effectiveServiceType = data.serviceType || (data.requiresRescue ? 'rescate' : 'taller');

    const newOrder: ServiceOrder = {
      id: `ord-${Date.now()}`,
      folio: newFolio,
      createdAt: now.toISOString(),
      clientName: data.clientName || 'Flotillas Express S.A. de C.V.',
      clientContact: `${data.operatorName} (${data.operatorPhone})`,
      clientCompany: data.clientCompany || 'Flotillas Express S.A.',
      serviceType: effectiveServiceType,
      priority: data.requiresRescue || effectiveServiceType === 'rescate' ? 'urgente' : 'alta',
      status: 'por_atender',
      unitNumber: data.unitNumber,
      operatorName: data.operatorName,
      operatorPhone: data.operatorPhone,
      requiresRescue: data.requiresRescue,
      rescueLocationUrl: data.rescueLocationUrl,
      videoEvidences: data.videos || [],
      clientObservationsHistory: [],
      vehicle: {
        type: data.vehicleType || 'tractocamion',
        plates: data.plates.toUpperCase(),
        economicNumber: data.economicNumber.toUpperCase(),
        brandModel: data.brandModel,
        location: data.location,
        failureDescription: data.failureDescription,
        driverContact: data.operatorPhone,
        odometerReading: data.odometer,
        mileage: data.odometer,
      },
      evidences: data.photos.map(p => ({
        id: p.id,
        phase: 'antes',
        url: p.url,
        title: p.title || 'Evidencia de Falla Reportada',
        timestamp: p.timestamp || now.toISOString(),
        uploadedBy: 'cliente' as any,
        uploaderName: data.operatorName || 'Operador',
      })),
      partsUsed: [],
    };

    setOrders(prev => [newOrder, ...prev]);

    // Disparar ventana emergente inmediata para Admin y Jefe de Taller
    setIncomingAlertOrder(newOrder);

    // Reproducir sonido sintetizado de alerta en vivo (Web Audio API)
    try {
      playEmergencyAlertSound();
    } catch {}

    // Despacho de notificaciones inmediatas a Jefe de Taller y Gerencia
    addNotification({
      title: data.requiresRescue 
        ? `🚨 ¡RESCATE VIAL URGENTE!: ${newFolio}` 
        : `📋 Nuevo Reporte de Falla: ${newFolio}`,
      message: `${data.unitNumber} (${data.plates}). Op: ${data.operatorName} (${data.operatorPhone}). Falla: ${data.failureDescription.slice(0, 80)}...`,
      type: data.requiresRescue ? 'alert' : 'reception',
      targetRole: 'all',
      orderId: newOrder.id,
      folio: newFolio,
      metadata: {
        vehiclePlates: data.plates,
        vehicleType: data.vehicleType || 'tractocamion',
        priority: data.requiresRescue ? 'urgente' : 'alta',
        clientName: data.clientName || 'Cliente',
      }
    });

    addToast(
      data.requiresRescue ? 'error' : 'success',
      data.requiresRescue ? '¡Solicitud de Rescate Enviada!' : 'Reporte de Falla Registrado',
      `Folio ${newFolio} asignado. Notificación y alerta emergente enviada a Jefe de Taller y Gerencia.`
    );

    return newOrder;
  };

  // Agregar observación o nueva falla reportada por el cliente a una orden existente
  const addClientObservation = (orderId: string, observationText: string, author?: string, photos?: EvidencePhoto[]) => {
    const now = new Date().toISOString();
    const newObs: ClientObservation = {
      id: `obs-${Date.now()}`,
      text: observationText,
      timestamp: now,
      author: author || 'Cliente / Operador',
      addedPhotos: photos || [],
    };

    let targetFolio = '';

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        targetFolio = o.folio;
        const currentHistory = o.clientObservationsHistory || [];
        const currentEvidences = o.evidences || [];
        return {
          ...o,
          clientObservationsHistory: [...currentHistory, newObs],
          evidences: photos ? [...currentEvidences, ...photos] : currentEvidences,
        };
      }
      return o;
    }));

    addNotification({
      title: `Nueva Observación del Cliente: ${targetFolio}`,
      message: `${author || 'El cliente'} agregó una observación: "${observationText.slice(0, 90)}..."`,
      type: 'alert',
      targetRole: 'jefe_taller',
      orderId,
      folio: targetFolio,
    });

    addNotification({
      title: `Nueva Observación del Cliente: ${targetFolio}`,
      message: `${author || 'El cliente'} agregó una observación: "${observationText.slice(0, 90)}..."`,
      type: 'alert',
      targetRole: 'gerencia',
      orderId,
      folio: targetFolio,
    });

    addToast('success', 'Observación Registrada', 'La nueva falla u observación fue guardada y notificada al taller.');
  };

  // Actualizar Estatus de Orden (Admin y Jefe de Taller)
  const updateOrderStatus = (orderId: string, newStatus: ServiceStatus, notes?: string) => {
    let targetFolio = '';
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        targetFolio = o.folio;
        return {
          ...o,
          status: newStatus,
          adminReviewNotes: notes ? (o.adminReviewNotes ? `${o.adminReviewNotes} | ${notes}` : notes) : o.adminReviewNotes,
        };
      }
      return o;
    }));

    addToast('info', 'Estatus Actualizado', `La orden ${targetFolio || orderId} cambió a estatus "${newStatus}".`);

    addNotification({
      title: `Estatus Actualizado: ${targetFolio}`,
      message: `El estatus de la orden fue actualizado a "${newStatus}". ${notes ? `Nota: ${notes}` : ''}`,
      type: 'system',
      targetRole: 'cliente',
      orderId,
      folio: targetFolio,
    });
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
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addRepairLog,
        updateRepairLog,
        removeRepairLog,
        services,
        addServiceItem,
        updateServiceItem,
        deleteServiceItem,
        attachQuotationPdf,
        createServiceOrder,
        createUnitReception,
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
        closeRepairOrder,
        deleteOrder,
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
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        addNotification,
        toasts,
        addToast,
        removeToast,
        units,
        addUnit,
        updateUnit,
        deleteUnit,
        clients,
        addClient,
        updateClient,
        deleteClient,
        createClientFaultReport,
        addClientObservation,
        updateOrderStatus,
        incomingAlertOrder,
        dismissIncomingAlert,
        latestAssignmentAlert,
        dismissAssignmentAlert,
        triggerAssignmentAlert,
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
