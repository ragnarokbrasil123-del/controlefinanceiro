"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, TrendingUp, TrendingDown, Calendar, Save, Loader2, ChevronDown } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "./Toast";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: string;
  date: string;
}

export function EditTransactionModal({ 
  isOpen, 
  onClose, 
  transaction,
  onSave
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  transaction: Transaction | null;
  onSave?: () => void;
}) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Variáveis");
  const [date, setDate] = useState("");
  
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      setTitle(transaction.title);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setType(transaction.type as 'expense' | 'income');
      // Format date correctly
      setDate(transaction.date.split('T')[0]);
      fetchCategories();
    }
  }, [isOpen, transaction]);

  async function fetchCategories() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('categories').select('*').eq('user_id', session.user.id).order('name');
    if (data) setCustomCategories(data);
  }

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    if (newType === 'income' && category !== 'Salário' && category !== 'Investimentos') {
      setCategory('Salário');
    } else if (newType === 'expense' && category === 'Salário') {
      setCategory('Variáveis');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !amount || !transaction) {
      toast("Por favor, preencha todos os campos obrigatórios.", "warning");
      return;
    }

    setIsLoading(true);

    try {
      const baseAmount = parseFloat(amount.replace(',', '.'));
      
      const { error } = await supabase.from('transactions').update({
        title,
        amount: baseAmount,
        type,
        category,
        date
      }).eq('id', transaction.id);

      if (error) throw error;

      toast("🎉 Lançamento atualizado com sucesso!", "success");
      onClose();
      if (onSave) onSave();
      
    } catch (error: any) {
      console.error(error);
      toast("Erro ao salvar alterações: " + error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-neutral-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-bold text-white">Editar Lançamento</h2>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-2">
              
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 shrink-0">
                <button type="button" onClick={() => handleTypeChange('expense')} className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-neutral-400 hover:text-white'}`}>
                  <TrendingDown className="w-4 h-4" /> Despesa
                </button>
                <button type="button" onClick={() => handleTypeChange('income')} className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-neutral-400 hover:text-white'}`}>
                  <TrendingUp className="w-4 h-4" /> Receita
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Valor Total</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">R$</span>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Título do Lançamento</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5">Categoria</label>
                  <div className="relative">
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer">
                      {type === 'expense' ? (
                      <>
                        <option value="Variáveis">Variáveis</option>
                        <option value="Contas Fixas">Contas Fixas</option>
                        <option value="Cartões">Cartões</option>
                        <option value="Investimentos">Investimentos</option>
                        {customCategories.filter(c => c.type === 'expense').map(c => (
                           <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </>
                    ) : (
                      <>
                        <option value="Salário">Salário</option>
                        <option value="Investimentos">Investimentos</option>
                        <option value="Vendas">Vendas</option>
                        <option value="Outros">Outros</option>
                        {customCategories.filter(c => c.type === 'income').map(c => (
                           <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                        </>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <button type="submit" disabled={isLoading} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
