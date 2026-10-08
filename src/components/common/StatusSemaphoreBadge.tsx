import React from 'react';
import { ServiceStatus } from '../../types';
import { getStatusSemaphore, SemaphoreColor } from '../../utils/statusSemaphore';

interface StatusSemaphoreBadgeProps {
  status: ServiceStatus;
  priority?: 'baja' | 'media' | 'alta' | 'urgente';
  quotationStatus?: 'borrador' | 'enviada' | 'aprobada' | 'rechazada';
  size?: 'sm' | 'md' | 'lg';
  showCategoryHint?: boolean;
}

export const StatusSemaphoreBadge: React.FC<StatusSemaphoreBadgeProps> = ({
  status,
  priority,
  quotationStatus,
  size = 'md',
  showCategoryHint = false,
}) => {
  const sem = getStatusSemaphore(status, priority, quotationStatus);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-xs sm:text-sm px-3 py-1.5 gap-2',
  }[size];

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs select-none transition-colors ${sizeClasses} ${sem.badgeClass}`}
      title={sem.categoryText}
    >
      <span className="relative flex items-center justify-center">
        {sem.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sem.dotColor}`} />
        )}
        <span className={`rounded-full shrink-0 ${dotSize} ${sem.dotColor}`} />
      </span>
      <span className="truncate">{sem.label}</span>
      {showCategoryHint && (
        <span className="text-[10px] opacity-75 ml-0.5">
          ({sem.color === 'verde' ? '🟢' : sem.color === 'amarillo' ? '🟡' : '🔴'})
        </span>
      )}
    </span>
  );
};
