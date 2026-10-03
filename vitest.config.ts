import { defineConfig } from 'vitest/config';

/**
 * Testes só da camada de regra de negócio (`lib/`), que é feita de funções
 * puras sem I/O. Não há ambiente de DOM aqui de propósito: componente não é
 * alvo desta configuração, e manter o escopo estreito faz a suíte rodar em
 * menos de um segundo — o que importa para ela ser realmente executada.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    // e2e roda no Playwright, nao aqui — sem isto o vitest tenta executar
    // os .spec.ts e falha por falta do runner dele.
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
