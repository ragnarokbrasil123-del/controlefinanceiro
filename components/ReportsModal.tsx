"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export function ReportsModal({ isOpen, onClose, transactions }: { isOpen: boolean, onClose: () => void, transactions: any[] }) {
  if (!isOpen) return null;

  const currentMonth = new Date().getMonth();
  
  // O Código pega apenas as despesas do mês atual
  const expenses = transactions.filter(t => {
    if (!t.date || t.type !== 'expense') return false;
    const [year, month] = t.date.split('-');
    return (parseInt(month) - 1) === currentMonth;
  });

  // Agrupa os gastos por categoria para montar as fatias da Pizza
  const dataMap = new Map();
  expenses.forEach(t => {
    const amount = Number(t.amount);
    if(dataMap.has(t.category)) {
      dataMap.set(t.category, dataMap.get(t.category) + amount);
    } else {
      dataMap.set(t.category, amount);
    }
  });

  const pieData = Array.from(dataMap, ([name, value]) => ({ name, value }));
  // Cores lindas e vibrantes para as categorias
  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f43f5e', '#a78bfa', '#f472b6'];

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
          className="relative w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Luzes de fundo para design Premium */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-400" />
                Para onde seu dinheiro vai?
              </h2>
              <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {pieData.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                Adicione despesas neste mês para ver os gráficos gerados automaticamente.
              </div>
            ) : (
              <div className="bg-black/30 rounded-2xl p-6 border border-white/5">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatMoney(value)}
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
