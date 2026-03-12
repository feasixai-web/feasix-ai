import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingWithMessage({ messages, interval = 2000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (!messages || messages.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [messages, interval]);
  
  const currentMessage = messages?.[currentIndex] || 'Loading...';
  
  return (
    <div className="flex items-center justify-center gap-3 p-8">
      <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
      <p className="text-zinc-300 text-sm animate-pulse">{currentMessage}</p>
    </div>
  );
}