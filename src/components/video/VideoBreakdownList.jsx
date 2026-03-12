import React, { useState, useEffect, useRef } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASE_COLORS = {
  entry: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  validation: 'bg-green-500/10 text-green-600 border-green-500/20',
  execution: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  scale: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
};

export default function VideoBreakdownList({ breakdown, currentTime, onTimestampClick, onChapterSelect }) {
  if (!breakdown || breakdown.length === 0) {
    return null;
  }

  // Parse timestamp to seconds helper
  const timestampToSeconds = (ts) => {
    const parts = ts.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
  };

  // Find which chapter is currently active
  let activeIndex = -1;
  for (let i = breakdown.length - 1; i >= 0; i--) {
    const chapterSeconds = timestampToSeconds(breakdown[i].timestamp);
    if (currentTime >= chapterSeconds) {
      activeIndex = i;
      break;
    }
  }

  return (
    <div className="space-y-2">
      {breakdown.map((chapter, index) => (
        <ChapterRow 
          key={index} 
          chapter={chapter} 
          isActive={index === activeIndex}
          onTimestampClick={onTimestampClick}
          onChapterSelect={onChapterSelect}
        />
      ))}
    </div>
  );
}

function ChapterRow({ chapter, isActive, onTimestampClick, onChapterSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const { timestamp, title, phase, explanation, significance, reality } = chapter;
  const rowRef = useRef(null);

  const phaseColor = PHASE_COLORS[phase] || 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20';

  // Trigger advisor response when this chapter becomes active
  useEffect(() => {
    if (isActive && onChapterSelect) {
      onChapterSelect(chapter);
    }
  }, [isActive]);

  // Auto-scroll to active chapter within its container only
  useEffect(() => {
    if (isActive && rowRef.current) {
      const element = rowRef.current;
      const container = element.closest('.overflow-y-auto');
      if (container) {
        const containerTop = container.offsetTop;
        const elementTop = element.offsetTop - containerTop;
        container.scrollTo({ top: elementTop, behavior: 'smooth' });
      }
    }
  }, [isActive]);

  const handleTimestampClick = (e) => {
    e.stopPropagation();
    if (onTimestampClick) {
      onTimestampClick(timestamp);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full scroll-mt-0" ref={rowRef}>
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
          isActive 
            ? "border-teal-500/50 bg-teal-950/30 shadow-lg shadow-teal-500/20 ring-2 ring-teal-500/30" 
            : "border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/50"
        )}>
          {/* Timestamp */}
          <button
            onClick={handleTimestampClick}
            className="text-xs text-zinc-500 hover:text-teal-400 font-mono mt-0.5 shrink-0 transition-colors"
          >
            {timestamp}
          </button>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-zinc-100 text-sm">{title}</h4>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-zinc-500 transition-transform shrink-0",
                  isOpen && "rotate-90"
                )}
              />
            </div>

            {/* Collapsed preview */}
            {!isOpen && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-xs px-2 py-0.5 rounded-full border capitalize", phaseColor)}>
                  {phase}
                </span>
                {explanation && (
                  <span className="text-xs text-zinc-400 line-clamp-1">{explanation}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 ml-16 space-y-3 px-4 py-3 rounded-lg border border-zinc-800/30 bg-zinc-950/50">
          {explanation && (
            <div>
              <h5 className="text-xs font-semibold text-zinc-400 mb-1">Explanation</h5>
              <p className="text-sm text-zinc-300 leading-relaxed">{explanation}</p>
            </div>
          )}

          {significance && (
            <div>
              <h5 className="text-xs font-semibold text-zinc-400 mb-1">Why It Matters</h5>
              <p className="text-sm text-zinc-300 leading-relaxed">{significance}</p>
            </div>
          )}

          {reality && (
            <div>
              <h5 className="text-xs font-semibold text-zinc-400 mb-1">Reality Check</h5>
              <p className="text-sm text-zinc-300 leading-relaxed">{reality}</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}