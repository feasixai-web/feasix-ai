import React from 'react';
import { Card } from '@/components/ui/card';
import { ChevronRight, Briefcase, Dumbbell, Code, TrendingUp, Heart, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const iconMap = {
  Briefcase,
  Dumbbell,
  Code,
  TrendingUp,
  Heart,
  BookOpen
};

export default function CategoryCard({ category, videosAnalyzed = 0, isLocked = false }) {
  const Icon = iconMap[category.icon] || Briefcase;
  
  return (
    <Link to={createPageUrl(`Category?id=${category.id}`)}>
      <Card className={`
        group relative overflow-hidden
        bg-zinc-900/50 border-zinc-800/50 
        hover:bg-zinc-900/80 hover:border-zinc-700/50
        transition-all duration-300 cursor-pointer
        ${isLocked ? 'opacity-60' : ''}
      `}>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/30">
              <Icon className="h-6 w-6 text-zinc-400" />
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-zinc-100">{category.name}</h3>
            <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{category.description}</p>
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-xs text-zinc-600">
            <span>{videosAnalyzed} videos analyzed</span>
            {isLocked && (
              <span className="text-amber-500/70">Upgrade to access</span>
            )}
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 to-transparent pointer-events-none" />
      </Card>
    </Link>
  );
}