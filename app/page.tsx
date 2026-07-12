"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Bell, User, Plus, Home as HomeIcon, Coffee, CreditCard, 
  ChevronLeft, ChevronRight, ArrowRight, Sparkles, LineChart, Target,
  PieChart as PieChartIcon, Search, Trash2, Heart, CheckCircle2, Clock, Edit2, Calendar, FileText, Settings2, Eye, EyeOff, LayoutGrid
} from "lucide-react";

import { TransactionModal } from "../components/TransactionModal";
import { EditTransactionModal } from "../components/EditTransactionModal";
import { AiUploadModal } from "../components/AiUploadModal";
import { FinancialPlannerModal } from "../components/FinancialPlannerModal";
import { SubscriptionTrackerModal } from "../components/SubscriptionTrackerModal";
import { ReportsModal } from "../components/ReportsModal";
import { StockTrackerModal } from "../components/StockTrackerModal";
import { ActivityModal } from "../components/ActivityModal";
import { ProfileModal } from "../components/ProfileModal";
import { CoupleModal } from "../components/CoupleModal";
import { FinancialCalendarModal } from "../components/FinancialCalendarModal";
import { WalletsModal } from "../components/WalletsModal";
import { AdminPanelModal } from "../components/AdminPanelModal";
import { PaywallModal } from "../components/PaywallModal";

