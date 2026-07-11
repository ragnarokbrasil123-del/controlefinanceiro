"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Target, Sparkles, Loader2, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

const CATEGORIES = ["Contas Fixas", "Variáveis", "Investimentos"];

export function BudgetModal({ isOpen, onClose, transactions, currentIncome, activeMonth }: { isOpen: boolean, onClose: () => void, transactions: any[], currentIncome: number, activeMonth: number }) {
  const [budgets, setBudgets] = useState<Record<string, number>>({
    "Contas Fixas": 0,
    "Variáveis": 0,
    "Investimentos": 0,
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBudgets();
    }
  }, [isOpen]);

  const fetchBudgets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    let query = supabase.from('budgets').select('*');
    if (session) query = query.eq('user_id', session.user.id);

    const { data, error } = await query;
    if (data && data.length > 0) {
      const bMap: Record<string, number> = {};
      data.forEach(b => {
        bMap[b.category] = b.amount;
      });
      setBudgets(prev => ({ ...prev, ...bMap }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      // Delete existing budgets for this user (or just generic ones if no user)
      if (userId) {
        await supabase.from('budgets').delete().eq('user_id', userId);
      } else {
        await supabase.from('budgets').delete().is('user_id', null);
      }

      const inserts = Object.keys(budgets).map(cat => ({
        user_id: userId,
        category: cat,
        amount: budgets[cat] || 0,
      }));

      const response = await supabase.from('budgets').insert(inserts);
      if (response.error) throw response.error;
      alert("Orçamentos salvos com sucesso!");
      onClose();
    } catch (err: any) {
      alert("Erro ao salvar orçamentos: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiSuggest = async () => {
    if (currentIncome <= 0) return alert("Adicione alguma receita neste mês para a IA ter uma base!");
    setIsAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch("/api/auto-budget", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ income: currentIncome })
      });
      
      const data = await res.json();
      if (data.error) {
        if (data.error === "PAYWALL_LIMIT_REACHED") {
           window.dispatchEvent(new CustomEvent('openModal', { detail: 'paywall' }));
           onClose();
           return;
        }
        throw new Error(data.error);
      }

      setBudgets(prev => ({
        ...prev,
        "Contas Fixas": data["Contas Fixas"] || prev["Contas Fixas"],
        "Variáveis": data["Variáveis"] || prev["Variáveis"],
        "Investimentos": data["Investimentos"] || prev["Investimentos"],
      }));

    } catch (err: any) {
      alert("Erro da IA: " + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const getSpentAmount = (cat: string) => {
    return transactions.filter(t => {
      if (t.type !== 'expense') return false;
      // Tratar Investimentos como despesa no contexto de "onde foi o dinheiro"
      if (cat === 'Investimentos' && t.category !== 'Investimentos') return false;
      if (cat !== 'Investimentos' && t.category !== cat) return false;
      
      if (!t.date) return false;
      const [year, month] = t.date.split('-');
      return (parseInt(month) - 1) === activeMonth;
    }).reduce((acc, t) => acc + t.amount, 0);
  };

  const formatMoney = (v: number) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-pink-400" /> Orçamentos (Tetos)
              </h2>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-4 flex flex-col gap-5">
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                <h3 className="text-white font-bold mb-2 flex items-center gap-2 relative z-10"><Sparkles className="w-4 h-4 text-purple-400" /> Auto-Orçamento IA</h3>
                <p className="text-sm text-neutral-400 mb-4 relative z-10">Deixe o Gemini analisar sua renda de <strong className="text-white">{formatMoney(currentIncome)}</strong> e sugerir tetos saudáveis usando a regra 50/30/20.</p>
                <button onClick={handleAiSuggest} disabled={isAiLoading} className="w-full relative z-10 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isAiLoading ? "Pensando..." : "Sugerir com IA"}
                </button>
              </div>

              <div className="space-y-4">
                {CATEGORIES.map(cat => {
                  const limit = budgets[cat] || 0;
                  const spent = getSpentAmount(cat);
                  const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
                  
                  let barColor = "bg-emerald-500";
                  if (percent > 75) barColor = "bg-yellow-500";
                  if (percent >= 100) barColor = "bg-rose-500";

                  return (
                    <div key={cat} className="bg-black/20 border border-white/5 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-white">{cat}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500">Teto: R$</span>
                          <input 
                            type="number" 
                            value={budgets[cat] || ""} 
                            onChange={(e) => setBudgets(p => ({ ...p, [cat]: Number(e.target.value) }))}
                            className="w-24 bg-white/5 border border-white/10 rounded-lg p-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 text-right font-medium"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/5 mb-2">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={`h-full ${barColor}`}></motion.div>
                      </div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-neutral-400">Gasto: {formatMoney(spent)}</span>
                        <span className={percent >= 100 ? "text-rose-400" : "text-neutral-500"}>{percent.toFixed(0)}% do limite</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 shrink-0">
              <button onClick={handleSave} disabled={isSaving} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Orçamentos
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
