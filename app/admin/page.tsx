"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Shield, Users, TrendingUp, TrendingDown, DollarSign,
  ChevronLeft, RefreshCw, Search, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { toast } from "../../components/Toast";
import { ToastContainer } from "../../components/Toast";

interface UserStat {
  id: string;
  email: string;
  role: string;
  created_at: string;
  transaction_count: number;
  total_income: number;
  total_expense: number;
}

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserStat[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalTransactions: 0, totalVolume: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/login'; return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      window.location.href = '/';
      return;
    }

    setIsAuthorized(true);
    await loadData();
  }

  async function loadData() {
    setIsRefreshing(true);
    try {
      // Busca todos os perfis
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, role, created_at');

      // Busca todas as transações
      const { data: transactions } = await supabase
        .from('transactions')
        .select('user_id, amount, type');

      if (!profiles || !transactions) return;

      // Busca emails via auth (necessita de service role, mas usamos o que temos)
      const userMap: Record<string, UserStat> = {};

      profiles.forEach(p => {
        userMap[p.id] = {
          id: p.id,
          email: `user-${p.id.substring(0, 8)}`,
          role: p.role || 'client',
          created_at: p.created_at,
          transaction_count: 0,
          total_income: 0,
          total_expense: 0,
        };
      });

      let totalVolume = 0;
      transactions.forEach(tx => {
        if (userMap[tx.user_id]) {
          userMap[tx.user_id].transaction_count++;
          if (tx.type === 'income') userMap[tx.user_id].total_income += tx.amount;
          else userMap[tx.user_id].total_expense += tx.amount;
          totalVolume += tx.amount;
        }
      });

      setUsers(Object.values(userMap));
      setStats({
        totalUsers: profiles.length,
        totalTransactions: transactions.length,
        totalVolume,
      });
    } catch (err) {
      toast("Erro ao carregar dados do admin.", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  async function handleToggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast(`Usuário ${newRole === 'admin' ? 'promovido a Admin' : 'rebaixado para Cliente'}.`, "success");
    } else {
      toast("Erro ao alterar role.", "error");
    }
  }

  const formatMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const filteredUsers = users.filter(u =>
    u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans">
      <ToastContainer />

      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="font-bold text-lg tracking-tight">Painel Admin</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">NEXA</span>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Visão Geral do Sistema</h1>
          <p className="text-neutral-400">Gerencie usuários, permissões e monitore a plataforma.</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            { title: "Usuários Totais", value: stats.totalUsers, icon: <Users className="w-6 h-6 text-indigo-400" />, color: "indigo" },
            { title: "Transações na Plataforma", value: stats.totalTransactions, icon: <TrendingUp className="w-6 h-6 text-emerald-400" />, color: "emerald" },
            { title: "Volume Financeiro Total", value: formatMoney(stats.totalVolume), icon: <DollarSign className="w-6 h-6 text-amber-400" />, color: "amber" },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden"
            >
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 bg-${card.color}-500`} />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-2xl bg-${card.color}-500/10 border border-${card.color}-500/20`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-neutral-400 text-sm font-medium mb-1 relative z-10">{card.title}</p>
              <p className="text-3xl font-extrabold text-white tracking-tight relative z-10">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Users Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold">Usuários Cadastrados</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Filtrar usuários..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20">
                    <th className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-6 py-4">ID do Usuário</th>
                    <th className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-6 py-4">Role</th>
                    <th className="text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider px-6 py-4">Transações</th>
                    <th className="text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider px-6 py-4">Receitas</th>
                    <th className="text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider px-6 py-4">Despesas</th>
                    <th className="text-center text-xs font-semibold text-neutral-400 uppercase tracking-wider px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-white font-mono text-xs">{user.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {user.role === 'admin' ? '👑 Admin' : '👤 Cliente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-medium">{user.transaction_count}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-emerald-400 font-medium">{formatMoney(user.total_income)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-rose-400 font-medium">{formatMoney(user.total_expense)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleRole(user.id, user.role)}
                          title={user.role === 'admin' ? 'Rebaixar para Cliente' : 'Promover para Admin'}
                          className={`p-2 rounded-lg transition-colors ${user.role === 'admin' ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-neutral-400 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                        >
                          {user.role === 'admin' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-neutral-500">Nenhum usuário encontrado.</div>
              )}
            </div>
          </div>

          <p className="text-xs text-neutral-500 mt-3 text-center">
            Nota: E-mails dos usuários não estão disponíveis via anon key. Use o Supabase Dashboard para ver e-mails completos.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
