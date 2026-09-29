# Contexto do Projeto — Nexa (Controle Financeiro)

> Cole este documento inteiro no início da conversa com qualquer IA (ChatGPT, Claude,
> Cursor, Copilot, Gemini) antes de pedir alterações no código. Ele descreve o projeto
> exatamente como ele é hoje — incluindo os defeitos conhecidos, para que a IA não os
> "descubra" de novo nem os replique.

---

## 1. O que é o produto

**Nexa** é um app de controle financeiro pessoal em português do Brasil, com recursos
de IA e um módulo para casais. É um SaaS em desenvolvimento, single-tenant por usuário,
usado principalmente no celular (é um PWA instalável).

Funcionalidades que existem hoje:

- Lançamento de receitas e despesas, com parcelamento e recorrência
- Múltiplas carteiras/contas, com filtro do dashboard por carteira
- Categorias fixas + categorias personalizadas por usuário
- Marcar despesa como paga/pendente, com alerta de contas a vencer
- Leitura de recibo/comprovante PIX por foto, via IA (OCR + extração estruturada)
- Conselho financeiro gerado por IA a partir dos números do mês
- Orçamento por categoria, com sugestão automática por IA (regra 50/30/20)
- Metas de economia (individuais e de casal)
- Módulo Casais: patrimônio conjunto, reserva de emergência, metas compartilhadas
- Relatórios com gráficos e exportação em PDF
- Painel administrativo (`/admin`) para o dono do produto

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Linguagem | TypeScript (`strict: true`) |
| Estilo | Tailwind CSS v4, tema dark, mobile-first |
| Backend | Supabase — Auth, Postgres e Storage |
| IA | Google Gemini (`gemini-flash-latest`) via REST direto, sem SDK |
| Animação | `motion` (Framer Motion v12) |
| Gráficos | `recharts` · PDF: `jspdf` · Ícones: `lucide-react` |

**Não há:** testes, middleware, state manager global, ORM, CI, Docker.
**Não é repositório Git** (situação a corrigir).

---

## 3. Estrutura de arquivos

```
app/
  page.tsx              Dashboard principal (~646 linhas) — o coração do app
  login/page.tsx        Login, cadastro e recuperação de senha
  casais/page.tsx       Módulo Casais (página separada)
  admin/page.tsx        Painel administrativo
  layout.tsx            Layout raiz: fontes, BottomNav, InstallPrompt, Toast
  manifest.ts           Manifest PWA gerado pelo Next
  globals.css           Só um @import do Tailwind
  api/
    extract/route.ts      POST — recebe imagem, devolve array de transações (IA)
    advisor/route.ts      POST — recebe totais do mês, devolve conselho em Markdown
    auto-budget/route.ts  POST — recebe renda, devolve orçamento em JSON

components/             24 modais + BottomNav + Toast + InstallPrompt
lib/
  supabase.ts           Client singleton do Supabase
  utils.ts              Só o helper `cn()` (clsx + tailwind-merge)
  types.ts              ⚠️ ARQUIVO MORTO — ver seção 9
hooks/use-mobile.ts     Detecta viewport < 768px
supabase/               SQL de segurança (RLS) — rodar manualmente no painel
public/                 Ícones, manifest.json, sw.js
```

---

## 4. Schema do banco (Supabase / Postgres)

Todas as tabelas têm `id` (uuid) e `user_id` (uuid, dono da linha).
**Todas são protegidas por RLS: cada usuário só enxerga as próprias linhas.**

### `transactions` — tabela central
| Coluna | Tipo | Observação |
|---|---|---|
| `user_id` | uuid | dono |
| `title` | text | nome do lançamento |
| `amount` | numeric | **sempre positivo**; o sinal vem do `type` |
| `type` | text | `'income'` ou `'expense'` |
| `category` | text | ver categorias abaixo |
| `date` | date | formato `YYYY-MM-DD` |
| `is_paid` | boolean | `false` = pendente (só faz sentido em despesa) |
| `installment_group` | uuid \| null | agrupa parcelas da mesma compra |
| `installment_info` | text \| null | ex.: `"3/12"` |
| `is_split` | boolean | despesa dividida com o parceiro(a) |
| `wallet_id` | uuid \| null | carteira de origem |
| `receipt_url` | text \| null | comprovante no Storage |

### `wallets`
`name`, `type`, `balance` (o `balance` existe mas **não é atualizado** pelo app — os saldos são calculados somando transações).

### `categories`
Categorias personalizadas do usuário: `name`, `type`.

### `profiles`
`id` (= id do usuário no Auth), `role` (`'client'` ou `'admin'`), `created_at`.

