import React, { useState } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronRight, RefreshCw, Sparkles, Zap, Save, Check, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PHASES = [
{ key: 'entry', label: 'Entry', icon: '🚀', color: 'blue' },
{ key: 'validation', label: 'Validation', icon: '🔍', color: 'emerald' },
{ key: 'execution', label: 'Execution', icon: '⚙️', color: 'purple' },
{ key: 'scale', label: 'Scale', icon: '📈', color: 'amber' }];


const COLOR_MAP = {
  blue: { bg: 'bg-blue-950/30', border: 'border-blue-800/40', text: 'text-blue-300', subBg: 'bg-blue-950/20', subBorder: 'border-blue-800/30', dot: 'bg-blue-400' },
  emerald: { bg: 'bg-emerald-950/30', border: 'border-emerald-800/40', text: 'text-emerald-300', subBg: 'bg-emerald-950/20', subBorder: 'border-emerald-800/30', dot: 'bg-emerald-400' },
  purple: { bg: 'bg-purple-950/30', border: 'border-purple-800/40', text: 'text-purple-300', subBg: 'bg-purple-950/20', subBorder: 'border-purple-800/30', dot: 'bg-purple-400' },
  amber: { bg: 'bg-amber-950/30', border: 'border-amber-800/40', text: 'text-amber-300', subBg: 'bg-amber-950/20', subBorder: 'border-amber-800/30', dot: 'bg-amber-400' }
};

