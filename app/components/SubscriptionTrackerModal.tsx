"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Search, AlertTriangle, ShieldAlert, CreditCard, Sparkles, TrendingDown } from "lucide-react";

export function SubscriptionTrackerModal({ isOpen, onClose, transactions }: { isOpen: boolean, onClose: () => void, transactions: any[] }) {
  if (!isOpen) return null;

  // O algoritmo que vasculha nomes
  const keywords = ['netflix', 'spotify', 'amazon', 'prime', 'academia', 'gympass', 'smartfit', 'internet', 'claro', 'vivo', 'tim', 'youtube', 'hbo', 'disney', 'apple', 'icloud', 'xbox', 'playstation', 'oi', 'banda larga', 'wifi'];
  const essentialKeywords = ['agua', 'água', 'luz', 'energia', 'iptu', 'ipva', 'aluguel', 'condominio', 'condomínio', 'gás', 'gas', 'cref', 'imposto', 'escola', 'faculdade', 'investimento', 'nexa', 'poupança', 'aporte', 'cdb', 'selic'];
  
  // Pegamos as transações que são despesas
  const recentTx = transactions.filter(t => t.type === 'expense');

  // Filtramos aquelas que parecem assinaturas (excluindo as essenciais e investimentos)
  const subscriptions = recentTx.filter(t => {
    if (t.category === 'Investimentos') return false;
    
    const titleLower = t.title.toLowerCase();
    if (essentialKeywords.some(k => titleLower.includes(k))) return false;
    
    return keywords.some(k => titleLower.includes(k)) || t.category === 'Contas Fixas';
  });

  // Para não duplicar se você pagou dois meses seguidos, vamos agrupar pelo nome
  const uniqueSubscriptions = Array.from(new Map(subscriptions.map(item => [item.title.toLowerCase(), item])).values());

  const totalMonthly = uniqueSubscriptions.reduce((acc, t) => acc + t.amount, 0);
  const totalYearly = totalMonthly * 12;

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
          {/* Fundo brilhante estilo Raio-X */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-rose-400" />
                Caçador de Assinaturas
              </h2>
              <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-neutral-400 mb-6">
              Nossa IA vasculhou seus gastos e encontrou estes &quot;vazamentos&quot; de dinheiro silenciosos. Veja o impacto:
            </p>

            <div className="mb-6 bg-black/30 rounded-2xl p-4 border border-rose-500/20 relative z-10 overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-neutral-400 font-medium text-sm">Gasto Mensal Fixo</span>
                <span className="text-white font-bold">{formatMoney(totalMonthly)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Impacto Anual (12x)
                </span>
                <span className="text-rose-400 font-bold text-xl">{formatMoney(totalYearly)}</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {uniqueSubscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldAlert className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">Nenhuma assinatura detectada. Seu dinheiro está seguro!</p>
                </div>
              ) : (
                uniqueSubscriptions.map((sub, idx) => {
                  const yearly = sub.amount * 12;
                  const titleLower = sub.title.toLowerCase();
                  const isEssential = ['agua', 'água', 'luz', 'energia', 'iptu', 'ipva', 'aluguel', 'condominio', 'condomínio', 'gás', 'gas', 'cref', 'imposto', 'escola', 'faculdade', 'investimento', 'nexa', 'poupança', 'aporte', 'cdb', 'selic'].some(k => titleLower.includes(k));
                  const isTelecom = ['tim', 'vivo', 'claro', 'oi', 'internet', 'wifi', 'banda larga'].some(k => titleLower.includes(k));

                  // Mostrar sugestão apenas se não for essencial e for maior que 40
                  const showSuggestion = sub.amount > 40 && !isEssential;
                  const suggestionText = isTelecom ? "Sugestão: Renegociar Plano?" : "Sugestão: Cancelar?";

                  return (
                    <div key={idx} className="flex flex-col p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-rose-400" />
                          </div>
                          <span className="text-white font-medium">{sub.title}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-sm">{formatMoney(sub.amount)}<span className="text-neutral-500 text-xs font-normal">/mês</span></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pl-11">
                        <span className="text-rose-400/80 text-xs font-medium bg-rose-500/10 px-2 py-0.5 rounded-md">
                          Custa {formatMoney(yearly)} ao ano
                        </span>
                        
                        {showSuggestion && (
                          <span className="text-xs text-orange-400 flex items-center gap-1 cursor-pointer hover:underline">
                            <TrendingDown className="w-3 h-3" /> {suggestionText}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
               <p className="text-xs text-neutral-400 text-center flex items-center justify-center gap-1">
                 <Sparkles className="w-3 h-3 text-indigo-400" /> 
                 Reveja essas assinaturas. A maioria não usamos o suficiente para justificar o custo anual.
               </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
