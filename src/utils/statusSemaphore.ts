import { ServiceStatus } from '../types';

export type SemaphoreColor = 'verde' | 'amarillo' | 'rojo';

export interface SemaphoreStatusDetail {
  color: SemaphoreColor;
  label: string;
  shortLabel: string;
  dotColor: string; // Tailwind circle color
  pulse: boolean;
  badgeClass: string;
  borderClass: string;
  categoryText: string;
}

/**
 * Determina el color del semáforo y formato visual para cada estatus de servicio
 * 🟢 Verde: Concluido, Liberación Autorizada, Unidad Entregada, Facturado, Cotización Aprobada
 * 🟡 Amarillo: En Diagnóstico, En Proceso, Evidencias en Revisión, Cotización Pendiente, Asignado
 * 🔴 Rojo: Evidencias Rechazadas / Observadas (Requiere atención urgente inmediata) o Solicitudes Urgentes
 */
export const CLIENT_STATUS_OPTIONS: Array<{
  id: 'por_atender' | 'en_proceso' | 'pendiente_refacciones' | 'validando_pruebas' | 'habilitada';
  label: string;
  sublabel: string;
  color: SemaphoreColor;
  badgeClass: string;
  dotColor: string;
}> = [
  {
    id: 'por_atender',
    label: 'Por atender',
    sublabel: 'Jefe de taller aún no asigna técnico',
    color: 'amarillo',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'en_proceso',
    label: 'En proceso',
    sublabel: 'Cuando técnico ya fue asignado',
    color: 'amarillo',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-300 font-bold',
    dotColor: 'bg-blue-600',
  },
  {
    id: 'pendiente_refacciones',
    label: 'Pendiente por refacciones',
    sublabel: 'En espera de suministro de partes',
    color: 'amarillo',
    badgeClass: 'bg-orange-50 text-orange-900 border-orange-300 font-bold',
    dotColor: 'bg-orange-500',
  },
  {
    id: 'validando_pruebas',
    label: 'Validando / Pruebas',
    sublabel: 'Gerente revisa evidencia para liberar',
    color: 'amarillo',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-300 font-bold',
    dotColor: 'bg-purple-600',
  },
  {
    id: 'habilitada',
    label: 'Habilitada',
    sublabel: 'Se envía notificación al cliente al liberar',
    color: 'verde',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
    dotColor: 'bg-emerald-600',
  },
];

/**
 * Determina el color del semáforo y formato visual para cada estatus de servicio
 */
