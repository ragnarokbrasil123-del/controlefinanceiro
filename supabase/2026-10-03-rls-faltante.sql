-- =============================================================================
-- Nexa (controlefinanceiro) — RLS nas tabelas que ficaram de fora
-- 2026-10-03
--
-- 🔴 PRIORIDADE ALTA. Rode antes de convidar qualquer pessoa.
--
-- O QUE FOI ENCONTRADO
--   Uma auditoria comparando as tabelas que o app USA com as que têm RLS em
--   arquivo versionado revelou quatro sem nenhuma proteção documentada:
--
--     wallets · categories · goals · budgets
--
--   O arquivo de 2026-08-16 protegeu transactions, profiles, couple_goals e
--   couple_settings. Essas quatro nunca entraram em nenhum script.
--
-- POR QUE ISSO IMPORTA
--   A anon key do Supabase é PÚBLICA por desenho: ela vai no JavaScript que
--   chega ao navegador de qualquer visitante, e está no histórico do
--   repositório. Isso é normal — o que impede alguém de usá-la para ler os
--   dados dos outros é exclusivamente a RLS.
--
--   Sem RLS nessas tabelas, qualquer pessoa com a anon key pode listar, criar,
--   alterar e apagar as metas, orçamentos, carteiras e categorias de TODOS os
--   usuários, direto pela REST API, sem nem abrir o app.
--
--   Filtrar por user_id no código do frontend não protege nada: a requisição
--   sai do navegador e pode ser reescrita.
--
-- O CASO MAIS GRAVE: APAGAR O DADO DE OUTRA PESSOA
--   Várias telas apagam e editam usando SOMENTE o id, sem filtrar o dono:
--
--     WalletsModal.tsx:59          .delete().eq('id', id)
--     AccountManagerModal.tsx:67   .delete().eq('id', id)
--     AccountManagerModal.tsx:78   .update({ name }).eq('id', id)
--     CategoryManagerModal.tsx:61  .delete().eq('id', id)
--     GoalsModal.tsx:72            .update({ current_amount }).eq('id', id)
--     GoalsModal.tsx:86            .delete().eq('id', id)
--
--   Isso está CORRETO desde que a RLS exista: o banco recusa a linha que não é
--   sua, e o `.eq('id', ...)` sozinho basta. Sem RLS, a mesma linha de código
--   permite apagar a carteira ou a meta de qualquer usuário — basta um id. É a
--   diferença entre vazamento de leitura e destruição de dado.
--
--   Não mude esse código: ligue a RLS. Ela é a proteção que ele pressupõe.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PASSO 1 — DIAGNÓSTICO (rode isto primeiro)
--
-- Mostra quais tabelas estão desprotegidas AGORA. Se todas já vierem com
-- rowsecurity = true, a proteção foi ligada à mão em algum momento e este
-- arquivo só vai versionar o que já existe.
-- -----------------------------------------------------------------------------
select tablename,
       rowsecurity as rls_ligada,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = t.tablename) as politicas
from pg_tables t
where schemaname = 'public'
order by rowsecurity, tablename;

-- Atenção: `rls_ligada = true` com `politicas = 0` é o pior cenário possível —
-- a tabela fica inacessível até para o dono, e o app quebra em silêncio.


-- -----------------------------------------------------------------------------
-- PASSO 2 — CORREÇÃO
--
-- Idempotente: pode rodar quantas vezes quiser. Se a RLS já estiver ligada,
-- apenas garante que as quatro políticas existem com o nome esperado.
-- -----------------------------------------------------------------------------

-- wallets ---------------------------------------------------------------------
alter table public.wallets enable row level security;

drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own" on public.wallets for select
  using (auth.uid() = user_id);

drop policy if exists "wallets_insert_own" on public.wallets;
create policy "wallets_insert_own" on public.wallets for insert
  with check (auth.uid() = user_id);

drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_update_own" on public.wallets for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wallets_delete_own" on public.wallets;
create policy "wallets_delete_own" on public.wallets for delete
  using (auth.uid() = user_id);


-- categories ------------------------------------------------------------------
alter table public.categories enable row level security;

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories for select
  using (auth.uid() = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories for delete
  using (auth.uid() = user_id);


-- goals -----------------------------------------------------------------------
alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals for select
  using (auth.uid() = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals for delete
  using (auth.uid() = user_id);


-- budgets ---------------------------------------------------------------------
alter table public.budgets enable row level security;

drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own" on public.budgets for select
  using (auth.uid() = user_id);

drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own" on public.budgets for insert
  with check (auth.uid() = user_id);

drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own" on public.budgets for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own" on public.budgets for delete
  using (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- PASSO 3 — CONFERÊNCIA
--
-- Rode o diagnóstico do Passo 1 de novo. Toda tabela da lista precisa estar com
-- rls_ligada = true E politicas > 0.
-- -----------------------------------------------------------------------------


-- =============================================================================
-- E SE ALGUMA LINHA ESTIVER SEM user_id?
--
-- O código de hoje sempre grava `user_id` e aborta sem sessão, mas o banco é
-- antigo e pode ter linhas de versões anteriores sem dono. Elas ficam órfãs:
-- ninguém consegue lê-las depois da RLS, e continuam ocupando espaço.
--
--   -- quantas existem, em cada tabela:
--   select 'wallets'    as tabela, count(*) from public.wallets    where user_id is null
--   union all select 'categories', count(*) from public.categories where user_id is null
--   union all select 'goals',      count(*) from public.goals      where user_id is null
--   union all select 'budgets',    count(*) from public.budgets    where user_id is null;
--
--   -- se for mais que zero e você confirmar que são lixo, apague (uma a uma):
--   -- delete from public.budgets where user_id is null;
--
-- Confira antes de apagar: se alguma for sua, o orçamento correspondente
-- desaparece da tela.
-- =============================================================================


-- =============================================================================
-- TESTE DE SEGURANÇA — vale fazer depois
--
-- Com uma segunda conta (comum, sem convite), no SQL Editor:
--
--   select count(*) from public.goals;
--   select count(*) from public.budgets;
--   select count(*) from public.wallets;
--   select count(*) from public.categories;
--
-- Todas devem retornar 0, ou apenas os registros daquela conta. Se aparecer
-- dado de outro usuário, a política não pegou — pare e me avise.
-- =============================================================================
