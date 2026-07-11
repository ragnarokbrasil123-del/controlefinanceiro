"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Layers, Settings2, Save } from "lucide-react";

export type ModulesState = {
  casal: boolean;
  metas: boolean;
  relatorios: boolean;
  orcamentos: boolean;
  assinaturas: boolean;
  planejador: boolean;
  calendario: boolean;
  ai: boolean;
};

export const defaultModulesState: ModulesState = {
  casal: true,
  metas: true,
  relatorios: true,
  orcamentos: true,
  assinaturas: true,
  planejador: true,
  calendario: true,
  ai: true,
};

export function ModulesModal({ isOpen, onClose, modules, onSave }: { isOpen: boolean, onClose: () => void, modules: ModulesState, onSave: (newModules: ModulesState) => void }) {
  const [localModules, setLocalModules] = useState<ModulesState>(modules);

  // Sincroniza estado se a prop mudar e o modal estiver abrindo
  useEffect(() => {
    if (isOpen) {
      setLocalModules(modules);
    }
  }, [isOpen, modules]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof ModulesState) => {
    setLocalModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(localModules);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ x: '100%' }} 
          animate={{ x: 0 }} 
          exit={{ x: '100%' }} 
          transition={{ type: "spring", bounce: 0, duration: 0.4 }} 
          className="relative w-full max-w-sm h-full bg-neutral-900 border-l border-white/10 shadow-2xl p-6 flex flex-col"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-400" />
              Personalizar
            </h2>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
            <div className="flex gap-3">
              <Layers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-indigo-300 mb-1">Módulos do Sistema</h3>
                <p className="text-xs text-neutral-400">
                  Desative as funções que você não utiliza para deixar sua tela inicial mais limpa. Suas preferências são salvas neste dispositivo.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-3 scrollbar-hide">
            <ToggleItem 
              label="Casal" 
              description="Controle financeiro conjunto" 
              isActive={localModules.casal} 
              onToggle={() => handleToggle('casal')} 
            />
            <ToggleItem 
              label="Metas" 
              description="Objetivos e sonhos financeiros" 
              isActive={localModules.metas} 
              onToggle={() => handleToggle('metas')} 
            />
            <ToggleItem 
              label="Relatórios" 
              description="Gráficos e visão geral" 
              isActive={localModules.relatorios} 
              onToggle={() => handleToggle('relatorios')} 
            />
            <ToggleItem 
              label="Orçamentos" 
              description="Limites de gastos mensais" 
              isActive={localModules.orcamentos} 
              onToggle={() => handleToggle('orcamentos')} 
            />
            <ToggleItem 
              label="Assinaturas" 
              description="Controle de gastos recorrentes" 
              isActive={localModules.assinaturas} 
              onToggle={() => handleToggle('assinaturas')} 
            />
            <ToggleItem 
              label="Planejador" 
              description="Projeções futuras e inteligência" 
              isActive={localModules.planejador} 
              onToggle={() => handleToggle('planejador')} 
            />
            <ToggleItem 
              label="Calendário" 
              description="Visão mensal de recebimentos e pagamentos" 
              isActive={localModules.calendario} 
              onToggle={() => handleToggle('calendario')} 
            />
          </div>

          <div className="mt-auto shrink-0 pt-4 border-t border-white/10 bg-neutral-900">
            <button 
              onClick={handleSave} 
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white w-full py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              <Save className="w-5 h-5" /> Salvar Preferências
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ToggleItem({ label, description, isActive, onToggle }: { label: string, description: string, isActive: boolean, onToggle: () => void }) {
  return (
    <div 
      onClick={onToggle}
      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${isActive ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-60'}`}
    >
      <div>
        <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-neutral-400'}`}>{label}</p>
        <p className="text-[11px] text-neutral-500 mt-0.5">{description}</p>
      </div>
      
      {/* Switch Style Toggle */}
      <div className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${isActive ? 'bg-indigo-500' : 'bg-neutral-700'}`}>
        <motion.div 
          initial={false}
          animate={{ x: isActive ? 24 : 0 }}
          className="w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </div>
    </div>
  );
}
