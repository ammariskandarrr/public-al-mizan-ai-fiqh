import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Bot, Loader2, Sparkles, Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types';
import { createChatSession } from '../services/geminiService';
import { Chat } from '@google/genai';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Assalamu Alaikum! I am your Al Mizan Fiqh assistant. I can help you with questions about Islamic Finance, Inheritance, Zakat, and Contractual Rulings. How can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session only once
    if (!chatSession.current) {
      chatSession.current = createChatSession();
    }
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSession.current.sendMessage({ message: userMsg.text });
      const responseText = result.text || "I apologize, I couldn't process that request.";

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered an error connecting to the knowledge base. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const SUGGESTIONS = [
    "Is Bitcoin Halal?",
    "Calculate Zakat on Gold",
    "Ruling on Drop-shipping",
    "Mortgage alternatives"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 z-10" />

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
            <Bot size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Fiqh Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-500">RAG Knowledge Base Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors" title="Clear Chat">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} group`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${msg.role === 'user' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-blue-600 border-slate-100'}`}>
              {msg.role === 'user' ? <UserIcon size={18} /> : <Sparkles size={18} />}
            </div>

            <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]`}>
              {/* Message Bubble */}
              <div className={`p-5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-tr-none'
                  : 'bg-white text-slate-700 border border-slate-200/60 rounded-tl-none'
                }`}>
                {msg.text}
              </div>

              {/* Footer / Actions */}
              <div className={`flex items-center gap-3 text-xs text-slate-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.role === 'model' && (
                  <>
                    <button className="hover:text-blue-600 transition-colors"><Copy size={12} /></button>
                    <button className="hover:text-green-600 transition-colors"><ThumbsUp size={12} /></button>
                    <button className="hover:text-red-500 transition-colors"><ThumbsDown size={12} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white text-blue-600 border border-slate-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <Loader2 size={18} className="animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl rounded-tl-none flex flex-col gap-2 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Consulting Islamic Texts...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-5 bg-white border-t border-slate-100 z-20">

        {/* Suggestions chips */}
        {messages.length < 3 && !isLoading && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setInput(suggestion)}
                className="whitespace-nowrap px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-sm font-medium rounded-xl border border-slate-200 hover:border-blue-200 transition-all active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a complex question about finance..."
            className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all placeholder:text-slate-400 text-slate-700"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-200"
          >
            <Send size={18} className={isLoading ? 'opacity-0' : 'opacity-100'} />
            {isLoading && <Loader2 size={18} className="absolute top-2.5 right-2.5 animate-spin" />}
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
          AI responses are based on Fiqh manuals but should be verified by a qualified scholar for critical decisions.
        </p>
      </div>
    </div>
  );
};

export default ChatBot;