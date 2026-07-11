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
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
      
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
    const { error } = await supabase.from('profiles').update({ plan_type: newPlan }).eq('id', userId);
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
            <button onClick={() => setActiveTab('metrics')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'metrics' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-neutral-400 hover:text-white'}`}>
              <Activity className="w-4 h-4" /> Métricas da API
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-neutral-400 hover:text-white'}`}>
              <Users className="w-4 h-4" /> Gerenciar Clientes
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-4 flex flex-col gap-6 relative z-10 scrollbar-hide">
            
            {activeTab === 'metrics' && (
              loading && logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p>Buscando logs da API...</p>
                </div>
              ) : (
                <>
                  {/* Resumo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-2 text-neutral-400">
                        <Activity className="w-5 h-5" />
                        <span className="font-semibold text-sm">Total de Usos (Recentes)</span>
                      </div>
                      <span className="text-3xl font-extrabold text-white">{totalLogs}</span>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-2 text-neutral-400">
                        <Users className="w-5 h-5" />
                        <span className="font-semibold text-sm">Usuários Ativos (Recentes)</span>
                      </div>
                      <span className="text-3xl font-extrabold text-white">{Object.keys(userStats).length}</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-2 text-neutral-400">
                        <Zap className="w-5 h-5" />
                        <span className="font-semibold text-sm">Funcionalidade Favorita</span>
                      </div>
                      <span className="text-2xl font-bold text-indigo-400">
                        {Object.entries(featureStats).sort((a: [string, any], b: [string, any]) => b[1] - a[1])[0]?.[0] ? getFeatureName(Object.entries(featureStats).sort((a: [string, any], b: [string, any]) => b[1] - a[1])[0][0]) : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Usuários */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Key className="w-4 h-4 text-emerald-400"/> Top Usuários Gastões</h3>
                      <div className="space-y-3">
                        {Object.entries(userStats).sort((a: [string, any], b: [string, any]) => b[1] - a[1]).slice(0, 5).map(([uid, count]: [string, any], index) => {
                          const userEmail = users.find(u => u.id === uid)?.email || uid;
                          return (
                            <div key={uid} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                              <div className="truncate flex-1 pr-4">
                                <span className="text-xs text-neutral-500 block truncate" title={uid}>ID: {uid}</span>
                                <span className="text-sm font-semibold text-neutral-200 truncate">{userEmail}</span>
                              </div>
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg shrink-0">{count} requisições</span>
                            </div>
                          );
                        })}
                        {Object.keys(userStats).length === 0 && <p className="text-sm text-neutral-500">Nenhum uso registrado ainda.</p>}
                      </div>
                    </div>

                    {/* Logs Recentes */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-rose-400"/> Acessos em Tempo Real</h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                        {logs.map((log) => {
                           const userEmail = users.find(u => u.id === log.user_id)?.email || log.user_id;
                           return (
                            <div key={log.id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                              <div className="truncate flex-1 pr-2">
                                <span className="text-sm font-bold text-indigo-300 block">{getFeatureName(log.feature)}</span>
                                <span className="text-xs text-neutral-500 truncate block">{userEmail}</span>
                              </div>
                              <span className="text-xs text-neutral-400 bg-white/5 px-2 py-1 rounded-md shrink-0">
                                {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                          );
                        })}
                        {logs.length === 0 && <p className="text-sm text-neutral-500">Nenhum uso registrado ainda.</p>}
                      </div>
                    </div>
                  </div>
                </>
              )
            )}

            {activeTab === 'users' && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                 <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400"/> Gerenciamento de Assinaturas</h3>
                 <p className="text-sm text-neutral-400 mb-6">Aqui você pode alterar manualmente os clientes do plano <strong>Free</strong> (com limite de IA) para o plano <strong>Premium</strong> (Ilimitado).</p>
                 
                 <div className="space-y-3">
                   {users.length === 0 && !loading ? (
                      <p className="text-sm text-neutral-500">Nenhum usuário encontrado. Certifique-se de que a função SQL foi criada no Supabase.</p>
                   ) : (
                     users.map(u => (
                       <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 gap-4">
                         <div className="truncate flex-1">
                           <span className="text-xs text-neutral-500 block truncate mb-1">ID: {u.id}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-base font-bold text-white truncate">{u.email}</span>
                             {u.role === 'admin' && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Dono</span>}
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-4 shrink-0">
                           <div className="flex flex-col items-end">
                             <span className="text-xs text-neutral-500 mb-1 uppercase tracking-wider font-semibold">Plano Atual</span>
                             {u.plan_type === 'premium' ? (
                               <span className="flex items-center gap-1.5 text-sm font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                                 <Crown className="w-4 h-4" /> Premium
                               </span>
                             ) : (
                               <span className="flex items-center gap-1.5 text-sm font-bold text-neutral-400 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                                 <Ban className="w-4 h-4" /> Free
                               </span>
                             )}
                           </div>
                           
                           {u.role !== 'admin' && (
                             <button 
                               onClick={() => handleTogglePlan(u.id, u.plan_type)}
                               disabled={isUpdating === u.id}
                               className={`h-10 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center min-w-[120px] ${
                                 u.plan_type === 'premium' 
                                 ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20' 
                                 : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                               }`}
                             >
                               {isUpdating === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (u.plan_type === 'premium' ? 'Rebaixar p/ Free' : 'Promover a Premium')}
                             </button>
                           )}
                         </div>
                       </div>
                     ))
                   )}
                 </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
