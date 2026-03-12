import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FeasixAdvisorHead from '@/components/FeasixAdvisorHead';

export default function ChapterChatPanel({ chapter, video }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create conversation when opened for the first time
  useEffect(() => {
    if (isOpen && !conversationId && chapter) {
      initializeConversation();
    }
  }, [isOpen, chapter]);

  const initializeConversation = async () => {
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: 'chapterAdvisor',
        metadata: {
          name: `Chat: ${chapter.title}`,
          videoId: video.id,
          chapterTimestamp: chapter.timestamp,
          chapterTitle: chapter.title
        }
      });

      setConversationId(conversation.id);

      // Subscribe to updates
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        const newMessages = data.messages || [];
        setMessages(newMessages);
        
        // Check if assistant just responded
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.role === 'assistant') {
          setIsThinking(false);
          setIsSending(false);
        }
      });

      // Send initial context message
      const contextMessage = `Chapter: "${chapter.title}" (${chapter.timestamp})\nVideo: "${video.title}"\nCreator: ${video.channel}\n\n${chapter.explanation || chapter.significance || ''}`;
      
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: contextMessage
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Instantly show user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Show thinking state immediately
    setIsThinking(true);
    setIsSending(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsThinking(false);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
          size="sm"
        >
          <MessageCircle className="h-4 w-4" />
          Conversate
          {isOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg overflow-hidden">
          {/* Messages Area */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages
              .filter(msg => msg.role !== 'system')
              .map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <FeasixAdvisorHead status="normal" size="sm" />
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-200'} rounded-2xl px-4 py-2`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            
            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex gap-3 justify-start">
                <FeasixAdvisorHead status="thinking" size="sm" />
                <div className="bg-zinc-800/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-1 bg-zinc-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400 animate-pulse transition-all duration-300" style={{ width: '70%' }} />
                    </div>
                    <span className="text-xs text-zinc-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-zinc-800/50 p-3 bg-zinc-900/80">
            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about this chapter..."
                className="min-h-[60px] resize-none bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                disabled={isSending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSending}
                className="bg-blue-600 hover:bg-blue-500 text-white self-end"
                size="icon"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}