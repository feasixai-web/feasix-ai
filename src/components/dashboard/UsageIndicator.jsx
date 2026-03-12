import React from 'react';
import { cn } from '@/lib/utils';

export default function UsageIndicator({ used, limit, label, showUpgrade = false }) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = used >= limit;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className={cn(
          'font-medium',
          isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-zinc-300'
        )}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-zinc-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isAtLimit && showUpgrade && (
        <p className="text-xs text-amber-500">Upgrade to continue</p>
      )}
    </div>
  );
}