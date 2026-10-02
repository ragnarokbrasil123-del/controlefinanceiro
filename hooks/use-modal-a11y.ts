import { useEffect, useRef } from 'react';

/**
 * Comportamento compartilhado de modal: Esc, focus trap, devolução do foco e
 * botão voltar do Android.
 *
 * ACESSIBILIDADE
 * A varredura encontrava 1 atributo aria no app inteiro e nenhum modal que
 * fechasse com Esc. Sem focus trap, o teclado continuava navegando pelos
 * elementos ATRÁS do modal aberto.
 *
 * BOTÃO VOLTAR
 * Como o app é todo feito de modais e não de rotas, o voltar do Android
 * fechava o APP inteiro em vez do modal — o usuário achava que tinha perdido
 * o que estava fazendo. Aqui cada modal aberto empurra uma entrada no
 * histórico e se fecha no popstate.
 *
 * Isto não substitui rotas de verdade (não dá URL própria nem link
 * compartilhável), mas resolve o atrito que se sente todo dia.
 *
 * Uso:
 *   const ref = useModalA11y(isOpen, onClose);
 *   <motion.div ref={ref} role="dialog" aria-modal="true" aria-label="...">
 */
export function useModalA11y(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // `onClose` costuma ser uma arrow inline — identidade nova a cada render.
  // Se ela entrasse nas dependências, o efeito reexecutaria sem parar e
  // empilharia uma entrada de histórico por render. A ref mantém a função
  // sempre atual sem disparar o efeito.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement;

    const focusables = () => {
      const node = containerRef.current;
      if (!node) return [] as HTMLElement[];
      return Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(el => el.offsetParent !== null);
    };

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    // --- botão voltar ---
    let closedByBackButton = false;
    const onPopState = () => {
      closedByBackButton = true;
      onCloseRef.current();
    };

    window.history.pushState({ nexaModal: true }, '');
    window.addEventListener('popstate', onPopState);
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();

      // Fechou pelo X, Esc ou clique fora: a entrada que empurramos continua
      // no histórico e precisa sair, senão o usuário teria que apertar voltar
      // duas vezes para sair da tela.
      if (!closedByBackButton) window.history.back();
    };
  }, [isOpen]);

  return containerRef;
}
