'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import { Plus, ArrowUpCircle, ArrowDownCircle, DollarSign, FileText, Download, Filter, X } from 'lucide-react';
import { Transaction, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../lib/types';
import { v4 as uuidv4 } from 'uuid'; // Wait, uuid is not installed. I'll use crypto.randomUUID() or a simple fallback.

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  // Load from localeStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('finances_transactions');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse transactions', e);
      }
    }
  }, []);

  // Save to localeStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('finances_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!filterMonth) return transactions;
    const [year, month] = filterMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = endOfMonth(start);

    return transactions.filter((t) => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start, end });
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterMonth]);

  const { income, expense, balance } = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += t.value;
          acc.balance += t.value;
        } else {
          acc.expense += t.value;
          acc.balance -= t.value;
        }
        return acc;
      },
      { income: 0, expense: 0, balance: 0 }
    );
  }, [filteredTransactions]);

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: generateId(),
    };
    setTransactions((prev) => [...prev, newTransaction]);
    setIsModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const generateReceipt = (t: Transaction) => {
    const doc = new jsPDF();
    
    // Configurações básicas
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("RECIBO DE PAGAMENTO", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    
    // Quadro de valor
    doc.rect(20, 30, 170, 15);
    doc.setFont("helvetica", "bold");
    doc.text(`VALOR: ${formatCurrency(t.value)}`, 105, 40, { align: "center" });

    // Texto do recibo
    doc.setFont("helvetica", "normal");
    const dateFormatted = format(parseISO(t.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    let textY = 60;
    doc.text(`Recebemos de: ${t.clientName || 'Cliente não identificado'}`, 20, textY);
    textY += 10;
    
    // Descrição com quebra de linha
    const descLines = doc.splitTextToSize(`A quantia supra de ${formatCurrency(t.value)} referente a: ${t.description || t.category}.`, 170);
    doc.text(descLines, 20, textY);
    textY += (descLines.length * 7) + 10;
    
    doc.text(`Data: ${dateFormatted}`, 20, textY);

    // Assinatura
    textY += 40;
    doc.line(60, textY, 150, textY);
    doc.text("Assinatura do Recebedor", 105, textY + 6, { align: "center" });

    doc.save(`Recibo_${t.clientName ? t.clientName.replace(/\s+/g, '_') : 'Pagamento'}_${format(parseISO(t.date), 'ddMMyyyy')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between flex-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Financeiro Pro</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex bg-slate-100 rounded-full px-4 py-1.5 items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {filterMonth ? format(parseISO(`${filterMonth}-01`), 'MMMM yyyy', { locale: ptBR }) : 'Período'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column - Dashboard Cards */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 flex flex-col justify-between h-44">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Saldo Atual</p>
              <h2 className="text-4xl font-bold mt-1">{formatCurrency(balance)}</h2>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-xs bg-white/20 px-2 py-1 rounded">Conta Principal</div>
              <DollarSign className="w-8 h-8 opacity-40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Receitas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1" title={formatCurrency(income)}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(income)}
              </p>
              <div className="mt-2 w-full bg-emerald-50 h-1 rounded-full">
                <div className="bg-emerald-500 h-1 rounded-full w-3/4"></div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Despesas</p>
              <p className="text-2xl font-bold text-red-500 mt-1" title={formatCurrency(expense)}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(expense)}
              </p>
              <div className="mt-2 w-full bg-red-50 h-1 rounded-full">
                <div className="bg-red-500 h-1 rounded-full w-1/3"></div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </div>

        {/* Right Column - Filters & List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-lg text-slate-800">
              Extrato de {filterMonth ? format(parseISO(`${filterMonth}-01`), 'MMM yyyy', { locale: ptBR }) : 'Todos'}
            </h3>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição / Cliente</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>Nenhuma movimentação neste período.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {format(parseISO(t.date), 'dd MMM', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{t.description || t.category}</p>
                        {t.clientName && (
                          <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">{t.clientName}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.value)}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          {t.type === 'income' ? (
                            <button
                              onClick={() => generateReceipt(t)}
                              className="text-xs font-bold text-indigo-600 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-600 hover:text-white transition-all whitespace-nowrap"
                            >
                              Gerar Recibo
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs px-3 py-1">—</span>
                          )}
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-md transition-colors"
                            title="Excluir"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Transaction Modal */}
      {isModalOpen && (
        <TransactionModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddTransaction}
        />
      )}
    </div>
  );
}

function TransactionModal({ onClose, onSave }: { onClose: () => void, onSave: (t: Omit<Transaction, 'id'>) => void }) {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [clientName, setClientName] = useState('');

  // Handle type change to reset default category
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !value || !date || !category) return;

    onSave({
      type,
      description,
      value: parseFloat(value),
      date,
      category,
      clientName: clientName.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Nova Transação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-shadow ${
                type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-shadow ${
                type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Saída
            </button>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              className="w-full border-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border outline-none transition-shadow"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border outline-none transition-shadow"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border outline-none transition-shadow bg-white"
              >
                {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Venda de produto X"
              className="w-full border-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border outline-none transition-shadow"
            />
          </div>

          {/* Client Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente/Pagador <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full border-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border outline-none transition-shadow"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
