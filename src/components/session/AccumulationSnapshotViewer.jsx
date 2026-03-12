import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronRight, RefreshCw, Sparkles, Layers } from 'lucide-react';
import { format } from 'date-fns';

const PHASES = [
  { key: 'entry', label: 'Entry', icon: '🚀', color: 'blue' },
  { key: 'validation', label: 'Validation', icon: '🔍', color: 'emerald' },
  { key: 'execution', label: 'Execution', icon: '⚙️', color: 'purple' },
  { key: 'scale', label: 'Scale', icon: '📈', color: 'amber' },
];

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-950/30', border: 'border-blue-800/40', text: 'text-blue-300', subBg: 'bg-blue-950/20', subBorder: 'border-blue-800/30', dot: 'bg-blue-400' },
  emerald: { bg: 'bg-emerald-950/30', border: 'border-emerald-800/40', text: 'text-emerald-300', subBg: 'bg-emerald-950/20', subBorder: 'border-emerald-800/30', dot: 'bg-emerald-400' },
  purple:  { bg: 'bg-purple-950/30', border: 'border-purple-800/40', text: 'text-purple-300', subBg: 'bg-purple-950/20', subBorder: 'border-purple-800/30', dot: 'bg-purple-400' },
  amber:   { bg: 'bg-amber-950/30', border: 'border-amber-800/40', text: 'text-amber-300', subBg: 'bg-amber-950/20', subBorder: 'border-amber-800/30', dot: 'bg-amber-400' },
};

function AccumulationView({ accumulation }) {
  return (
    <div className="space-y-3">
      {PHASES.map(({ key, label, color, icon }) => {
        const c = COLOR_MAP[color];
        const phase = accumulation?.[key];
        if (!phase) return null;

        const repeatedRaw = phase.repeated;
        const repeatedItems = Array.isArray(repeatedRaw) ? repeatedRaw : [];
        const repeatedIsNone = !Array.isArray(repeatedRaw) || repeatedItems.length === 0;
        const whatsNewRaw = phase.whats_new || [];

        return (
          <Collapsible key={key} defaultOpen={false}>
            <CollapsibleTrigger className={`flex items-center justify-between w-full p-4 rounded-lg border ${c.bg} ${c.border} hover:opacity-90 transition-opacity`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className={`text-sm font-semibold ${c.text}`}>{label}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 text-zinc-400">
                  {whatsNewRaw.length + repeatedItems.length} steps
                </span>
              </div>
              <ChevronRight className={`h-4 w-4 ${c.text}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2 pl-2">
              {/* Repeated */}
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
                  {repeatedIsNone ? (
                    <p className="text-xs text-zinc-500 px-3 py-2 italic">Nothing repeated from prior videos.</p>
                  ) : repeatedItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 bg-zinc-800/30 border border-zinc-700/20 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0 mt-1.5" />
                      <p className="text-xs text-zinc-300 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

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
                  {whatsNewRaw.length === 0 ? (
                    <p className="text-xs text-zinc-500 px-3 py-2 italic">No new steps in this phase.</p>
                  ) : whatsNewRaw.map((item, i) => {
                    if (typeof item === 'string') {
                      return (
                        <div key={i} className={`flex items-start gap-2 px-3 py-2 ${c.subBg} ${c.subBorder} border rounded-md`}>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${c.dot}`} />
                          <p className="text-xs text-zinc-200 leading-relaxed">{item}</p>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className={`px-3 py-3 ${c.subBg} ${c.subBorder} border rounded-md space-y-2`}>
                        <div className="flex items-center gap-2">
                          {item.timestamp && <span className={`text-xs font-mono font-bold ${c.text} flex-shrink-0`}>{item.timestamp}</span>}
                          <p className="text-xs font-semibold text-zinc-100">{item.main_step}</p>
                        </div>
                        {item.substeps?.length > 0 && (
                          <ul className="space-y-1 pl-2">
                            {item.substeps.map((sub, j) => (
                              <li key={j} className="flex items-start gap-2">
                                <div className={`w-1 h-1 rounded-full flex-shrink-0 mt-1.5 ${c.dot}`} />
                                <p className="text-xs text-zinc-300 leading-relaxed">{sub}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

export default function AccumulationSnapshotViewer({ snapshots = [] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  if (snapshots.length === 0) return null;

  const handleView = (snapshot) => {
    setSelected(snapshot);
    setOpen(true);
  };

  return (
    <>
      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" />
          Saved Accumulation Snapshots
        </p>
        {snapshots.map((snap, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-800/30 border border-zinc-700/30 rounded-lg">
            <div>
              <p className="text-xs font-medium text-zinc-200 truncate max-w-[180px]">{snap.video_title}</p>
              <p className="text-xs text-zinc-500">{snap.saved_at ? format(new Date(snap.saved_at), 'MMM d, h:mm a') : ''}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-teal-700/50 text-teal-300 hover:bg-teal-950/30 text-xs"
              onClick={() => handleView(snap)}
            >
              View Accumulation
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 text-sm font-semibold">
              Accumulation: {selected?.video_title}
            </DialogTitle>
            <p className="text-xs text-zinc-500">Saved {selected?.saved_at ? format(new Date(selected.saved_at), 'MMM d, yyyy h:mm a') : ''}</p>
          </DialogHeader>
          {selected?.accumulation && (
            <div className="mt-2">
              <AccumulationView accumulation={selected.accumulation} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}