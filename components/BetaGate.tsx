"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { KeyRound, Loader2, LogOut, ShieldCheck, FileText } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getUserId } from "../lib/session";
import { toast } from "./Toast";

/**
 * Portão do beta fechado.
 *
 * O Supabase Auth cria a conta no signUp, antes de qualquer lógica nossa — não
 * dá para "segurar" o cadastro sem desligar o signUp no painel. Então o
 * controle acontece aqui, depois: a conta nasce, mas o app só abre se houver
 * convite nominal resgatado.
 *
 * Também é onde o aceite dos termos é coletado, porque é o único ponto por
 * onde todo mundo passa obrigatoriamente antes de usar o app.
 */

/** Suba esta versão quando os termos mudarem: quem aceitou o antigo reaceita. */
export const TERMS_VERSION = '2026-10-02';

type Estado = 'verificando' | 'liberado' | 'precisa-convite' | 'precisa-termos';

export function BetaGate({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('verificando');
  const [code, setCode] = useState("");
  const [aceitou, setAceitou] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => { verificar(); }, []);

  async function verificar() {
    const uid = await getUserId();
    if (!uid) {
      // Sem sessão, o próprio dashboard redireciona para /login.
      setEstado('liberado');
      return;
    }

    const { data: temAcesso } = await supabase.rpc('has_beta_access');
    if (!temAcesso) { setEstado('precisa-convite'); return; }

    const { data: perfil } = await supabase
      .from('profiles')
      .select('accepted_terms_at, accepted_terms_version')
      .eq('id', uid)
      .maybeSingle();

    const aceiteValido = perfil?.accepted_terms_at && perfil?.accepted_terms_version === TERMS_VERSION;
    setEstado(aceiteValido ? 'liberado' : 'precisa-termos');
  }

  async function resgatar(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { toast("Digite o código do convite.", "warning"); return; }

    setIsBusy(true);
    const { error } = await supabase.rpc('redeem_beta_invite', { invite_code: code.trim() });
    setIsBusy(false);

    if (error) {
      // A função devolve mensagens específicas e já seguras para exibir
      // (convite não encontrado, e-mail diferente, já usado, expirado).
      toast(error.message.replace(/^.*?:\s*/, ''), "error");
      return;
    }
    toast("Convite aceito. Bem-vindo ao Nexa! 🎉", "success");
    await verificar();
  }

  async function aceitarTermos() {
    const uid = await getUserId();
    if (!uid) return;

    setIsBusy(true);
    const { error } = await supabase
      .from('profiles')
      .update({ accepted_terms_at: new Date().toISOString(), accepted_terms_version: TERMS_VERSION })
      .eq('id', uid);
    setIsBusy(false);

    if (error) { toast("Não consegui registrar o aceite: " + error.message, "error"); return; }
    await verificar();
  }

  async function sair() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (estado === 'verificando') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-neutral-600 animate-spin" />
      </div>
    );
  }

  if (estado === 'liberado') return <>{children}</>;

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-7 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {estado === 'precisa-convite' ? (
          <div className="relative z-10">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-5">
              <KeyRound className="w-5 h-5 text-indigo-400" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">O Nexa está em beta fechado</h1>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Por enquanto o acesso é só por convite. Se você recebeu um código, digite abaixo — ele precisa ter sido emitido para este mesmo e-mail.
            </p>

            <form onSubmit={resgatar} className="flex flex-col gap-3">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="NEXA-ABC1"
                aria-label="Código do convite"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-center text-lg font-bold tracking-widest placeholder:text-neutral-700 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isBusy}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar com o convite'}
              </button>
            </form>

            <button onClick={sair} className="w-full mt-4 text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5 py-2">
              <LogOut className="w-3.5 h-3.5" /> Sair desta conta
            </button>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">Antes de começar</h1>
            <p className="text-sm text-neutral-400 leading-relaxed mb-5">
              O Nexa guarda informações financeiras suas. Leia como tratamos esses dados antes de continuar.
            </p>

            <div className="flex flex-col gap-2 mb-5">
              <a href="/termos" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-300 hover:text-white transition-colors">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" /> Termos de uso
              </a>
              <a href="/privacidade" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-300 hover:text-white transition-colors">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" /> Política de privacidade
              </a>
            </div>

            <label className="flex items-start gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={aceitou}
                onChange={e => setAceitou(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-indigo-500 shrink-0 cursor-pointer"
              />
              <span className="text-xs text-neutral-400 leading-relaxed">
                Li e aceito os termos de uso e a política de privacidade.
              </span>
            </label>

            <button
              onClick={aceitarTermos}
              disabled={!aceitou || isBusy}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuar'}
            </button>

            <button onClick={sair} className="w-full mt-3 text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer py-2">
              Sair desta conta
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
