"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    // Verificar se já está instalado (standalone)
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isPwa);

    if (isPwa) return;

    // Detectar iOS
    const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase()) && !(window as any).MSStream;
    
    if (isIos) {
      // Mostrar aviso para iOS depois de alguns segundos
      const timer = setTimeout(() => setShowIosPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: Escutar evento de instalação
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowAndroidPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {/* Aviso Android */}
      {showAndroidPrompt && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-neutral-900 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 rounded-2xl p-5 z-50 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Instalar Aplicativo</h3>
              <p className="text-xs text-neutral-400">Tenha o Nexa na sua tela inicial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstallClick}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors"
            >
              Instalar
            </button>
            <button 
              onClick={() => setShowAndroidPrompt(false)}
              className="text-neutral-500 hover:text-white p-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Aviso iOS */}
      {showIosPrompt && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-xl border-t border-white/10 p-6 z-[100] pb-10"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-white text-lg">Instalar no iPhone</h3>
              <p className="text-sm text-neutral-400 mt-1">Instale o Nexa para ter a experiência completa de aplicativo.</p>
            </div>
            <button 
              onClick={() => setShowIosPrompt(false)}
              className="bg-white/5 p-2 rounded-full text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
              <div className="bg-indigo-500/20 p-2 rounded-lg">
                <Share className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-sm text-white">1. Toque no botão de <strong>Compartilhar</strong> na barra inferior do Safari.</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <PlusSquare className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm text-white">2. Role para baixo e escolha <strong>Adicionar à Tela de Início</strong>.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
