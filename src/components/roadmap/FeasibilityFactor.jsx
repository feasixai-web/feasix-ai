import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const impactConfig = {
  high: {
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-800/30'
  },
  medium: {
    icon: Minus,
    color: 'text-amber-400',
    bg: 'bg-amber-950/30',
    border: 'border-amber-800/30'
  },
  low: {
    icon: TrendingDown,
    color: 'text-red-400',
    bg: 'bg-red-950/30',
    border: 'border-red-800/30'
  }
};

export default function FeasibilityFactor({ factor, isBlurred = false }) {
  const config = impactConfig[factor.impact_level] || impactConfig.medium;
  const Icon = config.icon;
  
  return (
    <Card className={cn(
      'p-4 border transition-all duration-300',
      config.bg,
      config.border,
      isBlurred && 'blur-sm'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', config.bg)}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        <div>
          <p className="font-medium text-zinc-200">{factor.factor}</p>
          <p className="mt-1 text-sm text-zinc-400 italic">"{factor.statement}"</p>
        </div>
      </div>
    </Card>
  );
}