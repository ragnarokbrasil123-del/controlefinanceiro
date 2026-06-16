"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Bell, User, Plus, Home as HomeIcon, Coffee, CreditCard, 
  ChevronLeft, ChevronRight, ArrowRight, Sparkles, LineChart, Target,
  PieChart as PieChartIcon, Search, Trash2, Heart
} from "lucide-react";

import { TransactionModal } from "../components/TransactionModal";
import { AiUploadModal } from "../components/AiUploadModal";
import { FinancialPlannerModal } from "../components/FinancialPlannerModal";
import { SubscriptionTrackerModal } from "../components/SubscriptionTrackerModal";
import { ReportsModal } from "../components/ReportsModal";
import { ActivityModal } from "../components/ActivityModal";
import { ProfileModal } from "../components/ProfileModal";
import { CoupleModal } from "../components/CoupleModal";
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
  const [hasUnread, setHasUnread] = useState(true); 
  
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("client");
  
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  const handlePrevMonth = () => setActiveMonth(prev => prev === 0 ? 11 : prev - 1);
  const handleNextMonth = () => setActiveMonth(prev => prev === 11 ? 0 : prev + 1);
  const handleOpenModal = () => setIsModalOpen(true);

  // MÁGICA: Escutando os comandos da Barra de Baixo
  useEffect(() => {
    const handleNavigation = (e: any) => {
      const modal = e.detail;
      if (modal === 'casais') setIsCoupleOpen(true);
      if (modal === 'relatorios') setIsReportsOpen(true);
      if (modal === 'config') setIsProfileOpen(true);
      if (modal === 'manual') setIsModalOpen(true);
      if (modal === 'camera') setIsAiModalOpen(true);
    };
    window.addEventListener('openModal', handleNavigation);
    return () => window.removeEventListener('openModal', handleNavigation);
  }, []);

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
    }
    checkUserAndFetch();
  }, []);

  async function handleDeleteTransaction(id: string) {
    if(!window.confirm("Deseja apagar este lançamento?")) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setAllTransactions(prev => prev.filter(t => t.id !== id));
    else alert("Erro ao excluir.");
  }

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
  const recentTransactions = allTransactions.slice(0, 8); 

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30">
      
      <main className="max-w-md md:max-w-3xl mx-auto px-6 py-8 pb-32">
        {/* CABEÇALHO PREMIUM NATIVO */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wallet className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium tracking-wide uppercase">Olá, {userEmail ? userEmail.split('@')[0] : 'Usuário'}</p>
              <h1 className="text-2xl font-bold text-white tracking-tight">Seu FinApp</h1>
            </div>
          </div>
          
          {/* FERRAMENTAS EXTRAS NO TOPO */}
          <div className="flex gap-2">
             <button onClick={() => setIsTrackerOpen(true)} className="p-2.5 bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"><Search className="w-5 h-5"/></button>
             <button onClick={() => setIsPlannerOpen(true)} className="p-2.5 bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"><Target className="w-5 h-5"/></button>
             <button onClick={() => { setIsActivityOpen(true); setHasUnread(false); }} className="p-2.5 bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5"/>
                {hasUnread && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
             </button>
          </div>
        </header>

        {/* CARDS DE SALDO (Redesenhados para Mobile com deslize) */}
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
          <div className="snap-center shrink-0 w-full md:w-[300px]">
            <SummaryCard title="Saldo no Mês" amount={formatMoney(balance)} isPositive={balance >= 0} icon={<Wallet className="text-indigo-400" />} delay={0.1} />
          </div>
          <div className="snap-center shrink-0 w-[280px]">
            <SummaryCard title="Receitas" amount={formatMoney(totalIncome)} isPositive={true} icon={<TrendingUp className="text-emerald-400" />} delay={0.2} />
          </div>
          <div className="snap-center shrink-0 w-[280px]">
            <SummaryCard title="Despesas" amount={formatMoney(totalExpense)} isPositive={false} icon={<TrendingDown className="text-rose-400" />} delay={0.3} />
          </div>
        </div>

        {/* ORGANIZAÇÃO MENSAL */}
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Organização</h2>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
              <button onClick={handlePrevMonth} className="p-1.5 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <div className="w-24 text-center font-medium text-xs text-white tracking-wider uppercase">{MONTHS[activeMonth]}</div>
              <button onClick={handleNextMonth} className="p-1.5 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={activeMonth} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ExpenseCategoryCard title="Contas Fixas" icon={<HomeIcon className="w-5 h-5 text-blue-400" />} total={formatMoney(sumCategory(contasFixas))} accentColor="bg-blue-500/10 border-blue-500/20" items={contasFixas.map(t => ({ name: t.title, value: formatMoney(t.amount) }))} onAction={handleOpenModal} />
              <ExpenseCategoryCard title="Variáveis" icon={<Coffee className="w-5 h-5 text-amber-400" />} total={formatMoney(sumCategory(variaveis))} accentColor="bg-amber-500/10 border-amber-500/20" items={variaveis.map(t => ({ name: t.title, value: formatMoney(t.amount) }))} onAction={handleOpenModal} />
              <ExpenseCategoryCard title="Cartões" icon={<CreditCard className="w-5 h-5 text-purple-400" />} total={formatMoney(sumCategory(cartoes))} accentColor="bg-purple-500/10 border-purple-500/20" items={cartoes.map(t => ({ name: t.title, value: formatMoney(t.amount) }))} onAction={handleOpenModal} />
              <ExpenseCategoryCard title="Investimentos" icon={<LineChart className="w-5 h-5 text-emerald-400" />} total={formatMoney(sumCategory(investimentos))} accentColor="bg-emerald-500/10 border-emerald-500/20" items={investimentos.map(t => ({ name: t.title, value: formatMoney(t.amount) }))} onAction={handleOpenModal} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RECENTES */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold tracking-tight">Recentes</h2>
          </div>
          <div className="flex flex-col gap-3">
            {recentTransactions.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-4">Nenhuma transação lançada ainda.</p>
            ) : (
              recentTransactions.map((tx) => (
                <TransactionRow key={tx.id} title={tx.title} category={tx.category} date={new Date(tx.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} amount={`${tx.type === 'income' ? '+' : '-'} R$ ${tx.amount.toFixed(2).replace('.', ',')}`} type={tx.type} onDelete={() => handleDeleteTransaction(tx.id)} />
              ))
            )}
          </div>
        </motion.div>
      </main>

      {/* MODAIS INVISÍVEIS */}
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <AiUploadModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      <FinancialPlannerModal isOpen={isPlannerOpen} onClose={() => setIsPlannerOpen(false)} currentIncome={totalIncome} />
      <SubscriptionTrackerModal isOpen={isTrackerOpen} onClose={() => setIsTrackerOpen(false)} transactions={allTransactions} />
      <ReportsModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} transactions={allTransactions} />
      <ActivityModal isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} transactions={allTransactions} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} userEmail={userEmail} userRole={userRole} />
      <CoupleModal isOpen={isCoupleOpen} onClose={() => setIsCoupleOpen(false)} />
    </div>
  );
}

