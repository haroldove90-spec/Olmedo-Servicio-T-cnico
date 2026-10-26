import { ServiceStatus } from '../types';

export type SemaphoreColor = 'verde' | 'amarillo' | 'azul' | 'naranja' | 'purpura' | 'rojo';

export interface SemaphoreStatusDetail {
  color: SemaphoreColor;
  label: string;
  shortLabel: string;
  dotColor: string; // Tailwind circle color
  textColor: string; // Tailwind text color
  pulse: boolean;
  badgeClass: string;
  borderClass: string;
  categoryText: string;
}

/**
 * 5 Estatus Oficiales de Reportes de Falla solicitados por el negocio:
 * 1. Por atender (Jefe de taller aun no asigna tecnico) -> Ámbar / Dorado
 * 2. En proceso (cuando tecnico ya fue asigndo) -> Azul
 * 3. Pendiente por refacciones -> Naranja
 * 4. Validando / Pruebas (Gerente revisa evidencia para liberar) -> Púrpura / Morado
 * 5. Habilitada (Se envia notificación al cliente) -> Verde Esmeralda
 */
export const CLIENT_STATUS_OPTIONS: Array<{
  id: 'por_atender' | 'en_proceso' | 'pendiente_refacciones' | 'validando_pruebas' | 'habilitada';
  label: string;
  shortLabel: string;
  sublabel: string;
  color: SemaphoreColor;
  textColor: string;
  badgeClass: string;
  dotColor: string;
}> = [
  {
    id: 'por_atender',
    label: 'Por atender (Jefe de taller aun no asigna tecnico)',
    shortLabel: 'Por atender',
    sublabel: 'Jefe de taller aun no asigna tecnico',
    color: 'amarillo',
    textColor: 'text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 font-extrabold',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'en_proceso',
    label: 'En proceso (cuando tecnico ya fue asigndo)',
    shortLabel: 'En proceso',
    sublabel: 'cuando tecnico ya fue asigndo',
    color: 'azul',
    textColor: 'text-blue-700',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-300 font-extrabold',
    dotColor: 'bg-blue-600',
  },
  {
    id: 'pendiente_refacciones',
    label: 'Pendiente por refacciones',
    shortLabel: 'Pendiente por refacciones',
    sublabel: 'En espera de suministro de partes',
    color: 'naranja',
    textColor: 'text-orange-700',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-300 font-extrabold',
    dotColor: 'bg-orange-500',
  },
  {
    id: 'validando_pruebas',
    label: 'Validando / Pruebas (Gerente revisa evidencia para liberar)',
    shortLabel: 'Validando / Pruebas',
    sublabel: 'Gerente revisa evidencia para liberar',
    color: 'purpura',
    textColor: 'text-purple-700',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-300 font-extrabold',
    dotColor: 'bg-purple-600',
  },
  {
    id: 'habilitada',
    label: 'Habilitada (Se envia notificación al cliente)',
    shortLabel: 'Habilitada',
    sublabel: 'Se envia notificación al cliente',
    color: 'verde',
    textColor: 'text-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold',
    dotColor: 'bg-emerald-600',
  },
];

/**
 * Obtiene la clase de color de texto según el estatus
 */
export function getStatusTextColor(status: ServiceStatus | string): string {
  switch (status) {
    case 'por_atender':
    case 'solicitado':
      return 'text-amber-700';
    case 'en_proceso':
    case 'asignado':
    case 'en_diagnostico_trabajo':
      return 'text-blue-700';
    case 'pendiente_refacciones':
      return 'text-orange-700';
    case 'validando_pruebas':
    case 'evidencias_en_revision':
    case 'evidencias_rechazadas':
      return 'text-purple-700';
    case 'habilitada':
    case 'liberacion_autorizada':
    case 'unidad_liberada':
    case 'cerrado':
    case 'facturado':
      return 'text-emerald-700';
    default:
      return 'text-slate-700';
  }
}

/**
 * Determina el color y formato visual para cada estatus de servicio
 */
