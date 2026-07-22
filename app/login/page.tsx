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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast("Erro: " + error.message, "error");
    else toast("Instruções de recuperação enviadas para o seu e-mail! 📧", "success");
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
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
