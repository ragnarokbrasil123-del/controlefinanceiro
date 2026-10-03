-- =============================================================================
-- Nexa (controlefinanceiro) — exclusão de conta (LGPD)
-- 2026-10-03
--
-- ⚠️  LEIA ANTES DE RODAR. Este arquivo tem DUAS partes.
--
-- POR QUE EXISTE
--   O botão "Excluir Minha Conta Permanentemente" chama `supabase.rpc
--   ('delete_user')`. Essa função existe no banco de produção, criada à mão em
--   algum momento, e NÃO estava em nenhum arquivo versionado.
--
--   Isso é duplamente arriscado:
--     1) Ninguém sabe o que ela faz hoje. Pode apagar a conta e deixar os
--        lançamentos órfãos, ou falhar em silêncio.
--     2) Sua política de privacidade PROMETE exclusão irreversível e completa.
--        Promessa que o produto não cumpre é exposição legal, não só bug.
-- =============================================================================


-- =============================================================================
-- PARTE 1 — INSPEÇÃO (rode isto primeiro, sozinho)
--
-- Mostra o código da função que está em produção agora. Compare com a Parte 2
-- antes de substituir: se a sua fizer algo a mais que eu não previ, me mostre
-- o resultado em vez de sobrescrever.
-- =============================================================================

select p.proname as funcao,
       pg_get_functiondef(p.oid) as definicao
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'delete_user';

-- Nenhuma linha? A função NÃO existe, e o botão de excluir conta está
-- quebrado hoje. Nesse caso rode a Parte 2 direto.


-- =============================================================================
-- PARTE 2 — IMPLEMENTAÇÃO DE REFERÊNCIA
--
-- Só rode depois de olhar o resultado acima.
--
-- Apaga a conta do usuário autenticado e tudo que pertence a ele. A remoção
-- de auth.users vem por último: todas as tabelas têm
-- `references auth.users(id) on delete cascade`, então em tese bastaria essa
-- linha — mas apagar explicitamente deixa a intenção clara e protege caso
-- alguma tabela futura esqueça o cascade.
-- =============================================================================

create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Faça login para excluir a conta.';
  end if;

  -- Dependentes primeiro, para não esbarrar em chave estrangeira.
  delete from public.debt_payments        where user_id = uid;
  delete from public.debts                where user_id = uid;
  delete from public.investments          where user_id = uid;
  delete from public.transactions         where user_id = uid;
  delete from public.wallets              where user_id = uid;
  delete from public.categories           where user_id = uid;
  delete from public.goals                where user_id = uid;
  delete from public.budgets              where user_id = uid;
  delete from public.couple_goals         where user_id = uid;
  delete from public.couple_settings      where user_id = uid;
  delete from public.advice_history       where user_id = uid;
  delete from public.category_corrections where user_id = uid;
  delete from public.ai_rate_limits       where user_id = uid;
  delete from public.feedback             where user_id = uid;
  delete from public.error_log            where user_id = uid;

  -- O convite do beta é desvinculado, não apagado: serve de registro de que
  -- aquele e-mail foi convidado, e apagá-lo esconderia o histórico de quem
  -- entrou e saiu.
  update public.beta_invites set used_by = null, used_at = null where used_by = uid;

  delete from public.profiles where id = uid;
  delete from auth.users      where id = uid;
end;
$$;

comment on function public.delete_user is 'Exclusão de conta pela LGPD: apaga o usuário autenticado e todos os seus dados. Irreversível.';

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;


-- =============================================================================
-- OS COMPROVANTES NÃO SAEM POR AQUI
--
-- Os arquivos em Storage (bucket `receipts`) NÃO são apagados por esta função:
-- SQL não alcança o Storage. Hoje eles ficam órfãos no bucket depois da
-- exclusão da conta — o que contradiz a política de privacidade.
--
-- Para limpar manualmente, no painel: Storage → receipts → pasta com o UUID
-- do usuário → excluir.
--
-- A solução definitiva é uma Edge Function com service role, que o SQL sozinho
-- não substitui. Fica registrado como pendência conhecida.
-- =============================================================================


-- =============================================================================
-- COMO TESTAR SEM PERDER SUA CONTA
--
--   1. Crie uma conta descartável em /login
--   2. Lance uma receita e uma despesa nela
--   3. Em Ajustes → Excluir Minha Conta Permanentemente
--   4. Confirme que sumiu tudo (rode como ADMIN):
--        select count(*) from auth.users where email = 'descartavel@exemplo.com';
--        -- deve retornar 0
--
--   Não teste com a sua conta de admin: você perderia o acesso ao painel.
-- =============================================================================
