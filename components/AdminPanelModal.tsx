"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, Activity, Users, Zap, RefreshCw, Loader2, Key, ChevronRight, Crown, Ban } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminPanelModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'users'>('metrics');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      fetchUsers();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_logs_for_admin');
    if (data) setLogs(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.rpc('get_all_users_for_admin');
    if (data) setUsers(data);
  };

  const handleTogglePlan = async (userId: string, currentPlan: string) => {
    setIsUpdating(userId);
    const newPlan = currentPlan === 'premium' ? 'free' : 'premium';
    const { error } = await supabase.rpc('update_user_plan_admin', { 
      target_user_id: userId, 
      new_plan: newPlan 
    });
    
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan_type: newPlan } : u));
    } else {
      alert("Erro ao alterar plano: " + error.message);
    }
    setIsUpdating(null);
  };

  if (!isOpen) return null;

  const totalLogs = logs.length;
  
  // Contagem por funcionalidade
  const featureStats = logs.reduce((acc, log) => {
    acc[log.feature] = (acc[log.feature] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Contagem por usuário
  const userStats = logs.reduce((acc, log) => {
    acc[log.user_id] = (acc[log.user_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getFeatureName = (f: string) => {
    switch (f) {
      case 'chat': return 'Nexa Chat';
      case 'extract': return 'Leitura de Foto';
      case 'advisor': return 'Conselho';
      case 'auto-budget': return 'Auto-Orçamento';
      default: return f;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-neutral-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none"></div>

          <div className="flex justify-between items-center mb-4 shrink-0 relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-400" /> Painel de Controle (Admin)
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => { fetchLogs(); fetchUsers(); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white" title="Atualizar Dados">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 shrink-0 mb-6 relative z-10">
            <button onClick={() => setActiveTab('metrics')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'metrics' ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/30' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'}`}>
              <Activity className="w-4 h-4" /> Métricas da API
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/30' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'}`}>
              <Users className="w-4 h-4" /> Gerenciar Clientes
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-4 relative z-10">
            {activeTab === 'metrics' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-neutral-400 mb-2">
                      <Activity className="w-4 h-4" /> <span className="text-sm font-medium">Total de Usos (Recentes)</span>
                    </div>
                    <div className="text-3xl font-extrabold text-white">{loading ? '-' : totalLogs}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-neutral-400 mb-2">
                      <Users className="w-4 h-4" /> <span className="text-sm font-medium">Usuários Ativos (Recentes)</span>
                    </div>
                    <div className="text-3xl font-extrabold text-white">{loading ? '-' : Object.keys(userStats).length}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-neutral-400 mb-2">
                      <Zap className="w-4 h-4" /> <span className="text-sm font-medium">Funcionalidade Favorita</span>
                    </div>
                    <div className="text-xl font-extrabold text-indigo-400 mt-1">
                      {loading ? '-' : (
                        Object.entries(featureStats).sort((a: any, b: any) => b[1] - a[1])[0] 
                        ? getFeatureName(Object.entries(featureStats).sort((a: any, b: any) => b[1] - a[1])[0][0]) 
                        : 'Nenhuma'
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2"><Key className="w-4 h-4" /> Top Usuários Gastões</h3>
                    <div className="space-y-3">
                      {Object.entries(userStats).length === 0 && <p className="text-neutral-500 text-sm">Nenhum uso registrado ainda.</p>}
                      {Object.entries(userStats).sort((a: any, b: any) => b[1] - a[1]).slice(0,5).map(([uid, count], idx) => {
                        const usr = users.find(u => u.id === uid);
                        return (
                          <div key={uid} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <span className="text-neutral-500 font-bold w-4">{idx + 1}.</span>
                              <span className="text-sm text-neutral-200 truncate">{usr ? usr.email : uid.substring(0,8)+'...'}</span>
                            </div>
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-xs font-bold">{count} chamadas</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-rose-400 mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> Acessos em Tempo Real</h3>
                    <div className="space-y-3 h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                      {logs.length === 0 && <p className="text-neutral-500 text-sm">Nenhum uso registrado ainda.</p>}
                      {logs.map(log => {
                        const usr = users.find(u => u.id === log.user_id);
                        return (
                          <div key={log.id} className="flex flex-col bg-black/20 p-3 rounded-xl border border-white/5 gap-2">
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-neutral-200 truncate pr-2 font-medium">{usr ? usr.email : 'Usuário Oculto'}</span>
                              <span className="text-[10px] text-neutral-500 whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ChevronRight className="w-3 h-3 text-indigo-500" />
                              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{getFeatureName(log.feature)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl mb-4 flex items-start gap-3">
                  <div className="mt-0.5"><Users className="w-5 h-5 text-indigo-400" /></div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Gerenciamento de Assinaturas</h3>
                    <p className="text-sm text-neutral-400">Aqui você pode alterar manualmente os clientes do plano <strong>Free</strong> (com limite de IA) para o plano <strong>Premium</strong> (Ilimitado).</p>
                  </div>
                </div>

                {users.map(usr => (
                  <div key={usr.id} className="bg-black/30 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-indigo-500/30">
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">ID: {usr.id}</div>
                      <div className="font-bold text-white text-base">{usr.email}</div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 mb-1">Plano Atual</span>
                        {usr.plan_type === 'premium' ? (
                          <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-sm font-bold">
                            <Crown className="w-4 h-4" /> Premium
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-neutral-800 text-neutral-400 px-3 py-1.5 rounded-lg border border-white/5 text-sm font-bold">
                            <Ban className="w-4 h-4" /> Free
                          </span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleTogglePlan(usr.id, usr.plan_type)}
                        disabled={isUpdating === usr.id || usr.role === 'admin'}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center min-w-[140px] ${
                          usr.role === 'admin' 
                            ? 'bg-white/5 text-neutral-600 cursor-not-allowed'
                            : usr.plan_type === 'premium' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {isUpdating === usr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          usr.role === 'admin' ? 'Administrador' : (usr.plan_type === 'premium' ? 'Rebaixar p/ Free' : 'Promover a Premium')
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
