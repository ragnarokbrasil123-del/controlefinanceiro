/**
 * Flags de funcionalidade.
 *
 * AI_ENABLED controla tudo que depende do Google Gemini: leitura de recibo por
 * foto, conselheiro financeiro e orçamento automático.
 *
 * O padrão é DESLIGADO de propósito. Assim o app sobe e funciona sem a
 * GEMINI_API_KEY, e nenhum botão leva o usuário a uma tela que só devolve erro.
 * Para ligar, defina as duas variáveis no ambiente de deploy:
 *
 *   NEXT_PUBLIC_AI_ENABLED=true    (mostra os botões no cliente)
 *   GEMINI_API_KEY=...             (usada só no servidor)
 *
 * São duas porque o cliente não enxerga GEMINI_API_KEY — ela nunca pode ser
 * exposta ao navegador. A flag pública é só o interruptor visual; as rotas
 * validam a chave de verdade por conta própria.
 */
export const AI_ENABLED = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';
