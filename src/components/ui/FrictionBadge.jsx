import React from 'react';
import { cn } from '@/lib/utils';
import { Zap, TrendingUp, Mountain } from 'lucide-react';

const frictionConfig = {
  low: {
    label: 'Low Friction',
    icon: Zap,
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/50',
    text: 'text-emerald-400',
    description: 'Lower capital, time, or skill requirements. Fewer external dependencies.'
  },
  medium: {
    label: 'Medium Friction',
    icon: TrendingUp,
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/50',
    text: 'text-amber-400',
    description: 'Moderate capital, time, or skill investment. Some operational complexity.'
  },
  high: {
    label: 'High Friction',
    icon: Mountain,
    bg: 'bg-red-950/40',
    border: 'border-red-800/50',
    text: 'text-red-400',
    description: 'High capital, time, or skill requirements. Significant operational complexity or external dependencies.'
  }
};

export default function FrictionBadge({ friction, size = 'default', showDescription = false }) {
  const config = frictionConfig[friction];
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <div className="flex flex-col gap-1">
      <div className={cn(
        'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-medium',
        config.bg,
        config.border,
        config.text,
        size === 'large' && 'px-4 py-2 text-lg'
      )}>
        <Icon className={cn('h-4 w-4', size === 'large' && 'h-5 w-5')} />
        <span>{config.label}</span>
      </div>
      {showDescription && (
        <p className="text-xs text-zinc-500 max-w-xs">{config.description}</p>
      )}
    </div>
  );
}