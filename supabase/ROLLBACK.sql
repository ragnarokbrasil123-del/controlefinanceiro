-- =============================================================================
-- Nexa (controlefinanceiro) — ROLLBACK das migrações
-- 2026-10-03
--
-- ⚠️  NÃO RODE ESTE ARQUIVO INTEIRO.
--
-- Ele é um CATÁLOGO: cada bloco desfaz UMA migração. Copie apenas o bloco que
-- você precisa reverter, leia o aviso dele e rode só aquilo.
--
-- POR QUE ISTO EXISTE
--   Até aqui as migrações só avançavam. Se alguma quebrasse em produção, a
--   única saída seria improvisar SQL com o app no ar — que é exatamente a hora
--   em que ninguém pensa direito.
--
-- A REGRA QUE IMPORTA
--   Reverter uma migração que CRIOU coluna ou tabela APAGA os dados que
--   estiverem nela. Não há como desfazer um DROP. Antes de qualquer bloco
--   marcado com [DESTRUTIVO], exporte:
--
--     -- no SQL Editor, com o resultado em CSV pelo botão "Download"
--     select * from public.<tabela>;
--
--   O app também tem exportação completa em Ajustes → Seus dados.
-- =============================================================================


-- =============================================================================
-- [DESTRUTIVO] Reverter 2026-10-02-beta-fechado.sql
--   Perde: todos os convites, feedbacks e registros de erro.
--   Mantém: contas, lançamentos, dívidas — nada disso está nessas tabelas.
--   Efeito no app: o BetaGate falha aberto (por desenho) e libera o acesso.
-- =============================================================================
/*
drop function if exists public.redeem_beta_invite(text);
drop function if exists public.has_beta_access();
drop table if exists public.beta_invites;
drop table if exists public.feedback;
drop table if exists public.error_log;
alter table public.profiles
  drop column if exists accepted_terms_at,
  drop column if exists accepted_terms_version;
*/


-- =============================================================================
-- [DESTRUTIVO] Reverter 2026-10-01-admin-stats.sql
--   Perde: nada. São só funções de leitura.
--   Efeito no app: /admin volta a avisar que falta rodar o SQL.
-- =============================================================================
/*
drop function if exists public.admin_user_stats();
drop function if exists public.admin_platform_totals();
*/


-- =============================================================================
-- [DESTRUTIVO] Reverter 2026-10-01-fase-4-budgets-mensal.sql
--   Perde: a competência de cada orçamento. Como a coluna volta a ser
--   integer, os valores 'YYYY-MM' NÃO cabem e são zerados.
--   Efeito no app: BudgetModal filtra por month e não acha nada.
--
--   ANTES: select category, amount, month from public.budgets;  -> salve o CSV
-- =============================================================================
/*
drop index if exists budgets_user_category_month_idx;
drop index if exists budgets_user_month_idx;
alter table public.budgets drop constraint if exists budgets_month_format_check;
alter table public.budgets alter column month type integer using null;
*/


-- =============================================================================
-- [DESTRUTIVO] Reverter 2026-10-01-fase-1.sql
--   Perde: TODAS as dívidas, pagamentos, histórico de conselhos da IA,
--   correções de categoria aprendidas e contadores de uso.
--   Efeito no app: a tela de Dívidas abre vazia; o estágio volta a usar
--   profiles.has_debt.
--
--   ANTES: select * from public.debts;          -> salve o CSV
--          select * from public.debt_payments;  -> salve o CSV
-- =============================================================================
/*
drop table if exists public.debt_payments;   -- antes de debts: tem FK
drop table if exists public.debts;
drop table if exists public.advice_history;
drop table if exists public.category_corrections;
drop table if exists public.ai_rate_limits;
*/


-- =============================================================================
-- [DESTRUTIVO] Reverter 2026-09-30-investimentos.sql
--   Perde: todas as posições de patrimônio.
--   Efeito no app: a tela de Patrimônio abre vazia e o estágio 4 volta a usar
--   a soma dos aportes lançados.
--
--   ANTES: select * from public.investments;  -> salve o CSV
-- =============================================================================
/*
drop trigger if exists trg_investments_touch on public.investments;
drop table if exists public.investments;
*/


-- =============================================================================
-- [DESTRUTIVO] Reverter 2026-09-29-perfil-financeiro.sql
--   Perde: renda declarada, estratégia, tipo de renda, objetivo e o registro
--   de quem já fez o onboarding — todo mundo refaz as 4 perguntas.
--   Efeito no app: os limites voltam aos padrões conservadores.
--
--   NÃO remove o trigger de criação de profiles: sem ele, cadastro novo fica
--   sem linha em profiles e o usuário entra quebrado. Deixe-o.
-- =============================================================================
/*
alter table public.profiles
  drop column if exists monthly_income,
  drop column if exists income_type,
  drop column if exists strategy,
  drop column if exists has_debt,
  drop column if exists main_goal,
  drop column if exists onboarded_at;
*/


-- =============================================================================
-- ⛔ 2026-08-16-critical-security-fixes.sql — NÃO REVERTA
--
-- Esse arquivo habilita a RLS e a trava anti-escalada de admin. Desfazê-lo
-- deixaria QUALQUER usuário logado ler os dados financeiros de todos os
-- outros pela REST API, e se promover a administrador.
--
-- Se algo nele estiver atrapalhando, ajuste a policy específica — nunca
-- desligue a RLS da tabela.
-- =============================================================================
