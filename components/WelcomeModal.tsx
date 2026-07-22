"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Heart, Wallet, ChevronRight } from "lucide-react";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Check if user has seen the welcome screen
    const hasSeenWelcome = localStorage.getItem('nexa_welcomed');
    if (!hasSeenWelcome) {
      // Delay slightly for effect
      const t = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleNext = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      localStorage.setItem('nexa_welcomed', 'true');
      setIsOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} transition={{ type: "spring", bounce: 0.4 }} className="relative w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center text-center">
            
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
               <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
               <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao Nexa</h2>
                    <p className="text-neutral-400 text-sm">O seu novo ecossistema financeiro premium. Feito para ser simples, bonito e inteligente.</p>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Cérebro IA</h2>
                    <p className="text-neutral-400 text-sm">Não quer digitar gastos? Tire uma foto do recibo e a nossa IA cadastra tudo para você num passe de mágica.</p>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 mb-6">
                      <Heart className="w-8 h-8 text-white fill-white/20" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Juntos é Melhor</h2>
                    <p className="text-neutral-400 text-sm">Divida despesas com seu parceiro(a) com um clique e construam juntos o patrimônio dos sonhos.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 justify-center mt-8 mb-6">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-6 bg-indigo-500' : 'w-2 bg-white/20'}`}></div>
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-6 bg-purple-500' : 'w-2 bg-white/20'}`}></div>
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-6 bg-pink-500' : 'w-2 bg-white/20'}`}></div>
              </div>

              <button onClick={handleNext} className="w-full bg-white text-black font-bold py-3.5 rounded-xl transition-all shadow-lg hover:bg-neutral-200 active:scale-95 flex justify-center items-center gap-2">
                {step === 3 ? "Começar Agora" : "Avançar"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
