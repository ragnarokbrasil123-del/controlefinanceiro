"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Bell, User, Plus, Home as HomeIcon, Coffee, CreditCard, 
  ChevronLeft, ChevronRight, ArrowRight, Sparkles, LineChart, Target,
  PieChart as PieChartIcon, Search
} from "lucide-react";

import { TransactionModal } from "../components/TransactionModal";
import { AiUploadModal } from "../components/AiUploadModal";
import { FinancialPlannerModal } from "../components/FinancialPlannerModal";
import { SubscriptionTrackerModal } from "../components/SubscriptionTrackerModal";
import { ReportsModal } from "../components/ReportsModal";
import { supabase } from "../lib/supabase"; 

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Dashboard() {
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false); 
  const [isPlannerOpen, setIsPlannerOpen] = useState(false); 
  const [isTrackerOpen, setIsTrackerOpen] = useState(false); 
  const [isReportsOpen, setIsReportsOpen] = useState(false); 
  
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  const handlePrevMonth = () => setActiveMonth(prev => prev === 0 ? 11 : prev - 1);
  const handleNextMonth = () => setActiveMonth(prev => prev === 11 ? 0 : prev + 1);
  const handleOpenModal = () => setIsModalOpen(true);

  useEffect(() => {
    // ----------------------------------------
    // LIGANDO O MOTOR PWA PARA PERMITIR INSTALAÇÃO
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
    // ----------------------------------------

    async function fetchTransactions() {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (data) {
        setAllTransactions(data);
      }
    }
    fetchTransactions();
  }, []);

  // MATEMÁTICA AUTOMÁTICA
  const currentMonthTransactions = allTransactions.filter(t => {
    if (!t.date) return false;
    const [year, month] = t.date.split('-'); 
    return (parseInt(month) - 1) === activeMonth;
  });

  const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const contasFixas = currentMonthTransactions.filter(t => t.category === 'Contas Fixas' && t.type === 'expense');
  const variaveis = currentMonthTransactions.filter(t => t.category === 'Variáveis' && t.type === 'expense');
  const cartoes = currentMonthTransactions.filter(t => (t.category === 'Cartões' || t.category === 'Cartões de Crédito') && t.type === 'expense');
  const investimentos = currentMonthTransactions.filter(t => t.category === 'Investimentos' && t.type === 'expense');

  const sumCategory = (list: any[]) => list.reduce((acc, t) => acc + t.amount, 0);
  const formatMoney = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const recentTransactions = allTransactions.slice(0, 5); 

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wallet className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">FinApp</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="text-neutral-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            </button>
            <div className="w-9 h-9 bg-neutral-800 border border-white/10 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors">
              <User className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">Visão Geral</h1>
            <p className="text-neutral-400">Inteligência Financeira ao seu dispor.</p>
          </motion.div>
          
          {/* PAINEL DE BOTÕES DE INTELIGÊNCIA */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            
            <motion.button 
              onClick={() => setIsReportsOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-indigo-500/20"
            >
              <PieChartIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </motion.button>

            <motion.button 
              onClick={() => setIsTrackerOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-rose-500/20"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Assinaturas</span>
            </motion.button>

            <motion.button 
              onClick={() => setIsPlannerOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-emerald-500/20"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Planejador</span>
            </motion.button>

            <motion.button 
              onClick={() => setIsAiModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-purple-500/25 active:scale-95 cursor-pointer border border-white/10"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Ler Foto</span>
            </motion.button>

            <motion.button 
              onClick={handleOpenModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-white/10"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Manual</span>
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <SummaryCard 
            title="Saldo no Mês" 
            amount={formatMoney(balance)} 
            isPositive={balance >= 0}
            icon={<Wallet className="text-indigo-400" />}
            delay={0.2}
          />
          <SummaryCard 
            title="Receitas Mensais" 
            amount={formatMoney(totalIncome)} 
            isPositive={true}
            icon={<TrendingUp className="text-emerald-400" />}
            delay={0.3}
          />
          <SummaryCard 
            title="Despesas Mensais" 
            amount={formatMoney(totalExpense)} 
            isPositive={false}
            icon={<TrendingDown className="text-rose-400" />}
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <h2 className="text-xl font-semibold">Organização Mensal</h2>
              
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-24 text-center font-medium text-sm text-white tracking-wide">
                  {MONTHS[activeMonth]}
                </div>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={activeMonth}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <ExpenseCategoryCard 
                  title="Contas Fixas" 
                  icon={<HomeIcon className="w-5 h-5 text-blue-400" />}
                  total={formatMoney(sumCategory(contasFixas))}
                  accentColor="bg-blue-500/10 border-blue-500/20"
                  items={contasFixas.map(t => ({ name: t.title, value: formatMoney(t.amount) }))}
                  onAction={handleOpenModal}
                />
                
                <ExpenseCategoryCard 
                  title="Variáveis" 
                  icon={<Coffee className="w-5 h-5 text-amber-400" />}
                  total={formatMoney(sumCategory(variaveis))}
                  accentColor="bg-amber-500/10 border-amber-500/20"
                  items={variaveis.map(t => ({ name: t.title, value: formatMoney(t.amount) }))}
                  onAction={handleOpenModal}
                />

                <ExpenseCategoryCard 
                  title="Cartões" 
                  icon={<CreditCard className="w-5 h-5 text-purple-400" />}
                  total={formatMoney(sumCategory(cartoes))}
                  accentColor="bg-purple-500/10 border-purple-500/20"
                  items={cartoes.map(t => ({ name: t.title, value: formatMoney(t.amount) }))}
                  onAction={handleOpenModal}
                />

                <ExpenseCategoryCard 
                  title="Investimentos" 
                  icon={<LineChart className="w-5 h-5 text-emerald-400" />}
                  total={formatMoney(sumCategory(investimentos))}
                  accentColor="bg-emerald-500/10 border-emerald-500/20"
                  items={investimentos.map(t => ({ name: t.title, value: formatMoney(t.amount) }))}
                  onAction={handleOpenModal}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm h-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Recentes</h2>
              </div>
              
              <div className="flex flex-col gap-4">
                {recentTransactions.length === 0 ? (
                  <p className="text-neutral-500 text-sm text-center py-4">Nenhuma transação lançada ainda.</p>
                ) : (
                  recentTransactions.map((tx) => (
                    <TransactionRow 
                      key={tx.id}
                      title={tx.title} 
                      category={tx.category} 
                      date={new Date(tx.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} 
                      amount={`${tx.type === 'income' ? '+' : '-'} R$ ${tx.amount.toFixed(2).replace('.', ',')}`} 
                      type={tx.type} 
                    />
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <AiUploadModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      <FinancialPlannerModal isOpen={isPlannerOpen} onClose={() => setIsPlannerOpen(false)} currentIncome={totalIncome} />
      <SubscriptionTrackerModal isOpen={isTrackerOpen} onClose={() => setIsTrackerOpen(false)} transactions={allTransactions} />
      <ReportsModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} transactions={allTransactions} />
    </div>
  );
}

function SummaryCard({ title, amount, isPositive, icon, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm hover:bg-white/[0.07] transition-colors relative overflow-hidden group"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-2xl">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        </div>
      </div>
      
      <p className="text-neutral-400 text-sm font-medium mb-1">{title}</p>
      <h3 className={`text-3xl font-bold tracking-tight ${amount === 'R$ 0,00' ? 'text-neutral-500' : 'text-white'}`}>{amount}</h3>
    </motion.div>
  );
}

function ExpenseCategoryCard({ title, icon, total, items, accentColor, onAction }: any) {
  return (
    <div 
      onClick={onAction} 
      className={`bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm flex flex-col h-full hover:bg-white/[0.1] hover:border-white/20 transition-all group cursor-pointer`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${accentColor}`}>
            {icon}
          </div>
          <h3 className="font-semibold text-neutral-200">{title}</h3>
        </div>
        
        <button 
          className="text-neutral-400 hover:text-white bg-white/5 hover:bg-indigo-500 p-1.5 rounded-lg transition-colors flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          title={`Novo lançamento em ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col gap-3 mb-6">
        {items.length === 0 ? (
          <p className="text-neutral-600 text-sm italic py-2">Nenhum gasto neste mês.</p>
        ) : (
          items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-neutral-400 truncate max-w-[120px]">{item.name}</span>
              <span className="text-white font-medium whitespace-nowrap">{item.value}</span>
            </div>
          ))
        )}
      </div>
      
      <div className="pt-4 border-t border-white/10 mt-auto">
        <div className="flex justify-between items-end">
          <div>
            <span className="block text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Total</span>
            <span className={`text-lg font-bold ${total === 'R$ 0,00' ? 'text-neutral-500' : 'text-white'}`}>{total}</span>
          </div>
          
          <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 group/btn">
            Lançar <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ title, category, date, amount, type }: any) {
  const isIncome = type === 'income';
  
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${isIncome ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-rose-400/10 border-rose-400/20 text-rose-400'} group-hover:scale-105 transition-transform`}>
          {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-medium text-white mb-0.5 text-sm truncate w-32 sm:w-40">{title}</h4>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>{category}</span>
            <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
            <span>{date}</span>
          </div>
        </div>
      </div>
      <div className={`font-semibold text-sm whitespace-nowrap ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
        {amount}
      </div>
    </div>
  );
}