import { BudgetModal } from "../components/BudgetModal";
import { WelcomeModal } from "../components/WelcomeModal";
import { GoalsModal } from "../components/GoalsModal";
import { CategoryManagerModal } from "../components/CategoryManagerModal";
import { AiChatModal } from "../components/AiChatModal";
import { ModulesModal, ModulesState, defaultModulesState } from "../components/ModulesModal";
import { ToolsMenuModal } from "../components/ToolsMenuModal";
import { SummaryCard } from "../components/SummaryCard";
import { ExpenseCategoryCard } from "../components/ExpenseCategoryCard";
import { TransactionRow } from "../components/TransactionRow";
import { supabase } from "../lib/supabase";
import { syncOfflineTransactions } from "../lib/offlineSync";

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Dashboard() {
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [showBalances, setShowBalances] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<'expense' | 'income'>('expense');
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
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isModulesModalOpen, setIsModulesModalOpen] = useState(false);
  const [isStocksOpen, setIsStocksOpen] = useState(false);
  const [activeModules, setActiveModules] = useState<ModulesState>(defaultModulesState);
  const [isWalletsOpen, setIsWalletsOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [userPlan, setUserPlan] = useState("free");

  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);

  useEffect(() => {
    const handleOpenTool = (tool: string) => {
      switch(tool) {
        case 'reports': setIsReportsOpen(true); break;
        case 'goals': setIsGoalsOpen(true); break;
        case 'categories': setIsCategoryOpen(true); break;
        case 'planner': setIsPlannerOpen(true); break;
        case 'ai_upload': setIsAiModalOpen(true); break;
        case 'ai_chat': setIsAiChatOpen(true); break;
        case 'casais': window.location.href = '/casais'; break;
        case 'calendar': setIsCalendarOpen(true); break;
        case 'subscriptions': setIsTrackerOpen(true); break;
        case 'stocks': setIsStocksOpen(true); break;
      }
    };
    const handleOpenModal = (e: any) => {
      const name = e.detail;
      if ((name === 'acoes' || name === 'casais') && userPlan === 'free') {
        setIsPaywallOpen(true);
        return;
      }
      if (name === 'casais') setIsCoupleOpen(true);
      if (name === 'relatorios') setIsReportsOpen(true);
      if (name === 'config') setIsProfileOpen(true);
      if (name === 'manual') setIsModalOpen(true);
      if (name === 'camera') setIsAiModalOpen(true);
      if (name === 'ferramentas') setIsToolsMenuOpen(true);
      if (name === 'personalizar') setIsModulesModalOpen(true);
      if (name === 'metas') setIsGoalsOpen(true);
      if (name === 'orcamentos') setIsBudgetOpen(true);
      if (name === 'assinaturas') setIsTrackerOpen(true);
      if (name === 'planejador') setIsPlannerOpen(true);
      if (name === 'calendario') setIsCalendarOpen(true);
      if (name === 'acoes') setIsStocksOpen(true);
      if (name === 'adminPanel') setIsAdminPanelOpen(true);
      if (name === 'paywall') setIsPaywallOpen(true);
    };
    window.addEventListener('openModal', handleOpenModal);
    return () => window.removeEventListener('openModal', handleOpenModal);
  }, [userPlan]);

  const [hasUnread, setHasUnread] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("client");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPending, setFilterPending] = useState(false);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});

  const handlePrevMonth = () => setActiveMonth(prev => prev === 0 ? 11 : prev - 1);
  const handleNextMonth = () => setActiveMonth(prev => prev === 11 ? 0 : prev + 1);
  const handleOpenModal = () => {
    setTransactionModalType('expense');
    setIsModalOpen(true);
  };
  const handleOpenIncomeModal = () => {
    setTransactionModalType('income');
    setIsModalOpen(true);
  };

  const handleSaveModules = (newModules: ModulesState) => {
    setActiveModules(newModules);
    localStorage.setItem('nexa_modules_state', JSON.stringify(newModules));
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(console.error);

    const savedModules = localStorage.getItem('nexa_modules_state');
    if (savedModules) {
      try { setActiveModules(JSON.parse(savedModules)); } catch (e) {}
    }

    async function checkUserAndFetch() {
      // 1. Tenta sincronizar a fila offline
      await syncOfflineTransactions();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/login'; return; }
      setUserEmail(session.user.email || "");
      setUserName(session.user.user_metadata?.display_name || "");
      setUserId(session.user.id);

      const { data: profile } = await supabase.from('profiles').select('role, plan_type').eq('id', session.user.id).single();
      if (profile) {
        setUserRole(profile.role);
        setUserPlan(profile.plan_type || 'free');
      }

      const [txResponse, walletsResponse, budgetsResponse] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', session.user.id).order('date', { ascending: false }),
        supabase.from('wallets').select('*').eq('user_id', session.user.id),
        supabase.from('budgets').select('*').eq('user_id', session.user.id)
      ]);
      
      let transactions = txResponse.data || [];
      
      if (txResponse.data) {
        // --- MOTOR DE RECORRÊNCIA ---
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

        const contasFixasAnteriores = transactions.filter(t => t.category === 'Contas Fixas' && t.date && t.date.startsWith(lastMonthStr));
        const transacoesParaInserir: any[] = [];

        contasFixasAnteriores.forEach(contaAntiga => {
          const jaExiste = transactions.find(t => t.title === contaAntiga.title && t.category === 'Contas Fixas' && t.date && t.date.startsWith(currentMonthStr));
          if (!jaExiste) {
            const dataNova = new Date(contaAntiga.date);
            dataNova.setMonth(now.getMonth());
            dataNova.setFullYear(now.getFullYear());
            transacoesParaInserir.push({
              user_id: contaAntiga.user_id,
              title: contaAntiga.title,
              amount: contaAntiga.amount,
              type: contaAntiga.type,
              category: contaAntiga.category,
              date: dataNova.toISOString().split('T')[0],
              is_paid: false,
              wallet_id: contaAntiga.wallet_id
            });
          }
        });

        if (transacoesParaInserir.length > 0) {
          const { error } = await supabase.from('transactions').insert(transacoesParaInserir);
          if (!error) {
            const { data: newTxData } = await supabase.from('transactions').select('*').eq('user_id', session.user.id).order('date', { ascending: false });
            if (newTxData) transactions = newTxData;
          }
        }
        // ------------------------------
        setAllTransactions(transactions);
      }
      
      if (walletsResponse.data) setWallets(walletsResponse.data);
      if (budgetsResponse.data) {
        const bMap: Record<string, number> = {};
        budgetsResponse.data.forEach((b: any) => {
          bMap[b.category] = b.amount;
        });
        setBudgets(bMap);
      }
      setIsLoading(false);
    }
    checkUserAndFetch();
  }, []);

  async function refreshBudgets() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('budgets').select('*').eq('user_id', session.user.id);
    if (data) {
      const bMap: Record<string, number> = {};
      data.forEach((b: any) => {
        bMap[b.category] = b.amount;
      });
      setBudgets(bMap);
    }
  }

  function handleEditTransaction(tx: any) {
    setEditingTransaction(tx);
    setIsEditModalOpen(true);
  }

  async function handleDeleteTransaction(id: string) {
    const tx = allTransactions.find(t => t.id === id);
    if (!tx) return;

    if (tx.installment_group) {
      const confirmBulk = window.confirm("Este lançamento se repete. Deseja excluir TODAS as parcelas a partir desta data?\n\n[OK] = Excluir esta e as futuras\n[Cancelar] = Excluir apenas esta");
      
      if (confirmBulk) {
        const { error } = await supabase.from('transactions').delete()
          .eq('installment_group', tx.installment_group)
          .gte('date', tx.date);
          
        if (!error) {
          setAllTransactions(prev => prev.filter(t => !(t.installment_group === tx.installment_group && t.date >= tx.date)));
        } else {
          alert("Erro ao excluir série.");
        }
        return;
      }
    }

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

  const visibleTransactions = activeWalletId ? allTransactions.filter(t => t.wallet_id === activeWalletId) : allTransactions;

  const currentMonthTransactions = visibleTransactions.filter(t => {
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
  const formatMoney = (val: number) => showBalances ? `R$ ${val.toFixed(2).replace('.', ',')}` : 'R$ •••••';

  const filteredTransactions = visibleTransactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPending = filterPending ? (t.is_paid === false && t.type === 'expense') : true;
    return matchesSearch && matchesPending;
  });

  const recentTransactions = (searchQuery || filterPending) ? filteredTransactions : visibleTransactions.slice(0, 8); 

  const budgetProgress = Object.keys(budgets).map(category => {
    const limit = budgets[category];
    const spent = currentMonthTransactions.filter(t => t.type === 'expense' && t.category === category).reduce((acc, t) => acc + t.amount, 0);
    const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const overspent = spent > limit;
    return { category, limit, spent, percentage, overspent };
  }).filter(b => b.limit > 0);

  const variaveisPercent = totalIncome > 0 ? (sumCategory(variaveis) / totalIncome) * 100 : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

  const dueBills = visibleTransactions.filter(t => {
    if (t.type !== 'expense' || t.is_paid) return false;
    return t.date <= threeDaysStr;
  });

  useEffect(() => {
    if (dueBills.length > 0) setHasUnread(true);
    else setHasUnread(false);
  }, [dueBills.length]);

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
          
          <div className="flex items-center gap-4">
            <select 
              value={activeWalletId || ''} 
              onChange={(e) => setActiveWalletId(e.target.value || null)}
              className="bg-black/30 border border-white/10 text-white text-sm rounded-lg py-1.5 px-3 focus:outline-none focus:border-indigo-500 hidden sm:block"
            >
              <option value="">Todas Carteiras</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button onClick={() => setIsWalletsOpen(true)} className="text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-1.5 rounded-lg font-medium transition-colors border border-indigo-500/20 hidden sm:block">
              Carteiras
            </button>

            <button onClick={() => setIsAiChatOpen(true)} className="text-indigo-400 hover:text-indigo-300 transition-colors relative ml-2 hidden md:block" title="Nexa AI">
              <Sparkles className="w-5 h-5" />
            </button>

            <button onClick={() => { setIsActivityOpen(true); setHasUnread(false); }} className="text-neutral-400 hover:text-white transition-colors relative ml-2">
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
        
        <header className="flex md:hidden justify-between items-center mb-6 gap-2">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden bg-black/20 shrink-0">
              <img src="/icon-192.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-400 font-medium tracking-wide uppercase truncate">Olá, {userName || (userEmail ? userEmail.split('@')[0] : 'Usuário')}</p>
              <h1 className="text-2xl font-bold text-white tracking-tight truncate">Seu Nexa</h1>
            </div>
          </div>
          
          <div className="flex gap-2 shrink-0">
             <button onClick={() => setIsAiChatOpen(true)} className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-full hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors cursor-pointer" title="Nexa AI">
               <Sparkles className="w-5 h-5" />
             </button>
             <button onClick={() => setIsTrackerOpen(true)} className="p-2.5 bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"><Search className="w-5 h-5"/></button>
             <button onClick={() => setIsPlannerOpen(true)} className="p-2.5 bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"><Target className="w-5 h-5"/></button>
             <button onClick={() => { setIsActivityOpen(true); setHasUnread(false); }} className="p-2.5 bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5"/>
                {hasUnread && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
             </button>
          </div>
        </header>

        {/* Mobile Wallets */}
        <div className="flex md:hidden items-center gap-2 mb-8">
            <select 
              value={activeWalletId || ''} 
              onChange={(e) => setActiveWalletId(e.target.value || null)}
              className="flex-1 bg-black/30 border border-white/10 text-white text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Todas Carteiras</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button onClick={() => setIsWalletsOpen(true)} className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 p-2.5 rounded-xl transition-colors border border-indigo-500/20 shrink-0">
              <Wallet className="w-5 h-5" />
            </button>
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 relative z-10">
          <div className="shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Visão Geral</h1>
              <button onClick={() => setShowBalances(!showBalances)} className="text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer" title={showBalances ? "Ocultar saldos" : "Mostrar saldos"}>
                {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-neutral-400 text-sm md:text-base">Acompanhe e gerencie seu patrimônio</p>
          </div>
          
          {/* Atalhos: Carrossel no Mobile, Wrap no Desktop */}
          <div className="flex overflow-x-auto md:overflow-visible items-center gap-2 w-full xl:w-auto pb-2 md:pb-0 snap-x snap-mandatory md:snap-none flex-nowrap md:flex-wrap [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
            <motion.button onClick={() => setIsToolsMenuOpen(true)} className="hidden md:flex snap-start shrink-0 items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 px-4 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 cursor-pointer border border-white/10">
              <LayoutGrid className="w-3.5 h-3.5" /> <span>Ferramentas</span>
            </motion.button>
            <motion.button onClick={() => setIsAiModalOpen(true)} className="snap-start shrink-0 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-1.5 text-sm rounded-full font-medium transition-all shadow-lg shadow-purple-500/25 active:scale-95 cursor-pointer border border-white/10">
              <Sparkles className="w-3.5 h-3.5" /> <span>Ler Foto</span>
            </motion.button>
            <motion.button onClick={handleOpenModal} className="snap-start shrink-0 flex items-center justify-center gap-1.5 bg-white text-black px-4 py-1.5 text-sm rounded-full font-bold transition-all hover:bg-neutral-200 active:scale-95 cursor-pointer">
              <Plus className="w-4 h-4" /> <span>Novo Lançamento</span>
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
              <SummaryCard title="Saldo no Mês" amount={formatMoney(balance)} isPositive={balance >= 0} icon={<Wallet className="text-indigo-400" />} delay={0.1} badgeText="Atual" actionIcon={<FileText className="w-4 h-4" />} onAdd={() => setIsReportsOpen(true)} />
            </div>
            <div className="snap-center shrink-0 w-[80%] md:w-auto">
              <SummaryCard title="Receitas" amount={formatMoney(totalIncome)} isPositive={true} icon={<TrendingUp className="text-emerald-400" />} delay={0.2} onAdd={handleOpenIncomeModal} badgeText="Mês" />
            </div>
            <div className="snap-center shrink-0 w-[80%] md:w-auto">
              <SummaryCard title="Despesas" amount={formatMoney(totalExpense)} isPositive={false} icon={<TrendingDown className="text-rose-400" />} delay={0.3} onAdd={handleOpenModal} badgeText="Mês" />
            </div>
          </div>
        )}

        {/* Metas & Orçamentos (Budget Progress) */}
        {!isLoading && budgetProgress.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="mb-8 border border-white/5 rounded-3xl p-5 md:p-6 bg-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" /> Metas do Mês
              </h3>
              <button onClick={() => setIsBudgetOpen(true)} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full transition-colors cursor-pointer">
                Ajustar Limites
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {budgetProgress.map((b, idx) => {
                const isWarning = b.percentage >= 80 && b.percentage < 100;
                const isDanger = b.percentage >= 100;
                const barColor = isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
                
                return (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-neutral-300">{b.category}</span>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${isDanger ? 'text-rose-400' : 'text-white'}`}>{formatMoney(b.spent)}</span>
                        <span className="text-xs text-neutral-500 ml-1">/ {formatMoney(b.limit)}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${b.percentage}%` }} 
                        transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                        className={`h-full rounded-full ${barColor}`}
                      />
                    </div>
                    {isDanger && <span className="text-[10px] text-rose-400 font-medium">Limite excedido em {formatMoney(b.spent - b.limit)}!</span>}
                  </div>
                );
              })}
            </div>
          </motion.div>
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input type="text" placeholder="Buscar gastos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                  <button 
                    onClick={() => setFilterPending(!filterPending)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors border whitespace-nowrap ${filterPending ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-black/20 text-neutral-400 border-white/10 hover:text-white'}`}
                  >
                    A Vencer
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {recentTransactions.length === 0 ? (
                  <p className="text-neutral-500 text-sm text-center py-4">Nenhuma transação lançada ainda.</p>
                ) : (
                  recentTransactions.map((tx) => (
                    <TransactionRow key={tx.id} title={tx.title} category={tx.category} date={new Date(tx.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} amount={`${tx.type === 'income' ? '+ ' : '- '}${formatMoney(tx.amount)}`} type={tx.type} isPaid={tx.is_paid} onTogglePaid={() => handleTogglePaid(tx.id, tx.is_paid)} onDelete={() => handleDeleteTransaction(tx.id)} onEdit={() => handleEditTransaction(tx)} receiptUrl={tx.receipt_url} />
                  ))
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialType={transactionModalType} />
      <EditTransactionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={editingTransaction} />
      <AiUploadModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      <FinancialPlannerModal isOpen={isPlannerOpen} onClose={() => setIsPlannerOpen(false)} currentIncome={totalIncome} currentExpense={totalExpense} balance={balance} transactions={allTransactions} />
      <SubscriptionTrackerModal isOpen={isTrackerOpen} onClose={() => setIsTrackerOpen(false)} transactions={allTransactions} />
      <ReportsModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} transactions={allTransactions} activeMonth={activeMonth} />
      <AiChatModal isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} financialContext={{ income: totalIncome, expense: totalExpense, balance, transactions: currentMonthTransactions, userName }} />
      <StockTrackerModal isOpen={isStocksOpen} onClose={() => setIsStocksOpen(false)} userId={userId} />
      <ActivityModal isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} transactions={allTransactions} dueBills={dueBills} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} userEmail={userEmail} userName={userName} userRole={userRole} />
      <CoupleModal isOpen={isCoupleOpen} onClose={() => setIsCoupleOpen(false)} />
      <GoalsModal isOpen={isGoalsOpen} onClose={() => setIsGoalsOpen(false)} />
      <CategoryManagerModal isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} />
      <WalletsModal isOpen={isWalletsOpen} onClose={() => setIsWalletsOpen(false)} userId={userId} userPlan={userPlan} />
      <FinancialCalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} transactions={allTransactions} />
      <AdminPanelModal isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} />

      <BudgetModal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} onSave={refreshBudgets} transactions={allTransactions} currentIncome={totalIncome} activeMonth={activeMonth} />
      <ModulesModal isOpen={isModulesModalOpen} onClose={() => setIsModulesModalOpen(false)} modules={activeModules} onSave={handleSaveModules} />
      <ToolsMenuModal isOpen={isToolsMenuOpen} onClose={() => setIsToolsMenuOpen(false)} activeModules={activeModules} />
      <WelcomeModal />
    </div>
  );
}

