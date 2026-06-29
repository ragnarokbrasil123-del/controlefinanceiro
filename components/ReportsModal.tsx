"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, PieChart as PieChartIcon, BarChart3, TrendingUp, TrendingDown, Download } from "lucide-react";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";
import { useState } from "react";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export function ReportsModal({ isOpen, onClose, transactions }: any) {
  const [activeTab, setActiveTab] = useState<'categorias' | 'balanco'>('categorias');

  if (!isOpen) return null;

  // Processar dados para o Gráfico de Pizza
  const expenses = transactions.filter((t: any) => t.type === 'expense');
  const categoryDataRaw = expenses.reduce((acc: any, curr: any) => {
    if (!acc[curr.category]) acc[curr.category] = 0;
    acc[curr.category] += curr.amount;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryDataRaw).map(key => ({
    name: key,
    value: categoryDataRaw[key]
  })).sort((a, b) => b.value - a.value);

  // Processar dados para o Gráfico de Barras
  const monthlyDataRaw = transactions.reduce((acc: any, curr: any) => {
    if (!curr.date) return acc;
    const dateObj = new Date(curr.date);
    const monthYear = dateObj.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).toUpperCase();
    
    if (!acc[monthYear]) acc[monthYear] = { name: monthYear, Receitas: 0, Despesas: 0 };
    
    if (curr.type === 'income') acc[monthYear].Receitas += curr.amount;
    else acc[monthYear].Despesas += curr.amount;
    
    return acc;
  }, {});

  // AQUI: Forçamos o tipo para evitar o pânico do TypeScript
  const balanceData: any[] = Object.values(monthlyDataRaw).slice(0, 6).reverse();

  const formatMoney = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl z-50">
          <p className="text-white font-bold mb-1">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-neutral-300">{entry.name}:</span>
              <span className="text-white font-bold">{formatMoney(Number(entry.value))}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return alert("Nenhuma transação para exportar.");
    
    const headers = ["ID", "Título", "Categoria", "Valor", "Tipo", "Data", "Status"];
    const rows = transactions.map((t: any) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.amount.toFixed(2).replace('.', ','),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.date,
      t.is_paid === false ? 'Pendente' : 'Pago'
    ]);

    const csvContent = [headers.join(";"), ...rows.map(row => row.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_nexa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-safe">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl bg-neutral-900 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                  <PieChartIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Relatórios Premium</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleExportCSV} className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-emerald-500/20">
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex p-4 gap-2 bg-black/20 border-b border-white/5 overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => setActiveTab('categorias')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'categorias' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-neutral-400 hover:bg-white/5'}`}
              >
                <PieChartIcon className="w-4 h-4" /> Despesas por Categoria
              </button>
              <button 
                onClick={() => setActiveTab('balanco')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'balanco' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-neutral-400 hover:bg-white/5'}`}
              >
                <BarChart3 className="w-4 h-4" /> Balanço Mensal
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              
              {activeTab === 'categorias' && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
                  {categoryData.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500">Nenhuma despesa registrada. Adicione um lançamento!</div>
                  ) : (
                    <>
                      <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100}
                              paddingAngle={5} dataKey="value" stroke="none"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Total</span>
                          <span className="text-xl font-extrabold text-white">
                            {formatMoney(Number(categoryData.reduce((a, b) => a + b.value, 0)))}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {categoryData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="text-sm font-medium text-neutral-300">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold text-white">{formatMoney(Number(item.value))}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'balanco' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
                  {balanceData.length === 0 ? (
                     <div className="text-center py-10 text-neutral-500">Nenhum dado mensal registrado.</div>
                  ) : (
                    <>
                      <div className="h-72 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={balanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" tick={{fill: '#999', fontSize: 12}} axisLine={false} tickLine={false} />
                            <YAxis stroke="#666" tick={{fill: '#999', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val}`} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                            <Legend wrapperStyle={{paddingTop: '20px'}} />
                            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-gradient-to-r from-emerald-500/10 to-rose-500/10 border border-white/5 p-4 rounded-2xl flex items-center justify-around mt-4">
                        <div className="text-center">
                          <p className="text-xs text-neutral-400 mb-1 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400"/> Receitas Total</p>
                          <p className="font-bold text-emerald-400">{formatMoney(Number(balanceData.reduce((a: number, b: any) => a + b.Receitas, 0)))}</p>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="text-center">
                          <p className="text-xs text-neutral-400 mb-1 flex items-center justify-center gap-1"><TrendingDown className="w-3 h-3 text-rose-400"/> Despesas Total</p>
                          <p className="font-bold text-rose-400">{formatMoney(Number(balanceData.reduce((a: number, b: any) => a + b.Despesas, 0)))}</p>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
