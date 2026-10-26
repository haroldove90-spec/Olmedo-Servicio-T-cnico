import React from 'react';
import { ServiceStatus } from '../../types';
import { getStatusSemaphore } from '../../utils/statusSemaphore';

interface StatusSemaphoreBadgeProps {
  status: ServiceStatus | string;
  priority?: 'baja' | 'media' | 'alta' | 'urgente';
  quotationStatus?: 'borrador' | 'enviada' | 'aprobada' | 'rechazada';
  size?: 'sm' | 'md' | 'lg';
  showCategoryHint?: boolean;
  short?: boolean;
}

export const StatusSemaphoreBadge: React.FC<StatusSemaphoreBadgeProps> = ({
  status,
  priority,
  quotationStatus,
  size = 'md',
  showCategoryHint = false,
  short = false,
}) => {
  const sem = getStatusSemaphore(status, priority, quotationStatus);

  const sizeClasses = {
    sm: 'text-[10px] sm:text-[11px] px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-xs sm:text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs select-none transition-colors max-w-full ${sizeClasses} ${sem.badgeClass}`}
      title={sem.label}
    >
      <span className="relative flex items-center justify-center shrink-0">
        {sem.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sem.dotColor}`} />
        )}
        <span className={`rounded-full shrink-0 ${dotSize} ${sem.dotColor}`} />
      </span>
      <span className={`truncate font-extrabold ${sem.textColor}`}>
        {short ? sem.shortLabel : sem.label}
      </span>
      {showCategoryHint && (
        <span className="text-[10px] opacity-75 ml-0.5 shrink-0">
          ({sem.color === 'verde' ? '🟢' : sem.color === 'amarillo' ? '🟡' : sem.color === 'azul' ? '🔵' : sem.color === 'naranja' ? '🟠' : sem.color === 'purpura' ? '🟣' : '🔴'})
        </span>
      )}
    </span>
  );
};
