"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Check, Lock, Route } from "lucide-react";
import { getStageLadder, type ProfileInsights } from "../lib/profile";
import { formatMoney as fmtMoney } from "../lib/format";

/**
 * Mapa dos 5 estágios financeiros.
 *
 * A faixa do dashboard mostrava "Estágio 1/5" e mais nada — o usuário via um
 * número que parecia nota baixa, sem saber quais eram os outros quatro degraus
 * nem quanto faltava para o próximo. Aqui a escada aparece inteira, com o
 * critério de cada degrau calculado sobre os números reais da pessoa.
 */

const ACCENT_DOT: Record<string, string> = {
  rose: 'bg-rose-500', amber: 'bg-amber-500', blue: 'bg-blue-500',
  indigo: 'bg-indigo-500', emerald: 'bg-emerald-500',
};

const ACCENT_TEXT: Record<string, string> = {
  rose: 'text-rose-400', amber: 'text-amber-400', blue: 'text-blue-400',
  indigo: 'text-indigo-400', emerald: 'text-emerald-400',
};

const ACCENT_PANEL: Record<string, string> = {
  rose: 'bg-rose-500/5 border-rose-500/30', amber: 'bg-amber-500/5 border-amber-500/30',
  blue: 'bg-blue-500/5 border-blue-500/30', indigo: 'bg-indigo-500/5 border-indigo-500/30',
  emerald: 'bg-emerald-500/5 border-emerald-500/30',
};

export function StageRoadmapModal({
  isOpen,
  onClose,
  insights,
  showValues = true,
  onEditProfile,
}: {
  isOpen: boolean;
  onClose: () => void;
  insights: ProfileInsights;
  showValues?: boolean;
  onEditProfile?: () => void;
}) {
  const formatMoney = (val: number) => fmtMoney(val, showValues);
  const ladder = getStageLadder(insights);


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg max-h-[88vh] bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-center mb-5 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                  <Route className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">Sua jornada financeira</h2>
                  <p className="text-[11px] text-neutral-500">Onde você está e o que vem depois</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 relative z-10">
              <div className="relative">
                {/* Trilho vertical que conecta os degraus */}
                <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/10" />

                <div className="flex flex-col gap-3">
                  {ladder.map(step => {
                    const { stage, status, goal, remaining, target } = step;
                    const isCurrent = status === 'current';
                    const isDone = status === 'done';

                    return (
                      <div key={stage.id} className="flex gap-4 relative">
                        {/* Marcador */}
                        <div className="shrink-0 relative z-10 pt-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            isDone
                              ? `${ACCENT_DOT[stage.accent]} border-transparent`
                              : isCurrent
                                ? `bg-neutral-900 ${stage.accent === 'rose' ? 'border-rose-500' : stage.accent === 'amber' ? 'border-amber-500' : stage.accent === 'blue' ? 'border-blue-500' : stage.accent === 'indigo' ? 'border-indigo-500' : 'border-emerald-500'}`
                                : 'bg-neutral-900 border-white/10'
                          }`}>
                            {isDone ? (
                              <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            ) : isCurrent ? (
                              <span className={`text-xs font-bold ${ACCENT_TEXT[stage.accent]}`}>{stage.level}</span>
                            ) : (
                              <Lock className="w-3 h-3 text-neutral-600" />
                            )}
                          </div>
                        </div>

                        {/* Conteúdo */}
                        <div className={`flex-1 min-w-0 rounded-2xl border p-4 transition-colors ${
                          isCurrent ? ACCENT_PANEL[stage.accent] : 'bg-white/[0.02] border-white/5'
                        }`}>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className={`font-bold text-sm ${isCurrent ? 'text-white' : isDone ? 'text-neutral-300' : 'text-neutral-500'}`}>
                              {stage.label}
                            </h3>
                            {isCurrent && (
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ACCENT_TEXT[stage.accent]} bg-white/5`}>
                                Você está aqui
                              </span>
                            )}
                            {isDone && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-400/10">
                                Concluído
                              </span>
                            )}
                          </div>

                          <p className={`text-xs leading-relaxed ${isCurrent ? 'text-neutral-300' : 'text-neutral-500'}`}>
                            {goal}
                          </p>

                          {/* Quanto falta — só quando o critério é financeiro e ainda não foi batido */}
                          {!isDone && target !== null && remaining !== null && remaining > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-baseline justify-between gap-2">
                              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Faltam</span>
                              <span className={`text-sm font-bold ${isCurrent ? ACCENT_TEXT[stage.accent] : 'text-neutral-400'}`}>
                                {formatMoney(remaining)}
                              </span>
                            </div>
                          )}

                          {isCurrent && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1">Sua prioridade agora</p>
                              <p className="text-xs text-neutral-300 leading-relaxed">{stage.priority}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {insights.monthlyCost <= 0 && (
                <p className="text-[11px] text-neutral-600 leading-relaxed mt-5 text-center">
                  Lance algumas despesas para o Nexa calcular seu custo de vida — é ele que define os valores de cada degrau.
                </p>
              )}

              {/* O estágio sai das respostas do perfil. Se ele parecer errado,
                  o caminho para corrigir precisa estar aqui, não no SQL. */}
              {onEditProfile && (
                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                  <p className="text-[11px] text-neutral-500 mb-2">Esse não é o seu caso?</p>
                  <button
                    onClick={onEditProfile}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    Ajustar meu perfil financeiro
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
