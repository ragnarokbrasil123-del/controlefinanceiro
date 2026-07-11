"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Lock, CreditCard, CheckCircle2 } from "lucide-react";

export function PaywallModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />

        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-neutral-900 border border-purple-500/30 rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col text-center">
          
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-purple-600/20 to-transparent pointer-events-none"></div>

          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10">
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <Lock className="w-8 h-8 text-purple-400" />
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400" />
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-2 relative z-10">Limite da IA Atingido</h2>
          
          <p className="text-neutral-400 text-sm mb-8 relative z-10">
            Você utilizou todos os seus 3 créditos gratuitos da Inteligência Artificial. Faça o upgrade para o <strong className="text-purple-400">Plano Premium</strong> e desbloqueie todo o poder do seu Nexa!
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left relative z-10">
            <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wider text-center">O que você ganha</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-neutral-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Leitura ilimitada de recibos e notas fiscais
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Conselheiro Financeiro Inteligente ilimitado
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Chat Nexa AI a qualquer momento
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Planejamento automático de orçamentos (50/30/20)
              </li>
            </ul>
          </div>

          <button onClick={() => alert('Integração com pagamento (Stripe/MercadoPago) será implementada aqui.')} className="w-full relative z-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/25 active:scale-[0.98] flex justify-center items-center gap-2">
            <CreditCard className="w-5 h-5" /> Assinar Plano Premium
          </button>
          
          <button onClick={onClose} className="mt-4 text-xs font-semibold text-neutral-500 hover:text-neutral-300 transition-colors relative z-10">
            Agora não, continuarei no plano Free
          </button>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
