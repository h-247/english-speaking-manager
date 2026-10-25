import React from 'react';

export interface StatsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  accentColor?: 'yellow' | 'blue' | 'green' | 'default';
}

export function StatsCard({
  label,
  value,
  subValue,
  icon,
  accentColor = 'default',
}: StatsCardProps) {
  const accentBorder = {
    yellow: 'border-l-amber-500',
    blue: 'border-l-blue-500',
    green: 'border-l-emerald-500',
    default: 'border-l-[#555555]',
  }[accentColor];

  return (
    <div
      className={`bg-[#262626] border border-[#383838] border-l-4 ${accentBorder} rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all hover:border-[#484848]`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#ececec]">
          {value}
        </span>
        {subValue && <span className="text-xs text-gray-400">{subValue}</span>}
      </div>
    </div>
  );
}
