import React from 'react';

export type StatusValue = 'To Do' | 'Doing' | 'Done' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export function StatusBadge({
  status,
  size = 'md',
}: {
  status: StatusValue | string;
  size?: 'sm' | 'md';
}) {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    'To Do': {
      label: 'To Do',
      bg: 'bg-amber-500/10',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
    'To do': {
      label: 'To do',
      bg: 'bg-amber-500/10',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
    Doing: {
      label: 'Doing',
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      border: 'border-blue-500/30',
      dot: 'bg-blue-400 animate-pulse',
    },
    Done: {
      label: 'Done',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    PLANNED: {
      label: 'To Do',
      bg: 'bg-amber-500/10',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
    IN_PROGRESS: {
      label: 'Doing',
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      border: 'border-blue-500/30',
      dot: 'bg-blue-400 animate-pulse',
    },
    COMPLETED: {
      label: 'Done',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
  };

  const config = configs[status] || {
    label: status,
    bg: 'bg-gray-800',
    text: 'text-gray-300',
    border: 'border-gray-700',
    dot: 'bg-gray-400',
  };

  const sizeClasses =
    size === 'sm' ? 'text-xs px-2 py-0.5 gap-1.5' : 'text-xs px-2.5 py-1 gap-2';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} select-none`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
