"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, PieChart as PieChartIcon } from "lucide-react";

export function ReportsModal({ isOpen, onClose, transactions }: { isOpen: boolean, onClose: () => void, transactions: any[] }) {
  if (!isOpen) return null;

  const currentMonth = new Date().getMonth();
  
  // Pega as despesas do mês
  const expenses = transactions.filter(t => {
    if (!t.date || t.type !== 'expense') return false;
    const [year, month] = t.date.split('-');
    return (parseInt(month) - 1) === currentMonth;
  });

  // Agrupa os gastos
  const dataMap = new Map();
  let totalExpenses = 0;
  expenses.forEach(t => {
    const amount = Number(t.amount);
    totalExpenses += amount;
    if(dataMap.has(t.category)) {
      dataMap.set(t.category, dataMap.get(t.category) + amount);
    } else {
      dataMap.set(t.category, amount);
    }
  });

  // Organiza do maior gasto para o menor
  const chartData = Array.from(dataMap, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); 

  const maxExpense = chartData.length > 0 ? chartData[0].value : 1;

  const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-cyan-500'];

  const formatMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-400" />
                Raio-X de Despesas
              </h2>
              <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {chartData.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                Adicione despesas neste mês para ver as estatísticas.
              </div>
            ) : (
              <div className="space-y-6 mt-8">
                {chartData.map((item, idx) => {
                  const percentage = Math.round((item.value / maxExpense) * 100);
                  const share = Math.round((item.value / totalExpenses) * 100);
                  
                  return (
                    <div key={idx} className="relative group">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-white font-medium flex items-center gap-2 text-sm">
                          <span className={`w-2.5 h-2.5 rounded-full shadow-lg ${COLORS[idx % COLORS.length]}`}></span>
                          {item.name}
                        </span>
                        <div className="text-right">
                           <span className="text-white font-bold">{formatMoney(item.value)}</span>
                           <span className="text-neutral-500 text-xs ml-2">({share}%)</span>
                        </div>
                      </div>
                      <div className="h-3.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                        {/* Barrinha Animada */}
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                          className={`h-full rounded-full ${COLORS[idx % COLORS.length]} relative overflow-hidden`}
                        >
                           <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
