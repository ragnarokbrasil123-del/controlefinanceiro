"use client";

import { useState } from "react";
import { Home, LayoutGrid, BarChart3, Settings } from "lucide-react";

export function BottomNav() {

  const [activeTab, setActiveTab] = useState('home');

  const openModal = (name: string) => {
    setActiveTab(name);
    window.dispatchEvent(new CustomEvent('openModal', { detail: name }));
  };

  return (
    <div className="md:hidden block"> {/* <--- A CAPA DE INVISIBILIDADE NO PC ESTÁ AQUI */}
      <div className="fixed bottom-0 left-0 w-full z-40">
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xl border-t border-white/5"></div>
        
        <div className="relative px-6 h-[60px] flex items-center justify-around w-full max-w-md mx-auto">
          <button onClick={() => openModal('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-indigo-400' : 'text-neutral-500 hover:text-indigo-300'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Início</span>
          </button>
          <button onClick={() => openModal('ferramentas')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'ferramentas' ? 'text-indigo-400' : 'text-neutral-500 hover:text-indigo-300'}`}>
            <LayoutGrid className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Menu</span>
          </button>
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
  );
}
