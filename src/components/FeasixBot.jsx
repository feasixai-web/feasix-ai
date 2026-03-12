import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, Sparkles, Bot, Minus, Plus, GripHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FeasixAdvisorHead from '@/components/FeasixAdvisorHead';

const SYSTEM_PROMPT = `You are Feasix, the Business Advisor for the Feasix platform. Your mission is to help people evaluate entrepreneurship with extreme clarity and realistic skepticism. 

CRITICAL GUARDRAIL: You are strictly restricted to business-related topics. If a user asks about anything unrelated (e.g., weather, food, personal life), you must politely decline and ask them to "zone back in" to their business venture. 

Your tone: Analytical, objective, and supportive but honest. No hype. sound like a seasoned entrepreneur offering strategic guidance.

Keep responses concise (3-5 sentences max) as you are in a compact companion view. If more depth is needed, suggest they use the full "Chat with Feasix" page.`;

const GUIDE_MESSAGES = [
  { delay: 1200,  content: "I'm your Feasix Advisor. Ask me anything about a venture you're exploring — I'll help you assess what it actually requires." },
  { delay: 7000,  content: "Tip: Highlight any text on the page and I'll analyze it in context — useful for breaking down claims or advice you're unsure about." },
  { delay: 16000, content: "When you're ready, analyze a YouTube video under Search Videos. I'll help you identify execution requirements, capital needs, and friction points before you commit." },
];

const MIN_W = 280, MAX_W = 680, MIN_H = 180, MAX_H = 620;

function SpeechBubble({ message, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className="relative mb-2"
      style={{ maxWidth: 260 }}
    >
      {/* Bubble body */}
      <div className="bg-white border-[2.5px] border-zinc-900 rounded-2xl px-4 py-3 shadow-2xl relative">
        <button
          onClick={onDismiss}
          className="absolute top-1.5 right-1.5 text-zinc-400 hover:text-zinc-700 transition-colors p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
        <p className="text-[11.5px] text-zinc-800 leading-relaxed pr-3 font-semibold">{message}</p>
      </div>
      {/* Tail outer (border) */}
      <div
        className="absolute"
        style={{
          bottom: -11, right: 30,
          width: 0, height: 0,
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderTop: '11px solid #09090b',
        }}
      />
      {/* Tail inner (fill) */}
      <div
        className="absolute"
        style={{
          bottom: -8, right: 30,
          width: 0, height: 0,
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderTop: '11px solid white',
        }}
      />
    </motion.div>
  );
}

