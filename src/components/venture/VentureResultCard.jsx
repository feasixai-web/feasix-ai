import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, DollarSign, Clock, Zap, Youtube } from 'lucide-react';

const archetypeColors = {
  Creator:     'bg-purple-950/40 border-purple-800/40 text-purple-300',
  Builder:     'bg-blue-950/40   border-blue-800/40   text-blue-300',
  Operator:    'bg-teal-950/40   border-teal-800/40   text-teal-300',
  Merchant:    'bg-amber-950/40  border-amber-800/40  text-amber-300',
  Technician:  'bg-cyan-950/40   border-cyan-800/40   text-cyan-300',
  Opportunist: 'bg-green-950/40  border-green-800/40  text-green-300',
};

const capitalLabels = { Low: '$0–$200', Medium: '$200–$2,000', High: '$2,000+' };
const timeLabels    = { Fast: 'Days–weeks', Medium: '1–3 months', Slow: '3–12 months' };

export default function VentureResultCard({ venture, rank, onSelect }) {
  return (
    <div
      className="relative rounded-xl border-2 border-zinc-700/50 bg-zinc-900/50 p-6 cursor-pointer hover:border-zinc-600 transition-all space-y-4"
      onClick={() => onSelect(venture)}
    >
      {rank === 1 && (
        <div className="absolute -top-3 left-4">
          <span className="px-3 py-0.5 bg-teal-600 text-white text-xs font-semibold rounded-full">
            Best Match
          </span>
        </div>
      )}

      <div>
        <h3 className="text-base font-semibold text-zinc-100 mb-1">{venture.venture_name}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{venture.description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${archetypeColors[venture.archetype]}`}>
          {venture.archetype}
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-zinc-700/50 text-zinc-400">
          <DollarSign className="h-3 w-3" />
          {capitalLabels[venture.capital_required]}
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-zinc-700/50 text-zinc-400">
          <Clock className="h-3 w-3" />
          {timeLabels[venture.time_to_first_money]}
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-zinc-700/50 text-zinc-400">
          <Youtube className="h-3 w-3" />
          {venture.youtube_content_volume}
        </span>
      </div>

      <Button
        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm"
        onClick={(e) => { e.stopPropagation(); onSelect(venture); }}
      >
        Explore This Venture
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}