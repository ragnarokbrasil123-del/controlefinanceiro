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
    alert("Passo 1: Foto identificada pelo botão!"); // DETETIVE 1
    const file = e.target.files?.[0];
    if (!file) {
        alert("Ops: O arquivo veio vazio!");
        return;
    }

    setIsUploading(true);
    setErrorMessage("");
    
    try {
      alert("Passo 2: Enviando foto para o cérebro da Vercel..."); // DETETIVE 2
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      alert("Passo 3: Vercel respondeu com o código: " + response.status); // DETETIVE 3

      if (!response.ok) {
        const errorText = await response.text();
        alert("Erro na IA: " + errorText);
        throw new Error("A IA falhou em ler a imagem.");
      }

      const data = await response.json();
      alert("Passo 4: Gemini devolveu os dados: " + JSON.stringify(data)); // DETETIVE 4
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && Array.isArray(data) && data.length > 0) {
        alert(`Passo 5: Salvando ${data.length} itens no Supabase...`); // DETETIVE 5
        
        const transactionsToInsert = data.map((item: any) => ({
          user_id: session.user.id,
          title: item.description || "Despesa lida por IA",
          amount: parseFloat(item.amount || 0),
          category: item.category || "Variáveis",
          type: "expense",
          date: new Date().toISOString()
        })).filter(t => t.amount > 0);

        if (transactionsToInsert.length > 0) {
          const { error } = await supabase.from('transactions').insert(transactionsToInsert);
          
          if (error) {
            alert("ERRO SUPABASE: " + JSON.stringify(error));
            throw new Error("Erro de bloqueio no banco.");
          }
        }
      } else {
         alert("Faltaram dados ou a IA não retornou uma lista válida!");
         throw new Error("A IA não conseguiu extrair os dados corretamente.");
      }

      setIsUploading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose(); 
        window.location.reload(); 
      }, 2000);

    } catch (err: any) {
      alert("CAIU NO CATCH: " + err.message);
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
            Tire uma foto ou envie um arquivo.
          </p>

          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-10 relative">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">Analisando imagem...</h3>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-10 relative">
              <Sparkles className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">Leitura Concluída!</h3>
            </div>
          ) : (
            <div className="relative">
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4 text-center">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-indigo-500/20 rounded-2xl cursor-pointer">
                  <Camera className="w-6 h-6 text-indigo-400 mb-2" />
                  <span className="font-bold text-white text-sm">Tirar Foto</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                </label>

                <label className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-purple-500/20 rounded-2xl cursor-pointer">
                  <UploadCloud className="w-6 h-6 text-purple-400 mb-2" />
                  <span className="font-bold text-white text-sm">Enviar Galeria</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                </label>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