### `budgets`
`category`, `amount`. ⚠️ **Não tem coluna de mês/período** — o orçamento é global, não
mensal. Ao salvar, o app apaga todos os budgets do usuário e reinsere.

### `goals`
`title`, `target_amount`, `current_amount`, `created_at`.

### `couple_settings`
`joint_wealth`, `emergency_fund`, `house_expenses`. Uma linha por usuário.

### `couple_goals`
`title`, `target_amount`, `current_amount`, `color`, `created_at`.

### Storage
Bucket `receipts` — comprovantes, salvos em `{user_id}/{timestamp}.{ext}`.

### Categorias (valores string, não enum no banco)

As rotas de IA são instruídas a usar **obrigatoriamente** estes valores:

- **Despesa:** `Contas Fixas` · `Variáveis` · `Cartões` · `Investimentos`
- **Receita:** `Salário` · `Renda Extra`

⚠️ O dashboard também aceita `Cartões de Crédito` como sinônimo legado de `Cartões`.
Usuários podem criar categorias próprias, que convivem com essas.

---

## 5. Como a aplicação funciona (arquitetura real)

### Tudo é client-side
Praticamente todo componente começa com `"use client"`. **Não há Server Components
buscando dados, nem `middleware.ts`.** O padrão repetido em todo lugar é:

```ts
const { data: { session } } = await supabase.auth.getSession();
if (!session) { window.location.href = '/login'; return; }
const { data } = await supabase.from('tabela').select('*').eq('user_id', session.user.id);
```

Esse bloco aparece **21 vezes em 13 arquivos**. Cada modal busca os próprios dados no
`useEffect` quando abre.

### Proteção de rota
Feita com `window.location.href` no navegador — ou seja, **cosmética**. A proteção real
dos dados é a RLS no Postgres. Ao sugerir mudanças, não confie no redirect do client.

### Comunicação entre BottomNav e Dashboard
O menu inferior (mobile) **não usa rotas**. Ele dispara um evento no `window`:

```ts
// components/BottomNav.tsx
window.dispatchEvent(new CustomEvent('openModal', { detail: 'relatorios' }));

// app/page.tsx — escuta e abre o modal correspondente
window.addEventListener('openModal', handleOpenModal);
```

Nomes aceitos: `casais`, `relatorios`, `config`, `manual`, `camera`.

### Estado
Só `useState` local. O dashboard tem ~20 flags booleanas de modal (`isModalOpen`,
`isReportsOpen`, …). Não há Context, Redux ou Zustand.

### As rotas de API existem por um motivo só: esconder a chave do Gemini
Elas não são uma camada de negócio. Todas as três seguem o mesmo formato:

