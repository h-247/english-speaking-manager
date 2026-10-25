import React from 'react';

export function ScoreDisplay({
  score,
  size = 'md',
  showLabel = false,
}: {
  score: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return (
      <span className="text-gray-500 font-mono text-sm select-none" title="No attempts recorded">
        —
      </span>
    );
  }

  const scoreNum = Number(score);
  let colorClass = 'text-emerald-400';
  if (scoreNum < 6.0) {
    colorClass = 'text-rose-400';
  } else if (scoreNum < 8.0) {
    colorClass = 'text-amber-400';
  }

  const sizeClasses = {
    sm: 'text-xs font-semibold',
    md: 'text-sm font-bold',
    lg: 'text-xl font-extrabold',
  };

  return (
    <div className="inline-flex items-baseline gap-1">
      {showLabel && <span className="text-xs text-gray-400 font-normal">Score:</span>}
      <span className={`font-mono ${colorClass} ${sizeClasses[size]}`}>
        {scoreNum.toFixed(1)}
      </span>
      <span className="text-[10px] text-gray-400 font-mono">/10</span>
    </div>
  );
}