export default function AccumulationTab({ video, sessionId, onJumpToTimestamp }) {

  const parseTimestamp = (ts) => {
    if (!ts) return null;
    const parts = ts.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  };
  const rawAccumulation = video?.raw_friction_analysis_output?.accumulation;
  const claims = video?.friction_analysis?.execution_claims;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveSnapshot = async () => {
    if (!sessionId || !video?.id) {
      toast.error('No session context found. Open this video from a session to save accumulation.');
      return;
    }
    setSaving(true);
    try {
      await base44.functions.invoke('saveVideoAccumulationSnapshot', { videoId: video.id, sessionId });
      setSaved(true);
      toast.success('Accumulation saved to session');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error('Failed to save accumulation snapshot');
    } finally {
      setSaving(false);
    }
  };

  if (!rawAccumulation && !claims) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
          <Zap className="h-8 w-8 text-zinc-500" />
        </div>
        <h3 className="text-base font-medium text-zinc-300 mb-2">No Accumulation Data</h3>
        <p className="text-xs text-zinc-500">Click "Evaluate" to generate accumulation data.</p>
      </div>);

  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-zinc-100">Accumulated Execution Steps</h2>

      {/* Save to session button */}
      {rawAccumulation &&
      <div className="flex justify-end">
          <button
          onClick={handleSaveSnapshot}
          disabled={saving}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600/20 border border-teal-700/40 text-teal-300 hover:bg-teal-600/30 transition-colors text-xs font-medium disabled:opacity-50">

            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save to Session'}
          </button>
        </div>
      }

      {PHASES.map(({ key, label, color, icon }) => {
        const c = COLOR_MAP[color];
        const rawPhase = rawAccumulation?.[key];
        const claimsPhase = claims?.[key];

        const isOmitted = rawPhase?.status === 'Omitted' || claimsPhase?.status === 'Omitted';

        // whats_new: array of { timestamp, main_step, substeps[] } OR array of strings
        // Filter out "no new" placeholder items the LLM sometimes returns
        const NO_NEW_PATTERN = /no new (structural )?(pillars?|steps?|content|items?|phases?)/i;
        const whatsNewRaw = (Array.isArray(rawPhase?.whats_new) ? rawPhase.whats_new : []).filter(item => {
          if (typeof item === 'string') return !NO_NEW_PATTERN.test(item);
          if (typeof item === 'object' && item !== null) return !NO_NEW_PATTERN.test(item.main_step || '');
          return true;
        });
        // repeated: "None" string, array, or a long string with multiple "Main Step X:" entries
        const repeatedRaw = rawPhase?.repeated;
        let repeatedItems = [];
        if (Array.isArray(repeatedRaw)) {
          repeatedItems = repeatedRaw;
        } else if (typeof repeatedRaw === 'string' && repeatedRaw.toLowerCase() !== 'none' && repeatedRaw.trim() !== '') {
          // Split on "Main Step N:" pattern to separate concatenated steps
          const splitItems = repeatedRaw.split(/(?=Main Step \d+:)/i).map((s) => s.trim()).filter(Boolean);
          repeatedItems = splitItems.length > 1 ? splitItems : [repeatedRaw];
        }
        const repeatedIsNone = repeatedItems.length === 0;

        const totalCount = whatsNewRaw.length + repeatedItems.length;

        return (
          <Collapsible key={key} defaultOpen={false}>
            <CollapsibleTrigger className={`flex items-center justify-between w-full p-4 rounded-lg border ${c.bg} ${c.border} hover:opacity-90 transition-opacity`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className={`text-sm font-semibold ${c.text}`}>{label}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${whatsNewRaw.length > 0 ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' : 'bg-zinc-800/60 border border-zinc-700/40 text-zinc-500'}`}>
                    +{whatsNewRaw.length} new
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${repeatedItems.length > 0 ? 'bg-zinc-700/50 border border-zinc-600/40 text-zinc-400' : 'bg-zinc-800/60 border border-zinc-700/40 text-zinc-500'}`}>
                    {repeatedItems.length} reinforced
                  </span>
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 ${c.text}`} />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2 space-y-2 pl-2">
              {/* What's New */}
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className={`flex items-center justify-between w-full px-4 py-3 ${c.subBg} ${c.subBorder} border rounded-lg hover:opacity-90 transition-opacity`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className={`h-3.5 w-3.5 ${c.text}`} />
                    <span className={`text-xs font-medium ${c.text}`}>What's New</span>
                    <span className="text-xs text-zinc-500">({whatsNewRaw.length})</span>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 ${c.text}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 pl-3 space-y-2">
                  {whatsNewRaw.length === 0 ?
                  <p className="text-xs text-zinc-500 px-3 py-2 italic">No new steps in this phase.</p> :
                  whatsNewRaw.map((item, i) => {
                    if (typeof item === 'string') {
                      return (
                        <div key={i} className={`flex items-start gap-2 px-3 py-2 ${c.subBg} ${c.subBorder} border rounded-md`}>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${c.dot}`} />
                          <p className="text-xs text-zinc-200 leading-relaxed">{item}</p>
                        </div>);
                    }
                    return (
                      <div key={i} className={`px-3 py-3 ${c.subBg} ${c.subBorder} border rounded-md space-y-2`}>
                        <div className="flex items-center gap-2">
                          {item.timestamp && onJumpToTimestamp && (
                            <button
                              onClick={() => {
                                const secs = parseTimestamp(item.timestamp);
                                if (secs !== null) onJumpToTimestamp(secs, item.timestamp);
                              }}
                              title="Jump to this timestamp"
                              className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${c.text} flex-shrink-0 hover:underline cursor-pointer bg-transparent border-none p-0`}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {item.timestamp}
                            </button>
                          )}
                          {item.timestamp && !onJumpToTimestamp && (
                            <span className={`text-xs font-mono font-bold ${c.text} flex-shrink-0`}>{item.timestamp}</span>
                          )}
                          <p className="text-xs font-semibold text-zinc-100 select-text cursor-text">{item.main_step}</p>
                        </div>
                        {item.substeps?.length > 0 &&
                        <ul className="space-y-1 pl-2">
                            {item.substeps.map((sub, j) =>
                          <li key={j} className="flex items-start gap-2">
                                <div className={`w-1 h-1 rounded-full flex-shrink-0 mt-1.5 ${c.dot}`} />
                                <p className="text-xs text-zinc-300 leading-relaxed select-text cursor-text">{sub}</p>
                              </li>
                          )}
                          </ul>
                        }
                      </div>);
                  })}
                </CollapsibleContent>
              </Collapsible>

              {/* Repeated / Confirmed */}
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 bg-zinc-800/40 border border-zinc-700/40 rounded-lg hover:bg-zinc-800/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-300">Repeated / Confirmed</span>
                    <span className="text-xs text-zinc-500">({repeatedItems.length})</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 pl-3 space-y-1.5">
                  {repeatedIsNone ?
                  <p className="text-xs text-zinc-500 px-3 py-2 italic">Nothing repeated from prior videos.</p> :
                  repeatedItems.map((item, i) => {
                    if (typeof item === 'string') {
                      if (!item.trim()) return null;
                      return (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 bg-zinc-800/30 border border-zinc-700/20 rounded-md">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0 mt-1.5" />
                          <p className="text-xs text-zinc-300 leading-relaxed select-text cursor-text">{item}</p>
                        </div>);
                    }
                    const summary = item?.summary_line || item?.main_step || item?.summary || '';
                    if (!summary) return null;
                    const substeps = (Array.isArray(item?.substeps) ? item.substeps : []).filter(s => typeof s === 'string' && s.trim());
                    const reinforcements = Array.isArray(item?.reinforcements) ? item.reinforcements : [];
                    const mentionCount = item?.mention_count;
                    return (
                      <div key={i} className="px-3 py-3 bg-zinc-800/30 border border-zinc-700/20 rounded-md space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-zinc-200 leading-relaxed">{summary}</p>
                          {mentionCount &&
                          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700/60 text-zinc-400 flex-shrink-0">×{mentionCount}</span>
                          }
                        </div>
                        {substeps.length > 0 &&
                        <ul className="space-y-1 pl-2">
                            {substeps.map((sub, j) => {
                              const subText = typeof sub === 'string' ? sub : (sub?.text || sub?.detail || sub?.step || JSON.stringify(sub));
                              return (
                                <li key={j} className="flex items-start gap-2">
                                  <div className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5 bg-zinc-500" />
                                  <p className="text-xs text-zinc-100 leading-relaxed">{subText}</p>
                                </li>
                              );
                            })}
                          </ul>
                        }
                        {reinforcements.length > 0 &&
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {reinforcements.map((r, j) =>
                          <button
                              key={j}
                              onClick={() => {
                                if (onJumpToTimestamp && r.timestamp) {
                                  const secs = parseTimestamp(r.timestamp);
                                  if (secs !== null) onJumpToTimestamp(secs, r.timestamp);
                                }
                              }}
                              title={onJumpToTimestamp ? "Jump to this timestamp" : undefined}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-zinc-700/50 border border-zinc-600/40 text-zinc-400 font-mono ${onJumpToTimestamp ? 'hover:bg-zinc-600/60 hover:text-zinc-200 hover:border-zinc-500/60 cursor-pointer' : 'cursor-default'} transition-colors`}
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              Video {r.video_number} · {r.timestamp}
                            </button>
                          )}
                          </div>
                        }
                      </div>);
                  })}
                </CollapsibleContent>
              </Collapsible>
            </CollapsibleContent>
          </Collapsible>);

      })}
    </div>);

}