"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, LogOut, Shield, User } from "lucide-react";
import { supabase } from "../lib/supabase";

export function ProfileModal({ isOpen, onClose, userEmail, userRole }: { isOpen: boolean, onClose: () => void, userEmail: string, userRole: string }) {
  if (!isOpen) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="relative w-full max-w-sm h-full bg-neutral-900 border-l border-white/10 shadow-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">Meu Perfil</h2>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 text-center relative overflow-hidden">
            {userRole === 'admin' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>}
            
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${userRole === 'admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
              {userRole === 'admin' ? <Shield className="w-10 h-10" /> : <User className="w-10 h-10" />}
            </div>
            
            <h3 className="text-lg font-bold text-white truncate w-full">{userEmail || 'Carregando...'}</h3>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full mt-3 ${userRole === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {userRole === 'admin' ? 'Dono (Admin)' : 'Cliente Premium'}
            </span>
          </div>

          <button onClick={handleLogout} className="mt-auto flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white w-full py-4 rounded-2xl font-bold transition-all">
            <LogOut className="w-5 h-5" /> Sair do Sistema
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
