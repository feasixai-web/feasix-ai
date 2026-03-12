import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ANALYSIS_STEPS = [
  { key: 'preparing', label: 'Preparing video analysis', description: 'Setting up analysis pipeline' },
  { key: 'fetching', label: 'Fetching video data', description: 'Retrieving metadata and transcript' },
  { key: 'analyzing', label: 'Analyzing content', description: 'Processing transcript and extracting insights' },
  { key: 'scoring', label: 'Calculating feasibility scores', description: 'Evaluating requirements and friction' },
  { key: 'complete', label: 'Finalizing results', description: 'Completing analysis' }
];

export default function AnalysisProgress({ isAnalyzing, currentStep = 'preparing' }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const stepIndex = ANALYSIS_STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex >= 0) {
      setActiveStep(stepIndex);
    }
  }, [currentStep]);

  if (!isAnalyzing) return null;

  return (
    <div className="space-y-4 p-4 bg-zinc-900/80 border border-zinc-700/50 rounded-xl">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-200">Analyzing Video</h4>
        <span className="text-xs text-zinc-500">This may take a moment</span>
      </div>
      
      <div className="space-y-3">
        {ANALYSIS_STEPS.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          const isLast = index === ANALYSIS_STEPS.length - 1;
          
          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 text-zinc-600" />
                )}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-sm",
                  isActive ? "text-zinc-200 font-medium" : isCompleted ? "text-zinc-400" : "text-zinc-500"
                )}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
                )}
              </div>
              {!isLast && (
                <ArrowRight className={cn(
                  "h-3 w-3 mt-1",
                  isCompleted ? "text-zinc-500" : "text-zinc-700"
                )} />
              )}
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-800/50">
        You can navigate away - analysis will continue in the background
      </p>
    </div>
  );
}