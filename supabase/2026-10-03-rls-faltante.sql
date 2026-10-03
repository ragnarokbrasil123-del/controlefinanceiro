-- =============================================================================
-- Nexa (controlefinanceiro) — auditoria de RLS: cobertura por operação
-- 2026-10-03
--
-- ✅ NÃO HÁ FALHA ABERTA. Leia o histórico antes de agir.
--
-- O QUE A AUDITORIA PROCUROU
--   Cruzei as tabelas que o app USA com as que têm RLS em arquivo versionado.
--   Quatro apareceram sem nenhum script: wallets, categories, goals, budgets.
--   O arquivo de 2026-08-16 havia coberto apenas transactions, profiles,
--   couple_goals e couple_settings.
--
-- O QUE O BANCO RESPONDEU (verificado em 2026-10-03)
--   Todas as tabelas de `public` estão com rowsecurity = true. A proteção foi
--   ligada à mão no painel em algum momento e nunca entrou em arquivo. Ou
--   seja: o buraco era de VERSIONAMENTO, não de segurança. Nenhum dado esteve
--   acessível a terceiros.
--
--   Fica o registro de por que isso importa: a anon key é pública por desenho
--   (vai no JavaScript que chega ao navegador), e a RLS é a única coisa que
--   impede um usuário de ler os dados de outro.
-- =============================================================================


-- =============================================================================
-- A QUESTÃO QUE SOBRA: RLS LIGADA NÃO É O MESMO QUE RLS COMPLETA
--
-- Com RLS ligada, cada operação (select/insert/update/delete) precisa de uma
-- política que a permita. Faltando a política de uma operação, o Postgres NÃO
-- levanta erro: ele afeta zero linhas, em silêncio.
--
-- Na prática isso vira o pior tipo de defeito: o usuário clica em "excluir",
-- recebe o aviso de sucesso que o código mostra, e o dado continua lá.
--
-- Importa porque várias telas apagam e editam só pelo id, confiando na RLS
-- para barrar o que não é do dono:
--
--     WalletsModal.tsx:59          .delete().eq('id', id)
--     AccountManagerModal.tsx:67   .delete().eq('id', id)
--     AccountManagerModal.tsx:78   .update({ name }).eq('id', id)
--     CategoryManagerModal.tsx:61  .delete().eq('id', id)
--     GoalsModal.tsx:72            .update({ current_amount }).eq('id', id)
--     GoalsModal.tsx:86            .delete().eq('id', id)
--
-- Esse código está CERTO. Ele pressupõe RLS, e a RLS existe. Não mude as
-- telas: confira a cobertura abaixo.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PASSO 1 — COBERTURA POR OPERAÇÃO
--
-- Uma política com cmd = 'ALL' cobre as quatro operações sozinha. Fora isso,
-- cada cmd precisa aparecer para a operação que o app executa naquela tabela.
-- -----------------------------------------------------------------------------
select tablename,
       policyname,
       cmd,
       qual       as condicao_leitura,
       with_check as condicao_escrita
from pg_policies
where schemaname = 'public'
  and tablename in ('wallets','budgets','categories','goals')
order by tablename, cmd;

-- O que o app precisa em cada uma:
--   wallets     select, insert, update, delete
--   budgets     select, insert, delete
--   categories  select, insert, delete
--   goals       select, insert, update, delete


-- -----------------------------------------------------------------------------
-- PASSO 2 — PREENCHER SÓ O QUE FALTAR
--
-- ⚠️  NÃO rode este bloco inteiro às cegas. A RLS já está ligada e as políticas
--     existentes podem ter nomes e regras diferentes das daqui. Políticas
--     permissivas se somam (OR), então acrescentar sem olhar só AFROUXA o
--     acesso — nunca aperta.
--
-- Use como molde: descomente apenas a linha da operação que o Passo 1 mostrou
-- faltando, na tabela em que faltou.
--
-- O padrão segue o de 2026-08-16: dono identificado por auth.uid() = user_id.
-- -----------------------------------------------------------------------------

-- wallets ---------------------------------------------------------------------
-- create policy "wallets_select_own" on public.wallets for select
--   using (auth.uid() = user_id);
-- create policy "wallets_insert_own" on public.wallets for insert
--   with check (auth.uid() = user_id);
-- create policy "wallets_update_own" on public.wallets for update
--   using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "wallets_delete_own" on public.wallets for delete
--   using (auth.uid() = user_id);

-- categories ------------------------------------------------------------------
-- create policy "categories_select_own" on public.categories for select
--   using (auth.uid() = user_id);
-- create policy "categories_insert_own" on public.categories for insert
--   with check (auth.uid() = user_id);
-- create policy "categories_delete_own" on public.categories for delete
--   using (auth.uid() = user_id);

-- goals -----------------------------------------------------------------------
-- create policy "goals_select_own" on public.goals for select
--   using (auth.uid() = user_id);
-- create policy "goals_insert_own" on public.goals for insert
--   with check (auth.uid() = user_id);
-- create policy "goals_update_own" on public.goals for update
--   using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "goals_delete_own" on public.goals for delete
--   using (auth.uid() = user_id);

-- budgets ---------------------------------------------------------------------
-- create policy "budgets_select_own" on public.budgets for select
--   using (auth.uid() = user_id);
-- create policy "budgets_insert_own" on public.budgets for insert
--   with check (auth.uid() = user_id);
-- create policy "budgets_delete_own" on public.budgets for delete
--   using (auth.uid() = user_id);


-- =============================================================================
-- TABELAS ÓRFÃS ENCONTRADAS NO CAMINHO
--
--   ai_usage_logs   RLS ligada, 0 políticas
--   accounts        RLS ligada, 1 política
--   couples         RLS ligada, 3 políticas
--
-- Nenhuma das três aparece em qualquer .ts, .tsx ou .sql do projeto. São
-- sobras de versões anteriores.
--
-- `ai_usage_logs` com zero políticas é "negar tudo" — para tabela sem uso, o
-- estado mais seguro que existe. Não quebra nada e não é urgente.
--
-- Antes de apagar qualquer uma, confirme que está mesmo vazia e sem uso:
--
--   select 'ai_usage_logs' as t, count(*) from public.ai_usage_logs
--   union all select 'accounts', count(*) from public.accounts
--   union all select 'couples',  count(*) from public.couples;
--
-- `couples` merece atenção extra: o app tem funcionalidade de casais viva
-- (couple_goals, couple_settings). Pode ser que `couples` tenha sido o desenho
-- original abandonado — ou que guarde vínculo que alguém ainda use. Não apague
-- sem olhar o conteúdo.
-- =============================================================================


-- =============================================================================
-- TESTE DE SEGURANÇA — vale fazer de qualquer jeito
--
-- A auditoria acima lê metadado: ela diz que a política EXISTE, não que ela
-- FUNCIONA. A única prova real é tentar.
--
-- Com uma segunda conta (comum, sem convite), no SQL Editor:
--
--   select count(*) from public.goals;
--   select count(*) from public.budgets;
--   select count(*) from public.wallets;
--   select count(*) from public.categories;
--
-- Cada uma deve retornar 0, ou só os registros daquela conta. Se aparecer dado
-- de outro usuário, a política não está pegando — pare e investigue.
-- =============================================================================
