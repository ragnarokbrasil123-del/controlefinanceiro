"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Target, PiggyBank, ShieldCheck, Zap, Home as HomeIcon, Coins, Sparkles, Loader2, Bot } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { supabase } from "../lib/supabase";

export function FinancialPlannerModal({ isOpen, onClose, currentIncome, currentExpense, balance, transactions }: { isOpen: boolean, onClose: () => void, currentIncome: number, currentExpense: number, balance: number, transactions: any[] }) {
  const [activeTab, setActiveTab] = useState<'calculator' | 'advisor'>('calculator');
  const [salary, setSalary] = useState(currentIncome > 0 ? currentIncome.toString() : "3000");
  const [strategy, setStrategy] = useState('50_30_20');
  
  const [advice, setAdvice] = useState("");
  const [isFetchingAdvice, setIsFetchingAdvice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentIncome > 0) {
      setSalary(currentIncome.toString());
    }
  }, [isOpen, currentIncome]);

  if (!isOpen) return null;

  const strategies = [
    { id: '50_30_20', name: 'Equilibrado (50/30/20)', fixed: 0.5, var: 0.3, save: 0.2 },
    { id: '40_20_40', name: 'Agressivo / FIRE (40/20/40)', fixed: 0.4, var: 0.2, save: 0.4 },
    { id: '80_20', name: 'Simplista (80/20)', fixed: 0.8, var: 0.0, save: 0.2 },
  ];
  
  const currentStrategy = strategies.find(s => s.id === strategy) || strategies[0];

  const numSalary = parseFloat(salary) || 0;
  const fixedExpenses = numSalary * currentStrategy.fixed;
  const variableExpenses = numSalary * currentStrategy.var;
  const savePerMonth = numSalary * currentStrategy.save;
  const emergencyFund = numSalary * 6;
  const independence = numSalary * 92;

  const formatMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fetchAdvice = async () => {
    if (advice) return; // já tem conselho
    setIsFetchingAdvice(true);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income: currentIncome,
          expense: currentExpense,
          balance: balance,
          transactions: transactions,
          strategy: currentStrategy.name
        })
      });
      const data = await res.json();
      if (data.advice) {
        setAdvice(data.advice);
      } else {
        setAdvice("Ocorreu um erro ao gerar seu conselho.");
      }
    } catch (err) {
      setAdvice("Não foi possível conectar com a IA no momento.");
    } finally {
      setIsFetchingAdvice(false);
    }
  };

  const handleTabChange = (tab: 'calculator' | 'advisor') => {
    setActiveTab(tab);
    if (tab === 'advisor') fetchAdvice();
  };

  const handleSaveSalary = async () => {
    if (!salary || parseFloat(salary) <= 0) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.from('transactions').insert([{
        user_id: session.user.id,
        title: "Salário Principal",
        amount: parseFloat(salary),
        category: "Salário",
        type: "income",
        date: new Date().toISOString()
      }]);
      if (error) throw error;
      alert("Salário salvo com sucesso como Receita deste mês!");
      window.location.reload();
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" /> Planejador Ideal
              </h2>
              <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 shrink-0 mb-6">
              <button onClick={() => handleTabChange('calculator')} className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'calculator' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-neutral-400 hover:text-white'}`}>
                <Target className="w-4 h-4" /> Calculadora 50/30/20
              </button>
              <button onClick={() => handleTabChange('advisor')} className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'advisor' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-neutral-400 hover:text-white'}`}>
                <Bot className="w-4 h-4" /> Conselheiro IA
              </button>
            </div>

            <div className="overflow-y-auto pr-2 pb-4 flex-1">
              {activeTab === 'calculator' ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Simulador de Salário / Renda Principal (R$)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-neutral-500 font-medium">R$</span></div>
                        <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-all text-lg font-semibold" placeholder="3000" />
                      </div>
                      <button onClick={handleSaveSalary} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center whitespace-nowrap active:scale-95 shadow-lg shadow-emerald-500/20">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Receita"}
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 flex flex-col gap-2">
                    <label className="block text-sm font-medium text-neutral-400">Perfil Financeiro (Estratégia)</label>
                    <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto scrollbar-hide">
                      {strategies.map(s => (
                        <button key={s.id} onClick={() => setStrategy(s.id)} className={`flex-1 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${strategy === s.id ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {strategy === '80_20' ? (
                      <>
                        <PlannerRow icon={<HomeIcon className="w-4 h-4 text-blue-400" />} title="Custo de Vida (80%)" desc="Tudo misturado: contas fixas e lazer." amount={formatMoney(fixedExpenses)} bg="bg-blue-500/10 border-blue-500/20" />
                        <PlannerRow icon={<PiggyBank className="w-4 h-4 text-emerald-400" />} title="Guardar no Mês (20%)" desc="O seu pagamento para o seu futuro." amount={formatMoney(savePerMonth)} bg="bg-emerald-500/10 border-emerald-500/20" />
                      </>
                    ) : (
                      <>
                        <PlannerRow icon={<HomeIcon className="w-4 h-4 text-blue-400" />} title={`Despesas Fixas (${currentStrategy.fixed * 100}%)`} desc="Aluguel, contas, sobrevivência." amount={formatMoney(fixedExpenses)} bg="bg-blue-500/10 border-blue-500/20" />
                        <PlannerRow icon={<Zap className="w-4 h-4 text-amber-400" />} title={`Passar o Mês (${currentStrategy.var * 100}%)`} desc="Lazer, saídas, gastos variáveis." amount={formatMoney(variableExpenses)} bg="bg-amber-500/10 border-amber-500/20" />
                        <PlannerRow icon={<PiggyBank className="w-4 h-4 text-emerald-400" />} title={`Guardar no Mês (${currentStrategy.save * 100}%)`} desc="O seu pagamento para o seu futuro." amount={formatMoney(savePerMonth)} bg="bg-emerald-500/10 border-emerald-500/20" />
                      </>
                    )}
                    
                    <div className="h-px bg-white/10 my-2"></div>

                    <PlannerRow icon={<ShieldCheck className="w-4 h-4 text-teal-400" />} title="Reserva de Emergência" desc="Sua paz mental (6 meses guardados)." amount={formatMoney(emergencyFund)} bg="bg-teal-500/10 border-teal-500/20" />
                    <PlannerRow icon={<Coins className="w-4 h-4 text-yellow-400" />} title="Independência Financeira" desc="Total investido para render 1 salário/mês." amount={formatMoney(independence)} bg="bg-yellow-500/10 border-yellow-500/20" highlight={true} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full">
                  {isFetchingAdvice ? (
                    <div className="flex flex-col items-center justify-center py-10 flex-1">
                      <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                      <p className="text-neutral-400 font-medium">A IA está analisando suas finanças...</p>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-p:text-neutral-300 prose-li:text-neutral-300 prose-strong:text-purple-400 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm">
                      <ReactMarkdown>{advice}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function PlannerRow({ icon, title, desc, amount, bg, highlight = false }: any) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-2xl border ${bg} ${highlight ? 'shadow-[0_0_15px_rgba(234,179,8,0.15)]' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center">{icon}</div>
        <div>
          <h4 className={`font-semibold text-sm ${highlight ? 'text-yellow-400' : 'text-white'}`}>{title}</h4>
          <p className="text-xs text-neutral-400">{desc}</p>
        </div>
      </div>
      <div className={`font-bold ${highlight ? 'text-lg text-yellow-400' : 'text-white'}`}>{amount}</div>
    </div>
  );
}