// ==========================================
// COMPONENTES MENORES (Aparência Premium)
// ==========================================

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

function ExpenseCategoryCard({ title, icon, total, items, accentColor, onAction }: any) {
  return (
    <div onClick={onAction} className={`bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm flex flex-col h-full active:scale-95 transition-all group cursor-pointer`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${accentColor}`}>{icon}</div>
          <h3 className="font-semibold text-neutral-200">{title}</h3>
        </div>
        <button className="text-neutral-400 bg-white/5 p-1.5 rounded-lg flex items-center"><Plus className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 flex flex-col gap-3 mb-6">
        {items.length === 0 ? <p className="text-neutral-600 text-sm italic py-2">Nenhum gasto neste mês.</p> : items.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="text-neutral-400 truncate max-w-[120px]">{item.name}</span>
            <span className="text-white font-medium whitespace-nowrap">{item.value}</span>
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

function TransactionRow({ title, category, date, amount, type, onDelete }: any) {
  const isIncome = type === 'income';
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3.5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${isIncome ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-rose-400/10 border-rose-400/20 text-rose-400'}`}>
          {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-semibold text-white mb-0.5 text-sm truncate w-32 sm:w-48">{title}</h4>
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 uppercase tracking-wide font-medium">
            <span>{category}</span>
            <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
            <span>{date}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`font-bold text-sm tracking-tight whitespace-nowrap ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
          {amount}
        </div>
        <button onClick={onDelete} className="p-2 text-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
