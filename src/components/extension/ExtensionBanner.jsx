import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chrome, X } from 'lucide-react';
import FeasixWordmark from '@/components/brand/FeasixWordmark';

export default function ExtensionBanner({ onDismiss }) {
  return (
    <Card className="relative bg-gradient-to-r from-zinc-900 to-zinc-900/50 border-zinc-800/50 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
      
      <div className="relative p-6">
        <button 
          onClick={onDismiss}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/30">
            <Chrome className="h-10 w-10 text-zinc-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 flex-wrap">
              <FeasixWordmark className="text-lg" /> Browser Extension
            </h3>
            <p className="mt-1 text-sm text-zinc-400 max-w-lg">
              Get instant Skip/Skim/Watch ratings directly on YouTube. The extension analyzes video transcripts 
              and displays verdicts before you start watching.
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Chrome className="h-4 w-4 mr-2" />
            Coming Soon
          </Button>
        </div>
      </div>
    </Card>
  );
}