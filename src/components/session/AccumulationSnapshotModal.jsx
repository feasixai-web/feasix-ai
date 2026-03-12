import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Layers, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function AccumulationSnapshotModal({ snapshot, trigger }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!snapshot) return null;

  const jsonText = JSON.stringify(snapshot.accumulation, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-400" />
              Accumulation Snapshot
            </DialogTitle>
            <p className="text-xs text-zinc-400 truncate">{snapshot.video_title}</p>
            {snapshot.saved_at && (
              <p className="text-xs text-zinc-500">Saved {format(new Date(snapshot.saved_at), 'MMM d, yyyy h:mm a')}</p>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col mt-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500">Raw accumulation data (JSON) — copy this as context for your next AI analysis.</p>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-300 transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              readOnly
              value={snapshot.accumulation ? jsonText : 'No accumulation data in this snapshot.'}
              className="flex-1 w-full min-h-[400px] p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}