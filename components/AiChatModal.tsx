"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Bot, User, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export function AiChatModal({ isOpen, onClose, financialContext }: any) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Olá${financialContext?.userName ? `, ${financialContext.userName}` : ''}! Sou o Nexa AI. Estou analisando as suas finanças desse mês. Como posso te ajudar hoje?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    const currentHistory = [...messages];
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      // Pass only the history excluding the first welcome message to save tokens, or include it? 
      // Including is fine, but formatting it as 'model' works.
      const historyToSend = currentHistory.slice(1).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: historyToSend,
          financialContext
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao gerar resposta");

      const aiMessage: Message = { id: Date.now().toString() + 'ai', role: 'model', content: data.reply };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'err', role: 'model', content: "Ops! Tive um problema de conexão. Tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: "100%" }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: "100%" }} 
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="w-full h-full sm:h-[80vh] sm:max-h-[800px] max-w-2xl bg-neutral-900 sm:border border-white/10 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Nexa AI</h2>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-neutral-800 text-neutral-400' : 'bg-indigo-500 text-white'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`p-3.5 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-tr-sm' : 'bg-white/10 text-neutral-200 rounded-tl-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>

                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="flex gap-3 max-w-[85%] flex-row">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/10 text-neutral-200 rounded-tl-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
            <div className="relative flex items-center">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte sobre seus gastos, peça dicas..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 resize-none overflow-hidden"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-neutral-500 mt-2">
              Nexa AI pode cometer erros. Considere verificar informações importantes.
            </p>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
