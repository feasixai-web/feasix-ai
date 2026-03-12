import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BrainCircuit } from 'lucide-react';
import FeasixAdvisorHead from '@/components/FeasixAdvisorHead';

const SIDEBAR_MESSAGES = [
  { delay: 2000, content: "Hello! I'm your Feasix Advisor. I'll be here to guide you through your entrepreneurship journey." },
  { delay: 10000, content: "Need a hand? Just click on me or highlight any text on the page for a quick analysis." },
  { delay: 25000, content: "Remember, the most successful ventures start with a clear understanding of the friction involved. Let's find it." },
];

export default function FeasixSidebarAdvice() {
  const location = useLocation();
  const [speechBubble, setSpeechBubble] = useState(null);
  const [status, setStatus] = useState('normal'); // 'normal', 'warning', 'thinking'
  const bubbleTimerRef = useRef(null);
  const guideShownRef = useRef(false);

  useEffect(() => {
    // Reset status on navigation
    setStatus('normal');
    
    // Proactive guidance on initial load
    if (!guideShownRef.current && !sessionStorage.getItem('sidebar-guide-shown')) {
      guideShownRef.current = true;
      const timers = SIDEBAR_MESSAGES.map(({ delay, content }) =>
        setTimeout(() => {
          showBubble(content);
        }, delay)
      );
      sessionStorage.setItem('sidebar-guide-shown', 'true');
      return () => timers.forEach(clearTimeout);
    }
  }, [location.pathname]);

  const showBubble = (content, duration = 8000) => {
    setSpeechBubble(content);
    clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => setSpeechBubble(null), duration);
  };

  const handleAdvisorClick = () => {
    showBubble("I'm analyzing the current page for relevant insights to share with you...", 5000);
    setStatus('thinking');
    setTimeout(() => setStatus('normal'), 3000);
  };

  return (
    <div className="flex flex-col items-center py-10 px-6 relative h-full">
      {/* Advisor Head Section */}
      <div className="relative mb-12">
        <button 
          onClick={handleAdvisorClick}
          className="relative group transition-transform hover:scale-105 active:scale-95"
        >
          <div className="absolute -inset-4 bg-teal-500/5 blur-2xl rounded-full group-hover:bg-teal-500/10 transition-colors" />
          <FeasixAdvisorHead status={status} size="xl" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-teal-500/30 px-4 py-1.5 rounded-full shadow-2xl whitespace-nowrap">
            <span className="text-[10px] font-bold text-teal-400 tracking-[0.2em] uppercase">Advisor</span>
          </div>
        </button>

        {/* Thought Bubble - Positioned relative to head, adjusted for wider sidebar */}
        <AnimatePresence>
          {speechBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -10, y: 10 }}
              animate={{ opacity: 1, scale: 1, x: 20, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10, y: 10 }}
              className="absolute left-full top-0 z-[100] ml-4 pointer-events-none"
              style={{ width: '260px' }}
            >
              <div className="bg-white border-[3px] border-zinc-900 rounded-[2rem] px-6 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
                <p className="text-[13px] text-zinc-900 leading-relaxed font-bold">
                  {speechBubble}
                </p>
                {/* Tail pointing precisely back to advisor's mouth/head */}
                <div
                  className="absolute"
                  style={{
                    top: '30px', left: '-12px',
                    width: 0, height: 0,
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderRight: '12px solid #09090b',
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    top: '30px', left: '-8px',
                    width: 0, height: 0,
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderRight: '10px solid white',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context Area */}
      <div className="w-full space-y-4">
        <div className="p-5 rounded-[1.5rem] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/50 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <BrainCircuit className="h-12 w-12 text-teal-400" />
          </div>
          <div className="flex items-center gap-2 mb-3 relative">
            <Sparkles className="h-4 w-4 text-teal-400" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">System Context</span>
          </div>
          <p className="text-[12px] text-zinc-300 leading-relaxed font-medium relative">
             Analyzing the <span className="text-teal-400 font-bold">{location.pathname.split('/').pop() || 'Dashboard'}</span> for high-friction details and venture requirements.
          </p>
        </div>

        {/* Quick Help Tip */}
        <div className="px-4 py-2 border-l-2 border-teal-500/30 bg-teal-500/5 rounded-r-lg">
          <p className="text-[10px] text-zinc-500 italic">
            "Friction is the distance between your idea and market reality."
          </p>
        </div>
      </div>
    </div>
  );
}
