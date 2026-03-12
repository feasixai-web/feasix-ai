import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, Coins, Brain, Activity, AlertCircle, BarChart3, Anchor, Eye, Users, Zap, TrendingUp, Flame } from 'lucide-react';

const dimensionIcons = {
  'Capital Intensity': Coins,
  'Skill Complexity': Brain,
  'Time to Feedback Loop': Activity,
  'Emotional Volatility Risk': AlertCircle,
  'Operational Complexity Growth': BarChart3,
  'Platform Dependency Risk': Anchor,
  'Focus Requirement': Eye,
  'Market Saturation Sensitivity': Users
};

const getVerdictStyle = (verdict) => {
  switch(verdict) {
    case 'high':
      return {
        gradient: 'from-red-950/40 via-red-900/20 to-transparent',
        border: 'border-red-800/40',
        icon: 'text-red-400',
        iconBg: 'bg-red-950/50',
        badge: 'bg-red-900/60 text-red-200 border-red-700/60',
        glow: 'shadow-red-900/20'
      };
    case 'medium':
      return {
        gradient: 'from-amber-950/40 via-amber-900/20 to-transparent',
        border: 'border-amber-800/40',
        icon: 'text-amber-400',
        iconBg: 'bg-amber-950/50',
        badge: 'bg-amber-900/60 text-amber-200 border-amber-700/60',
        glow: 'shadow-amber-900/20'
      };
    case 'low':
      return {
        gradient: 'from-emerald-950/40 via-emerald-900/20 to-transparent',
        border: 'border-emerald-800/40',
        icon: 'text-emerald-400',
        iconBg: 'bg-emerald-950/50',
        badge: 'bg-emerald-900/60 text-emerald-200 border-emerald-700/60',
        glow: 'shadow-emerald-900/20'
      };
    default:
      return {
        gradient: 'from-zinc-800/40 via-zinc-800/20 to-transparent',
        border: 'border-zinc-700/40',
        icon: 'text-zinc-400',
        iconBg: 'bg-zinc-800/50',
        badge: 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60',
        glow: 'shadow-zinc-900/20'
      };
  }
};

export default function DimensionCard({ dimension }) {
  const Icon = dimensionIcons[dimension.dimension_name] || Zap;
  const style = getVerdictStyle(dimension.micro_verdict);

  return (
    <Collapsible>
      <CollapsibleTrigger className="w-full group">
        <Card className={`bg-gradient-to-br ${style.gradient} backdrop-blur-sm border ${style.border} p-5 hover:shadow-lg ${style.glow} transition-all duration-200`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className={`p-3 rounded-xl ${style.iconBg} border ${style.border} flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${style.icon}`} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-100 mb-1">{dimension.dimension_name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${style.badge}`}>
                    {dimension.micro_verdict.toUpperCase()} FRICTION
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-zinc-500 group-data-[state=open]:rotate-180 transition-transform flex-shrink-0 mt-1" />
          </div>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="bg-zinc-900/60 border-zinc-800/50 p-5 mt-3 space-y-4">
          {/* Structural Reality */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-teal-400" />
              <p className="text-xs font-semibold text-teal-300 uppercase tracking-wide">Structural Reality</p>
            </div>
            <div className="grid gap-3">
              {dimension.structural_reality.map((reality, rIdx) => (
                <Card key={rIdx} className="bg-gradient-to-br from-teal-950/30 to-teal-900/10 border-teal-800/30 p-4 hover:border-teal-700/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-teal-900/50 border border-teal-700/50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-teal-300">{rIdx + 1}</span>
                    </div>
                    <p className="text-sm text-teal-100 leading-relaxed flex-1">{reality}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Context Collision */}
          {dimension.personal_context_collision?.collision_exists && (
            <div className="pt-4 border-t border-zinc-700/30">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4 text-amber-400" />
                <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Your Context Collision</p>
              </div>
              <Card className="bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-red-950/20 border-amber-700/40 p-5 shadow-lg shadow-amber-900/20">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-amber-900/40 border border-amber-700/50">
                    <AlertCircle className="h-5 w-5 text-amber-300" />
                  </div>
                  <p className="text-sm text-amber-50 leading-relaxed flex-1">
                    {dimension.personal_context_collision.collision_explanation}
                  </p>
                </div>
                {dimension.personal_context_collision.relevant_constraints && dimension.personal_context_collision.relevant_constraints.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {dimension.personal_context_collision.relevant_constraints.map((constraint, cIdx) => (
                      <span key={cIdx} className="text-xs px-3 py-1.5 rounded-lg bg-amber-900/60 text-amber-100 border border-amber-700/60 font-medium shadow-sm">
                        {constraint}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}