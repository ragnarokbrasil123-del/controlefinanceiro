"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, LogOut, Shield, User, Lock, Check, Settings, Tag } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "./Toast";
import { AccountManagerModal } from "./AccountManagerModal";
import { CategoryManagerModal } from "./CategoryManagerModal";

export function ProfileModal({ isOpen, onClose, userEmail, userRole }: { isOpen: boolean, onClose: () => void, userEmail: string, userRole: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast("A senha deve ter pelo menos 6 caracteres.", "warning");
      return;
    }
    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdating(false);
    if (error) {
      toast("Erro ao atualizar senha: " + error.message, "error");
    } else {
      toast("Senha atualizada com sucesso! 🔒", "success");
      setNewPassword("");
    }
  };

  const handleLGPDDelete = async () => {
    if (confirm("LGPD: Tem certeza absoluta que deseja excluir sua conta e TODOS os seus dados financeiros de nossos servidores? Esta ação é IRREVERSÍVEL!")) {
      const { error } = await supabase.rpc('delete_user');
      if (error) {
        toast("Erro ao excluir conta. Certifique-se de ter rodado o script SQL.", "error");
      } else {
        toast("Sua conta e seus dados foram excluídos com sucesso.", "success");
        handleLogout();
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="relative w-full max-w-sm h-full bg-neutral-900 border-l border-white/10 shadow-2xl p-6 flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">Meu Perfil</h2>
              <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
            </div>

            {/* Avatar / Info */}
            <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl p-8 mb-6 text-center relative overflow-hidden">
              {userRole === 'admin' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>}
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${userRole === 'admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                {userRole === 'admin' ? <Shield className="w-10 h-10" /> : <User className="w-10 h-10" />}
              </div>
              
              <h3 className="text-lg font-bold text-white truncate w-full">{userEmail || 'Carregando...'}</h3>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full mt-3 ${userRole === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {userRole === 'admin' ? 'Dono (Admin)' : 'Cliente Premium'}
              </span>
            </div>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setIsAccountOpen(true)}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 rounded-2xl transition-all group"
              >
                <Settings className="w-5 h-5 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                <span className="text-xs font-medium text-neutral-400 group-hover:text-white transition-colors">Contas</span>
              </button>
              <button
                onClick={() => setIsCategoryOpen(true)}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 rounded-2xl transition-all group"
              >
                <Tag className="w-5 h-5 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                <span className="text-xs font-medium text-neutral-400 group-hover:text-white transition-colors">Categorias</span>
              </button>
            </div>

            {/* Alterar Senha */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 shrink-0">
              <label className="text-xs font-medium text-neutral-400 mb-2 block">Alterar Senha</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button onClick={handleUpdatePassword} disabled={isUpdating || !newPassword} className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white px-3 rounded-xl flex items-center justify-center transition-colors">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Admin Link */}
            {userRole === 'admin' && (
              <a
                href="/admin"
                className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl font-medium text-sm transition-colors"
              >
                <Shield className="w-4 h-4" /> Painel Administrativo
              </a>
            )}

            <div className="mt-auto space-y-3 shrink-0">
              <button onClick={handleLGPDDelete} className="w-full text-xs font-bold text-rose-500 hover:text-white bg-rose-500/5 hover:bg-rose-500 py-3 rounded-xl transition-colors border border-rose-500/10 hover:border-rose-500">
                Excluir Minha Conta Permanentemente
              </button>
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white w-full py-4 rounded-2xl font-bold transition-all">
                <LogOut className="w-5 h-5" /> Sair do Sistema
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <AccountManagerModal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
      <CategoryManagerModal isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} />
    </>
  );
}
