-- =============================================================================
-- Nexa (controlefinanceiro) — identificar quem enviou o feedback
-- 2026-10-03
--
-- Rode no SQL Editor do painel Supabase. Seguro rodar mais de uma vez.
--
-- POR QUE
--   A caixa de entrada mostrava a mensagem sem dizer de quem era. Num beta
--   com 20 pessoas, ler "quebrou na minha tela" sem saber quem escreveu
--   impede de responder, de perguntar detalhe e de ver se é a mesma pessoa
--   reclamando três vezes.
--
--   A tabela guarda user_id, mas o e-mail vive em auth.users, que o cliente
--   não pode ler. Daí a função com privilégio, igual à do painel admin.
-- =============================================================================

create or replace function public.admin_feedback_list()
returns table (
  id         uuid,
  user_id    uuid,
  email      text,
  kind       text,
  message    text,
  status     text,
  context    jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Autorização explícita: a função roda com privilégio elevado e enxerga
  -- auth.users. Sem esta linha, qualquer usuário logado leria o e-mail de
  -- todo mundo chamando-a pela REST API.
  if not public.is_admin(auth.uid()) then
    raise exception 'Acesso negado: apenas administradores.';
  end if;

  return query
  select f.id, f.user_id, u.email::text, f.kind, f.message, f.status, f.context, f.created_at
  from public.feedback f
  left join auth.users u on u.id = f.user_id
  order by f.created_at desc
  limit 200;
end;
$$;

comment on function public.admin_feedback_list is 'Feedback do beta com o e-mail de quem enviou. Só responde a admins.';

revoke all on function public.admin_feedback_list() from public, anon;
grant execute on function public.admin_feedback_list() to authenticated;

-- =============================================================================
-- CHECKLIST
--   a) Como admin, deve listar com e-mail preenchido:
--        select email, kind, message from public.admin_feedback_list();
--
--   b) TESTE DE SEGURANÇA — como usuário comum, deve falhar com
--      "Acesso negado: apenas administradores."
-- =============================================================================
