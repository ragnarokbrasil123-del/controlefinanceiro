"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, Loader2, Target, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

const CATEGORIES = ["Contas Fixas", "Variáveis", "Investimentos"];

export function BudgetModal({ isOpen, onClose, onSave, transactions, currentIncome, activeMonth }: any) {
  const [budgets, setBudgets] = useState<Record<string, number>>({
    "Contas Fixas": 0,
    "Variáveis": 0,
    "Investimentos": 0
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const strategy = typeof window !== 'undefined' ? localStorage.getItem('nexa_financial_strategy') || '50_30_20' : '50_30_20';
  const strategyLabel = strategy === '40_20_40' ? '40/20/40' : strategy === '80_20' ? '80/20' : '50/30/20';

  useEffect(() => {
    if (isOpen) {
      loadBudgets();
    }
  }, [isOpen]);

  const loadBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('budgets').select('*').eq('user_id', user.id);
      if (error) throw error;
      
      const newBudgets: Record<string, number> = {};
      data?.forEach(b => { newBudgets[b.category] = b.limit_amount; });
      setBudgets(prev => ({ ...prev, ...newBudgets }));
    } catch (err) {
      console.error("Erro ao carregar orçamentos:", err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      for (const cat of CATEGORIES) {
        const val = budgets[cat] || 0;
        
        const { data: existing } = await supabase.from('budgets').select('id').eq('user_id', user.id).eq('category', cat).single();

        if (existing) {
          await supabase.from('budgets').update({ limit_amount: val }).eq('id', existing.id);
        } else {
          await supabase.from('budgets').insert([{ user_id: user.id, category: cat, limit_amount: val }]);
        }
      }
      
      onSave(); // atualiza a home
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
        body: JSON.stringify({ income: currentIncome, strategy: strategyLabel })
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
    return transactions.filter((t: any) => {
      if (t.type !== 'expense') return false;
      // Tratar Investimentos como despesa no contexto de "onde foi o dinheiro"
      if (cat === 'Investimentos' && t.category !== 'Investimentos') return false;
      if (cat !== 'Investimentos' && t.category !== cat) return false;
      
      if (!t.date) return false;
      const [year, month] = t.date.split('-');
      return (parseInt(month) - 1) === activeMonth;
    }).reduce((acc: number, t: any) => acc + t.amount, 0);
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
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden group shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                <h3 className="text-white font-bold mb-2 flex items-center gap-2 relative z-10"><Sparkles className="w-4 h-4 text-purple-400" /> Auto-Orçamento IA</h3>
                <p className="text-sm text-neutral-400 mb-4 relative z-10">Deixe o Gemini analisar sua renda de <strong className="text-white">{formatMoney(currentIncome)}</strong> e sugerir tetos saudáveis usando a regra {strategyLabel}.</p>
                <button onClick={handleAiSuggest} disabled={isAiLoading} className="w-full relative z-10 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
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
                    <div key={cat} className="bg-black/20 border border-white/5 p-3 rounded-2xl shrink-0">
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
