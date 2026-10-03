import { defineConfig, devices } from '@playwright/test';

/**
 * Testes de fumaça: abrem cada tela e confirmam que ela carrega.
 *
 * Os 151 testes de unidade cobrem os CÁLCULOS. Nenhum cobria a ligação entre
 * cálculo e tela — e foi exatamente ali que apareceram os dois erros que o
 * usuário encontrou clicando: o painel admin mostrando UUID e o perfil
 * espremido. Ambos passaram por toda a suíte.
 *
 * Tela branca é o pior modo de falha de todos: a pessoa não vê mensagem, não
 * entende o que houve e não volta. Capturar isso automaticamente é o maior
 * ganho por esforço que existe hoje.
 *
 * ESCOPO DELIBERADO: só leitura. Nenhum teste cria, edita ou apaga dado,
 * porque o banco de desenvolvimento é o MESMO de produção — teste que suja
 * dado de cliente é pior que teste nenhum. Quando houver um Supabase separado
 * para staging, dá para cobrir os fluxos de escrita.
 */
export default defineConfig({
  testDir: './e2e',
  // Sem paralelismo: um único servidor de desenvolvimento atendendo tudo.
  workers: 1,
  // Em CI, falha se alguém esquecer um .only e mascarar a suíte inteira.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3100',
    trace: 'retain-on-failure',
    // Headless sempre: isto roda em CI e em terminal, nunca em tela.
    headless: true,
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // O app é mobile-first e os dois bugs de layout de hoje eram de celular.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  // Sobe o app sozinho quando não houver um endereço externo configurado.
  //
  // Usa o BUILD DE PRODUÇÃO, não o servidor de desenvolvimento. O dev compila
  // cada rota no primeiro acesso, e isso estourava o tempo dos testes em
  // falhas que não existiam no app — "/api/health não responde" quando ele
  // respondia em milissegundos fora do teste.
  //
  // Testar o build também é mais fiel: é o mesmo artefato que vai para a
  // Vercel.
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run build && npm start -- -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://exemplo.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'chave-falsa',
    },
  },
});
