import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Repeat } from 'lucide-react';

export default function AggregatedInsights({ session, isBlurred = false }) {
  if (!session) return null;
  
  return (
    <div className={`space-y-6 ${isBlurred ? 'blur-sm pointer-events-none' : ''}`}>
      {/* Repeated Requirements */}
      {session.aggregated_requirements?.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-950/30">
              <Repeat className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-zinc-100">Repeated Requirements</h3>
          </div>
          <div className="space-y-3">
            {session.aggregated_requirements.map((req, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-zinc-200">{req.requirement}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Mentioned in {req.source_count} source{req.source_count > 1 ? 's' : ''} • {req.confidence} confidence
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Consistent Failure Points */}
      {session.aggregated_failures?.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-950/30">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="font-semibold text-zinc-100">Consistent Failure Points</h3>
          </div>
          <div className="space-y-3">
            {session.aggregated_failures.map((failure, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-zinc-200">{failure.failure}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Stage: {failure.stage} • Mentioned in {failure.source_count} source{failure.source_count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}