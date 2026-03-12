import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, AlertTriangle, HelpCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoadmapStep({ step, isBlurred = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="relative">
      {/* Connection line */}
      <div className="absolute left-6 top-14 bottom-0 w-px bg-zinc-800" />
      
      <Card 
        className={`
          relative bg-zinc-900/50 border-zinc-800/50 overflow-hidden cursor-pointer
          hover:bg-zinc-900/80 hover:border-zinc-700/50 transition-all duration-300
          ${isBlurred ? 'blur-sm pointer-events-none' : ''}
        `}
        onClick={() => !isBlurred && setIsExpanded(!isExpanded)}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Step number */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <span className="text-lg font-semibold text-zinc-400">{step.order}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-zinc-100">{step.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{step.description}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-6 ml-16 space-y-5">
                  {/* Why this step exists */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <HelpCircle className="h-4 w-4" />
                      <span>Why this step exists</span>
                    </div>
                    <p className="text-sm text-zinc-300 pl-6">{step.why_exists}</p>
                  </div>
                  
                  {/* Common failures */}
                  {step.common_failures?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-red-400/80">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Where people commonly fail</span>
                      </div>
                      <ul className="space-y-1 pl-6">
                        {step.common_failures.map((failure, i) => (
                          <li key={i} className="text-sm text-zinc-400">• {failure}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Assumptions */}
                  {step.assumptions_about_user?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-amber-400/80">
                        <Users className="h-4 w-4" />
                        <span>What this assumes about you</span>
                      </div>
                      <ul className="space-y-1 pl-6">
                        {step.assumptions_about_user.map((assumption, i) => (
                          <li key={i} className="text-sm text-zinc-400">• {assumption}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}