import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  HelpCircle, 
  AlertCircle, 
  RefreshCcw, 
  Plus, 
  MessageSquare, 
  ChevronRight,
  MoreVertical,
  History
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const CHAT_SYSTEM_PROMPT = `You are Feasix, a seasoned and highly analytical Business Advisor. Your goal is to help users evaluate, refine, and stress-test their business ideas with extreme realism.

CRITICAL GUARDRAIL: You are strictly restricted to business-related topics (entrepreneurship, market analysis, execution requirements, financial modeling, friction points, etc.). 
If a user asks about anything unrelated to business (e.g., weather, entertainment, personal advice, general trivia), you must politely decline and ask them to "zone back in" to their business venture. Use a phrase like "Let's zone back into your venture—I'm here to help you navigate the business complexities."

TONE: 
- Calm, strategic, and evidence-based.
- No hype. No "rah-rah" motivation. 
- Sound like a mentor who has seen thousands of businesses fail and knows exactly why.
- Provide data-driven insights and highlight common pitfalls.

FORMATTING:
- Keep initial responses concise but comprehensive (roughly 2-4 focused paragraphs).
- Use bullet points for clarity when listing requirements or risks.
- If context about the current page is provided, use it to offer specific guidance.`;

const INITIAL_MESSAGE = "I'm Feasix. I'm here to help you strip away the hype and look at the raw mechanics of your business idea. What venture are we evaluating today?";

// Mock data for saved chats
const MOCK_SAVED_CHATS = [
  { id: '1', title: 'SaaS Market Validation', date: '2 hours ago' },
  { id: '2', title: 'E-commerce Logistics', date: 'Yesterday' },
  { id: '3', title: 'Niche Coffee Brand', date: 'Mar 10' },
  { id: '4', title: 'Cloud Kitchen Friction', date: 'Mar 08' },
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: INITIAL_MESSAGE, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState('');
  const [savedChats, setSavedChats] = useState(MOCK_SAVED_CHATS);
  const [activeChatId, setActiveChatId] = useState('1');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Attempt to gather context from the page/sessionStorage
    const lastPage = sessionStorage.getItem('feasix-last-page') || 'the dashboard';
    const activeVideo = sessionStorage.getItem('feasix-analysis-title');
    
    let ctx = `The user is currently on ${lastPage}.`;
    if (activeVideo) {
      ctx += ` They are currently analyzing a video titled "${activeVideo}".`;
    }
    setCurrentContext(ctx);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateResponse = async (userMsg) => {
    setIsLoading(true);
    const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Advisor'}: ${m.content}`).join('\n');
    const prompt = `${CHAT_SYSTEM_PROMPT}\n\nCURRENT CONTEXT: ${currentContext}\n\nCONVERSATION HISTORY:\n${history}\n\nUser: ${userMsg}\nAdvisor:`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered a technical friction point. Let's try that again.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setInput('');
    generateResponse(userMsg);
  };

  const startNewChat = () => {
    setMessages([{ role: 'assistant', content: INITIAL_MESSAGE, timestamp: new Date() }]);
    setActiveChatId(null);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-[1600px] mx-auto overflow-hidden">
      
      {/* Saved Chats Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-zinc-950 border-r border-zinc-800/50">
        <div className="p-6">
          <Button 
            onClick={startNewChat}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/50 rounded-xl py-6 flex items-center gap-2 group transition-all"
          >
            <Plus className="h-4 w-4 text-teal-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">New Session</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
          <div className="flex items-center gap-2 px-3 mb-4 mt-2">
            <History className="h-4 w-4 text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recent Conversions</span>
          </div>
          
          {savedChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${
                activeChatId === chat.id 
                  ? 'bg-zinc-900 border border-zinc-800 shadow-lg' 
                  : 'hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden text-left">
                <MessageSquare className={`h-4 w-4 flex-shrink-0 ${activeChatId === chat.id ? 'text-teal-400' : 'text-zinc-600'}`} />
                <div className="min-w-0">
                  <p className={`text-xs font-medium truncate ${activeChatId === chat.id ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                    {chat.title}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{chat.date}</p>
                </div>
              </div>
              <ChevronRight className={`h-3.5 w-3.5 transition-opacity ${activeChatId === chat.id ? 'opacity-100 text-teal-500' : 'opacity-0 group-hover:opacity-100 text-zinc-700'}`} />
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-zinc-800/50 bg-zinc-950/50">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-950/30 border border-teal-500/20">
                <Sparkles className="h-4 w-4 text-teal-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Venture Credits</p>
                <p className="text-sm font-bold text-zinc-100">Unlimited</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden">
        {/* Header (Simplified) */}
        <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
             <Bot className="h-5 w-5 text-teal-400" />
             <div className="flex flex-col">
               <h1 className="text-sm font-bold text-zinc-100 tracking-tight">Chat with Feasix</h1>
               <p className="text-[10px] text-zinc-500">Evaluating: {activeChatId ? savedChats.find(c => c.id === activeChatId)?.title : 'New Business Venture'}</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Insight</span>
            </div>
            <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Message View - Narrower Container (max-w-3xl) */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar bg-zinc-950">
          <div className="max-w-3xl mx-auto py-12 space-y-10">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border shadow-lg ${
                    msg.role === 'user' 
                      ? 'bg-zinc-800 border-zinc-700/50' 
                      : 'bg-gradient-to-br from-teal-600 to-teal-800 border-teal-500/30'
                  }`}>
                    {msg.role === 'user' ? <User className="h-5 w-5 text-zinc-400" /> : <Bot className="h-5 w-5 text-white/90" />}
                  </div>

                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                    <div className={`px-5 py-4 rounded-2xl text-[14px] leading-relaxed shadow-xl ${
                      msg.role === 'user'
                        ? 'bg-zinc-100 text-zinc-900 rounded-tr-none'
                        : 'bg-zinc-900/80 text-zinc-100 border border-zinc-800/50 rounded-tl-none border-l-[3px] border-l-teal-500/50'
                    }`}>
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className={line.trim() === '' ? 'h-4' : 'mb-3 last:mb-0'}>
                          {line}
                        </p>
                      ))}
                    </div>
                    {/* Optional: Add timestamps or controls here */}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 border-teal-500/30 flex items-center justify-center shadow-lg">
                  <Bot className="h-5 w-5 text-white/90" />
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-2xl rounded-tl-none border-l-[3px] border-l-teal-500/50 px-5 py-4">
                  <div className="flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-32" />
          </div>
        </div>

        {/* Floating Input Area - Narrowed to match chat */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-12 z-10">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-teal-400/10 rounded-[22px] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-end gap-3 bg-zinc-900 border border-zinc-800/80 rounded-3xl p-2 pl-5 shadow-2xl">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault(); 
                      handleSend(); 
                    } 
                  }}
                  placeholder="Ask about strategy, market friction..."
                  rows={1}
                  className="flex-1 bg-transparent text-zinc-100 py-3 text-[14px] focus:outline-none placeholder:text-zinc-600 resize-none max-h-48"
                  disabled={isLoading}
                />
                <Button 
                  type="submit"
                  size="icon"
                  className="rounded-2xl h-10 w-10 bg-teal-600 hover:bg-teal-500 text-white shadow-lg transition-all flex-shrink-0"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <div className="flex items-center justify-center mt-3">
              <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-[0.2em]">Business Clarity Engine Active</p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-teal-500/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />
      </main>
    </div>
  );
}