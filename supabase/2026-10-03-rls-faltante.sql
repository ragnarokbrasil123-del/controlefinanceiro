-- =============================================================================
-- Nexa (controlefinanceiro) — auditoria de RLS + limpeza de políticas
-- 2026-10-03
--
-- ✅ NUNCA HOUVE FALHA DE SEGURANÇA. Leia o histórico antes de agir.
--
-- O QUE A AUDITORIA PROCUROU
--   Cruzei as tabelas que o app USA com as que têm RLS em arquivo versionado.
--   Quatro apareceram sem nenhum script: wallets, categories, goals, budgets.
--   O arquivo de 2026-08-16 cobriu apenas transactions, profiles, couple_goals
--   e couple_settings.
--
-- O QUE O BANCO RESPONDEU (verificado em 2026-10-03)
--   Todas as tabelas de `public` com rowsecurity = true, e as quatro já tinham
--   cobertura COMPLETA de operações. A proteção foi montada à mão no painel e
--   nunca entrou em arquivo. O buraco era de VERSIONAMENTO, não de segurança.
--   Nenhum dado esteve acessível a terceiros em momento algum.
--
--   Fica o registro de por que isso importa: a anon key é pública por desenho
--   (vai no JavaScript que chega ao navegador), e a RLS é a única coisa que
--   impede um usuário de ler os dados de outro.
--
-- O ERRO DESTE ARQUIVO, E A CORREÇÃO
--   A primeira versão afirmava falha aberta e mandava rodar 16 CREATE POLICY.
--   Foi executada antes do diagnóstico confirmar qualquer coisa. Como
--   políticas permissivas se somam com OR e as criadas eram a checagem de dono
--   padrão, nada quebrou — mas as 4 tabelas foram de 13 para 29 políticas,
--   todas as 16 novas redundantes com as que já existiam.
--
--   O PASSO 3 desfaz isso. Não é urgente; é higiene.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PASSO 1 — ESTADO ATUAL
--
-- Uma política com cmd = 'ALL' cobre as quatro operações sozinha. Rode antes e
-- depois da limpeza para comparar.
-- -----------------------------------------------------------------------------
select tablename,
       policyname,
       cmd,
       qual       as condicao_leitura,
       with_check as condicao_escrita
from pg_policies
where schemaname = 'public'
  and tablename in ('wallets','budgets','categories','goals')
order by tablename, cmd, policyname;

-- Em política de INSERT, `condicao_leitura` NULL é o esperado: INSERT não lê
-- linha existente, então só `with_check` se aplica. Não é defeito.


-- -----------------------------------------------------------------------------
-- PASSO 2 — O QUE JÁ EXISTIA, E PRECISA CONTINUAR EXISTINDO
--
--   budgets     "Usuários gerenciam próprios orçamentos"       ALL   dono
--               "Usuários gerenciam seus próprios orçamentos"  ALL   dono
--                  ^ duplicata anterior a esta auditoria; uma das duas basta
--
--   categories  "Users can manage their own categories"        ALL   dono
--               + 3 políticas CRUD redundantes com a ALL acima
--
--   goals       "Users can view/insert/update/delete own goals"       dono
--               "Acesso as metas do casal"                     ALL   casal
--
--   wallets     "Users can manage their own wallets"           ALL   dono
--               "Acesso as carteiras do casal"                 ALL   casal
--
-- ⚠️  AS DUAS POLÍTICAS DE CASAL SÃO ESSENCIAIS E NÃO PODEM SER REMOVIDAS.
--     São o único mecanismo que deixa um parceiro ver as metas e carteiras do
--     outro. Elas consultam a tabela `couples`:
--
--       couple_id IN (SELECT couples.id FROM couples WHERE couples.user_a_id ...)
--
--     Isso também significa que `couples` NÃO é tabela órfã, ainda que não
--     apareça em nenhum .ts ou .tsx: quem a usa é o próprio banco. Apagá-la
--     quebraria o compartilhamento entre casais.
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- PASSO 3 — LIMPEZA (opcional, reversível)
--
-- Remove as 16 políticas que esta auditoria introduziu por engano. Todas são
-- redundantes: as originais do Passo 2 já cobrem as mesmas operações com a
-- mesma condição.
--
-- POR QUE VALE FAZER
--   1. Cada política é avaliada e combinada com OR em toda consulta. Nove
--      políticas onde cinco bastam é custo em cada leitura — e o plano é o
--      Supabase free.
--   2. Duplicata é armadilha futura: no dia em que alguém apertar uma regra,
--      a cópia frouxa continua liberando, e a correção parece aplicada sem
--      estar.
--
-- SEGURANÇA DA OPERAÇÃO
--   Remover política permissiva só pode RESTRINGIR acesso, nunca abrir. O
--   risco real é o oposto: apagar demais e travar o app. Por isso o Passo 4
--   confere a cobertura logo depois, e nada aqui toca nas políticas de casal.
-- -----------------------------------------------------------------------------

