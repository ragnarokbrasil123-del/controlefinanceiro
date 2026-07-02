"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Bell, User, Plus, Home as HomeIcon, Coffee, CreditCard, 
  ChevronLeft, ChevronRight, ArrowRight, Sparkles, LineChart, Target,
  PieChart as PieChartIcon, Search, Trash2, Heart, CheckCircle2, Clock, Edit2, Calendar
} from "lucide-react";

import { TransactionModal } from "../components/TransactionModal";
import { EditTransactionModal } from "../components/EditTransactionModal";
import { AiUploadModal } from "../components/AiUploadModal";
import { FinancialPlannerModal } from "../components/FinancialPlannerModal";
import { SubscriptionTrackerModal } from "../components/SubscriptionTrackerModal";
import { ReportsModal } from "../components/ReportsModal";
import { ActivityModal } from "../components/ActivityModal";
import { ProfileModal } from "../components/ProfileModal";
import { CoupleModal } from "../components/CoupleModal";
import { FinancialCalendarModal } from "../components/FinancialCalendarModal";

import { BudgetModal } from "../components/BudgetModal";
import { WelcomeModal } from "../components/WelcomeModal";
import { DashboardChart } from "../components/DashboardChart";
import { GoalsModal } from "../components/GoalsModal";
import { CategoryManagerModal } from "../components/CategoryManagerModal";
import { supabase } from "../lib/supabase";

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Dashboard() {
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false); 
  const [isPlannerOpen, setIsPlannerOpen] = useState(false); 
  const [isTrackerOpen, setIsTrackerOpen] = useState(false); 
  const [isReportsOpen, setIsReportsOpen] = useState(false); 
  const [isActivityOpen, setIsActivityOpen] = useState(false); 
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const [isCoupleOpen, setIsCoupleOpen] = useState(false); 
  const [isGoalsOpen, setIsGoalsOpen] = useState(false); 
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);

  // Escutar eventos do BottomNav
  useEffect(() => {
    const handleOpenModal = (e: any) => {
      const name = e.detail;
      if (name === 'casais') setIsCoupleOpen(true);
      if (name === 'relatorios') setIsReportsOpen(true);
      if (name === 'config') setIsProfileOpen(true);
      if (name === 'manual') setIsModalOpen(true);
      if (name === 'camera') setIsAiModalOpen(true);
    };
    window.addEventListener('openModal', handleOpenModal);
    return () => window.removeEventListener('openModal', handleOpenModal);
  }, []);

  const [hasUnread, setHasUnread] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("client");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  const handlePrevMonth = () => setActiveMonth(prev => prev === 0 ? 11 : prev - 1);
  const handleNextMonth = () => setActiveMonth(prev => prev === 11 ? 0 : prev + 1);
  const handleOpenModal = () => setIsModalOpen(true);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(console.error);

    async function checkUserAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/login'; return; }
      setUserEmail(session.user.email || "");

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile) setUserRole(profile.role);

      const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (data) setAllTransactions(data);
      setIsLoading(false);
    }
    checkUserAndFetch();
  }, []);

  function handleEditTransaction(tx: any) {
    setEditingTransaction(tx);
    setIsEditModalOpen(true);
  }

  async function handleDeleteTransaction(id: string) {
    if(!window.confirm("Deseja apagar este lançamento?")) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setAllTransactions(prev => prev.filter(t => t.id !== id));
    else alert("Erro ao excluir.");
  }

  async function handleTogglePaid(id: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    const { error } = await supabase.from('transactions').update({ is_paid: newStatus }).eq('id', id);
    if (!error) {
      setAllTransactions(prev => prev.map(t => t.id === id ? { ...t, is_paid: newStatus } : t));
    } else {
      alert("Erro ao atualizar status.");
    }
  }

  const currentMonthTransactions = allTransactions.filter(t => {
    if (!t.date) return false;
    const [year, month] = t.date.split('-'); 
    return (parseInt(month) - 1) === activeMonth;
  });

  const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const contasFixas = currentMonthTransactions.filter(t => t.category === 'Contas Fixas');
  const variaveis = currentMonthTransactions.filter(t => t.category === 'Variáveis');
  const cartoes = currentMonthTransactions.filter(t => (t.category === 'Cartões' || t.category === 'Cartões de Crédito'));
  const investimentos = currentMonthTransactions.filter(t => t.category === 'Investimentos');

  const sumCategory = (list: any[]) => list.reduce((acc, t) => {
    if (t.category === 'Investimentos') return acc + t.amount;
    return acc + (t.type === 'expense' ? t.amount : -t.amount);
  }, 0);
  const formatMoney = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const filteredTransactions = allTransactions.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const recentTransactions = searchQuery ? filteredTransactions : allTransactions.slice(0, 8); 

  const variaveisPercent = totalIncome > 0 ? (sumCategory(variaveis) / totalIncome) * 100 : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30">
      
      <nav className="hidden md:flex border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden bg-black/20">
              <img src="/icon-192.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xl tracking-tight">Nexa</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => { setIsActivityOpen(true); setHasUnread(false); }} className="text-neutral-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              {hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
            </button>
            <div onClick={() => setIsProfileOpen(true)} className={`w-9 h-9 border rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${userRole === 'admin' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-neutral-800 border-white/10 text-neutral-400 hover:border-emerald-500'}`}>
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-md md:max-w-7xl mx-auto px-6 py-8 pb-32 md:pb-12 md:py-12">
        
        <header className="flex md:hidden justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden bg-black/20">
              <img src="/icon-192.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium tracking-wide uppercase">Olá, {userEmail ? userEmail.split('@')[0] : 'Usuário'}</p>
              <h1 className="text-2xl font-bold text-white tracking-tight">Seu Nexa</h1>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button onClick={() => setIsTrackerOpen(true)} className="p-2.5 bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"><Search className="w-5 h-5"/></button>
             <button onClick={() => setIsPlannerOpen(true)} className="p-2.5 bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"><Target className="w-5 h-5"/></button>
             <button onClick={() => { setIsActivityOpen(true); setHasUnread(false); }} className="p-2.5 bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5"/>
                {hasUnread && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
             </button>
          </div>
        </header>

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 relative z-10">
          <div className="shrink-0">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Visão Geral</h1>
            <p className="text-neutral-400 text-sm md:text-base">Acompanhe e gerencie seu patrimônio</p>
          </div>
          
          {/* Atalhos: Carrossel no Mobile, Wrap no Desktop */}
          <div className="flex overflow-x-auto md:overflow-visible items-center gap-3 w-full xl:w-auto pb-2 md:pb-0 snap-x snap-mandatory md:snap-none flex-nowrap md:flex-wrap [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
            <motion.button onClick={() => setIsCoupleOpen(true)} className="snap-start shrink-0 flex items-center justify-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 px-5 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-pink-500/20">
              <Heart className="w-4 h-4" /> <span>Casal</span>
            </motion.button>
            <motion.button onClick={() => setIsGoalsOpen(true)} className="snap-start shrink-0 flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-5 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-yellow-500/20">
              <Target className="w-4 h-4" /> <span>Metas</span>
            </motion.button>
            <motion.button onClick={() => setIsReportsOpen(true)} className="snap-start shrink-0 flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-5 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-indigo-500/20">
              <PieChartIcon className="w-4 h-4" /> <span>Relatórios</span>
            </motion.button>
            <motion.button onClick={() => setIsBudgetOpen(true)} className="snap-start shrink-0 flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-5 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-orange-500/20">
              <Wallet className="w-4 h-4" /> <span>Orçamentos</span>
            </motion.button>
            <motion.button onClick={() => setIsTrackerOpen(true)} className="snap-start shrink-0 flex items-center justify-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 px-5 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-teal-500/20">
              <CreditCard className="w-4 h-4" /> <span>Assinaturas</span>
            </motion.button>
            <motion.button onClick={() => setIsPlannerOpen(true)} className="snap-start shrink-0 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-5 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-emerald-500/20">
              <Target className="w-4 h-4" /> <span>Planejador</span>
            </motion.button>
            <motion.button onClick={() => setIsCalendarOpen(true)} className="snap-start shrink-0 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-5 py-2.5 rounded-full font-medium transition-all active:scale-95 cursor-pointer border border-blue-500/20">
              <Calendar className="w-4 h-4" /> <span>Calendário</span>
            </motion.button>
            <motion.button onClick={() => setIsAiModalOpen(true)} className="snap-start shrink-0 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-purple-500/25 active:scale-95 cursor-pointer border border-white/10">
              <Sparkles className="w-4 h-4" /> <span>Ler Foto</span>
            </motion.button>
            <motion.button onClick={handleOpenModal} className="snap-start shrink-0 flex items-center justify-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-bold transition-all hover:bg-neutral-200 active:scale-95 cursor-pointer">
              <Plus className="w-5 h-5" /> <span>Novo Lançamento</span>
            </motion.button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-6 md:pb-12">
            {[1,2,3].map(i => (
              <div key={i} className="min-w-[80%] md:min-w-0 h-32 bg-white/5 border border-white/10 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-6 md:pb-12 snap-x snap-mandatory md:snap-none scrollbar-hide">
            <div className="snap-center shrink-0 w-[85%] md:w-auto">
              <SummaryCard title="Saldo no Mês" amount={formatMoney(balance)} isPositive={balance >= 0} icon={<Wallet className="text-indigo-400" />} delay={0.1} />
            </div>
            <div className="snap-center shrink-0 w-[80%] md:w-auto">
              <SummaryCard title="Receitas" amount={formatMoney(totalIncome)} isPositive={true} icon={<TrendingUp className="text-emerald-400" />} delay={0.2} />
            </div>
            <div className="snap-center shrink-0 w-[80%] md:w-auto">
              <SummaryCard title="Despesas" amount={formatMoney(totalExpense)} isPositive={false} icon={<TrendingDown className="text-rose-400" />} delay={0.3} />
            </div>
          </div>
        )}

        {/* Projeção de Fim de Mês */}
        {!isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className={`mb-8 border rounded-3xl p-5 md:p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden ${balance >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
            <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${balance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${balance >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Previsão de Fim de Mês</h3>
                <p className="text-neutral-400 text-sm">Baseado nas despesas fixas e variáveis agendadas</p>
              </div>
            </div>
            <div className="text-left md:text-right relative z-10 bg-black/20 p-4 rounded-2xl border border-white/5 w-full md:w-auto">
              <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-1">Saldo Livre Previsto</p>
              <p className={`text-2xl font-extrabold tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatMoney(balance)}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Se não houver novos gastos, este será seu saldo.</p>
            </div>
          </motion.div>
        )}

        {/* Gráfico Principal */}
        {!isLoading && (
          <div className="mb-8">
            <DashboardChart transactions={allTransactions} />
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">Organização</h2>
                <button onClick={() => setIsCategoryOpen(true)} className="text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2.5 py-1 rounded-full font-medium transition-colors border border-indigo-500/20">
                  + Categorias
                </button>
              </div>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 w-fit">
                <button onClick={handlePrevMonth} className="p-1.5 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                <div className="w-24 text-center font-medium text-xs text-white tracking-wider uppercase">{MONTHS[activeMonth]}</div>
                <button onClick={handleNextMonth} className="p-1.5 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div key={activeMonth} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ExpenseCategoryCard title="Contas Fixas" icon={<HomeIcon className="w-5 h-5 text-blue-400" />} total={formatMoney(sumCategory(contasFixas))} accentColor="bg-blue-500/10 border-blue-500/20" items={contasFixas} formatMoney={formatMoney} onAction={handleOpenModal} onEditItem={handleEditTransaction} />
                <ExpenseCategoryCard title="Variáveis" icon={<Coffee className="w-5 h-5 text-amber-400" />} total={formatMoney(sumCategory(variaveis))} accentColor="bg-amber-500/10 border-amber-500/20" items={variaveis} formatMoney={formatMoney} onAction={handleOpenModal} onEditItem={handleEditTransaction} />
                <ExpenseCategoryCard title="Cartões" icon={<CreditCard className="w-5 h-5 text-purple-400" />} total={formatMoney(sumCategory(cartoes))} accentColor="bg-purple-500/10 border-purple-500/20" items={cartoes} formatMoney={formatMoney} onAction={handleOpenModal} onEditItem={handleEditTransaction} />
                <ExpenseCategoryCard title="Investimentos" icon={<LineChart className="w-5 h-5 text-emerald-400" />} total={formatMoney(sumCategory(investimentos))} accentColor="bg-emerald-500/10 border-emerald-500/20" items={investimentos} formatMoney={formatMoney} onAction={handleOpenModal} onEditItem={handleEditTransaction} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            {/* Dicas do Nexa (Gamificação) */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="mb-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-5 relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="mt-1"><Sparkles className="w-5 h-5 text-indigo-400" /></div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-300 mb-1">Dica do Nexa</h3>
                  {variaveisPercent > 30 ? (
                    <p className="text-xs text-neutral-300 leading-relaxed">Cuidado! Seus gastos variáveis já consomem <strong>{variaveisPercent.toFixed(1)}%</strong> da sua renda. Tente segurar as compras por impulso.</p>
                  ) : balance > 0 ? (
                    <p className="text-xs text-neutral-300 leading-relaxed">Seu orçamento está saudável e deve sobrar dinheiro! Que tal destinar esse valor para uma de suas Metas?</p>
                  ) : balance < 0 ? (
                    <p className="text-xs text-neutral-300 leading-relaxed">Alerta! Sua previsão é fechar no vermelho. Reveja os gastos agendados e cancele assinaturas que não usa.</p>
                  ) : (
                    <p className="text-xs text-neutral-300 leading-relaxed">Continue acompanhando seus gastos diários para não ter surpresas no fim do mês.</p>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm h-full">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold tracking-tight">Recentes</h2>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input type="text" placeholder="Buscar gastos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {recentTransactions.length === 0 ? (
                  <p className="text-neutral-500 text-sm text-center py-4">Nenhuma transação lançada ainda.</p>
                ) : (
                  recentTransactions.map((tx) => (
                    <TransactionRow key={tx.id} title={tx.title} category={tx.category} date={new Date(tx.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} amount={`${tx.type === 'income' ? '+' : '-'} R$ ${tx.amount.toFixed(2).replace('.', ',')}`} type={tx.type} isPaid={tx.is_paid} onTogglePaid={() => handleTogglePaid(tx.id, tx.is_paid)} onDelete={() => handleDeleteTransaction(tx.id)} onEdit={() => handleEditTransaction(tx)} />
                  ))
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditTransactionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={editingTransaction} />
      <AiUploadModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      <FinancialPlannerModal isOpen={isPlannerOpen} onClose={() => setIsPlannerOpen(false)} currentIncome={totalIncome} currentExpense={totalExpense} balance={balance} transactions={allTransactions} />
      <SubscriptionTrackerModal isOpen={isTrackerOpen} onClose={() => setIsTrackerOpen(false)} transactions={allTransactions} />
      <ReportsModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} transactions={allTransactions} />
      <ActivityModal isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} transactions={allTransactions} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} userEmail={userEmail} userRole={userRole} />
      <CoupleModal isOpen={isCoupleOpen} onClose={() => setIsCoupleOpen(false)} />
      <GoalsModal isOpen={isGoalsOpen} onClose={() => setIsGoalsOpen(false)} />
      <CategoryManagerModal isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} />
      <FinancialCalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} transactions={allTransactions} />

      <BudgetModal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} transactions={allTransactions} currentIncome={totalIncome} activeMonth={activeMonth} />
      <WelcomeModal />
    </div>
  );
}

