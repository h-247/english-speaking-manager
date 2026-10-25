import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-[#383838] bg-[#262626]/40 my-4">
      {icon && (
        <div className="p-3.5 rounded-full bg-[#1a1a1a] border border-[#383838] text-gray-400 mb-3.5">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#ececec]">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-400 max-w-md mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionIcon}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
