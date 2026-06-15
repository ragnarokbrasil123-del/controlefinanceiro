"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, UploadCloud, Camera, FileText, FileSpreadsheet, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AiUploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleFileSelect = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage("");
    
    try {
      // 1. Enviar a foto real para a nossa API do Gemini (O Cérebro)
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("A Inteligência Artificial não conseguiu ler a imagem. Tente uma foto mais nítida.");
      }

      const data = await response.json();
      
      // 2. Gravar o resultado no banco de dados (Supabase)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && data.description && data.amount) {
        const { error } = await supabase.from('transactions').insert([{
          user_id: session.user.id,
          description: data.description,
          amount: parseFloat(data.amount),
          category: data.category || "Variáveis",
          type: "expense", // Recibos geralmente são despesas
          date: new Date().toISOString()
        }]);

        if (error) throw new Error("Erro ao salvar no banco de dados.");
      } else {
         throw new Error("A IA não conseguiu encontrar um valor na foto.");
      }

      // 3. Dar o sinal verde pro usuário!
      setIsUploading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose(); 
        // Atualiza a tela para mostrar a nova transação Mágica
        window.location.reload(); 
      }, 2000);

    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || "Erro desconhecido.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isUploading ? onClose : undefined} />
        
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-neutral-900 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 rounded-3xl p-6 overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>

          <div className="flex justify-between items-center mb-2 relative">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Leitura por IA
            </h2>
            {!isUploading && (
              <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-full transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            )}
          </div>
          
          <p className="text-neutral-400 text-sm mb-6 relative">
            Tire uma foto ou envie um arquivo. O Google Gemini vai ler tudo (PDFs, planilhas ou notinhas) e lançar para você.
          </p>

          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-10 relative">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">A Inteligência Artificial está lendo...</h3>
              <p className="text-neutral-400 text-sm text-center">Isso leva cerca de 4 segundos.<br/>Procurando o local e o valor exato na nota.</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-10 relative">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Leitura Concluída!</h3>
              <p className="text-neutral-400 text-sm">A sua compra foi adicionada com sucesso.</p>
            </div>
          ) : (
            <div className="relative">
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4 text-center">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Botão Câmera Direta */}
                <label className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 rounded-2xl transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-indigo-500/30">
                    <Camera className="w-6 h-6 text-indigo-400" />
                  </div>
                  <span className="font-bold text-white text-sm">Tirar Foto</span>
                  <span className="text-xs text-neutral-500 mt-1 text-center">Câmera do Celular</span>
                  
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                </label>

                {/* Botão Arquivos */}
                <label className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 rounded-2xl transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-purple-500/30">
                    <UploadCloud className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="font-bold text-white text-sm">Enviar Arquivo</span>
                  <span className="text-xs text-neutral-500 mt-1 text-center">Galeria ou Documentos</span>
                  
                  <input type="file" accept="image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleFileSelect} />
                </label>
              </div>

              <div className="flex justify-center gap-5 text-xs text-neutral-500 mt-6 bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-neutral-400"/> JPG/PNG</span>
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-neutral-400"/> PDF</span>
                <span className="flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4 text-neutral-400"/> EXCEL</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