function SummaryCard({ title, amount, isPositive, icon, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay }} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3.5 bg-white/10 rounded-2xl border border-white/10 shadow-inner">{icon}</div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full ${isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        </div>
      </div>
      <p className="text-neutral-400 text-sm font-medium mb-1 tracking-wide">{title}</p>
      <h3 className={`text-4xl font-extrabold tracking-tight ${amount === 'R$ 0,00' ? 'text-neutral-500' : 'text-white'}`}>{amount}</h3>
    </motion.div>
  );
}

function ExpenseCategoryCard({ title, icon, total, items, accentColor, onAction, onEditItem, formatMoney }: any) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm flex flex-col h-full transition-all group`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${accentColor}`}>{icon}</div>
          <h3 className="font-semibold text-neutral-200">{title}</h3>
        </div>
        <button onClick={onAction} className="text-neutral-400 bg-white/5 p-1.5 rounded-lg flex items-center hover:bg-white/10 transition-colors cursor-pointer"><Plus className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 flex flex-col gap-3 mb-6">
        {items.length === 0 ? <p className="text-neutral-600 text-sm italic py-2">Nenhum gasto neste mês.</p> : items.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center text-sm group/item">
            <span className="text-neutral-300 pr-2 line-clamp-2 leading-tight">{item.title}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`font-medium whitespace-nowrap ${item.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                {item.type === 'income' ? '+ ' : ''}{formatMoney(item.amount)}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); onEditItem(item); }} 
                className="text-indigo-400/50 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors cursor-pointer"
                title="Editar gasto"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-white/10 mt-auto">
        <div className="flex justify-between items-end">
          <div>
            <span className="block text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Total</span>
            <span className={`text-xl font-bold tracking-tight ${total === 'R$ 0,00' ? 'text-neutral-500' : 'text-white'}`}>{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ title, category, date, amount, type, isPaid, onTogglePaid, onDelete, onEdit }: any) {
  const isIncome = type === 'income';
  return (
    <div className={`flex flex-wrap items-center justify-between p-3.5 rounded-2xl border transition-colors gap-y-3 gap-x-2 overflow-hidden ${isPaid === false ? 'bg-amber-500/5 border-amber-500/10' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
      
      {/* Esquerda: Icone e Textos */}
      <div className="flex items-center gap-3 flex-[1_1_180px] min-w-0">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${isIncome ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-rose-400/10 border-rose-400/20 text-rose-400'}`}>
          {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        </div>
        
        <div className="flex flex-col min-w-0 py-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`font-semibold text-sm line-clamp-2 leading-snug ${isPaid === false ? 'text-amber-100' : 'text-white'}`}>
              {title || "Sem título"}
            </h4>
            {isPaid === false && <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 mt-0.5">Pendente</span>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500 uppercase tracking-wide font-medium mt-1">
            <span className="line-clamp-1">{category || "Sem Categoria"}</span>
            <span className="w-1 h-1 bg-neutral-700 rounded-full shrink-0"></span>
            <span className="shrink-0">{date || "Sem data"}</span>
          </div>
        </div>
      </div>

      {/* Direita: Valor e Botões */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 flex-[1_1_150px]">
        <div className={`font-bold text-sm tracking-tight whitespace-nowrap mr-auto sm:mr-1 ${isIncome ? 'text-emerald-400' : (isPaid === false ? 'text-amber-400' : 'text-white')}`}>
          {amount}
        </div>
        {isPaid !== undefined && (
          <button onClick={onTogglePaid} className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${isPaid ? 'text-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10'}`}>
            {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </button>
        )}
        <button onClick={onEdit} className="p-2 text-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors cursor-pointer shrink-0"><Edit2 className="w-4 h-4" /></button>
        <button onClick={onDelete} className="p-2 text-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer shrink-0"><Trash2 className="w-4 h-4" /></button>
      </div>
      
    </div>
  );
}
