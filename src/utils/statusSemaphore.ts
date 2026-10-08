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
export function getStatusSemaphore(
  status: ServiceStatus, 
  priority?: 'baja' | 'media' | 'alta' | 'urgente',
  quotationStatus?: 'borrador' | 'enviada' | 'aprobada' | 'rechazada'
): SemaphoreStatusDetail {
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
  if (status === 'solicitado') yellowLabel = 'Solicitado (En Espera de Asignación)';
  if (status === 'asignado') yellowLabel = 'Técnico Asignado a la Orden';
  if (status === 'en_diagnostico_trabajo') yellowLabel = 'En Diagnóstico y Trabajo Mecánico';
  if (status === 'evidencias_en_revision') yellowLabel = 'Evidencias en Revisión de Gerencia';
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