drop policy if exists "wallets_select_own"    on public.wallets;
drop policy if exists "wallets_insert_own"    on public.wallets;
drop policy if exists "wallets_update_own"    on public.wallets;
drop policy if exists "wallets_delete_own"    on public.wallets;

drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;

drop policy if exists "goals_select_own"      on public.goals;
drop policy if exists "goals_insert_own"      on public.goals;
drop policy if exists "goals_update_own"      on public.goals;
drop policy if exists "goals_delete_own"      on public.goals;

drop policy if exists "budgets_select_own"    on public.budgets;
drop policy if exists "budgets_insert_own"    on public.budgets;
drop policy if exists "budgets_update_own"    on public.budgets;
drop policy if exists "budgets_delete_own"    on public.budgets;

-- A duplicata de budgets é anterior a esta auditoria. Confira no Passo 1 que as
-- duas são mesmo idênticas (ambas ALL, ambas auth.uid() = user_id) e então
-- descomente para ficar com uma só:
--
-- drop policy if exists "Usuários gerenciam próprios orçamentos" on public.budgets;


-- -----------------------------------------------------------------------------
-- PASSO 4 — CONFERÊNCIA OBRIGATÓRIA
--
-- Rode logo depois da limpeza. Toda tabela precisa manter cobertura das
-- operações que o app executa:
--
--   wallets     select, insert, update, delete
--   budgets     select, insert, delete
--   categories  select, insert, delete
--   goals       select, insert, update, delete
--
-- Uma linha com cmd = 'ALL' satisfaz as quatro de uma vez.
-- -----------------------------------------------------------------------------
select tablename,
       count(*)                                   as politicas,
       count(*) filter (where cmd = 'ALL')        as cobre_tudo,
       string_agg(distinct cmd, ', ' order by cmd) as operacoes
from pg_policies
where schemaname = 'public'
  and tablename in ('wallets','budgets','categories','goals')
group by tablename
order by tablename;

-- Esperado depois da limpeza: 13 políticas no total.
--   budgets 2 · categories 4 · goals 5 · wallets 2
--
-- Se alguma tabela ficar sem 'ALL' e sem o cmd de que o app precisa, a RLS
-- passa a recusar aquela operação EM SILÊNCIO: zero linhas afetadas, sem erro.
-- Nesse caso recrie a política correspondente a partir do Passo 2.


-- =============================================================================
-- DEPOIS DA LIMPEZA, TESTE NO APP
--
-- Metadado prova que a política existe, não que ela funciona. Com sua conta,
-- confirme que ainda dá para:
--
--   1. criar e excluir uma carteira         (WalletsModal)
--   2. criar e excluir uma categoria        (CategoryManagerModal)
--   3. criar meta e atualizar o valor dela  (GoalsModal)
--   4. salvar o orçamento do mês            (BudgetModal)
--
-- O item 3 é o mais sensível: GoalsModal.tsx:72 faz
-- `.update({ current_amount }).eq('id', id)`, sem filtrar o dono, confiando
-- inteiramente na RLS para barrar o que não é seu. Se a política de UPDATE
-- sumisse, o valor simplesmente não mudaria — e a tela não mostraria erro.
-- =============================================================================


-- =============================================================================
-- TABELAS SEM USO APARENTE
--
--   ai_usage_logs   RLS ligada, 0 políticas — nenhuma referência encontrada
--   accounts        RLS ligada, 1 política  — nenhuma referência encontrada
--
-- `ai_usage_logs` com zero políticas é "negar tudo". Para tabela sem uso, é o
-- estado mais seguro possível. Não quebra nada e não é urgente.
--
-- `couples` TAMBÉM não aparece no código, mas NÃO entra nesta lista: as
-- políticas de casal em goals e wallets dependem dela (veja o Passo 2).
--
-- Antes de apagar qualquer coisa, confirme que está vazia:
--
--   select 'ai_usage_logs' as t, count(*) from public.ai_usage_logs
--   union all select 'accounts', count(*) from public.accounts;
--
-- E procure dependência escondida, que foi exatamente o que quase me fez
-- recomendar a remoção de `couples`:
--
--   select tablename, policyname, qual
--   from pg_policies
--   where schemaname = 'public'
--     and (qual::text like '%accounts%' or qual::text like '%ai_usage_logs%');
-- =============================================================================


-- =============================================================================
-- TESTE DE ISOLAMENTO — vale fazer de qualquer jeito
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
