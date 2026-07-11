"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Crown, Sparkles, CheckCircle2, Ban, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [step, setStep] = useState<'plans' | 'login'>('plans');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert("Erro ao criar conta: " + error.message);
        setLoading(false);
      } else {
        alert("Conta criada com sucesso! Você já pode fazer login.");
        setIsRegistering(false);
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("Erro de login: E-mail ou senha incorretos.");
        setLoading(false);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 2500);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) return alert("Digite seu e-mail primeiro para recuperar a senha.");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) alert("Erro: " + error.message);
    else alert("Instruções de recuperação enviadas para o seu e-mail!");
  };

  const handlePremiumClick = () => {
    alert("A assinatura Premium estará disponível em breve! Por enquanto, por favor acesse pelo Plano Free.");
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30 py-12">
      <div className="w-full max-w-4xl flex flex-col items-center">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 overflow-hidden bg-black/20 border border-white/10">
            <img src="/icon-192.png" alt="Logo Nexa" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Nexa</h1>
          <p className="text-neutral-400 text-center text-sm">Inteligência Financeira ao seu dispor.</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'plans' && (
            <motion.div key="plans" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-3xl flex flex-col items-center">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">Escolha como deseja acessar</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                
                {/* Cartão FREE */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative flex flex-col h-full hover:border-emerald-500/50 transition-colors">
                  <div className="mb-6">
                    <span className="bg-white/10 text-neutral-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Acesso Básico</span>
                    <h3 className="text-3xl font-extrabold text-white mt-4 mb-2">Plano Free</h3>
                    <p className="text-neutral-400 text-sm">Ideal para começar a organizar sua vida financeira.</p>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3 text-sm text-neutral-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      Gestão de despesas e receitas
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      Criação de Metas Financeiras
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-300">
                      <Ban className="w-5 h-5 text-rose-400 shrink-0" />
                      <span className="text-neutral-500">Múltiplas Carteiras (Limite de 1 conta)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-300">
                      <Ban className="w-5 h-5 text-rose-400 shrink-0" />
                      <span className="text-neutral-500">Investimentos & Ações (Bloqueado)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-300">
                      <Ban className="w-5 h-5 text-rose-400 shrink-0" />
                      <span className="text-neutral-500">IA Ilimitada (Apenas 3 testes)</span>
                    </li>
                  </ul>
                  <button onClick={() => setStep('login')} className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95">
                    Entrar no Plano Free <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Cartão PREMIUM */}
                <div className="bg-gradient-to-b from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-3xl p-8 backdrop-blur-sm relative flex flex-col h-full overflow-hidden hover:border-purple-500/50 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
                  
                  {/* Etiqueta Em Construção */}
                  <div className="absolute top-5 right-5 bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse">
                    Em Construção
                  </div>

                  <div className="mb-6 relative z-10">
                    <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit">
                      <Crown className="w-4 h-4" /> Acesso VIP
                    </span>
                    <h3 className="text-3xl font-extrabold text-white mt-4 mb-2">Plano Premium</h3>
                    <p className="text-neutral-400 text-sm">O poder total da Inteligência Artificial trabalhando por você.</p>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1 relative z-10">
                    <li className="flex items-start gap-3 text-sm text-neutral-300">
                      <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                      <strong>IA Ilimitada trabalhando por você</strong>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-300">
                      <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                      <strong>Múltiplas Carteiras e Contas</strong>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-300">
                      <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                      <strong>Módulo Profissional de Ações</strong>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-300">
                      <Sparkles className="w-5 h-5 text-pink-400 shrink-0" />
                      <strong className="text-pink-300">Nexa Casal (Sincronização em tempo real)</strong>
                    </li>
                  </ul>
                  <button onClick={handlePremiumClick} className="w-full relative z-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/25 active:scale-95 flex items-center justify-center gap-2">
                    <Crown className="w-5 h-5" /> Assinar Premium
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {step === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-md">
              <button onClick={() => setStep('plans')} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Voltar aos Planos
              </button>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
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

                <div className="mt-8 text-center relative z-10">
                  <p className="text-neutral-400 text-sm">
                    {isRegistering ? 'Já tem uma conta?' : 'Não tem conta ainda?'}
                    <button onClick={() => setIsRegistering(!isRegistering)} className="text-indigo-400 hover:text-indigo-300 font-bold ml-2 transition-colors">
                      {isRegistering ? 'Faça Login' : 'Cadastre-se'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
