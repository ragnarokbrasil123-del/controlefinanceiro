"use client";

import { useState } from "react";
import { Home, Heart, BarChart3, Settings, Plus, Camera, PenTool } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function BottomNav() {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const openModal = (name: string) => {
    setActiveTab(name);
    window.dispatchEvent(new CustomEvent('openModal', { detail: name }));
  };

  return (
    <div className="md:hidden block"> {/* <--- A CAPA DE INVISIBILIDADE NO PC ESTÁ AQUI */}
      <div className="fixed bottom-0 left-0 w-full z-40 pb-safe">
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xl border-t border-white/5"></div>
        
        <div className="relative px-6 h-20 flex items-center justify-between">
          <div className="flex gap-8">
            <button onClick={() => openModal('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-indigo-400' : 'text-neutral-500 hover:text-indigo-300'}`}>
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-medium tracking-wide">Início</span>
            </button>
            <button onClick={() => openModal('casais')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'casais' ? 'text-indigo-400' : 'text-neutral-500 hover:text-indigo-300'}`}>
              <Heart className="w-6 h-6" />
              <span className="text-[10px] font-medium tracking-wide">Casais</span>
            </button>
          </div>

          <div className="absolute left-1/2 -top-6 -translate-x-1/2">
            <button 
              onClick={() => setIsFabOpen(!isFabOpen)}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 ${isFabOpen ? 'bg-neutral-800 border border-white/10 rotate-45' : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-indigo-500/30 hover:scale-105 active:scale-95'}`}
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>

          <div className="flex gap-8">
            <button onClick={() => openModal('relatorios')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'relatorios' ? 'text-indigo-400' : 'text-neutral-500 hover:text-indigo-300'}`}>
              <BarChart3 className="w-6 h-6" />
              <span className="text-[10px] font-medium tracking-wide">Gráficos</span>
            </button>
            <button onClick={() => openModal('config')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'config' ? 'text-indigo-400' : 'text-neutral-500 hover:text-indigo-300'}`}>
              <Settings className="w-6 h-6" />
              <span className="text-[10px] font-medium tracking-wide">Ajustes</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFabOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-30"
              onClick={() => setIsFabOpen(false)}
            />
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 flex gap-6">
              <motion.button 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0, transition: { duration: 0.1 } }}
                onClick={() => { setIsFabOpen(false); openModal('manual'); }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-neutral-800 border border-white/10 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-transform">
                  <PenTool className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-white text-[11px] font-medium bg-black/50 px-2 py-1 rounded-md backdrop-blur-md border border-white/5">Manual</span>
              </motion.button>
              
              <motion.button 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.05 } }} exit={{ y: 20, opacity: 0, transition: { duration: 0.1 } }}
                onClick={() => { setIsFabOpen(false); openModal('camera'); }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 active:scale-95 transition-transform">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-[11px] font-medium bg-black/50 px-2 py-1 rounded-md backdrop-blur-md border border-white/5">Câmera IA</span>
              </motion.button>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
