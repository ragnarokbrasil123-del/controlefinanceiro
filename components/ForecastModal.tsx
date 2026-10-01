"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CalendarClock, AlertTriangle, TrendingDown, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { formatMoney as fmtMoney } from "../lib/format";
import {
  forecastMonths, upcomingBills, tightWeeks,
  whatIfCut, whatIfIncomeDrop, projectGoal,
  type Tx,
} from "../lib/forecast";
import type { ProfileInsights } from "../lib/profile";

/**
 * Previsão e simulação.
 *
 * O app só olhava para trás. Aqui ele responde "o que vem pela frente" usando
 * dados que já existiam: parcelas lançadas, custo de vida mediano e renda
 * mediana.
 *
 * Toda projeção é estimativa, e a tela separa visualmente o que JÁ ESTÁ
 * LANÇADO (fato) do que o padrão sugere (palpite).
 */
export function ForecastModal({
  isOpen,
  onClose,
  allTransactions,
  insights,
  activeMonth,
  activeYear,
  showValues = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  allTransactions: Tx[];
  insights: ProfileInsights;
  activeMonth: number;
  activeYear: number;
  showValues?: boolean;
}) {
  const [cut, setCut] = useState("");
  const [drop, setDrop] = useState("20");

  const formatMoney = (v: number) => fmtMoney(v, showValues);
  const fromPeriod = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;

  const forecast = forecastMonths({
    allTransactions,
    fromPeriod,
    monthlyCost: insights.monthlyCost,
    medianIncome: insights.referenceIncome,
    months: 3,
  });

  const bills = upcomingBills(allTransactions);
  const apertadas = tightWeeks(bills, insights.referenceIncome * 0.25);

  const semDados = insights.monthlyCost <= 0 && insights.referenceIncome <= 0;

  const cutNum = parseFloat(cut) || 0;
  const simCut = cutNum > 0 ? whatIfCut({
    reserveCurrent: insights.reserveAmount,
    reserveTarget: insights.reserveIdeal,
    currentContribution: insights.suggestedContribution,
    monthlyCut: cutNum,
  }) : null;

  const dropNum = parseFloat(drop) || 0;
  const simDrop = dropNum > 0 ? whatIfIncomeDrop({
    income: insights.referenceIncome,
    monthlyCost: insights.monthlyCost,
    reserveAmount: insights.reserveAmount,
    dropPercent: dropNum,
  }) : null;

  const metaAtual = projectGoal(
    insights.reserveAmount, insights.reserveIdeal, insights.suggestedContribution,
  );

  const mesLabel = (p: string) => {
    const [y, m] = p.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[88vh] bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-center mb-5 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <CalendarClock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">O que vem pela frente</h2>
                  <p className="text-[11px] text-neutral-500">Projeção baseada no que já está lançado</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Fechar" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 relative z-10 flex flex-col gap-5">

              {semDados ? (
                <div className="text-center py-10 px-4">
                  <CalendarClock className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
                  <p className="text-sm text-neutral-400 mb-2">Ainda não dá para projetar.</p>
                  <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
                    O Nexa precisa de pelo menos um mês de receitas e despesas lançadas para estimar o que vem pela frente.
                  </p>
                </div>
              ) : (
                <>
                  {/* Projeção */}
                  <section>
                    <h3 className="text-sm font-semibold text-white mb-2.5">Próximos 3 meses</h3>
                    <div className="flex flex-col gap-2">
                      {forecast.map(f => (
                        <div key={f.period} className={`rounded-2xl border p-4 ${f.tight ? 'bg-rose-500/5 border-rose-500/20' : 'bg-black/20 border-white/5'}`}>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-sm font-semibold text-white capitalize">{mesLabel(f.period)}</span>
                            <span className={`text-sm font-bold ${f.tight ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {formatMoney(f.projectedBalance)}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5 text-[11px]">
                            <Row label="Renda esperada" value={formatMoney(f.estimatedIncome)} muted />
                            {f.committed > 0 && (
                              <Row
                                label="Já comprometido"
                                value={`− ${formatMoney(f.committed)}`}
                                tone="rose"
                                badge="lançado"
                              />
                            )}
                            <Row
                              label="Contas de sempre"
                              value={`− ${formatMoney(f.estimatedRecurring)}`}
                              muted
                              badge="estimativa"
                            />
                          </div>

                          {f.tight && (
                            <p className="text-[11px] text-rose-300 mt-2.5 flex items-start gap-1.5 leading-relaxed">
                              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                              Neste ritmo, {mesLabel(f.period)} fecha no vermelho antes de qualquer gasto novo.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-2.5 leading-relaxed">
                      "Já comprometido" é o que está lançado no app. "Contas de sempre" é estimativa pelo seu padrão dos últimos meses — pode variar.
                    </p>
                  </section>

                  {/* Vencimentos */}
                  {bills.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-white mb-2.5">A pagar</h3>
                      {apertadas.length > 0 && (
                        <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3.5 mb-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-neutral-300 leading-relaxed">
                            {apertadas.length === 1 ? 'Uma semana concentra' : `${apertadas.length} semanas concentram`} muitos vencimentos.
                            A mais pesada soma <strong className="text-amber-300">{formatMoney(Math.max(...apertadas.map(w => w.total)))}</strong>.
                          </p>
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        {bills.slice(0, 10).map((b, i) => (
                          <div key={`${b.title}-${b.date}-${i}`} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${b.overdue ? 'bg-rose-500/5 border-rose-500/20' : 'bg-black/20 border-white/5'}`}>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white truncate">{b.title}</p>
                              <p className="text-[11px] text-neutral-500">
                                {new Date(b.date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })}
                                {b.overdue
                                  ? <span className="text-rose-400 font-semibold"> · vencida há {Math.abs(b.daysUntil)}d</span>
                                  : b.daysUntil <= 7 && <span className="text-amber-400 font-semibold"> · em {b.daysUntil}d</span>}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-white whitespace-nowrap">{formatMoney(b.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Simulador */}
                  <section className="bg-black/20 border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" /> E se...
                    </h3>

                    <div className="mb-4">
                      <label className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider mb-1.5 block">
                        Se eu cortar por mês
                      </label>
                      <div className="relative mb-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">R$</span>
                        <input type="number" step="0.01" value={cut} onChange={e => setCut(e.target.value)} placeholder="300" className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                      </div>

                      {insights.reserveIdeal <= 0 ? (
                        <p className="text-[11px] text-neutral-600">Defina seu custo de vida lançando despesas para o Nexa calcular a meta da reserva.</p>
                      ) : simCut ? (
                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3">
                          {simCut.newMonths === null ? (
                            <p className="text-xs text-neutral-400">Mesmo com o corte, ainda não há aporte suficiente para a reserva.</p>
                          ) : (
                            <p className="text-xs text-neutral-300 leading-relaxed">
                              Guardando <strong className="text-white">{formatMoney(simCut.newMonthlyContribution)}</strong> por mês,
                              você completa a reserva em <strong className="text-indigo-300">{simCut.newMonths} meses</strong>
                              {simCut.monthsSaved > 0 && <> — <strong className="text-emerald-400">{simCut.monthsSaved} meses antes</strong> do ritmo atual</>}.
                            </p>
                          )}
                        </div>
                      ) : metaAtual.months !== null ? (
                        <p className="text-[11px] text-neutral-500">
                          No ritmo atual ({formatMoney(insights.suggestedContribution)}/mês), a reserva fica pronta em {metaAtual.months} meses.
                        </p>
                      ) : (
                        <p className="text-[11px] text-neutral-500">Sem aporte mensal, a reserva não avança.</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider mb-1.5 block">
                        Se minha renda cair
                      </label>
                      <div className="flex gap-2 mb-2">
                        {[10, 20, 30, 50].map(p => (
                          <button
                            key={p}
                            onClick={() => setDrop(String(p))}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                              drop === String(p)
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                                : 'bg-black/30 border-white/10 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>

                      {simDrop && (
                        <div className={`rounded-xl p-3 border ${simDrop.survives ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                          {simDrop.survives ? (
                            <p className="text-xs text-neutral-300 leading-relaxed flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              Com {formatMoney(simDrop.newIncome)}, você ainda cobre seu custo de {formatMoney(simDrop.monthlyCost)}.
                            </p>
                          ) : (
                            <p className="text-xs text-neutral-300 leading-relaxed flex items-start gap-2">
                              <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              <span>
                                Faltariam <strong className="text-rose-300">{formatMoney(simDrop.deficit)}</strong> por mês.
                                {simDrop.monthsOfRunway !== null && simDrop.monthsOfRunway > 0
                                  ? <> Sua reserva cobriria <strong className="text-white">{simDrop.monthsOfRunway.toFixed(1)} meses</strong>.</>
                                  : <> Sem reserva, o rombo seria imediato.</>}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  {insights.reserveIdeal > 0 && (
                    <section className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-4">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Reserva: <strong className="text-white">{formatMoney(insights.reserveAmount)}</strong> de {formatMoney(insights.reserveIdeal)}.
                        {metaAtual.months !== null && metaAtual.months > 0 && metaAtual.targetDate && (
                          <> No ritmo atual, fica pronta em <strong className="text-emerald-400">{metaAtual.targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>.</>
                        )}
                        {metaAtual.months === 0 && <> Já está completa. 🎉</>}
                      </p>
                    </section>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, tone, muted, badge }: {
  label: string; value: string; tone?: 'rose'; muted?: boolean; badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-neutral-500 flex items-center gap-1.5">
        {label}
        {badge && (
          <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${badge === 'lançado' ? 'bg-white/10 text-neutral-400' : 'bg-white/5 text-neutral-600'}`}>
            {badge}
          </span>
        )}
      </span>
      <span className={tone === 'rose' ? 'text-rose-400 font-semibold' : muted ? 'text-neutral-400' : 'text-white'}>{value}</span>
    </div>
  );
}
