"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Lock, Eye, EyeOff, Loader2, Check, AlertTriangle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "../../components/Toast";

/**
 * Definição de nova senha, após o link de recuperação.
 *
 * Esta tela não existia. O app chamava `resetPasswordForEmail`, o e-mail era
 * enviado, a pessoa clicava — e caía no dashboard já logada, sem nunca ver
 * onde trocar a senha. Na prática só funcionava para quem adivinhasse que
 * precisava ir em Ajustes.
 *
 * O Supabase entrega o token de recuperação no HASH da URL
 * (#access_token=...&type=recovery) e o cliente o consome sozinho, criando
 * uma sessão temporária. Por isso aqui basta chamar updateUser — mas só
 * depois de confirmar que a sessão existe, senão a troca falha em silêncio.
 */
export default function RecuperarSenhaPage() {
  const [estado, setEstado] = useState<'verificando' | 'pronto' | 'invalido' | 'concluido'>('verificando');
  const [password, setPassword] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // O cliente processa o hash de forma assíncrona; escutar o evento é mais
    // confiável do que ler a sessão imediatamente.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setEstado('pronto');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setEstado(prev => (prev === 'pronto' ? prev : session ? 'pronto' : 'invalido'));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast("A senha precisa de pelo menos 6 caracteres.", "warning");
      return;
    }
    if (password !== confirmacao) {
      toast("As duas senhas não são iguais.", "warning");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSaving(false);

    if (error) {
      toast("Não consegui trocar a senha: " + error.message, "error");
      return;
    }
    setEstado('concluido');
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-7 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {estado === 'verificando' && (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 text-neutral-600 animate-spin" />
          </div>
        )}

        {estado === 'invalido' && (
          <div className="relative z-10 text-center">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-lg font-bold text-white mb-2">Link expirado ou já usado</h1>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Links de recuperação valem por pouco tempo e só podem ser usados uma vez. Peça um novo na tela de login.
            </p>
            <a href="/login" className="block w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-colors">
              Voltar ao login
            </a>
          </div>
        )}

        {estado === 'concluido' && (
          <div className="relative z-10 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-lg font-bold text-white mb-2">Senha alterada</h1>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Já pode entrar com a nova senha.
            </p>
            <a href="/" className="block w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-colors">
              Ir para o app
            </a>
          </div>
        )}

        {estado === 'pronto' && (
          <form onSubmit={salvar} className="relative z-10">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-5">
              <Lock className="w-5 h-5 text-indigo-400" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">Criar nova senha</h1>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Escolha uma senha nova para a sua conta.
            </p>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nova senha"
                  autoFocus
                  aria-label="Nova senha"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-11 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmacao}
                  onChange={e => setConfirmacao(e.target.value)}
                  placeholder="Repita a nova senha"
                  aria-label="Repita a nova senha"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <p className="text-[11px] text-neutral-600 mt-3 leading-relaxed">
              Pelo menos 6 caracteres. Repetir a senha evita salvar um erro de digitação que te trancaria para fora.
            </p>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full mt-5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
