"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, TrendingUp, Edit2, Trash2, CheckCircle2, Clock } from "lucide-react";

export function IncomeListModal({ isOpen, onClose, incomes, onEdit, onDelete, onTogglePaid, formatMoney }: any) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
          className="relative w-full max-w-md bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Suas Receitas</h2>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-3">
            {incomes.length === 0 ? (
              <p className="text-center text-neutral-500 py-4">Nenhuma receita registrada neste mês.</p>
            ) : (
              incomes.map((item: any) => (
                <div key={item.id} className={`flex justify-between items-center text-sm p-4 rounded-2xl border transition-all ${ item.is_paid === false ? 'bg-amber-500/5 border-amber-500/10' : 'bg-black/20 border-white/5' }`}>
                  <div className="flex flex-col gap-1 min-w-0 pr-4 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${ item.is_paid === false ? 'bg-amber-400' : 'bg-emerald-500' }`} title={item.is_paid === false ? 'Pendente' : 'Recebido'} />
                      <span className="text-white font-semibold line-clamp-1">{item.title}</span>
                      {item.is_paid === false && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">PEND.</span>
                      )}
                    </div>
                    <span className="text-emerald-400 font-bold text-lg">+ {formatMoney(item.amount)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {item.is_paid !== undefined && (
                      <button 
                        onClick={() => onTogglePaid(item.id, item.is_paid)} 
                        className={`p-2 rounded-xl transition-colors shrink-0 ${item.is_paid ? 'text-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10'}`}
                        title={item.is_paid ? 'Marcar como pendente' : 'Marcar como recebido'}
                      >
                        {item.is_paid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </button>
                    )}
                    <button 
                      onClick={() => { onEdit(item); onClose(); }} 
                      className="text-indigo-400/50 hover:text-indigo-400 p-2 rounded-xl hover:bg-indigo-500/10 transition-colors shrink-0"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(item.id)} 
                      className="text-rose-500/50 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition-colors shrink-0"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
