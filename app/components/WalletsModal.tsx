"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wallet, Trash2, Plus, CreditCard, Building2, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export function WalletsModal({ isOpen, onClose, userId, userPlan }: { isOpen: boolean, onClose: () => void, userId: string, userPlan?: string }) {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletType, setNewWalletType] = useState("bank"); // bank or credit
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadWallets();
    }
  }, [isOpen, userId]);

  const loadWallets = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (!error && data) {
      setWallets(data);
    }
    setLoading(false);
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    
    if (userPlan === 'free' && wallets.length >= 1) {
      window.dispatchEvent(new CustomEvent('openModal', { detail: 'paywall' }));
      onClose();
      return;
    }

    setIsSaving(true);
    
    const { data, error } = await supabase.from('wallets').insert([{
      name: newWalletName,
      type: newWalletType,
      user_id: userId,
      balance: 0
    }]).select();

    if (!error && data) {
      setWallets([...wallets, data[0]]);
      setNewWalletName("");
    } else {
      alert("Erro ao criar carteira: " + (error?.message || 'Desconhecido'));
    }
    setIsSaving(false);
  };

  const handleDeleteWallet = async (id: string) => {
    if (confirm("Tem certeza? Transações ligadas a esta carteira ficarão sem carteira vinculada.")) {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (!error) {
        setWallets(wallets.filter(w => w.id !== id));
      } else {
        alert("Erro ao excluir carteira.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-neutral-900 border border-white/10 shadow-2xl rounded-3xl p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" /> Minhas Carteiras
            </h2>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
          </div>

          <form onSubmit={handleCreateWallet} className="flex gap-2 mb-6">
            <div className="flex-1 flex gap-2 bg-black/20 p-1 border border-white/10 rounded-xl">
              <select value={newWalletType} onChange={(e) => setNewWalletType(e.target.value)} className="bg-transparent text-white text-sm outline-none px-2 border-r border-white/10">
                <option value="bank" className="bg-neutral-900">Conta</option>
                <option value="credit" className="bg-neutral-900">Cartão</option>
              </select>
              <input 
                type="text" 
                value={newWalletName} onChange={e => setNewWalletName(e.target.value)}
                placeholder="Ex: Nubank, Itaú..."
                className="flex-1 bg-transparent text-white placeholder-neutral-500 text-sm focus:outline-none px-2"
                required
              />
            </div>
            <button type="submit" disabled={isSaving || !newWalletName.trim()} className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white p-3 rounded-xl flex items-center justify-center transition-colors">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </form>

          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5">
              <Wallet className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm">Nenhuma carteira criada.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${wallet.type === 'credit' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {wallet.type === 'credit' ? <CreditCard className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{wallet.name}</h3>
                      <p className="text-xs text-neutral-400">{wallet.type === 'credit' ? 'Cartão de Crédito' : 'Conta Bancária'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteWallet(wallet.id)} className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
