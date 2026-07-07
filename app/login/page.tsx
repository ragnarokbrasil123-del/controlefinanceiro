"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Wallet, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("Erro ao criar conta: " + error.message);
      else {
        alert("Conta criada com sucesso! Você já pode fazer login.");
        setIsRegistering(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Erro de login: E-mail ou senha incorretos.");
      else window.location.href = "/"; // Redireciona para o painel principal se der certo!
    }
    
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) return alert("Digite seu e-mail primeiro para recuperar a senha.");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) alert("Erro: " + error.message);
    else alert("Instruções de recuperação enviadas para o seu e-mail!");
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 overflow-hidden bg-black/20">
            <img src="/icon-192.png" alt="Logo Nexa" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Nexa</h1>
          <p className="text-neutral-400 text-center">Inteligência Financeira ao seu dispor.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
          <form onSubmit={handleAuth} className="flex flex-col gap-5">
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

            <button type="submit" disabled={loading} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isRegistering ? 'Criar minha conta' : 'Entrar no Sistema'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
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
