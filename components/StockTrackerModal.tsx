"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, TrendingUp, TrendingDown, Plus, Trash2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface StockPosition {
  ticker: string;
  quantity: number;
  averagePrice: number;
}

interface StockData {
  ticker: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  name: string;
  error?: boolean;
}

export function StockTrackerModal({ isOpen, onClose, userId }: { isOpen: boolean, onClose: () => void, userId: string }) {
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [liveData, setLiveData] = useState<Record<string, StockData>>({});
  
  const [newTicker, setNewTicker] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newAvgPrice, setNewAvgPrice] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadAndMigrate = async () => {
      // 1. Fetch from Supabase
      const { data, error } = await supabase.from('stocks').select('*').eq('user_id', userId);
      
      let currentPositions = data ? data.map(d => ({
        ticker: d.ticker,
        quantity: Number(d.quantity),
        averagePrice: Number(d.average_price)
      })) : [];

      // 2. Check local storage for migration
      const saved = localStorage.getItem('@nexa/stocks');
      if (saved) {
        try {
          const localPositions: StockPosition[] = JSON.parse(saved);
          const toMigrate = localPositions.filter(lp => !currentPositions.find(cp => cp.ticker === lp.ticker));
          
          if (toMigrate.length > 0) {
            const inserts = toMigrate.map(p => ({
              user_id: userId,
              ticker: p.ticker,
              quantity: p.quantity,
              average_price: p.averagePrice
            }));
            
            const { error: insertError } = await supabase.from('stocks').insert(inserts);
            if (!insertError) {
              currentPositions = [...currentPositions, ...toMigrate];
            }
          }
          // Remove from local storage after checking/migrating
          localStorage.removeItem('@nexa/stocks');
        } catch (e) {
          console.error("Failed to migrate saved stocks", e);
        }
      }

      setPositions(currentPositions);
    };

    loadAndMigrate();
  }, [isOpen, userId]);

  useEffect(() => {
    if (isOpen && positions.length > 0) {
      fetchQuotes();
    }
  }, [isOpen, positions.length]); // Re-fetch when opened or a new position is added

  const fetchQuotes = async () => {
    if (positions.length === 0) return;
    setIsLoading(true);
    try {
      const tickersToFetch = positions.map(p => p.ticker).join(',');
      const res = await fetch(`/api/stocks?tickers=${tickersToFetch}`);
      const data: StockData[] = await res.json();
      
      const newLiveData: Record<string, StockData> = {};
      data.forEach(item => {
        newLiveData[item.ticker] = item;
      });
      setLiveData(prev => ({ ...prev, ...newLiveData }));
    } catch (error) {
      console.error("Failed to fetch stock quotes", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker || !newQuantity || !newAvgPrice || !userId) return;

    const ticker = newTicker.toUpperCase().trim();
    if (positions.find(p => p.ticker === ticker)) {
      alert("Ação já está na carteira!");
      return;
    }

    setIsLoading(true);
    const newStock = {
      user_id: userId,
      ticker,
      quantity: Number(newQuantity),
      average_price: Number(newAvgPrice)
    };

    const { error } = await supabase.from('stocks').insert([newStock]);
    
    if (!error) {
      setPositions(prev => [...prev, {
        ticker,
        quantity: Number(newQuantity),
        averagePrice: Number(newAvgPrice)
      }]);
      setNewTicker("");
      setNewQuantity("");
      setNewAvgPrice("");
      setIsAdding(false);
    } else {
      alert("Erro ao adicionar ação no banco de dados.");
    }
    setIsLoading(false);
  };

  const handleRemove = async (ticker: string) => {
    if (!userId) return;
    
    const { error } = await supabase.from('stocks').delete().eq('user_id', userId).eq('ticker', ticker);
    
    if (!error) {
      setPositions(prev => prev.filter(p => p.ticker !== ticker));
    } else {
      alert("Erro ao remover ação do banco de dados.");
    }
  };

  const formatMoney = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const totalInvested = positions.reduce((acc, p) => acc + (p.quantity * p.averagePrice), 0);
  const currentTotal = positions.reduce((acc, p) => {
    const currentPrice = liveData[p.ticker]?.price || p.averagePrice;
    return acc + (p.quantity * currentPrice);
  }, 0);

  const totalProfit = currentTotal - totalInvested;
  const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-safe">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full sm:max-w-xl bg-neutral-900 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
          
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Controle de Ações</h2>
              <p className="text-sm text-neutral-400">Acompanhe seus investimentos</p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchQuotes} className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-full transition-colors" title="Atualizar cotações">
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto">
            
            {/* Header Resume */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-white/5 p-5 rounded-2xl mb-6">
              <p className="text-sm text-neutral-400 mb-1">Patrimônio em Ações</p>
              <h3 className="text-3xl font-extrabold text-white mb-4">{formatMoney(currentTotal)}</h3>
              
              <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2">
                <div>
                  <p className="text-xs text-neutral-500">Valor Investido</p>
                  <p className="text-sm font-medium text-neutral-300">{formatMoney(totalInvested)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">Rentabilidade</p>
                  <div className={`flex items-center gap-1 text-sm font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {formatMoney(totalProfit)} ({totalProfitPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Sua Carteira</h3>
              <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>

            {isAdding && (
              <form onSubmit={handleAdd} className="bg-black/20 border border-white/5 p-4 rounded-xl mb-6 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-neutral-400 mb-1 block">Ticker (ex: PETR4)</label>
                    <input type="text" value={newTicker} onChange={e => setNewTicker(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-indigo-500 uppercase" placeholder="PETR4" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 mb-1 block">Quantidade</label>
                    <input type="number" step="1" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="100" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 mb-1 block">Preço Médio (R$)</label>
                    <input type="number" step="0.01" value={newAvgPrice} onChange={e => setNewAvgPrice(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="35.50" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Salvar</button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-3">
              {positions.length === 0 && !isAdding && (
                <div className="text-center py-10 text-neutral-500">
                  <p>Você ainda não possui ações cadastradas.</p>
                  <button onClick={() => setIsAdding(true)} className="text-indigo-400 font-medium mt-2 hover:underline">Adicionar a primeira</button>
                </div>
              )}

              {positions.map((pos) => {
                const data = liveData[pos.ticker];
                const currentPrice = data?.price || pos.averagePrice;
                const currentValue = pos.quantity * currentPrice;
                const invested = pos.quantity * pos.averagePrice;
                const profit = currentValue - invested;
                const profitPercent = (profit / invested) * 100;

                return (
                  <div key={pos.ticker} className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between group">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase">{pos.ticker}</span>
                        {data?.name && <span className="text-xs text-neutral-500 truncate max-w-[120px]">{data.name}</span>}
                      </div>
                      <span className="text-xs text-neutral-400">{pos.quantity} cotas • PM: {formatMoney(pos.averagePrice)}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-white">{formatMoney(currentValue)}</p>
                        <div className={`flex items-center justify-end gap-1 text-xs font-medium ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatMoney(profit)} ({profitPercent.toFixed(2)}%)
                        </div>
                      </div>
                      <button onClick={() => handleRemove(pos.ticker)} className="p-2 text-neutral-500 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
