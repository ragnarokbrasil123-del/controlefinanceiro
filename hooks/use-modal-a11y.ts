import { useEffect, useRef } from 'react';

/**
 * Acessibilidade de modal: Esc, focus trap e devolução do foco.
 *
 * A varredura encontrou 1 atributo aria no app inteiro e nenhum modal que
 * fechasse com Esc. Pior: sem focus trap, o teclado continuava navegando pelos
 * elementos ATRÁS do modal aberto — quem usa teclado ou leitor de tela ficava
 * perdido, clicando em coisas invisíveis.
 *
 * Uso:
 *   const ref = useModalA11y(isOpen, onClose);
 *   <motion.div ref={ref} role="dialog" aria-modal="true" aria-label="...">
 */
export function useModalA11y(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Guarda quem tinha o foco para devolver ao fechar: sem isso o usuário de
    // teclado volta para o começo da página a cada modal.
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

    // Foca o primeiro elemento útil, não o container.
    const first = focusables()[0];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;

      // Circula dentro do modal em vez de escapar para a página.
      if (e.shiftKey && active === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    // Impede a página de rolar atrás do modal.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  return containerRef;
}
