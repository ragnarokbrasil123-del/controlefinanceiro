"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, PieChart as PieChartIcon, BarChart3, TrendingUp, TrendingDown, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { TransactionRow } from "./TransactionRow";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export function ReportsModal({ isOpen, onClose, transactions, activeMonth }: any) {
  const [activeTab, setActiveTab] = useState<'categorias' | 'balanco'>('categorias');
  const [period, setPeriod] = useState<number>(6);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [localMonth, setLocalMonth] = useState(activeMonth !== undefined ? activeMonth : new Date().getMonth());

  useEffect(() => {
    if (activeMonth !== undefined) {
      setLocalMonth(activeMonth);
    }
  }, [activeMonth]);

  if (!isOpen) return null;

  const now = new Date();
  const baseMonth = localMonth;
  let startM = 0;
  let endM = 0;
  
  if (period === 1) {
    startM = baseMonth;
    endM = baseMonth;
  } else if (period === 2) {
    startM = Math.floor(baseMonth / 2) * 2;
    endM = startM + 1;
  } else if (period === 3) {
    startM = Math.floor(baseMonth / 3) * 3;
    endM = startM + 2;
  } else if (period === 6) {
    startM = Math.floor(baseMonth / 6) * 6;
    endM = startM + 5;
  } else {
    startM = 0;
    endM = 11;
  }

  const startDate = new Date(now.getFullYear(), startM, 1);
  const endDate = new Date(now.getFullYear(), endM + 1, 0, 23, 59, 59);

  const getPeriodLabel = () => {
    const year = now.getFullYear();
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    if (period === 1) return `${months[startM]} de ${year}`;
    if (period === 2) return `Bimestre (${months[startM]} e ${months[endM]}) de ${year}`;
    if (period === 3) return `Trimestre (${months[startM]} a ${months[endM]}) de ${year}`;
    if (period === 6) return `${startM === 0 ? '1º' : '2º'} Semestre de ${year}`;
    return `Ano inteiro de ${year} (Jan - Dez)`;
  };

  const filteredTransactions = transactions.filter((t: any) => {
    if (!t.date) return false;
    const [year, month, day] = t.date.split('-');
    const tDate = new Date(Number(year), Number(month) - 1, Number(day));
    return tDate >= startDate && tDate <= endDate;
  });

  const expenses = filteredTransactions.filter((t: any) => t.type === 'expense');
  
  const expenseByCategory = expenses
    .filter((t: any) => t.category !== 'Transferência')
    .reduce((acc: any, curr: any) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

  const categoryData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value: value as number,
  })).sort((a, b) => b.value - a.value);

  // Processar dados para o Gráfico de Barras
  const balanceData: any[] = [];
  
  // 1. Criar o array de meses preenchidos (do início ao fim do período)
  for (let i = startM; i <= endM; i++) {
    const d = new Date(Date.UTC(now.getFullYear(), i, 1));
    const monthStr = d.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase();
    const yearStr = d.getUTCFullYear().toString().slice(-2);
    const monthYear = `${monthStr}/${yearStr}`;
    
    balanceData.push({ 
      name: monthYear, 
      Receitas: 0, 
      Despesas: 0,
      _matchKey: `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    });
  }

  // 2. Preencher com os dados reais
  filteredTransactions.forEach((curr: any) => {
    if (!curr.date) return;
    const [year, month] = curr.date.split('-');
    const matchKey = `${Number(year)}-${Number(month) - 1}`;
    
    const targetMonth = balanceData.find(m => m._matchKey === matchKey);
    if (targetMonth) {
      if (curr.type === 'income') targetMonth.Receitas += curr.amount;
      else targetMonth.Despesas += curr.amount;
    }
  });

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
    if (!filteredTransactions || filteredTransactions.length === 0) return alert("Nenhuma transação para exportar.");
    
    const headers = ["ID", "Título", "Categoria", "Valor", "Tipo", "Data", "Status"];
    const rows = filteredTransactions.map((t: any) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.amount.toFixed(2).replace('.', ','),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.date,
      t.is_paid === false ? 'Pendente' : 'Pago'
    ]);

    const csvContent = [headers.join(";"), ...rows.map((row: any[]) => row.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_nexa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return alert("Nenhuma transação para exportar.");
    const doc = new jsPDF();
    doc.text("Relatório Financeiro - Nexa", 14, 15);
    
    const tableColumn = ["Data", "Título", "Categoria", "Valor", "Tipo"];
    const tableRows: any[] = [];
    
    filteredTransactions.forEach((t: any) => {
      const ticketData = [
        new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
        t.title,
        t.category,
        `R$ ${t.amount.toFixed(2).replace('.', ',')}`,
        t.type === 'income' ? 'Receita' : 'Despesa'
      ];
      tableRows.push(ticketData);
    });
    
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`relatorio_nexa_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return alert("Nenhuma transação para exportar.");
    const data = filteredTransactions.map((t: any) => ({
      ID: t.id,
      Título: t.title,
      Categoria: t.category,
      Valor: t.amount,
      Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
      Data: new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
      Status: t.is_paid === false ? 'Pendente' : 'Pago'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, `extrato_nexa_${new Date().toISOString().split('T')[0]}.xlsx`);
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
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button onClick={handleExportPDF} className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-rose-500/20">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-emerald-500/20">
                  <Download className="w-4 h-4" /> Excel
                </button>
                <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row p-4 gap-4 bg-black/20 border-b border-white/5">
              <div className="flex gap-2 flex-1 overflow-x-auto scrollbar-hide">
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
              <div className="shrink-0 flex items-center gap-2">
                <select 
                  value={localMonth} 
                  onChange={(e) => setLocalMonth(Number(e.target.value))}
                  className="w-full sm:w-auto bg-black/30 border border-white/10 text-white text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>
                <select 
                  value={period} 
                  onChange={(e) => setPeriod(Number(e.target.value))}
                  className="w-full sm:w-auto bg-black/30 border border-white/10 text-white text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value={1}>Mensal</option>
                  <option value={2}>Bimestral</option>
                  <option value={3}>Trimestral</option>
                  <option value={6}>Semestral</option>
                  <option value={12}>Anual</option>
                </select>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-6 text-center">
                <p className="text-sm font-medium text-indigo-400 bg-indigo-500/10 inline-block px-3 py-1 rounded-full border border-indigo-500/20">
                  Período analisado: {getPeriodLabel()}
                </p>
              </div>
              
              {activeTab === 'categorias' && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
                  {selectedCategory ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => setSelectedCategory(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-400 transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-white tracking-tight">Despesas em {selectedCategory}</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        {expenses
                          .filter((t: any) => t.category === selectedCategory)
                          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((tx: any) => (
                            <TransactionRow 
                              key={tx.id} 
                              title={tx.title} 
                              category={tx.category} 
                              date={new Date(tx.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} 
                              amount={`${tx.type === 'income' ? '+ ' : '- '}${formatMoney(tx.amount)}`} 
                              type={tx.type} 
                              isPaid={tx.is_paid} 
                              receiptUrl={tx.receipt_url}
                            />
                          ))
                        }
                      </div>
                    </div>
                  ) : categoryData.length === 0 ? (
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
                          <div 
                            key={index} 
                            onClick={() => setSelectedCategory(item.name)}
                            className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all active:scale-[0.98] group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{formatMoney(Number(item.value))}</span>
                              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                            </div>
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
                            <XAxis dataKey="name" stroke="#666" tick={{fill: '#999', fontSize: 10}} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={50} />
                            <YAxis stroke="#666" tick={{fill: '#999', fontSize: 11}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val}`} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                            <Legend wrapperStyle={{paddingTop: '20px'}} />
                            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
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
