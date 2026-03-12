import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Zap, Target, Clock, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const challengeConfig = {
  easy: { bg: 'bg-emerald-950/30', border: 'border-emerald-800/50', text: 'text-emerald-300', icon: '✓' },
  medium: { bg: 'bg-amber-950/30', border: 'border-amber-800/50', text: 'text-amber-300', icon: '◆' },
  hard: { bg: 'bg-red-950/30', border: 'border-red-800/50', text: 'text-red-300', icon: '!' }
};

export default function SubstepDetailPopup({ substep, isOpen, onClose }) {
  const navigate = useNavigate();
  
  if (!substep) return null;

  const challengeStyle = challengeConfig[substep.challenge_level] || challengeConfig.medium;

  const handleAskAI = async () => {
    const context = `I have a question about this execution step: "${substep.text}". ${substep.simplified_explanation || ''}`;
    navigate(createPageUrl(`AIChat?newChat=true&context=${encodeURIComponent(context)}`));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-900/95 border-zinc-800/50">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{substep.text}</DialogTitle>
          <DialogDescription className="text-zinc-400 mt-2">
            Detailed breakdown and requirements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Challenge Level */}
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg border font-medium text-sm ${challengeStyle.bg} ${challengeStyle.border} ${challengeStyle.text}`}>
              {challengeStyle.icon} Challenge: {substep.challenge_level?.charAt(0).toUpperCase() + substep.challenge_level?.slice(1)}
            </div>
          </div>

          {/* Simplified Explanation */}
          {substep.simplified_explanation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-teal-300">What This Step Is</h3>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed ml-6">
                {substep.simplified_explanation}
              </p>
            </div>
          )}

          {/* Constraints & Limitations Metrics */}
          {(substep.cost_estimate || substep.time_estimate || substep.risk_level) && (
            <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-100">Constraints & Limitations</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {substep.cost_estimate && (
                  <div className="bg-slate-900/50 rounded-md p-3 border border-slate-700/30">
                    <p className="text-xs font-medium text-slate-400 mb-1">💰 Cost</p>
                    <p className="text-sm font-semibold text-slate-100">{substep.cost_estimate}</p>
                  </div>
                )}
                {substep.time_estimate && (
                  <div className="bg-slate-900/50 rounded-md p-3 border border-slate-700/30">
                    <p className="text-xs font-medium text-slate-400 mb-1">⏱️ Time</p>
                    <p className="text-sm font-semibold text-slate-100">{substep.time_estimate}</p>
                  </div>
                )}
                {substep.risk_level && (
                  <div className="bg-slate-900/50 rounded-md p-3 border border-slate-700/30">
                    <p className="text-xs font-medium text-slate-400 mb-1">⚠️ Risk</p>
                    <p className="text-sm font-semibold text-slate-100">{substep.risk_level}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unspoken Requirements */}
          {substep.unspoken_requirements && substep.unspoken_requirements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-blue-300">Unspoken Requirements</h3>
              </div>
              <div className="ml-6 space-y-2">
                {substep.unspoken_requirements.map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-xs text-zinc-500 flex-shrink-0 mt-1">•</span>
                    <p className="text-sm text-zinc-300">{req}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nuances / Make-or-Break Factors */}
          {substep.nuances && substep.nuances.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-amber-300">Critical Nuances (Make-or-Break Factors)</h3>
              </div>
              <div className="ml-6 space-y-2">
                {substep.nuances.map((nuance, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30">
                    <span className="text-xs font-bold text-amber-400 flex-shrink-0 mt-0.5">!</span>
                    <p className="text-sm text-amber-100">{nuance}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Chat CTA */}
          <div className="pt-4 border-t border-zinc-800/50">
            <Button
              onClick={handleAskAI}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Talk through any questions with AI
            </Button>
            <p className="text-xs text-zinc-500 text-center mt-2">
              Get personalized guidance and clarification on this step
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}