# Nexa — Controle Financeiro

App de controle financeiro pessoal em português, com foco em **construção de
patrimônio** e controle do gasto com cartões. PWA instalável, mobile-first.

## O que faz

- Lançamento de receitas e despesas, com parcelamento e recorrência
- Múltiplas carteiras, categorias personalizadas, contas a vencer
- **Perfil financeiro adaptativo** — o app classifica o usuário em 5 estágios
  (Emergência → Estabilidade → Reserva → Acumulação → Independência) e calibra
  limites e metas ao caso dele, em vez de usar constantes universais
- Reserva de emergência calculada sobre o custo de vida real (3–6 meses, ou
  6–12 se a renda for variável)
- Gestão de cartões separando fatura do mês de parcelas futuras
- Leitura de recibo e comprovante PIX por foto, via IA
- Conselheiro financeiro por IA, ciente do estágio do usuário
- Orçamentos, metas e módulo para casais
- Relatórios com gráficos e exportação em PDF

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Auth + Postgres + Storage) · Google Gemini · Recharts · Motion

## Rodando localmente

**Pré-requisitos:** Node.js 20+ e um projeto Supabase.

```bash
npm install
cp .env.example .env.local   # preencha com as suas credenciais
npm run dev
```

O app sobe em `http://localhost:3000`.

### Variáveis de ambiente

| Variável | Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |
| `GEMINI_API_KEY` | Google AI Studio → API Keys (**apenas servidor**) |

O app falha na inicialização se as duas primeiras faltarem — de propósito, para
não conectar no projeto errado em silêncio.

### Banco de dados

Os scripts em [`supabase/`](supabase/) devem ser rodados **na ordem de data**,
pelo SQL Editor do painel Supabase. Todos são idempotentes.

| Script | O que faz |
|---|---|
| `2026-08-16-critical-security-fixes.sql` | RLS por dono em todas as tabelas, trigger anti-escalada de admin |
| `2026-09-29-perfil-financeiro.sql` | Colunas do perfil financeiro, criação automática de `profiles`, semente de renda |

> **Toda tabela nova precisa de RLS por `user_id` desde o início.** Filtro feito
> só no frontend não protege nada: a REST API do Supabase é acessível
> diretamente com a anon key.

## Scripts

```bash
npm run dev     # desenvolvimento
npm run build   # build de produção
npm run lint    # ESLint
```

> Não rode `npm run build` com o `npm run dev` ativo — os dois escrevem em
> `.next` e o cache corrompe. Se acontecer: `rm -rf .next` e reinicie.

## Arquitetura

Aplicação client-side: os componentes falam direto com o Supabase, e as rotas
em `app/api/` existem apenas para manter a chave do Gemini fora do navegador.

Arquivos centrais:

- [`app/page.tsx`](app/page.tsx) — dashboard
- [`lib/profile.ts`](lib/profile.ts) — perfil financeiro, estágios e limites; é
  onde vive a regra de negócio, sem I/O e testável
- [`lib/api-auth.ts`](lib/api-auth.ts) — validação de JWT das rotas de IA
- [`CONTEXTO-IA.md`](CONTEXTO-IA.md) — schema completo e convenções do projeto