export function getStatusSemaphore(
  status: ServiceStatus | string, 
  priority?: 'baja' | 'media' | 'alta' | 'urgente',
  _quotationStatus?: 'borrador' | 'enviada' | 'aprobada' | 'rechazada'
): SemaphoreStatusDetail {
  // 1. Por atender (Jefe de taller aun no asigna tecnico)
  if (status === 'por_atender' || status === 'solicitado') {
    return {
      color: priority === 'urgente' ? 'rojo' : 'amarillo',
      label: 'Por atender (Jefe de taller aun no asigna tecnico)',
      shortLabel: 'Por atender',
      dotColor: priority === 'urgente' ? 'bg-rose-600' : 'bg-amber-500',
      textColor: priority === 'urgente' ? 'text-rose-700' : 'text-amber-700',
      pulse: priority === 'urgente',
      badgeClass: priority === 'urgente' 
        ? 'bg-rose-50 text-rose-700 border-rose-300 font-extrabold' 
        : 'bg-amber-50 text-amber-700 border-amber-300 font-extrabold',
      borderClass: 'border-amber-300',
      categoryText: '🟡 Por atender: Jefe de taller aun no asigna tecnico',
    };
  }

  // 2. En proceso (cuando tecnico ya fue asigndo)
  if (
    status === 'en_proceso' || 
    status === 'asignado' || 
    status === 'en_diagnostico_trabajo'
  ) {
    return {
      color: 'azul',
      label: 'En proceso (cuando tecnico ya fue asigndo)',
      shortLabel: 'En proceso',
      dotColor: 'bg-blue-600',
      textColor: 'text-blue-700',
      pulse: false,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-300 font-extrabold',
      borderClass: 'border-blue-300',
      categoryText: '🔵 En proceso: cuando tecnico ya fue asigndo',
    };
  }

  // 3. Pendiente por refacciones
  if (status === 'pendiente_refacciones') {
    return {
      color: 'naranja',
      label: 'Pendiente por refacciones',
      shortLabel: 'Pendiente por refacciones',
      dotColor: 'bg-orange-500',
      textColor: 'text-orange-700',
      pulse: true,
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-300 font-extrabold',
      borderClass: 'border-orange-300',
      categoryText: '🟠 Pendiente por refacciones: Insumos requeridos',
    };
  }

  // 4. Validando / Pruebas (Gerente revisa evidencia para liberar)
  if (
    status === 'validando_pruebas' || 
    status === 'evidencias_en_revision' || 
    status === 'evidencias_rechazadas' ||
    status === 'cotizacion_pendiente'
  ) {
    return {
      color: 'purpura',
      label: 'Validando / Pruebas (Gerente revisa evidencia para liberar)',
      shortLabel: 'Validando / Pruebas',
      dotColor: 'bg-purple-600',
      textColor: 'text-purple-700',
      pulse: status === 'evidencias_rechazadas',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-300 font-extrabold',
      borderClass: 'border-purple-300',
      categoryText: '🟣 Validando / Pruebas: Gerente revisa evidencia para liberar',
    };
  }

  // 5. Habilitada (Se envia notificación al cliente)
  if (
    status === 'habilitada' ||
    status === 'liberacion_autorizada' ||
    status === 'unidad_liberada' ||
    status === 'cerrado' ||
    status === 'facturado' ||
    status === 'cotizacion_aprobada'
  ) {
    return {
      color: 'verde',
      label: 'Habilitada (Se envia notificación al cliente)',
      shortLabel: 'Habilitada',
      dotColor: 'bg-emerald-600',
      textColor: 'text-emerald-700',
      pulse: false,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold',
      borderClass: 'border-emerald-300',
      categoryText: '🟢 Habilitada: Se envia notificación al cliente',
    };
  }

  // Fallback por defecto
  return {
    color: 'amarillo',
    label: 'Por atender (Jefe de taller aun no asigna tecnico)',
    shortLabel: 'Por atender',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-700',
    pulse: false,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 font-extrabold',
    borderClass: 'border-amber-300',
    categoryText: 'Por atender',
  };
}
