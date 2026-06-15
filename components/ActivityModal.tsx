"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Bell, TrendingUp, TrendingDown } from "lucide-react";

export function ActivityModal({ isOpen, onClose, transactions }: { isOpen: boolean, onClose: () => void, transactions: any[] }) {
  if (!isOpen) return null;

  const recentActivities = transactions.slice(0, 15);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="relative w-full max-w-sm h-full bg-neutral-900 border-l border-white/10 shadow-2xl p-6 flex flex-col"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-400" />
              Central de Atividades
            </h2>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {recentActivities.length === 0 ? (
               <p className="text-neutral-500 text-center text-sm">Nenhuma atividade registrada.</p>
            ) : (
              recentActivities.map((tx, idx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div key={idx} className="flex gap-4 relative">
                     {/* Linha do tempo */}
                     <div className="w-px h-full bg-white/10 absolute left-[19px] top-8 -z-10"></div>
                     
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${isIncome ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                     </div>
                     <div className="pt-2 pb-6">
                        <p className="text-sm text-white font-medium">
                          {isIncome ? 'Dinheiro na conta!' : 'Despesa registrada'}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                          O lançamento de <span className="text-white">"{tx.title}"</span> no valor de <strong className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>R$ {tx.amount.toFixed(2).replace('.', ',')}</strong> foi adicionado em {tx.category}.
                        </p>
                        <span className="text-[10px] text-neutral-500 mt-2 block font-medium">
                           {new Date(tx.date).toLocaleDateString('pt-BR')}
                        </span>
                     </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
