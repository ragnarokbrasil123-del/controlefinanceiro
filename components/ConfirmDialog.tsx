"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { useModalA11y } from "../hooks/use-modal-a11y";

/**
 * Confirmação no padrão visual do app.
 *
 * Substitui os `window.confirm`, que quebravam o idioma visual, não eram
 * estilizáveis e se comportavam de forma inconsistente em navegadores mobile.
 *
 * A API imita o confirm nativo de propósito — devolve uma Promise<boolean> —
 * para que a migração dos pontos de uso seja uma troca de linha, sem
 * reestruturar o fluxo de cada componente:
 *
 *   if (!(await confirmDialog({ title: '...', message: '...' }))) return;
 */

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Vermelho para ação destrutiva; indigo para o resto */
  danger?: boolean;
}

type PendingConfirm = ConfirmOptions & { id: string };

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise(resolve => {
    const id = crypto.randomUUID();
    const handler = (e: Event) => {
      window.removeEventListener('nexa:confirm-result:' + id, handler);
      resolve((e as CustomEvent).detail === true);
    };
    window.addEventListener('nexa:confirm-result:' + id, handler);
    window.dispatchEvent(new CustomEvent('nexa:confirm', { detail: { ...options, id } }));
  });
}

export function ConfirmDialogContainer() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const answer = useCallback((value: boolean) => {
    if (!pending) return;
    window.dispatchEvent(new CustomEvent('nexa:confirm-result:' + pending.id, { detail: value }));
    setPending(null);
  }, [pending]);

  const a11yRef = useModalA11y(!!pending, () => answer(false));

  useEffect(() => {
    const handler = (e: Event) => setPending((e as CustomEvent).detail as PendingConfirm);
    window.addEventListener('nexa:confirm', handler);
    return () => window.removeEventListener('nexa:confirm', handler);
  }, []);

  return (
    <AnimatePresence>
      {pending && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => answer(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            ref={a11yRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3 mb-5">
              <div className={`p-2.5 rounded-2xl border shrink-0 ${pending.danger ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-base font-bold text-white leading-snug">{pending.title}</h2>
                {pending.message && (
                  <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed whitespace-pre-line">{pending.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => answer(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer text-sm"
              >
                {pending.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                onClick={() => answer(true)}
                className={`flex-1 font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm text-white ${pending.danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
              >
                {pending.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
