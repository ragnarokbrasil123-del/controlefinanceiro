"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, TrendingUp, TrendingDown, Inbox } from "lucide-react";
import { useModalA11y } from "../hooks/use-modal-a11y";
import { formatMoney } from "../lib/format";

/**
 * Os lançamentos por trás de um número do topo.
 *
 * O painel mostrava "Cartões & Variáveis: R$ 3.637,19" e mandava cortar ali
 * primeiro — sem dizer o que compunha o valor. Para descobrir, a pessoa tinha
 * que rolar até a lista do mês e somar de cabeça.
 *
 * ORDEM POR VALOR, NÃO POR DATA
 * Quem abre isto quer saber ONDE cortar, não o que aconteceu primeiro. Em
 * ordem cronológica a resposta fica enterrada no meio da lista; do maior para
 * o menor, ela é a primeira linha.
 *
 * SOMENTE LEITURA
 * Editar e apagar continuam na lista do mês, que já tem esses botões. Aqui a
 * pergunta é "de onde vem este número" — misturar ações destrutivas numa tela
 * de conferência convida ao clique errado.
 */

type Transacao = {
  id: string;
  title?: string | null;
  category?: string | null;
  date?: string | null;
  amount: number;
  type: 'income' | 'expense';
  is_paid?: boolean | null;
};

const ACCENTS: Record<string, { text: string; bar: string; ring: string }> = {
  emerald: { text: 'text-emerald-400', bar: 'bg-emerald-400', ring: 'border-emerald-500/30' },
  blue:    { text: 'text-blue-400',    bar: 'bg-blue-400',    ring: 'border-blue-500/30' },
  rose:    { text: 'text-rose-400',    bar: 'bg-rose-400',    ring: 'border-rose-500/30' },
  amber:   { text: 'text-amber-400',   bar: 'bg-amber-400',   ring: 'border-amber-500/30' },
  indigo:  { text: 'text-indigo-400',  bar: 'bg-indigo-400',  ring: 'border-indigo-500/30' },
};

export function PillarDetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  transactions,
  accent = 'indigo',
  showValues = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  transactions: Transacao[];
  accent?: string;
  showValues?: boolean;
}) {
  const a11yRef = useModalA11y(isOpen, onClose);
  if (!isOpen) return null;

  const theme = ACCENTS[accent] ?? ACCENTS.indigo;

  // Ordena uma cópia: `sort` altera no lugar, e a lista recebida é a mesma que
  // alimenta o cálculo do card. Ordenar o original mudaria a ordem no painel.
  const ordenadas = [...transactions].sort((a, b) => b.amount - a.amount);
  const total = transactions.reduce((acc, t) => acc + t.amount, 0);
  const maior = ordenadas[0]?.amount ?? 0;

  const dinheiro = (v: number) => (showValues ? formatMoney(v) : 'R$ •••••');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          ref={a11yRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Lançamentos de ${title}`}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          className={`relative w-full sm:max-w-lg bg-neutral-900 border ${theme.ring} rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[80dvh] overflow-hidden`}
        >
          {/* shrink-0 no cabeçalho e no rodapé, flex-1 + min-h-0 no corpo:
              sem isso o flex comprime o conteúdo em vez de rolar. */}
          <div className="shrink-0 p-5 pb-4 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{title}</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {transactions.length === 0
                    ? 'Nenhum lançamento neste mês'
                    : `${transactions.length} ${transactions.length === 1 ? 'lançamento' : 'lançamentos'} • ${subtitle ?? ''}`}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="shrink-0 p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-3xl font-extrabold tracking-tight mt-3 ${theme.text}`}>{dinheiro(total)}</p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {ordenadas.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-5 h-5 text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-400">Nada lançado aqui neste mês.</p>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed max-w-xs mx-auto">
                  Se você esperava ver algo, confira se o lançamento está na categoria certa ou em outro mês.
                </p>
              </div>
            ) : (
              ordenadas.map(t => {
                const fatia = total > 0 ? (t.amount / total) * 100 : 0;
                const isIncome = t.type === 'income';
                return (
                  <div
                    key={t.id}
                    className="relative p-3 rounded-2xl bg-black/20 border border-white/5 overflow-hidden"
                  >
                    {/* Barra proporcional ao MAIOR item, não ao total: com 30
                        lançamentos, todas as fatias contra o total viram
                        traços invisíveis e a comparação se perde. */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 ${theme.bar} opacity-[0.07] pointer-events-none`}
                      style={{ width: `${maior > 0 ? (t.amount / maior) * 100 : 0}%` }}
                    />

                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border ${isIncome ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-rose-400/10 border-rose-400/20 text-rose-400'}`}>
                          {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white truncate">{t.title || 'Sem título'}</p>
                            {t.is_paid === false && (
                              <span className="shrink-0 bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Pendente
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                            {t.category || 'Sem categoria'}
                            {t.date && ` • ${new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-white whitespace-nowrap">{dinheiro(t.amount)}</p>
                        {total > 0 && showValues && (
                          <p className="text-[10px] text-neutral-500 mt-0.5">{fatia.toFixed(0)}% do total</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="shrink-0 px-5 py-3 border-t border-white/10 bg-black/20">
            <p className="text-[11px] text-neutral-600 leading-snug">
              Para editar ou apagar, use a lista de lançamentos do mês.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