export function getStatusSemaphore(
  status: ServiceStatus, 
  priority?: 'baja' | 'media' | 'alta' | 'urgente',
  quotationStatus?: 'borrador' | 'enviada' | 'aprobada' | 'rechazada'
): SemaphoreStatusDetail {
  // Las 5 Opciones Principales Solicitadas por el Cliente
  if (status === 'por_atender') {
    return {
      color: priority === 'urgente' ? 'rojo' : 'amarillo',
      label: 'Por atender (Jefe de taller aún no asigna técnico)',
      shortLabel: 'Por atender',
      dotColor: priority === 'urgente' ? 'bg-rose-600' : 'bg-amber-500',
      pulse: priority === 'urgente',
      badgeClass: priority === 'urgente' 
        ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold' 
        : 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
      borderClass: 'border-amber-300',
      categoryText: '🟡 Por atender: En espera de asignación',
    };
  }

  if (status === 'en_proceso') {
    return {
      color: 'amarillo',
      label: 'En proceso (Cuando técnico ya fue asignado)',
      shortLabel: 'En proceso',
      dotColor: 'bg-blue-600',
      pulse: false,
      badgeClass: 'bg-blue-50 text-blue-900 border-blue-300 font-bold',
      borderClass: 'border-blue-300',
      categoryText: '🔵 En proceso: Cuadrilla técnica atendiendo',
    };
  }

  if (status === 'pendiente_refacciones') {
    return {
      color: 'amarillo',
      label: 'Pendiente por refacciones',
      shortLabel: 'Pendiente refacciones',
      dotColor: 'bg-orange-500',
      pulse: true,
      badgeClass: 'bg-orange-50 text-orange-900 border-orange-300 font-bold',
      borderClass: 'border-orange-300',
      categoryText: '🟠 Pendiente por refacciones: Insumos requeridos',
    };
  }

  if (status === 'validando_pruebas') {
    return {
      color: 'amarillo',
      label: 'Validando / Pruebas (Gerente revisa evidencia para liberar)',
      shortLabel: 'Validando / Pruebas',
      dotColor: 'bg-purple-600',
      pulse: false,
      badgeClass: 'bg-purple-50 text-purple-900 border-purple-300 font-bold',
      borderClass: 'border-purple-300',
      categoryText: '🟣 Validando / Pruebas: Revisión de evidencia',
    };
  }

  if (status === 'habilitada') {
    return {
      color: 'verde',
      label: 'Habilitada (Se envía notificación al cliente al liberar)',
      shortLabel: 'Habilitada',
      dotColor: 'bg-emerald-600',
      pulse: false,
      badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
      borderClass: 'border-emerald-300',
      categoryText: '🟢 Habilitada: Unidad operativa y liberada',
    };
  }

  // Caso 1: 🔴 ROJO - Corrección Inmediata / Observado / Urgente detenido
  if (status === 'evidencias_rechazadas' || quotationStatus === 'rechazada') {
    return {
      color: 'rojo',
      label: status === 'evidencias_rechazadas' 
        ? 'Evidencias Observadas / Corrección Inmediata' 
        : 'Cotización Rechazada por Cliente',
      shortLabel: 'Observación Urgente',
      dotColor: 'bg-rose-600',
      pulse: true,
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
      borderClass: 'border-rose-400',
      categoryText: '🔴 Rojo: Atención Inmediata Requerida',
    };
  }

  // Solicitud Urgente aún sin asignar -> Rojo
  if (priority === 'urgente' && status === 'solicitado') {
    return {
      color: 'rojo',
      label: 'Auxilio Urgente (Sin Asignar)',
      shortLabel: 'Urgente',
      dotColor: 'bg-rose-600',
      pulse: true,
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
      borderClass: 'border-rose-400',
      categoryText: '🔴 Rojo: Solicitud Crítica en Espera',
    };
  }

  // Caso 2: 🟢 VERDE - Concluido, Liberado, Aprobado o Facturado
  if (
    status === 'liberacion_autorizada' ||
    status === 'unidad_liberada' ||
    status === 'cotizacion_aprobada' ||
    status === 'facturado' ||
    status === 'cerrado' ||
    quotationStatus === 'aprobada'
  ) {
    let lbl = 'Liberación Autorizada';
    if (status === 'unidad_liberada') lbl = 'Unidad Entregada / Liberada';
    if (status === 'cotizacion_aprobada') lbl = 'Cotización Aprobada por Cliente';
    if (status === 'facturado') lbl = 'Servicio Facturado y Cerrado';
    if (status === 'cerrado') lbl = 'Orden Concluida';

    return {
      color: 'verde',
      label: lbl,
      shortLabel: 'Concluido / Liberado',
      dotColor: 'bg-emerald-500',
      pulse: false,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
      borderClass: 'border-emerald-300',
      categoryText: '🟢 Verde: Concluido / Liberado / Facturado',
    };
  }

  // Caso 3: 🟡 AMARILLO - En Proceso Operativo, Diagnóstico, Revisión o Por Cotizar
  let yellowLabel = 'En Proceso Operativo';
  if (status === 'solicitado') yellowLabel = 'Por atender (Jefe de taller aún no asigna técnico)';
  if (status === 'asignado') yellowLabel = 'En proceso (Cuando técnico ya fue asignado)';
  if (status === 'en_diagnostico_trabajo') yellowLabel = 'En Diagnóstico y Trabajo Mecánico';
  if (status === 'evidencias_en_revision') yellowLabel = 'Validando / Pruebas (Gerente revisa evidencia)';
  if (status === 'cotizacion_pendiente') yellowLabel = 'Cotización Pendiente de Autorización';

  return {
    color: 'amarillo',
    label: yellowLabel,
    shortLabel: 'En Proceso',
    dotColor: 'bg-amber-500',
    pulse: false,
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 font-medium',
    borderClass: 'border-amber-300',
    categoryText: '🟡 Amarillo: En Proceso / En Taller',
  };
}
