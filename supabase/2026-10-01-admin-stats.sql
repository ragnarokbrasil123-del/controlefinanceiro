-- =============================================================================
-- Nexa (controlefinanceiro) — Painel /admin: estatísticas agregadas
-- 2026-10-01
--
-- Rode isto inteiro no SQL Editor do painel Supabase (Project -> SQL Editor).
-- É seguro rodar mais de uma vez.
--
-- O QUE ISTO CORRIGE
--   O /admin tinha dois problemas:
--
--   1) NÃO ESCALAVA. Ele baixava TODAS as transações de TODOS os usuários para
--      o navegador e somava num forEach. Com algumas dezenas de usuários ativos
--      isso trava o browser e trafega dados que não precisavam sair do banco.
--
--   2) EXIBIA E-MAILS FALSOS. O código montava `user-a3f9c2d1` a partir do id,
--      com um comentário assumindo que ler o e-mail exigiria service role. Não
--      exige: uma função SECURITY DEFINER consegue ler auth.users, desde que
--      ela mesma verifique quem está chamando.
--
-- SEGURANÇA
--   A função roda com privilégio do dono (SECURITY DEFINER), então PRECISA
--   checar permissão por conta própria — é o primeiro comando do corpo. Sem
--   essa checagem, qualquer usuário logado leria o e-mail e o volume financeiro
--   de todo mundo chamando a função pela REST API.
--
--   `search_path` fixo evita que um schema malicioso no path sequestre as
--   referências de tabela dentro da função.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) Estatísticas por usuário, agregadas no banco
-- -----------------------------------------------------------------------------
create or replace function public.admin_user_stats()
returns table (
  id                uuid,
  email             text,
  role              text,
  created_at        timestamptz,
  transaction_count bigint,
  total_income      numeric,
  total_expense     numeric,
  last_activity     date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Autorização explícita: a função roda com privilégio elevado.
  if not public.is_admin(auth.uid()) then
    raise exception 'Acesso negado: apenas administradores.';
  end if;

  return query
  select
    p.id,
    u.email::text,
    coalesce(p.role, 'client')::text,
    p.created_at,
    count(t.id) as transaction_count,
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0) as total_income,
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as total_expense,
    max(t.date::date) as last_activity
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join public.transactions t on t.user_id = p.id
  group by p.id, u.email, p.role, p.created_at
  order by count(t.id) desc;
end;
$$;

comment on function public.admin_user_stats is 'Estatísticas por usuário para o painel /admin. Agrega no banco em vez de baixar tudo para o navegador, e devolve o e-mail real. Só responde a admins.';


-- -----------------------------------------------------------------------------
-- 2) Totais da plataforma
--    Consulta separada para o cabeçalho não depender de somar as linhas da
--    listagem no cliente.
-- -----------------------------------------------------------------------------
create or replace function public.admin_platform_totals()
returns table (
  total_users        bigint,
  total_transactions bigint,
  total_volume       numeric,
  active_last_30d    bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Acesso negado: apenas administradores.';
  end if;

  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.transactions),
    (select coalesce(sum(amount), 0) from public.transactions),
    (select count(distinct user_id) from public.transactions
      where date::date >= current_date - interval '30 days');
end;
$$;

comment on function public.admin_platform_totals is 'Totais da plataforma para o painel /admin. Só responde a admins.';


-- -----------------------------------------------------------------------------
-- 3) Permissão de execução
--    `authenticated` pode CHAMAR, mas a checagem de admin dentro da função é
--    que decide se responde. Revogamos de anon para não expor nem a tentativa.
-- -----------------------------------------------------------------------------
revoke all on function public.admin_user_stats() from public, anon;
revoke all on function public.admin_platform_totals() from public, anon;

grant execute on function public.admin_user_stats() to authenticated;
grant execute on function public.admin_platform_totals() to authenticated;


-- =============================================================================
-- CHECKLIST DEPOIS DE RODAR
--
--   a) Logado como ADMIN, deve listar os usuários com e-mail real:
--        select * from public.admin_user_stats();
--
--   b) Os totais devem vir numa linha só:
--        select * from public.admin_platform_totals();
--
--   c) TESTE DE SEGURANÇA — logado como usuário comum, as duas chamadas acima
--      devem falhar com "Acesso negado: apenas administradores."
--      Se alguma responder, a checagem não está funcionando: pare e me avise.
--
--   d) Confirme que `is_admin` existe (veio do SQL de 2026-08-16):
--        select public.is_admin(auth.uid());
-- =============================================================================
