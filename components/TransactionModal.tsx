"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "../lib/supabase";

export function TransactionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  
  // Estados para capturar os dados do formulário
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Contas Fixas");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Preenche a data com o dia de hoje automaticamente quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Função para mudar o tipo (Receita/Despesa) e ajustar a categoria padrão
  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    setCategory(newType === 'expense' ? 'Contas Fixas' : 'Salário');
  };

  // FUNÇÃO MÁGICA: Envia para o Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita recarregar a página
    
    if (!title || !amount) {
      alert("Por favor, preencha o título e o valor.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            title: title,
            amount: parseFloat(amount.replace(',', '.')), // Converte "10,50" para "10.50"
            type: type,
            category: category,
            date: date
          }
        ]);

      if (error) {
        throw error;
      }

      alert("🎉 Lançamento salvo com sucesso no banco de dados!");
      
      // Limpa os campos para o próximo
      setTitle("");
      setAmount("");
      
      onClose(); // Fecha o modal
      
      // Recarrega a página para a gente ver o dado novo no futuro
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Novo Lançamento</h2>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Botões de Tipo */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-neutral-400 hover:text-white'}`}
                >
                  <TrendingDown className="w-4 h-4" /> Despesa
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-neutral-400 hover:text-white'}`}
                >
                  <TrendingUp className="w-4 h-4" /> Receita
                </button>
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Título</label>
                <input 
                  type="text" 
                  placeholder="Ex: Conta de Luz, Supermercado..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Categoria e Data */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5">Categoria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    {type === 'expense' ? (
                      <>
                        <option value="Contas Fixas">Contas Fixas</option>
                        <option value="Variáveis">Variáveis</option>
                        <option value="Cartões">Cartões de Crédito</option>
                      </>
                    ) : (
                      <>
                        <option value="Salário">Salário</option>
                        <option value="Investimentos">Investimentos</option>
                        <option value="Outros">Outros</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5">Data</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex justify-center items-center"
              >
                {isLoading ? "Salvando..." : "Salvar Lançamento"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
