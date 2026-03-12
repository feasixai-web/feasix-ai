import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, ArrowRight, Trash2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccumulationPanel({ 
  videos = [], 
  onRemove, 
  onAnalyze, 
  isAnalyzing = false,
  canAnalyze = true,
  minVideos = 3,
  maxVideos = 3,
  isPaid = false
}) {
  const canStartAnalysis = videos.length >= minVideos && canAnalyze;
  const isAtLimit = !isPaid && videos.length >= maxVideos;
  
  return (
    <Card className="bg-zinc-900/50 border-zinc-800/50 sticky top-4">
      <div className="p-5 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800/50">
            <Layers className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100">Accumulation</h3>
            <p className="text-xs text-zinc-500">{videos.length} / {isPaid ? '∞' : maxVideos} videos</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        <AnimatePresence>
          {videos.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">
              Add high-quality videos to begin analysis
            </p>
          ) : (
            videos.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 truncate">{video.title}</p>
                  <p className="text-xs text-zinc-500">{video.channel}</p>
                </div>
                <button 
                  onClick={() => onRemove?.(video.id)}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      
      {isAtLimit && (
        <div className="px-4 py-2 bg-amber-950/30 border-t border-amber-800/30">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <Lock className="h-3 w-3" />
            <span>Free tier limit reached</span>
          </div>
        </div>
      )}
      
      <div className="p-4 border-t border-zinc-800/50">
        <Button
          className="w-full bg-zinc-100 text-zinc-900 hover:bg-white"
          disabled={!canStartAnalysis || isAnalyzing}
          onClick={onAnalyze}
        >
          {isAnalyzing ? (
            'Analyzing...'
          ) : (
            <>
              Generate Roadmap
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
        {videos.length < minVideos && videos.length > 0 && (
          <p className="mt-2 text-xs text-zinc-500 text-center">
            Add {minVideos - videos.length} more video{minVideos - videos.length > 1 ? 's' : ''} to analyze
          </p>
        )}
      </div>
    </Card>
  );
}