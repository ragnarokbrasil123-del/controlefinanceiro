"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, UploadCloud, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AiUploadModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState("Iniciando leitura...");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSuccess(false);

    try {
      // 1. Converter a foto para enviar pela internet
      setStatusText("Lendo a foto com IA...");
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;

        // 2. Enviar a foto para o Cérebro (backend) que criamos agora há pouco
        setStatusText("Extraindo transações da imagem...");
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Image })
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        if (!data.transactions || data.transactions.length === 0) throw new Error("A IA não achou valores na foto.");

        // 3. Salvar todas as transações que a IA achou no Supabase
        setStatusText(`Salvando ${data.transactions.length} itens no banco...`);
        const { error } = await supabase.from('transactions').insert(data.transactions);

        if (error) throw error;

        // 4. Sucesso!
        setIsUploading(false);
        setSuccess(true);
        setTimeout(() => {
          onClose();
          window.location.reload(); // Recarrega a tela para os gastos mágicos aparecerem
        }, 2500);
      };
      
      reader.onerror = () => {
        throw new Error("Erro ao ler a imagem.");
      };

    } catch (error: any) {
      alert("Erro na IA: " + error.message);
      setIsUploading(false);
      setSuccess(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={!isUploading ? onClose : undefined}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Fundo brilhante para dar cara de IA */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Leitura Automática
              </h2>
              {!isUploading && !success && (
                <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Leitura Concluída!</h3>
                <p className="text-neutral-400">Os dados foram separados e salvos com sucesso.</p>
              </div>
            ) : isUploading ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-6" />
                <p className="text-neutral-300 font-medium animate-pulse">{statusText}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-neutral-400 text-sm mb-2 text-center">
                  Envie a foto de um comprovante, conta de luz ou anotações à mão. O Google Gemini vai ler tudo e separar pra você.
                </p>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <span className="text-indigo-300 font-medium text-center">Clique para escolher a foto</span>
                  <span className="text-indigo-400/50 text-xs mt-2">Formatos: JPG, PNG</span>
                </div>

                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
