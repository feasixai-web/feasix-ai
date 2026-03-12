import React from 'react';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ANALYSIS_STEPS = [
  { key: 'preparing', label: 'Preparing' },
  { key: 'fetching', label: 'Fetching data' },
  { key: 'analyzing', label: 'Analyzing' },
  { key: 'scoring', label: 'Scoring' },
  { key: 'complete', label: 'Complete' }
];

export default function AnalysisProgressBar({ isActive, currentStep = 'preparing', videoTitle, onDismiss }) {
  if (!isActive) return null;

  const currentStepIndex = ANALYSIS_STEPS.findIndex(s => s.key === currentStep);
  const isComplete = currentStep === 'complete';
  const progress = ((currentStepIndex + 1) / ANALYSIS_STEPS.length) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800/50">
      <div className="max-w-full px-4 py-3">
        <div className="flex items-center gap-4">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-teal-400 flex-shrink-0" />
          ) : (
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {isComplete ? 'Analysis Complete' : 'Analyzing Video'}
              </p>
              {videoTitle && <p className="text-xs text-zinc-500 truncate">• {videoTitle}</p>}
            </div>
            <div className="w-full bg-zinc-800/50 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {isComplete && (
            <button
              onClick={onDismiss}
              className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}