export default function FeasixBot() {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop() || 'Home';
  
  // Don't show bot on LandingPage or Onboarding
  if (pageName === 'LandingPage' || pageName === 'Onboarding' || pageName === '') {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectionPopup, setSelectionPopup] = useState(null);
  const [pendingSelection, setPendingSelection] = useState('');
  const [speechBubble, setSpeechBubble] = useState(null);
  const [position, setPosition] = useState(null);
  const [panelSize, setPanelSize] = useState({ width: 384, height: 340 });

  const messagesEndRef = useRef(null);
  const guideShownRef = useRef(false);
  const containerRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const bubbleTimerRef = useRef(null);

  // Initial position: top-right on mobile, bottom-right on desktop
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    setPosition({
      top: isMobile ? 16 : window.innerHeight - 120,
      left: window.innerWidth - (isMobile ? 90 : 200),
    });
  }, []);

  // Proactive guide messages as speech bubbles
  useEffect(() => {
    if (guideShownRef.current) return;
    guideShownRef.current = true;
    if (sessionStorage.getItem('feasix-guide-shown')) return;

    const timers = GUIDE_MESSAGES.map(({ delay, content }) =>
      setTimeout(() => {
        setSpeechBubble(content);
        clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = setTimeout(() => setSpeechBubble(null), 10000);
      }, delay)
    );
    sessionStorage.setItem('feasix-guide-shown', '1');
    return () => timers.forEach(clearTimeout);
  }, []);

  // Text selection popup
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 15) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPendingSelection(text);
        setSelectionPopup({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 14 });
      } else {
        setSelectionPopup(null);
        setPendingSelection('');
      }
    };
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Drag
  const handleDragStart = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    hasDragged.current = false;
    const startX = e.clientX, startY = e.clientY;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const onMove = (me) => {
      if (Math.abs(me.clientX - startX) > 3 || Math.abs(me.clientY - startY) > 3) {
        hasDragged.current = true;
        setPosition({
          top: Math.max(0, Math.min(window.innerHeight - 60, me.clientY - dragOffset.current.y)),
          left: Math.max(0, Math.min(window.innerWidth - 60, me.clientX - dragOffset.current.x)),
        });
      }
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const adjustSize = (delta) => {
    setPanelSize(s => ({
      width: Math.min(MAX_W, Math.max(MIN_W, s.width + delta * 80)),
      height: Math.min(MAX_H, Math.max(MIN_H, s.height + delta * 80)),
    }));
  };

  const buildPrompt = (userMessage) => {
    const ctx = messages.map(m => `${m.role === 'user' ? 'User' : 'Feasix'}: ${m.content}`).join('\n');
    return `${SYSTEM_PROMPT}\n\n${ctx ? `Conversation so far:\n${ctx}\n` : ''}User: ${userMessage}\n\nRespond as Feasix:`;
  };

  const sendMessage = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage) return;
    setInput('');
    setSelectionPopup(null);
    setPendingSelection('');
    setIsOpen(true);
    setSpeechBubble(null);

    const updated = [...messages, { role: 'user', content: userMessage }];
    setMessages(updated);
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt: buildPrompt(userMessage) });
      setMessages([...updated, { role: 'assistant', content: response }]);
    } catch {
      setMessages([...updated, { role: 'assistant', content: "Hit a snag — try again!" }]);
    }
    setLoading(false);
  };

  const askAboutSelection = () => {
    sendMessage(`Explain this in plain English — what does it actually mean for someone building a business: "${pendingSelection}"`);
  };

  const containerStyle = {
    position: 'fixed',
    ...(position ? { top: position.top, left: position.left } : { bottom: 16, right: 16 }),
    zIndex: 150
  };

  return (
    <>
      {/* Text Selection Popup */}
      {selectionPopup && (
        <div
          className="fixed z-[200] pointer-events-auto"
          style={{ left: selectionPopup.x, top: selectionPopup.y, transform: 'translate(-50%, -100%)' }}
        >
          <button
            onMouseDown={(e) => { e.preventDefault(); askAboutSelection(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white text-xs font-semibold rounded-full shadow-xl transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-3 w-3" />
            Ask Feasix
          </button>
        </div>
      )}

      {/* Main Widget */}
      <div ref={containerRef} className="flex flex-col items-end gap-0 select-none" style={containerStyle}>

        {/* Chat Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="mb-3 bg-zinc-900 border border-teal-800/40 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
              style={{ width: panelSize.width }}
            >
              {/* Draggable Header */}
              <div
                onMouseDown={handleDragStart}
                className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60 bg-gradient-to-r from-teal-950/70 to-zinc-900 cursor-grab active:cursor-grabbing"
              >
                <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-teal-400" />
                </div>
                <GripHorizontal className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-100 leading-none">Feasix Guide</p>
                  <p className="text-[10px] text-teal-400 mt-0.5">Your business clarity mentor</p>
                </div>
                <button onMouseDown={e => e.stopPropagation()} onClick={() => adjustSize(-1)} className="text-zinc-500 hover:text-zinc-300 p-1 rounded" title="Shrink"><Minus className="h-3 w-3" /></button>
                <button onMouseDown={e => e.stopPropagation()} onClick={() => adjustSize(1)} className="text-zinc-500 hover:text-zinc-300 p-1 rounded" title="Grow"><Plus className="h-3 w-3" /></button>
                <button onMouseDown={e => e.stopPropagation()} onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 p-1 rounded" title="Close"><X className="h-3.5 w-3.5" /></button>
              </div>

              {/* Messages */}
              <div className="overflow-y-auto p-3 space-y-2.5" style={{ height: panelSize.height }}>
                {messages.length === 0 && (
                  <p className="text-xs text-zinc-600 text-center py-4">Ask me anything about Feasix or business ideas...</p>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0 mb-0.5">
                        <Bot className="h-3 w-3 text-teal-400" />
                      </div>
                    )}
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed select-text cursor-text ${
                      msg.role === 'user'
                        ? 'bg-zinc-700/80 text-zinc-100 rounded-br-sm'
                        : 'bg-teal-950/60 border border-teal-800/40 text-zinc-200 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3 w-3 text-teal-400" />
                    </div>
                    <div className="bg-teal-950/60 border border-teal-800/40 rounded-2xl rounded-bl-sm px-3 py-2.5">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-zinc-800/60">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Ask Feasix anything..."
                    className="flex-1 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-600/60 transition-colors"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="p-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white transition-colors flex-shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CoC-style Speech Bubble (when chat closed) */}
        <AnimatePresence>
          {!isOpen && speechBubble && (
            <SpeechBubble message={speechBubble} onDismiss={() => setSpeechBubble(null)} />
          )}
        </AnimatePresence>

        {/* Bot Avatar Button */}
        <button
          onMouseDown={handleDragStart}
          onClick={() => {
            if (!hasDragged.current) {
              setIsOpen(prev => !prev);
              setSpeechBubble(null);
            }
          }}
          className="relative flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing group"
        >
          {/* Feasix Advisor Head */}
          <div className="relative group-hover:scale-110 transition-transform shadow-2xl shadow-teal-900/60 rounded-full">
            <FeasixAdvisorHead status="normal" size="md" />
            {speechBubble && !isOpen && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-teal-300 rounded-full border-2 border-zinc-950 animate-pulse" />
            )}
          </div>
          {/* Tagline label */}
          <div className="bg-zinc-900/90 border border-teal-700/50 rounded-full px-3 py-1 shadow-lg whitespace-nowrap">
            <span className="text-[10px] font-bold text-teal-300 tracking-wide">Venture Advisor</span>
          </div>
        </button>
      </div>
    </>
  );
}