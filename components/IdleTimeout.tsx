"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

/**
 * Encerra a sessão após inatividade.
 *
 * A sessão do Supabase se renova sozinha indefinidamente enquanto a aba
 * existir. Num app financeiro aberto no celular de alguém, ou num computador
 * compartilhado, isso significa conta aberta para sempre.
 *
 * O aviso antes de deslogar é o que torna isto aceitável: sair sem avisar, no
 * meio de um lançamento, seria pior que o problema que resolve.
 *
 * 30 minutos é folgado de propósito. Tempo curto em app de uso esporádico só
 * irrita e ensina o usuário a ignorar o aviso.
 */

const INATIVIDADE_MS = 30 * 60 * 1000;
const AVISO_SEGUNDOS = 60;

const EVENTOS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

export function IdleTimeout() {
  const [avisando, setAvisando] = useState(false);
  const [segundos, setSegundos] = useState(AVISO_SEGUNDOS);
  const [saindo, setSaindo] = useState(false);

  // Espelha o estado para os listeners não capturarem um valor velho.
  const avisandoRef = useRef(false);
  avisandoRef.current = avisando;

  // Momento da última interação. Um único relógio verificando periodicamente é
  // mais simples e mais robusto que reagendar timeouts a cada clique.
  const ultimaAtividade = useRef(Date.now());

  useEffect(() => {
    let cancelado = false;
    let intervalo: ReturnType<typeof setInterval> | null = null;

    const registrarAtividade = () => {
      // Durante o aviso, mexer no mouse não cancela: a pessoa precisa clicar
      // em "Continuar". Cancelar por acaso um aviso que ela nem viu derrota
      // o propósito.
      if (!avisandoRef.current) ultimaAtividade.current = Date.now();
    };

    const sair = async () => {
      setSaindo(true);
      await supabase.auth.signOut();
      window.location.href = '/login';
    };

    const verificar = () => {
      if (cancelado) return;
      const parado = Date.now() - ultimaAtividade.current;

      if (!avisandoRef.current) {
        if (parado >= INATIVIDADE_MS) {
          setAvisando(true);
          setSegundos(AVISO_SEGUNDOS);
        }
        return;
      }

      const restante = Math.ceil((INATIVIDADE_MS + AVISO_SEGUNDOS * 1000 - parado) / 1000);
      if (restante <= 0) { void sair(); return; }
      setSegundos(restante);
    };

    // Só vigia quem está logado: na tela de login não há sessão para expirar.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || cancelado) return;

      ultimaAtividade.current = Date.now();
      EVENTOS.forEach(ev => window.addEventListener(ev, registrarAtividade, { passive: true }));
      intervalo = setInterval(verificar, 1000);
    });

    return () => {
      cancelado = true;
      if (intervalo) clearInterval(intervalo);
      EVENTOS.forEach(ev => window.removeEventListener(ev, registrarAtividade));
    };
  }, []);

  const continuar = () => {
    ultimaAtividade.current = Date.now();
    setAvisando(false);
    setSegundos(AVISO_SEGUNDOS);
  };

  return (
    <AnimatePresence>
      {avisando && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="idle-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-neutral-900 border border-amber-500/25 rounded-3xl p-6 shadow-2xl text-center"
          >
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>

            <h2 id="idle-title" className="text-lg font-bold text-white mb-2">Ainda está aí?</h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-1">
              Por segurança, vamos encerrar sua sessão em{' '}
              <strong className="text-amber-400 tabular-nums">{segundos}s</strong>.
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed mb-6">
              Nada do que você lançou se perde.
            </p>

            <button
              onClick={continuar}
              disabled={saindo}
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saindo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar conectado'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
