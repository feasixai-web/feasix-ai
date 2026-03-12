import React from 'react';
import { Loader2, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ANALYSIS_STEPS = [
{ key: 'preparing', label: 'Preparing' },
{ key: 'fetching', label: 'Fetching data' },
{ key: 'analyzing', label: 'Analyzing' },
{ key: 'scoring', label: 'Scoring' },
{ key: 'complete', label: 'Complete' }];


export default function AnalysisProgressCard({ currentStep = 'preparing', videoTitle, videoId, onDismiss }) {
  const currentStepIndex = ANALYSIS_STEPS.findIndex((s) => s.key === currentStep);
  const isComplete = currentStep === 'complete';
  const progress = (currentStepIndex + 1) / ANALYSIS_STEPS.length * 100;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 to-zinc-900/50 border border-blue-800/30">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isComplete ?
            <CheckCircle2 className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" /> :

            <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
            }
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-200">
                {isComplete ? 'Analysis Complete' : 'Analyzing Video'}
              </p>
              {videoTitle &&
              <p className="text-xs text-zinc-500 truncate mt-0.5">{videoTitle}</p>
              }
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

          {/* Step Labels */}
        <div className="flex gap-1 text-xs text-zinc-500">
          {ANALYSIS_STEPS.map((step, idx) => null










          )}
        </div>

        {/* Go to Results Button */}
        {isComplete && videoId &&
        <Link to={createPageUrl(`VideoDetail?id=${videoId}`)}>
            <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-500 text-white">
              View Results
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </Link>
        }
      </div>
    </div>);

}