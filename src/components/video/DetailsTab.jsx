import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, AlertTriangle } from 'lucide-react';

export default function DetailsTab({ video, analyzingFriction, onJumpToTimestamp }) {
  const handleTimestampClick = (timestamp) => {
    const clean = timestamp.replace(/[\[\]]/g, '').split('-')[0].trim();
    const parts = clean.split(':');
    let seconds = 0;
    if (parts.length === 2) seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    else if (parts.length === 3) seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    onJumpToTimestamp(seconds, clean);
  };

  return (
    <div className="space-y-6">
      {/* Nuggets Section */}
      <div>
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-purple-400" />
          Execution Nuggets
        </h4>
        {analyzingFriction ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full bg-zinc-800/50" />
            <Skeleton className="h-20 w-full bg-zinc-800/50" />
          </div>
        ) : video?.friction_analysis?.execution_nuggets?.length > 0 ? (
          <div className="space-y-4">
            {video.friction_analysis.execution_nuggets.map((nugget, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-br from-purple-950/20 to-purple-900/5 rounded-lg border border-purple-800/30 group">
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg bg-purple-900/50 border border-purple-700/50 flex-shrink-0 cursor-pointer hover:bg-purple-800/70 transition-colors"
                    onClick={() => handleTimestampClick(nugget.timestamp)}
                    title="Click to jump to this moment"
                  >
                    <Sparkles className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs font-mono px-2 py-1 bg-zinc-900/70 text-purple-300 rounded border border-purple-700/50 cursor-pointer hover:bg-purple-900/50 transition-colors"
                        onClick={() => handleTimestampClick(nugget.timestamp)}
                      >
                        {nugget.timestamp}
                      </span>
                      <span className="text-xs text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">jump</span>
                      <span className="text-sm font-semibold text-purple-200">{nugget.insight}</span>
                    </div>
                    {nugget.failure_mode && (
                      <div className="p-3 bg-zinc-900/40 rounded-lg border-l-4 border-amber-500/50">
                        <p className="text-xs font-medium text-amber-300 mb-1 flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3" />
                          Failure Mode
                        </p>
                        <p className="text-sm text-zinc-200 leading-relaxed">{nugget.failure_mode}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 text-center py-6">Click "Evaluate" to extract nuggets.</p>
        )}
      </div>

      <div className="border-t border-zinc-800/50" />

      {/* Nuances Section */}
      <div>
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          Nuances
        </h4>
        {analyzingFriction ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full bg-zinc-800/50" />
            <Skeleton className="h-20 w-full bg-zinc-800/50" />
          </div>
        ) : video?.friction_analysis?.nuances?.length > 0 ? (
          <div className="space-y-3">
            {video.friction_analysis.nuances.map((nuance, idx) => (
              <div key={idx} className="p-4 bg-amber-950/20 border border-amber-800/30 rounded-lg space-y-3">
                {nuance.verbatim_evidence_quote && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      {nuance.timestamp && (
                        <button
                          onClick={() => handleTimestampClick(nuance.timestamp)}
                          className="text-xs font-mono px-2 py-1 bg-zinc-900/70 text-amber-300 rounded border border-amber-700/50 hover:bg-amber-900/50 transition-colors"
                        >
                          {nuance.timestamp.replace(/[\[\]]/g, '').split('-')[0].trim()}
                        </button>
                      )}
                      <p className="text-xs font-semibold text-amber-300">Video Statement:</p>
                    </div>
                    <div className="pl-4 border-l-2 border-amber-500/50">
                      <p className="text-sm text-amber-200 leading-relaxed italic">"{nuance.verbatim_evidence_quote}"</p>
                    </div>
                  </div>
                )}
                <div className="pl-4 border-l-2 border-zinc-700/50">
                  <p className="text-xs font-semibold text-zinc-400 mb-1">Nuance:</p>
                  <p className="text-sm font-medium text-zinc-200">{nuance.nuance}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (video?.failure_points_discussed?.length > 0 || video?.constraints_mentioned?.length > 0) ? (
          <div className="space-y-3">
            {video.failure_points_discussed?.map((fp, idx) => (
              <div key={`fp-${idx}`} className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-lg">
                <p className="text-xs text-zinc-300 mb-2 font-medium">"{typeof fp === 'string' ? fp : fp.failure_point}"</p>
                <p className="text-xs text-amber-200 leading-relaxed">
                  <span className="font-semibold">Nuance: </span>
                  {typeof fp === 'object' && fp.explanation_context ? fp.explanation_context : "Critical failure point often underestimated."}
                </p>
              </div>
            ))}
            {video.constraints_mentioned?.map((constraint, idx) => (
              <div key={`c-${idx}`} className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-lg">
                <p className="text-xs text-zinc-300 mb-2 font-medium">"{typeof constraint === 'string' ? constraint : constraint.constraint}"</p>
                <p className="text-xs text-amber-200 leading-relaxed">
                  <span className="font-semibold">Nuance: </span>
                  {typeof constraint === 'object' && constraint.explanation_context ? constraint.explanation_context : "This constraint creates hidden bottlenecks."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 text-center py-6">Click "Evaluate" to identify nuances.</p>
        )}
      </div>
    </div>
  );
}