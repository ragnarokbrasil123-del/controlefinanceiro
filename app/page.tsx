"use client";

import { motion } from "motion/react";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Bell,
  Search,
  User,
  Plus
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30">
      {/* Navegação Superior */}
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
        {/* Cabeçalho do Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">Visão Geral</h1>
            <p className="text-neutral-400">Acompanhe suas finanças e controle seus gastos.</p>
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

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <SummaryCard 
            title="Saldo Total" 
            amount="R$ 14.250,00" 
            trend="+2.5%" 
            isPositive={true}
            icon={<Wallet className="text-indigo-400" />}
            delay={0.2}
          />
          <SummaryCard 
            title="Receitas" 
            amount="R$ 18.500,00" 
            trend="+12.5%" 
            isPositive={true}
            icon={<TrendingUp className="text-emerald-400" />}
            delay={0.3}
          />
          <SummaryCard 
            title="Despesas" 
            amount="R$ 4.250,00" 
            trend="-1.2%" 
            isPositive={false}
            icon={<TrendingDown className="text-rose-400" />}
            delay={0.4}
          />
        </div>

        {/* Lista de Transações Recentes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Transações Recentes</h2>
            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Ver todas</button>
          </div>
          
          <div className="flex flex-col gap-4">
            <TransactionRow 
              title="Supermercado Extra" 
              category="Alimentação" 
              date="Hoje, 14:30" 
              amount="- R$ 450,00" 
              type="expense" 
            />
            <TransactionRow 
              title="Salário Mês" 
              category="Receita" 
              date="Ontem, 09:00" 
              amount="+ R$ 12.000,00" 
              type="income" 
            />
            <TransactionRow 
              title="Netflix" 
              category="Assinaturas" 
              date="12 de Junho, 10:15" 
              amount="- R$ 39,90" 
              type="expense" 
            />
            <TransactionRow 
              title="Conta de Luz" 
              category="Moradia" 
              date="10 de Junho, 16:45" 
              amount="- R$ 185,00" 
              type="expense" 
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// Componente para os Cards (Saldo, Receitas, Despesas)
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

// Componente para a Lista de Transações
function TransactionRow({ title, category, date, amount, type }: any) {
  const isIncome = type === 'income';
  
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isIncome ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-rose-400/10 border-rose-400/20 text-rose-400'} group-hover:scale-105 transition-transform`}>
          {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-medium text-white mb-0.5">{title}</h4>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>{category}</span>
            <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
            <span>{date}</span>
          </div>
        </div>
      </div>
      <div className={`font-semibold ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
        {amount}
      </div>
    </div>
  );
}
