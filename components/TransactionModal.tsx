"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, TrendingUp, TrendingDown, Calendar, Wallet, ChevronDown } from "lucide-react";
import { supabase } from "../lib/supabase";
import { saveOfflineTransaction } from "../lib/offlineSync";

export function TransactionModal({ isOpen, onClose, initialType = 'expense', isCouple = false, coupleId }: { isOpen: boolean, onClose: () => void, initialType?: 'expense' | 'income', isCouple?: boolean, coupleId?: string }) {
  const [type, setType] = useState<'expense' | 'income'>(initialType);
  
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(initialType === 'expense' ? 'Variáveis' : 'Salário');
  const [date, setDate] = useState("");
  
  const [isInstallment, setIsInstallment] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [installments, setInstallments] = useState(1);
  const [isSplit, setIsSplit] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletId, setWalletId] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setCategory(initialType === 'expense' ? 'Variáveis' : 'Salário');
      setDate(new Date().toISOString().split('T')[0]);
      fetchData();
    }
  }, [isOpen, initialType]);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const [catRes, walRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', session.user.id).order('name'),
      supabase.from('wallets').select('*').eq('user_id', session.user.id).order('name')
    ]);
    
    if (catRes.data) setCustomCategories(catRes.data);
    if (walRes.data && walRes.data.length > 0) {
      setWallets(walRes.data);
      setWalletId(walRes.data[0].id);
    }
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
      
      let receiptUrl = null;
      if (receiptFile && userId) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
        if (!uploadError && data) {
          const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(data.path);
          receiptUrl = publicUrlData.publicUrl;
        }
      }

      const transactionsToInsert = [];
      const installmentGroup = isInstallment && installments > 1 ? crypto.randomUUID() : null;

      const startDate = new Date(date);
      // Ajusta timezone offset para evitar bug de data
      startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());

      let loopCount = (isInstallment || isRecurring) && type === 'expense' ? installments : 1;
      let amountPerInstallment = baseAmount;
      
      if (isInstallment && type === 'expense' && installments > 0) {
        amountPerInstallment = baseAmount / installments;
      }
      
      if (isSplit && type === 'expense') amountPerInstallment = amountPerInstallment / 2;

      for (let i = 0; i < loopCount; i++) {
        const currentInstallmentDate = new Date(startDate);
        currentInstallmentDate.setMonth(currentInstallmentDate.getMonth() + i);
        
        let finalTitle = title;
        if (isInstallment) finalTitle = `${title} (${i+1}/${installments})`;
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
          is_paid: i === 0 ? isPaid : false,
          user_id: userId,
          wallet_id: walletId || null,
          receipt_url: receiptUrl,
          couple_id: isCouple ? coupleId : null
        });
      }

      if (!navigator.onLine) {
        transactionsToInsert.forEach(t => saveOfflineTransaction(t));
        alert("Você está offline! 📶 O lançamento foi salvo no seu celular e será enviado quando a internet voltar.");
      } else {
        const { error } = await supabase.from('transactions').insert(transactionsToInsert);
        if (error) throw error;
        alert("🎉 Lançamento salvo com sucesso no banco de dados!");
      }
      
      setTitle("");
      setAmount("");
      setIsInstallment(false);
      setIsRecurring(false);
      setInstallments(1);
      setIsSplit(false);
      setIsPaid(true);
      setReceiptFile(null);
      setDate(new Date().toISOString().split('T')[0]);
      
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
              <h2 className="text-xl font-bold text-white">
                {type === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
              </h2>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
              
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">{isInstallment ? "Valor Total da Compra" : "Valor"}</label>
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

              <div className="flex gap-4">
                <div className="flex-1">
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

                {wallets.length > 0 && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">Carteira</label>
                    <div className="relative">
                      <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer">
                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Comprovante (Opcional)</label>
                <input type="file" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30 transition-colors cursor-pointer" />
              </div>

              {type === 'expense' && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={isInstallment} onChange={(e) => { setIsInstallment(e.target.checked); setIsRecurring(false); }} className="w-5 h-5 rounded border-white/20 bg-black/20 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-neutral-900" />
                    <span className="text-white font-medium">Compra Parcelada?</span>
                  </label>
                  
                  {isInstallment && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-3">
                      <span className="text-neutral-400 text-sm">Em</span>
                      <input type="number" min="2" max="48" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))} className="w-20 bg-black/20 border border-white/10 rounded-lg p-2 text-center text-white focus:outline-none focus:border-indigo-500" />
                      <span className="text-neutral-400 text-sm">vezes</span>
                    </motion.div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={isRecurring} onChange={(e) => { setIsRecurring(e.target.checked); setIsInstallment(false); }} className="w-5 h-5 rounded border-white/20 bg-black/20 text-rose-500 focus:ring-rose-500 focus:ring-offset-neutral-900" />
                    <span className="text-white font-medium">Conta Mensal Fixa (Repetir)?</span>
                  </label>
                  
                  {isRecurring && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-3">
                      <span className="text-neutral-400 text-sm">Repetir por</span>
                      <input type="number" min="2" max="48" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))} className="w-20 bg-black/20 border border-white/10 rounded-lg p-2 text-center text-white focus:outline-none focus:border-indigo-500" />
                      <span className="text-neutral-400 text-sm">meses</span>
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
