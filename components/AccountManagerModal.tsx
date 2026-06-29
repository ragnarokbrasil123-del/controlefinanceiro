"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, CreditCard, Building, Wallet, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AccountManagerModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState('checking');
  const [balance, setBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  async function fetchAccounts() {
    const { data: { session } } = await supabase.auth.getSession();
    
    let query = supabase.from('accounts').select('*').order('created_at', { ascending: false });
    if (session) {
      query = query.eq('user_id', session.user.id);
    }
    
    const { data } = await query;
    if (data) setAccounts(data);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Digite o nome da conta");

    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    try {
      const { error } = await supabase.from('accounts').insert([{
        name,
        type,
        balance: parseFloat(balance.replace(',', '.') || '0'),
        user_id: session?.user?.id || null
      }]);
      
      if (error) throw error;
      
      setName("");
      setBalance("");
      setIsCreating(false);
      fetchAccounts();
      
    } catch (err: any) {
      alert("Erro ao criar conta: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Deseja mesmo excluir esta conta?")) return;
    await supabase.from('accounts').delete().eq('id', id);
    fetchAccounts();
  };

  const getIcon = (t: string) => {
    if (t === 'credit') return <CreditCard className="w-5 h-5 text-purple-400" />;
    if (t === 'savings') return <Building className="w-5 h-5 text-emerald-400" />;
    return <Wallet className="w-5 h-5 text-indigo-400" />;
  };

  const getTypeLabel = (t: string) => {
    if (t === 'credit') return 'Cartão de Crédito';
    if (t === 'savings') return 'Poupança';
    return 'Conta Corrente';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-bold text-white">Minhas Contas</h2>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isCreating && (
              <div className="overflow-y-auto pr-2 pb-4 space-y-3 flex-1">
                {accounts.length === 0 ? (
                  <p className="text-center text-neutral-500 py-8">Nenhuma conta cadastrada.</p>
                ) : (
                  accounts.map(acc => (
                    <div key={acc.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                          {getIcon(acc.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{acc.name}</h3>
                          <p className="text-xs text-neutral-400">{getTypeLabel(acc.type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-white">R$ {acc.balance.toFixed(2).replace('.', ',')}</span>
                        <button onClick={() => handleDelete(acc.id)} className="text-neutral-500 hover:text-rose-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                
                <button onClick={() => setIsCreating(true)} className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed text-neutral-300 font-medium py-4 rounded-2xl transition-colors flex justify-center items-center gap-2">
                  <Plus className="w-5 h-5" /> Nova Conta
                </button>
              </div>
            )}

            {isCreating && (
              <form onSubmit={handleCreate} className="flex flex-col gap-4 overflow-y-auto pr-2 pb-4 shrink-0">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5">Tipo de Conta</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500">
                    <option value="checking">Conta Corrente / Dinheiro</option>
                    <option value="savings">Conta Poupança / Investimento</option>
                    <option value="credit">Cartão de Crédito</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5">Nome (Ex: Nubank, Itaú)</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5">Saldo Atual (ou Limite se Cartão)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">R$</span>
                    <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">Cancelar</button>
                  <button type="submit" disabled={isLoading} className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors disabled:opacity-50">
                    {isLoading ? "Salvando..." : "Salvar Conta"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
