"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  /** Rotulo do botao de acao (ex.: "Desfazer") */
  actionLabel?: string;
  /** Id usado para despachar a acao de volta a quem criou o toast */
  actionId?: string;
  durationMs?: number;
}

// Função global para disparar toasts de qualquer lugar
export function toast(message: string, type: ToastType = "success") {
  window.dispatchEvent(
    new CustomEvent("nexa:toast", { detail: { message, type } })
  );
}

/**
 * Toast com desfazer.
 *
 * O app nao tinha undo em lugar nenhum: a confirmacao era a unica rede de
 * seguranca, e num app de dinheiro excluir uma serie de parcelas sem volta e
 * arriscado. Aqui a acao ja aconteceu na tela, e  reverte se o usuario
 * clicar dentro da janela.
 */
export function toastWithUndo(message: string, onUndo: () => void, durationMs = 7000) {
  const actionId = crypto.randomUUID();
  const handler = () => { onUndo(); window.removeEventListener("nexa:toast-action:" + actionId, handler); };
  window.addEventListener("nexa:toast-action:" + actionId, handler);
  // Se o usuario nao desfizer, o listener morre junto com a janela do toast.
  setTimeout(() => window.removeEventListener("nexa:toast-action:" + actionId, handler), durationMs + 500);

  window.dispatchEvent(new CustomEvent("nexa:toast", {
    detail: { message, type: "info" as ToastType, actionLabel: "Desfazer", actionId, durationMs },
  }));
}

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
};

const STYLES = {
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-rose-500/30 bg-rose-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  info: "border-indigo-500/30 bg-indigo-500/10",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type, actionLabel, actionId, durationMs } = (e as CustomEvent).detail;
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type, actionLabel, actionId }]);
      setTimeout(() => removeToast(id), durationMs ?? 4000);
    };

    window.addEventListener("nexa:toast", handler);
    return () => window.removeEventListener("nexa:toast", handler);
  }, [removeToast]);

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl max-w-[320px] ${STYLES[t.type]}`}
          >
            {ICONS[t.type]}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white leading-snug">{t.message}</p>
              {t.actionLabel && t.actionId && (
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("nexa:toast-action:" + t.actionId));
                    removeToast(t.id);
                  }}
                  className="mt-1.5 text-xs font-bold text-indigo-300 hover:text-indigo-200 underline underline-offset-2 cursor-pointer"
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Fechar aviso"
              className="text-neutral-400 hover:text-white transition-colors shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
