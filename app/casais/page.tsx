"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Heart, ArrowLeft, Plus, Users, Wallet, Target, Sparkles, Loader2, DollarSign } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { TransactionModal } from "../../components/TransactionModal";
import { TransactionRow } from "../../components/TransactionRow";

export default function CasaisDashboard() {
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  useEffect(() => {
    fetchCoupleData();
  }, []);

  const fetchCoupleData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/';
      return;
    }
    
    const userId = session.user.id;
    
    // Busca o casal ativo
    const { data: coupleData } = await supabase
      .from('couples')
      .select('*')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .eq('status', 'active')
      .limit(1);
      
    if (coupleData && coupleData.length > 0) {
      const cId = coupleData[0].id;
      setCoupleId(cId);
      
      // Busca transações conjuntas
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('couple_id', cId)
        .order('date', { ascending: false });
        
      if (txData) setTransactions(txData);
    } else {
      // Se não tem casal ativo, manda pro dashboard
      window.location.href = '/';
    }
    setLoading(false);
  };

  const handleEditDummy = () => {};
  const handleToggleDummy = async () => {};
  const handleDeleteDummy = async () => {};

  // Calcula saldos
  const totalIncomes = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncomes - totalExpenses;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /> Voltar ao Painel Pessoal
          </button>
          <div className="bg-pink-500/20 text-pink-400 px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2 border border-pink-500/30">
            <Heart className="w-4 h-4 fill-pink-500" /> Nexa Casal
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-white mb-2">Cofre Compartilhado</h1>
            <p className="text-neutral-400 mb-6 max-w-lg">
              Este é o espaço seguro onde você e seu parceiro(a) constroem o futuro juntos. Lançamentos feitos aqui aparecem nos dois celulares.
            </p>
            
            <div className="flex items-center gap-4 bg-black/30 w-fit p-2 pr-6 rounded-full border border-white/5">
              <div className="flex -space-x-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/50 border-2 border-neutral-900 flex items-center justify-center font-bold text-white">V</div>
                <div className="w-10 h-10 rounded-full bg-pink-500/50 border-2 border-neutral-900 flex items-center justify-center font-bold text-white">P</div>
              </div>
              <span className="text-sm font-semibold text-neutral-300">Vocês estão conectados!</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Saldo do Casal */}
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-pink-500/30 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-neutral-400">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-sm uppercase tracking-wider">Conta da Casa</span>
                </div>
                <button onClick={() => setIsTxModalOpen(true)} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white p-2 px-4 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-pink-500/25 transition-all">
                  <Plus className="w-4 h-4" /> Nova Despesa
                </button>
              </div>
              
              <h2 className="text-4xl font-extrabold text-white mb-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
              </h2>
              
              <div className="flex gap-4 mt-6">
                 <div className="flex-1 bg-black/30 rounded-xl p-3 border border-white/5">
                   <p className="text-xs text-neutral-500 font-bold mb-1">RECEITAS CONJUNTAS</p>
                   <p className="text-emerald-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncomes)}</p>
                 </div>
                 <div className="flex-1 bg-black/30 rounded-xl p-3 border border-white/5">
                   <p className="text-xs text-neutral-500 font-bold mb-1">DESPESAS DA CASA</p>
                   <p className="text-rose-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}</p>
                 </div>
              </div>
            </div>

            {/* Metas Conjuntas */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-pink-500/30 transition-colors group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-neutral-400">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-sm uppercase tracking-wider">Sonhos</span>
                  </div>
                </div>
                <p className="text-neutral-500 text-sm mt-4">Nenhuma meta criada ainda. Planejem a próxima viagem juntos!</p>
              </div>
              <button className="w-full text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 py-2 rounded-xl text-sm font-bold transition-colors mt-4">
                Criar Meta
              </button>
            </div>

            {/* Lista de Transações do Casal */}
            <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Histórico do Casal</h3>
              
              {transactions.length === 0 ? (
                <div className="text-center py-12 bg-black/20 rounded-2xl border border-white/5">
                  <DollarSign className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400">Ainda não há lançamentos conjuntos.</p>
                  <button onClick={() => setIsTxModalOpen(true)} className="text-pink-400 font-bold text-sm mt-2 hover:underline">Adicione a primeira despesa da casa</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map(t => (
                    <TransactionRow 
                      key={t.id} 
                      transaction={t} 
                      onEdit={handleEditDummy}
                      onTogglePaid={handleToggleDummy}
                      onDelete={handleDeleteDummy}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
      
      {coupleId && (
        <TransactionModal 
          isOpen={isTxModalOpen} 
          onClose={() => {
            setIsTxModalOpen(false);
            fetchCoupleData(); // Recarrega as transações ao fechar
          }} 
          isCouple={true} 
          coupleId={coupleId} 
        />
      )}
    </div>
  );
}
