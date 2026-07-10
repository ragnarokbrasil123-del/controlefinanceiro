"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Heart, Target, PieChartIcon, Wallet, CreditCard, Calendar, Settings2, TrendingUp, Sparkles, Bot } from "lucide-react";
import { ModulesState } from "./ModulesModal";

interface ToolsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModules: ModulesState;
}

export function ToolsMenuModal({ isOpen, onClose, activeModules }: ToolsMenuModalProps) {
  if (!isOpen) return null;

  const handleOpen = (name: string) => {
    window.dispatchEvent(new CustomEvent('openModal', { detail: name }));
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-safe">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full sm:max-w-md bg-neutral-900 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Ferramentas</h2>
              <p className="text-sm text-neutral-400">Suas extensões do Nexa</p>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              
              {activeModules.ai && (
                <button onClick={() => handleOpen('ai_chat')} className="flex flex-col items-center justify-center gap-3 p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 rounded-2xl border border-indigo-500/20 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all">
                    <Bot className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-white">Nexa AI Chat</span>
                </button>
              )}

              {activeModules.casal && (
                <button onClick={() => handleOpen('casais')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95 group">
                  <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-neutral-300">Casal</span>
                </button>
              )}

              {activeModules.metas && (
                <button onClick={() => handleOpen('metas')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95 group">
                  <div className="w-12 h-12 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-neutral-300">Metas</span>
                </button>
              )}

              {activeModules.relatorios && (
                <button onClick={() => handleOpen('relatorios')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95 group">
                  <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PieChartIcon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-neutral-300">Relatórios</span>
                </button>
              )}

              {activeModules.orcamentos && (
                <button onClick={() => handleOpen('orcamentos')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95 group">
                  <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-neutral-300">Orçamentos</span>
                </button>
              )}

              {activeModules.assinaturas && (
                <button onClick={() => handleOpen('assinaturas')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95 group">
                  <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-neutral-300">Assinaturas</span>
                </button>
              )}

              {activeModules.planejador && (
                <button onClick={() => handleOpen('planejador')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95 group">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-neutral-300">Planejador</span>
                </button>
              )}

              {activeModules.calendario && (
                <button onClick={() => handleOpen('calendario')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95 group">
                  <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-neutral-300">Calendário</span>
                </button>
              )}

              <button onClick={() => handleOpen('acoes')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95 group">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-neutral-300">Ações</span>
              </button>

            </div>
          </div>
          
          <div className="p-4 border-t border-white/10 bg-black/20 flex justify-center">
            <button onClick={() => handleOpen('personalizar')} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
              <Settings2 className="w-4 h-4" /> Personalizar Ferramentas
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
