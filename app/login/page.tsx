"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "../../components/Toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast("Erro ao criar conta: " + error.message, "error");
        setLoading(false);
      } else {
        toast("Conta criada com sucesso! Faça seu login.", "success");
        setIsRegistering(false);
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast("E-mail ou senha incorretos.", "error");
        setLoading(false);
      } else {
        // Mostra a tela de splash e redireciona depois
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 2500);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast("Digite seu e-mail primeiro para recuperar a senha.", "warning");
      return;
    }
    // Sem o redirectTo, o link do e-mail caía no dashboard e a pessoa nunca
    // via onde trocar a senha — o fluxo existia mas não terminava em lugar
    // nenhum.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-senha`,
    });
    if (error) toast("Erro: " + error.message, "error");
    else toast("Instruções de recuperação enviadas para o seu e-mail! 📧", "success");
  };

  /**
   * Login com Google.
   *
   * Exige o provedor habilitado no painel do Supabase (Authentication →
   * Providers → Google) com as credenciais do Google Cloud. Sem isso o botão
   * devolve erro do próprio Supabase, e a mensagem abaixo explica o que fazer
   * em vez de mostrar um erro técnico ao usuário final.
   */
  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setIsGoogleLoading(false);
      toast(
        error.message?.toLowerCase().includes('provider')
          ? "Login com Google ainda não está habilitado nesta instalação."
          : "Erro ao entrar com Google: " + error.message,
        "error",
      );
    }
    // Em caso de sucesso o navegador é redirecionado; não há o que fazer aqui.
  };

  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="flex flex-col items-center relative z-10">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.4)] mb-8 overflow-hidden bg-black/20 border border-white/10">
            <img src="/icon-192.png" alt="Logo Nexa" className="w-full h-full object-cover" />
          </div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center flex flex-col items-center">
            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Bem-vindo de volta</h2>
            <div className="flex items-center gap-3 text-neutral-400 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> 
              <span className="text-sm font-medium">Preparando seu espaço financeiro...</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 overflow-hidden bg-black/20 border border-white/10">
            <img src="/icon-192.png" alt="Logo Nexa" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Nexa</h1>
          <p className="text-neutral-400 text-center text-sm">Inteligência Financeira ao seu dispor.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <form onSubmit={handleAuth} className="flex flex-col gap-5 relative z-10">
            <div>
              <label className="text-sm font-medium text-neutral-400 mb-2 block">Seu E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input 
                  type="email" 
                  required 
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-400 mb-2 flex justify-between">
                Sua Senha
                {!isRegistering && (
                  <button type="button" onClick={handleResetPassword} className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">Esqueceu a senha?</button>
                )}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50 shadow-lg shadow-indigo-500/25 active:scale-95">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isRegistering ? 'Criar minha conta' : 'Entrar no Sistema'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5 relative z-10">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-[11px] text-neutral-600 uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={isGoogleLoading}
            className="w-full relative z-10 bg-white hover:bg-neutral-100 text-neutral-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {/* SVG oficial do Google: usar um ícone genérico aqui quebra a
                    diretriz de marca deles e o usuário não reconhece o botão. */}
                <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continuar com Google
              </>
            )}
          </button>

          <div className="mt-8 text-center relative z-10">
            <p className="text-neutral-400 text-sm">
              {isRegistering ? 'Já tem uma conta?' : 'Não tem conta ainda?'}
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-indigo-400 hover:text-indigo-300 font-bold ml-2 transition-colors">
                {isRegistering ? 'Faça Login' : 'Cadastre-se'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
