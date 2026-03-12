import React from 'react';
import { cn } from '@/lib/utils';

export default function SignalMeter({ value, rating, showLabel = true }) {
  const getColor = () => {
    // Always based on signal density: >80 = watch (green), ≤80 = skim (amber)
    if (value > 80) return 'bg-emerald-500';
    return 'bg-amber-500';
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', getColor())}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-zinc-500 w-12">{value}% signal</span>
      )}
    </div>
  );
}