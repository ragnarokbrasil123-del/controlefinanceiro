import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

/**
 * Testes de fumaça — cada tela carrega sem quebrar?
 *
 * Só leitura. Nenhum teste aqui cria, edita ou apaga dado: o banco de
 * desenvolvimento é o mesmo de produção, e teste que suja dado de cliente é
 * pior que teste nenhum.
 */

/** Ruído conhecido que não indica defeito do app. */
const RUIDO_ESPERADO = [
  'Download the React DevTools',
  'Content Security Policy',   // a CSP está em modo relatório de propósito
  'favicon',
  'manifest',
  'sw.js',
  'ServiceWorker',
  'Failed to load resource',   // recursos externos (fontes, ícones) em ambiente de teste
  '[BetaGate]',                // aviso proposital quando o SQL do beta não rodou
];

/** Coleta erros de console reais, ignorando o ruído acima. */
function coletarErros(page: Page): string[] {
  const erros: string[] = [];

  const registrar = (texto: string) => {
    if (RUIDO_ESPERADO.some(r => texto.includes(r))) return;
    erros.push(texto);
  };

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') registrar(msg.text());
  });

  // Exceção não capturada é o que produz tela branca — o pior modo de falha,
  // porque o usuário não vê mensagem nenhuma e simplesmente não volta.
  page.on('pageerror', err => registrar(`pageerror: ${err.message}`));

  return erros;
}

/** Tela branca: body sem conteúdo visível. */
async function temConteudo(page: Page): Promise<boolean> {
  const texto = await page.locator('body').innerText().catch(() => '');
  return texto.trim().length > 20;
}

const ROTAS_PUBLICAS = [
  { caminho: '/login',            contem: 'Nexa' },
  { caminho: '/termos',           contem: 'Termos de Uso' },
  { caminho: '/privacidade',      contem: 'Privacidade' },
  { caminho: '/recuperar-senha',  contem: null },
];

for (const rota of ROTAS_PUBLICAS) {
  test(`carrega ${rota.caminho} sem erro`, async ({ page }) => {
    const erros = coletarErros(page);

    const resposta = await page.goto(rota.caminho, { waitUntil: 'networkidle' });
    expect(resposta?.status(), `${rota.caminho} respondeu ${resposta?.status()}`).toBeLessThan(400);

    expect(await temConteudo(page), `${rota.caminho} renderizou em branco`).toBe(true);
    if (rota.contem) await expect(page.locator('body')).toContainText(rota.contem);

    expect(erros, `erros no console em ${rota.caminho}`).toEqual([]);
  });
}

test('a raiz redireciona para o login quando não há sessão', async ({ page }) => {
  const erros = coletarErros(page);

  await page.goto('/', { waitUntil: 'networkidle' });
  // O dashboard manda para /login quando não encontra sessão. Esperar pela URL
  // é mais confiável que dormir um tempo fixo.
  await page.waitForURL(/\/login/, { timeout: 15_000 });

  expect(await temConteudo(page)).toBe(true);
  expect(erros).toEqual([]);
});

test('o formulário de login está utilizável', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'networkidle' });

  // Campos presentes e habilitados — não preenche nem envia nada.
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /entrar/i }).first()).toBeEnabled();
});

test('as páginas legais se referenciam', async ({ page }) => {
  // A política promete direitos que os termos mencionam; link quebrado entre
  // as duas é problema de conformidade, não de navegação.
  await page.goto('/termos', { waitUntil: 'networkidle' });
  await expect(page.locator('a[href="/privacidade"]')).toBeVisible();

  await page.goto('/privacidade', { waitUntil: 'networkidle' });
  await expect(page.locator('a[href="/termos"]')).toBeVisible();
});

test('a saúde do app responde', async ({ request }) => {
  const r = await request.get('/api/health');
  const body = await r.json();

  expect([200, 503]).toContain(r.status());
  expect(body).toHaveProperty('status');
  expect(body).toHaveProperty('checks');

  // Nunca pode vazar o valor de uma variável de ambiente — só se ela existe.
  const texto = JSON.stringify(body);
  expect(texto).not.toMatch(/eyJ|supabase\.co|AIza/);
});

test('as rotas de IA exigem autenticação', async ({ request }) => {
  // Sem token, nenhuma delas pode responder 200 — é o que impede alguém de
  // queimar a cota do Gemini de fora.
  for (const rota of ['/api/advisor', '/api/auto-budget']) {
    const r = await request.post(rota, { data: {}, failOnStatusCode: false });
    expect([401, 503], `${rota} respondeu ${r.status()} sem token`).toContain(r.status());
  }
});

test('não há barra de rolagem horizontal no celular', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'só no projeto mobile');

  await page.goto('/login', { waitUntil: 'networkidle' });

  // Estouro horizontal foi exatamente a queixa de "vazando a tela do celular".
  const estoura = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(estoura, 'a página passa da largura da tela').toBe(false);
});
