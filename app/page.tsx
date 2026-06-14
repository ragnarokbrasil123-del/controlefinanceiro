"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Bell,
  Search,
  User,
  Plus,
  Home as HomeIcon,
  Coffee,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from "lucide-react";

// Nomes completos dos meses para o novo seletor
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Dashboard() {
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());

  // Funções para navegar entre os meses
  const handlePrevMonth = () => setActiveMonth(prev => prev === 0 ? 11 : prev - 1);
  const handleNextMonth = () => setActiveMonth(prev => prev === 11 ? 0 : prev + 1);

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
            <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition-colors">
              <Search className="w-4 h-4 text-neutral-400 mr-2" />
              <input 
                type="text" 
                placeholder="Buscar transações..." 
                className="bg-transparent border-none outline-none text-sm text-white placeholder:text-neutral-500 w-48"
              />
            </div>
            <button className="text-neutral-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>
            <div className="w-9 h-9 bg-neutral-800 border border-white/10 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors">
              <User className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">Visão Geral</h1>
            <p className="text-neutral-400">Organize sua vida financeira pessoal.</p>
          </motion.div>
          
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nova Transação
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <SummaryCard 
            title="Saldo Disponível" 
            amount="R$ 14.250,00" 
            trend="+2.5%" 
            isPositive={true}
            icon={<Wallet className="text-indigo-400" />}
            delay={0.2}
          />
          <SummaryCard 
            title="Receitas Mensais" 
            amount="R$ 18.500,00" 
            trend="+12.5%" 
            isPositive={true}
            icon={<TrendingUp className="text-emerald-400" />}
            delay={0.3}
          />
          <SummaryCard 
            title="Despesas Mensais" 
            amount="R$ 4.250,00" 
            trend="-1.2%" 
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
              
              {/* NOVO: Seletor de Meses Compacto */}
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="w-24 text-center font-medium text-sm text-white tracking-wide">
                  {MONTHS[activeMonth]}
                </div>
                
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
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
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <ExpenseCategoryCard 
                  title="Contas Fixas" 
                  icon={<HomeIcon className="w-5 h-5 text-blue-400" />}
                  total="R$ 1.850,00"
                  accentColor="bg-blue-500/10 border-blue-500/20"
                  items={[
                    { name: "Aluguel", value: "R$ 1.500,00" },
                    { name: "Luz e Água", value: "R$ 200,00" },
                    { name: "Internet", value: "R$ 150,00" },
                  ]}
                />
                
                <ExpenseCategoryCard 
                  title="Variáveis" 
                  icon={<Coffee className="w-5 h-5 text-amber-400" />}
                  total="R$ 1.150,00"
                  accentColor="bg-amber-500/10 border-amber-500/20"
                  items={[
                    { name: "Supermercado", value: "R$ 600,00" },
                    { name: "Lazer/Ifood", value: "R$ 350,00" },
                    { name: "Transporte", value: "R$ 200,00" },
                  ]}
                />

                <ExpenseCategoryCard 
                  title="Cartões" 
                  icon={<CreditCard className="w-5 h-5 text-purple-400" />}
                  total="R$ 1.250,00"
                  accentColor="bg-purple-500/10 border-purple-500/20"
                  items={[
                    { name: "Nubank (1234)", value: "R$ 850,00" },
                    { name: "Itaú (9876)", value: "R$ 400,00" },
                  ]}
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
                <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Ver todas</button>
              </div>
              
              <div className="flex flex-col gap-4">
                <TransactionRow 
                  title="Supermercado Extra" 
                  category="Variável" 
                  date="Hoje" 
                  amount="- R$ 450,00" 
                  type="expense" 
                />
                <TransactionRow 
                  title="Salário" 
                  category="Receita" 
                  date="Ontem" 
                  amount="+ R$ 12.000,00" 
                  type="income" 
                />
                <TransactionRow 
                  title="Fatura Nubank" 
                  category="Cartão" 
                  date="Dia 12" 
                  amount="- R$ 850,00" 
                  type="expense" 
                />
                <TransactionRow 
                  title="Internet Claro" 
                  category="Fixa" 
                  date="Dia 10" 
                  amount="- R$ 150,00" 
                  type="expense" 
                />
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ title, amount, trend, isPositive, icon, delay }: any) {
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
          {trend}
        </div>
      </div>
      
      <p className="text-neutral-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold tracking-tight">{amount}</h3>
    </motion.div>
  );
}

function ExpenseCategoryCard({ title, icon, total, items, accentColor }: any) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm flex flex-col h-full hover:bg-white/[0.07] transition-all group`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${accentColor}`}>
            {icon}
          </div>
          <h3 className="font-semibold text-neutral-200">{title}</h3>
        </div>
        
        {/* NOVO: Botão Lançar (+) no topo do card (Aparece mais forte no Hover) */}
        <button 
          className="text-neutral-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors flex items-center opacity-70 sm:opacity-0 sm:group-hover:opacity-100"
          title={`Novo lançamento em ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col gap-3 mb-6">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="text-neutral-400">{item.name}</span>
            <span className="text-white font-medium">{item.value}</span>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t border-white/10 mt-auto">
        <div className="flex justify-between items-end">
          <div>
            <span className="block text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Total</span>
            <span className="text-lg font-bold">{total}</span>
          </div>
          
          {/* NOVO: Botão Detalhes (Entrar na Aba) na parte inferior */}
          <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 group/btn">
            Detalhes <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
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
