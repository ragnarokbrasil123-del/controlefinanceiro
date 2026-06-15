"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Target, PiggyBank, ShieldCheck, Zap, Home as HomeIcon, Coins } from "lucide-react";

export function FinancialPlannerModal({ isOpen, onClose, currentIncome }: { isOpen: boolean, onClose: () => void, currentIncome: number }) {
  const [salary, setSalary] = useState(currentIncome > 0 ? currentIncome.toString() : "3000");

  // Atualiza o simulador se a sua renda do mês mudar
  useEffect(() => {
    if (isOpen && currentIncome > 0) {
      setSalary(currentIncome.toString());
    }
  }, [isOpen, currentIncome]);

  if (!isOpen) return null;

  const numSalary = parseFloat(salary) || 0;

  // ==========================================
  // A MATEMÁTICA DO SUCESSO QUE VOCÊ PEDIU
  // ==========================================
  const fixedExpenses = numSalary / 2;       // Despesas Fixas (50%)
  const variableExpenses = numSalary * 0.3;  // Passar o mês (30%)
  const savePerMonth = numSalary * 0.2;      // Guardar no mês (20%)
  const emergencyFund = numSalary * 6;       // Reserva de Emergência (6x)
  const independence = numSalary * 92;       // Render o próprio salário (92x)

  const formatMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Fundo brilhante para design premium */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Planejador Ideal (50-30-20)
              </h2>
              <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Simulador de Salário / Renda Principal (R$)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-neutral-500 font-medium">R$</span>
                </div>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-lg font-semibold"
                  placeholder="3000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <PlannerRow 
                icon={<HomeIcon className="w-4 h-4 text-blue-400" />}
                title="Despesas Fixas (50%)"
                desc="Aluguel, contas, sobrevivência."
                amount={formatMoney(fixedExpenses)}
                bg="bg-blue-500/10 border-blue-500/20"
              />
              <PlannerRow 
                icon={<Zap className="w-4 h-4 text-amber-400" />}
                title="Passar o Mês (30%)"
                desc="Lazer, saídas, gastos variáveis."
                amount={formatMoney(variableExpenses)}
                bg="bg-amber-500/10 border-amber-500/20"
              />
              <PlannerRow 
                icon={<PiggyBank className="w-4 h-4 text-purple-400" />}
                title="Guardar no Mês (20%)"
                desc="O seu pagamento para o seu futuro."
                amount={formatMoney(savePerMonth)}
                bg="bg-purple-500/10 border-purple-500/20"
              />
              
              <div className="h-px bg-white/10 my-2"></div>

              <PlannerRow 
                icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                title="Reserva de Emergência"
                desc="Sua paz mental (6 meses guardados)."
                amount={formatMoney(emergencyFund)}
                bg="bg-emerald-500/10 border-emerald-500/20"
              />
              <PlannerRow 
                icon={<Coins className="w-4 h-4 text-yellow-400" />}
                title="Independência Financeira"
                desc="Total investido para render 1 salário/mês."
                amount={formatMoney(independence)}
                bg="bg-yellow-500/10 border-yellow-500/20"
                highlight={true}
              />
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
        <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h4 className={`font-semibold text-sm ${highlight ? 'text-yellow-400' : 'text-white'}`}>{title}</h4>
          <p className="text-xs text-neutral-400">{desc}</p>
        </div>
      </div>
      <div className={`font-bold ${highlight ? 'text-lg text-yellow-400' : 'text-white'}`}>
        {amount}
      </div>
    </div>
  );
}
