"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, Users, Sparkles, ArrowRight, Copy, Check, Loader2, Link as LinkIcon } from "lucide-react";
import { supabase } from "../lib/supabase";

export function CoupleModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [coupleState, setCoupleState] = useState<'none' | 'pending' | 'active'>('none');
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkCoupleStatus();
    }
  }, [isOpen]);

  const checkCoupleStatus = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const userId = session.user.id;

    // Busca casais onde eu sou o user_a ou user_b
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .limit(1);

    if (data && data.length > 0) {
      const couple = data[0];
      setCoupleState(couple.status);
      setInviteCode(couple.invite_code);
      
      // Se tiver parceiro, busca o email dele
      if (couple.status === 'active') {
        const partnerId = couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id;
        // RPC helper opcional no futuro, por enquanto chumbado
        setPartnerEmail("Parceiro(a) Conectado");
      }
    } else {
      setCoupleState('none');
    }
    setLoading(false);
  };

  const handleGenerateCode = async () => {
    setActionLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // Gera código simples tipo NEXA-A1B2
    const code = "NEXA-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const { data, error } = await supabase.from('couples').insert([{
      user_a_id: session.user.id,
      invite_code: code,
      status: 'pending'
    }]).select();

    if (!error && data) {
      setInviteCode(code);
      setCoupleState('pending');
    } else {
      alert("Erro ao gerar convite. Você já tem um pendente?");
    }
    setActionLoading(false);
  };

  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    
    setActionLoading(true);
    const { data, error } = await supabase.rpc('join_couple', { code: inputCode.trim() });
    
    if (error) {
      alert(error.message);
    } else {
      alert("Conectado com sucesso!");
      checkCoupleStatus();
    }
    setActionLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-neutral-900 border border-pink-500/30 shadow-2xl shadow-pink-500/20 rounded-3xl p-6 overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-pink-500/20 to-transparent pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" /> Nexa Casais
            </h2>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-full transition-colors"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-col items-center justify-center text-center relative z-10 pt-4 pb-2">
            
            {loading ? (
               <div className="py-12"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
            ) : coupleState === 'active' ? (
               // ----- ACTIVE -----
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
                 <div className="w-20 h-20 bg-pink-500/20 border border-pink-500/30 rounded-full flex items-center justify-center mb-6 relative">
                   <Users className="w-10 h-10 text-pink-400" />
                   <div className="absolute -bottom-2 -right-2 bg-neutral-900 p-1 rounded-full">
                     <div className="bg-gradient-to-r from-pink-500 to-rose-500 w-6 h-6 rounded-full flex items-center justify-center">
                       <Check className="w-4 h-4 text-white" />
                     </div>
                   </div>
                 </div>
                 
                 <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mb-2">Vocês estão conectados!</h3>
                 <p className="text-neutral-400 mb-8 text-sm">
                   Acesse agora o Cofre Compartilhado para gerenciar as finanças e metas do casal.
                 </p>
                 
                 <button onClick={() => window.location.href = '/casais'} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-500/25 group">
                   Acessar Cofre do Casal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </button>
               </motion.div>
            ) : coupleState === 'pending' ? (
               // ----- PENDING -----
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
                 <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mb-4 text-pink-500">
                   <LinkIcon className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Código Gerado!</h3>
                 <p className="text-neutral-400 text-sm mb-6">
                   Envie o código abaixo para o(a) seu parceiro(a) colar no app dele(a).
                 </p>
                 
                 <div className="bg-black/50 border border-pink-500/30 p-4 rounded-2xl w-full mb-6">
                    <span className="text-2xl font-mono font-bold tracking-widest text-pink-400">{inviteCode}</span>
                 </div>
                 
                 <button onClick={copyCode} className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-colors">
                   {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                   {copied ? 'Código Copiado!' : 'Copiar Código'}
                 </button>
               </motion.div>
            ) : (
               // ----- NONE -----
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
                 <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mb-6">
                   <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Mundos separados, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">sonhos juntos!</span></h3>
                 <p className="text-neutral-400 text-sm mb-8">
                   Crie um Cofre Compartilhado para as despesas da casa e metas de viagem, mantendo a sua privacidade no painel pessoal.
                 </p>
                 
                 <div className="w-full space-y-4">
                   <button onClick={handleGenerateCode} disabled={actionLoading} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-500/25 disabled:opacity-50">
                     {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                     Gerar Código Convite
                   </button>
                   
                   <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink-0 mx-4 text-neutral-500 text-xs font-semibold uppercase">OU SE VOCÊ FOI CONVIDADO</span>
                      <div className="flex-grow border-t border-white/10"></div>
                   </div>
                   
                   <form onSubmit={handleJoinCouple} className="flex gap-2">
                     <input 
                       type="text" 
                       value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())}
                       placeholder="Cole o código do parceiro" 
                       className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-pink-500 font-mono tracking-widest uppercase text-center"
                     />
                     <button type="submit" disabled={actionLoading || !inputCode} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl disabled:opacity-50 transition-colors">
                       <ArrowRight className="w-5 h-5" />
                     </button>
                   </form>
                 </div>
               </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
