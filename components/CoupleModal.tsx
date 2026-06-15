"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Heart, Users, Sparkles, ArrowRight } from "lucide-react";

export function CoupleModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-neutral-900 border border-pink-500/30 shadow-2xl shadow-pink-500/20 rounded-3xl p-6 overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-pink-500/20 to-transparent"></div>
          
          <div className="flex justify-between items-center mb-6 relative">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" /> FinApp Casais
            </h2>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-full transition-colors"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-col items-center justify-center text-center relative z-10 py-8">
            <div className="w-20 h-20 bg-pink-500/20 border border-pink-500/30 rounded-full flex items-center justify-center mb-6 relative">
              <Users className="w-10 h-10 text-pink-400" />
              <div className="absolute -bottom-2 -right-2 bg-neutral-900 p-1 rounded-full">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 w-6 h-6 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Casal que trabalha junto,</h3>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mb-6">cresce junto!</h3>
            
            <p className="text-neutral-400 mb-8 leading-relaxed">
              Bem-vindo(a) à área conjunta! Aqui vocês terão uma visão unificada dos gastos da casa, metas para viagens e a construção do patrimônio da família.
            </p>

            <button onClick={() => window.location.href = '/casais'} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-500/25 group">
              Acessar Painel do Casal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