1. Lê o header `Authorization: Bearer <token>`
2. Valida com `supabase.auth.getUser(token)` — devolve 401 se inválido
3. Monta o prompt e chama a REST API do Gemini
4. Limpa a resposta (remove ```json e blocos `<thought>`) e devolve

O frontend chama assim:

```ts
const { data: { session } } = await supabase.auth.getSession();
await fetch('/api/extract', {
  method: 'POST',
  headers: { Authorization: `Bearer ${session.access_token}` },
  body: formData,
});
```

### Cálculos financeiros
Ficam **dentro do JSX**, em `app/page.tsx`. O mês é filtrado no navegador com
manipulação de string:

```ts
const [year, month] = t.date.split('-');
return (parseInt(month) - 1) === activeMonth && parseInt(year) === activeYear;
```

Regra não óbvia em `sumCategory` (app/page.tsx): para a categoria `Investimentos` o
valor **sempre soma**; nas demais, despesa soma e receita **subtrai**.

### Parcelamento
No `TransactionModal`, ao marcar parcelado, o app gera N linhas em `transactions` de uma
vez (um `insert` com array), todas com o mesmo `installment_group`. Apenas a primeira
nasce com `is_paid` conforme o usuário escolheu; as demais nascem `false`. Ao excluir, o
app pergunta se quer apagar a série inteira a partir daquela data.

Há um ajuste de fuso na criação das datas — **mantenha-o**:
```ts
startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
```

---

## 6. Convenções de código a seguir

- **Idioma:** UI, mensagens de erro e comentários em **português do Brasil**. Nomes de
  variáveis e funções em inglês (`handleSubmit`, `formatMoney`) — padrão misto já existente.
- **Modais:** um arquivo por modal em `components/`, exportado como *named export*
  (`export function XModal`), com props `{ isOpen, onClose, onSave? }`. Envolvidos em
  `<AnimatePresence>` + `motion.div`, fundo `bg-black/60 backdrop-blur-sm`, card
  `bg-neutral-900 border border-white/10 rounded-3xl`.
- **Feedback ao usuário:** sempre `toast(mensagem, "success" | "error" | "warning" | "info")`
  importado de `components/Toast`. Nunca `alert()`.
- **Visual:** fundo `neutral-950`, texto branco, cantos `rounded-2xl`/`rounded-3xl`,
  cores por contexto — indigo (padrão), emerald (receita), rose (despesa), amber
  (pendente), pink (casais).
- **Dinheiro:** `amount` é sempre positivo no banco; o sinal é semântico, via `type`.

---

## 7. Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=            # apenas servidor — nunca expor ao cliente
```

⚠️ Hoje a URL e a anon key do Supabase estão **hardcoded como fallback** em 4 arquivos
(`lib/supabase.ts` e as 3 rotas de API). É um defeito conhecido — ver seção 9.

---

## 8. Segurança — o que já está resolvido

O arquivo `supabase/2026-08-16-critical-security-fixes.sql` (rodado manualmente no painel
do Supabase) implementa:

- RLS em `transactions`, `profiles`, `couple_goals`, `couple_settings`
- Função `is_admin(uid)` como `SECURITY DEFINER`, para evitar recursão de RLS
- Trigger `prevent_self_role_escalation` — impede um usuário de se promover a admin
- Exceção explícita de leitura para admins (necessária para o painel `/admin`)

**Regra ao alterar o banco:** toda tabela nova precisa de RLS por `user_id` desde o
início. Nunca confie em filtro feito só no frontend.

---

## 9. Defeitos conhecidos — NÃO replicar, NÃO reportar como novidade

1. **`lib/types.ts` está morto e descreve um schema falso.** Define `Transaction` com
   campos `value`, `clientName`, `description`, que **não existem** no banco (o real usa
   `amount`, `title`). As categorias listadas nele (`Alimentação`, `Transporte`) também
   são falsas. Nenhum arquivo o importa. **Ignore esse arquivo** — use a seção 4 como
   fonte de verdade.
2. **Credenciais hardcoded como fallback** em 4 arquivos.
3. **`formatMoney` reimplementado 4 vezes**, em 8 arquivos, com resultados divergentes:
   `toFixed(2).replace('.', ',')` → `R$ 1500,50` · `toLocaleString('pt-BR')` → `R$ 1.500,50`.
4. **Nenhuma query tem `limit`** — o dashboard baixa o histórico inteiro do usuário.
5. **`/admin` não escala:** baixa todas as transações de todos os usuários e agrega no
   navegador. Os emails exibidos são falsos (`user-a3f9c2d1`), por falta de service role.
6. **Recibos usam `getPublicUrl()`** em vez de URL assinada.
7. **Rotas de IA sem rate limit.**
8. **~50 usos de `any`** — não há tipos gerados do Supabase.
9. **Service worker é fachada:** `public/sw.js` intercepta `fetch` e não faz nada. O app
   **não funciona offline**, apesar de se anunciar como PWA.
10. **Dois manifests conflitantes:** `app/manifest.ts` e `public/manifest.json` divergem
    em nome e cor; o layout aponta para o segundo.
11. **ESLint desligado no build** (`ignoreDuringBuilds: true` em `next.config.ts`).
12. **Zoom bloqueado** (`userScalable: false`) — barreira de acessibilidade.
13. **`package.json` ainda se chama `ai-studio-applet`** e o README é o boilerplate do
    Google AI Studio. O projeto nasceu de um template e a identidade não foi atualizada.

---

## 10. Como trabalhar neste projeto

**Ao propor mudanças:**

- Mantenha o padrão de modal existente; não introduza biblioteca de UI nova (shadcn,
  MUI) sem ser pedido.
- Não converta tudo para Server Components de uma vez. Se for migrar, faça por rota.
- Não invente colunas: confira a seção 4. Se precisar de uma coluna nova, diga
  explicitamente qual `ALTER TABLE` é necessário — o dono roda o SQL à mão no painel.
- Toda tabela nova precisa de policy de RLS junto.
- Não coloque a `GEMINI_API_KEY` em código de cliente.
- Não remova o ajuste de `getTimezoneOffset()` no cálculo de parcelas.
- Ao mexer em dinheiro, lembre que `amount` é positivo e o sinal vem de `type`.
- Prefira consolidar duplicação existente (`formatMoney`, o bloco de `getSession`) a
  criar mais uma cópia.

**Comandos:**
```bash
npm install
npm run dev      # desenvolvimento
npm run build    # produção
npm run lint     # ESLint (não roda no build hoje)
```

**Não existem testes.** Se escrever algum, proponha o framework junto — não há nada
instalado.
