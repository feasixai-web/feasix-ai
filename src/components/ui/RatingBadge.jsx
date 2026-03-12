import React from 'react';
import { cn } from '@/lib/utils';
import { XCircle, FastForward, Eye } from 'lucide-react';

const ratingConfig = {
  skip: {
    label: 'Skip',
    icon: XCircle,
    bg: 'bg-red-950/40',
    border: 'border-red-800/50',
    text: 'text-red-400',
    description: 'Largely repetitive, generic, or adds no meaningful new information. Does not surface unique requirements, constraints, or failure points.'
  },
  skim: {
    label: 'Skim',
    icon: FastForward,
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/50',
    text: 'text-amber-400',
    description: 'Contains some useful or clarifying information, but most content is repetitive or surface-level. Only specific segments may be worth attention.'
  },
  watch: {
    label: 'Watch',
    icon: Eye,
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/50',
    text: 'text-emerald-400',
    description: 'Introduces new, non-obvious information that materially affects understanding, feasibility, or execution. Explicitly discusses constraints, prerequisites, risks, or failure points not commonly covered.'
  }
};

export default function RatingBadge({ rating, size = 'default', showDescription = false }) {
  const config = ratingConfig[rating];
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