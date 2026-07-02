"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, TrendingUp, TrendingDown, Calendar, Wallet, ChevronDown } from "lucide-react";
import { supabase } from "../lib/supabase";

export function TransactionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Variáveis");
  const [date, setDate] = useState("");
  
  const [isInstallment, setIsInstallment] = useState(false);
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [installments, setInstallments] = useState(1);
  const [isSplit, setIsSplit] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      fetchCategories();
    }
  }, [isOpen]);

  async function fetchCategories() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('categories').select('*').eq('user_id', session.user.id).order('name');
    if (data) setCustomCategories(data);
  }



  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    setCategory(newType === 'expense' ? 'Variáveis' : 'Salário');
    if (newType === 'income') {
      setIsInstallment(false);
      setIsSplit(false);
      setIsPaid(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !amount) {
      return alert("Por favor, preencha o título e o valor.");
    }


    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      const baseAmount = parseFloat(amount.replace(',', '.'));
      
      const transactionsToInsert = [];
      const installmentGroup = isInstallment && installments > 1 ? crypto.randomUUID() : null;

      const startDate = new Date(date);
      // Ajusta timezone offset para evitar bug de data
      startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());

      let loopCount = isInstallment && type === 'expense' ? installments : 1;
      let amountPerInstallment = baseAmount;
      if (isSplit && type === 'expense') amountPerInstallment = amountPerInstallment / 2;

      for (let i = 0; i < loopCount; i++) {
        const currentInstallmentDate = new Date(startDate);
        currentInstallmentDate.setMonth(currentInstallmentDate.getMonth() + i);
        
        let finalTitle = isInstallment ? `${title} (${i+1}/${installments})` : title;
        if (isSplit && type === 'expense') finalTitle = `${finalTitle} 👩‍❤️‍👨`;
        
        transactionsToInsert.push({
          title: finalTitle,
          amount: amountPerInstallment,
          type: type,
          category: category,
          date: currentInstallmentDate.toISOString().split('T')[0],
          installment_group: installmentGroup,
          installment_info: isInstallment ? `${i+1}/${installments}` : null,
          is_split: isSplit && type === 'expense',
          is_paid: isPaid,
          user_id: userId
        });
      }

      const { error } = await supabase.from('transactions').insert(transactionsToInsert);

      if (error) throw error;

      alert("🎉 Lançamento salvo com sucesso no banco de dados!");
      
      setTitle("");
      setAmount("");
      setIsInstallment(false);
      setInstallments(1);
      setIsSplit(false);
      setIsPaid(true);
      
      onClose();
      window.location.reload(); 
      
    } catch (error: any) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-bold text-white">Novo Lançamento</h2>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
              
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 shrink-0">
                <button type="button" onClick={() => handleTypeChange('expense')} className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-neutral-400 hover:text-white'}`}>
                  <TrendingDown className="w-4 h-4" /> Despesa
                </button>
                <button type="button" onClick={() => handleTypeChange('income')} className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-neutral-400 hover:text-white'}`}>
                  <TrendingUp className="w-4 h-4" /> Receita
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">{isInstallment ? "Valor da Parcela" : "Valor Total"}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">R$</span>
                  <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Título</label>
                <input type="text" placeholder="Ex: Conta de Luz, Supermercado..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>

              <div className="flex gap-4">

                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Categoria</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer">
                    {type === 'expense' ? (
                    <>
                      <option value="Variáveis">Variáveis</option>
                      <option value="Contas Fixas">Contas Fixas</option>
                      <option value="Cartões">Cartões de Crédito</option>
                      {customCategories.filter(c => c.type === 'expense').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </>
                  ) : (
                    <>
                      <option value="Salário">Salário</option>
                      <option value="Investimentos">Investimentos</option>
                      <option value="Outros">Outros</option>
                      {customCategories.filter(c => c.type === 'income').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </>
                  )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                </div>
              </div>

              {type === 'expense' && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} className="w-5 h-5 rounded border-white/20 bg-black/20 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-neutral-900" />
                    <span className="text-white font-medium">Compra Parcelada?</span>
                  </label>
                  
                  {isInstallment && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-3">
                      <span className="text-neutral-400 text-sm">Em</span>
                      <input type="number" min="2" max="48" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))} className="w-20 bg-black/20 border border-white/10 rounded-lg p-2 text-center text-white focus:outline-none focus:border-indigo-500" />
                      <span className="text-neutral-400 text-sm">vezes</span>
                    </motion.div>
                  )}

                  <div className="h-px bg-white/10 w-full"></div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={isSplit} onChange={(e) => setIsSplit(e.target.checked)} className="w-5 h-5 rounded border-white/20 bg-black/20 text-pink-500 focus:ring-pink-500 focus:ring-offset-neutral-900" />
                    <div>
                      <span className="text-white font-medium block">Dividir com Parceiro(a)?</span>
                      <span className="text-neutral-500 text-xs">A despesa será cortada pela metade (50/50).</span>
                    </div>
                  </label>

                  <div className="h-px bg-white/10 w-full"></div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="w-5 h-5 rounded border-white/20 bg-black/20 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-900" />
                    <div>
                      <span className="text-white font-medium block">Já foi pago?</span>
                      <span className="text-neutral-500 text-xs">Desmarque se for uma conta para o futuro.</span>
                    </div>
                  </label>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex justify-center items-center shrink-0">
                {isLoading ? "Salvando..." : "Salvar Lançamento"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
