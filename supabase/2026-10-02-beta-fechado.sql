-- =============================================================================
-- Nexa (controlefinanceiro) — Infraestrutura do beta fechado
-- 2026-10-02
--
-- Rode isto inteiro no SQL Editor do painel Supabase (Project -> SQL Editor).
-- É seguro rodar mais de uma vez.
--
-- O QUE ISTO HABILITA
--   1) beta_invites      -> porta de entrada: só entra quem tem convite
--   2) aceite de termos  -> LGPD, em profiles
--   3) feedback          -> o produto do beta; sem isto você só tem gente usando
--   4) error_log         -> hoje erro vai para o console e ninguém vê
--
-- POR QUE CONVITE E NÃO "CADASTRO ABERTO COM APROVAÇÃO"
--   O Supabase Auth cria a conta no signUp, antes de qualquer lógica do app.
--   Não dá para "segurar" o cadastro sem desligar o signUp no painel. Então o
--   controle acontece DEPOIS: a conta nasce, mas o app só libera o uso se
--   houver convite com aquele e-mail. É simples, auditável e reversível.
-- =============================================================================


-- =============================================================================
-- 1) CONVITES
-- =============================================================================
create table if not exists public.beta_invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  code        text not null,
  invited_by  uuid references auth.users(id) on delete set null,
  used_by     uuid references auth.users(id) on delete set null,
  used_at     timestamptz,
  expires_at  timestamptz,
  note        text,
  created_at  timestamptz not null default now()
);

comment on table  public.beta_invites            is 'Convites do beta fechado. Só quem tem convite com o próprio e-mail consegue usar o app.';
comment on column public.beta_invites.code       is 'Código que o usuário digita no cadastro. Curto e legível, para caber numa mensagem de WhatsApp.';
comment on column public.beta_invites.used_by    is 'Preenchido quando o convite é resgatado. Um convite serve uma vez.';
comment on column public.beta_invites.expires_at is 'Opcional. NULL = não expira.';

-- E-mail guardado em minúsculas, para a comparação não falhar por caixa.
create unique index if not exists beta_invites_email_idx on public.beta_invites (lower(email));
create unique index if not exists beta_invites_code_idx  on public.beta_invites (upper(code));

alter table public.beta_invites enable row level security;

-- Ninguém lê a tabela direto: a verificação acontece pelas funções abaixo,
-- que são SECURITY DEFINER. Sem isto, alguém listaria todos os convites e
-- e-mails dos convidados pela REST API.
drop policy if exists "beta_invites_admin_all" on public.beta_invites;
create policy "beta_invites_admin_all"
  on public.beta_invites for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- -----------------------------------------------------------------------------
-- Resgate do convite: chamado logo após o cadastro.
-- Confere e-mail + código, marca como usado e libera o acesso.
-- -----------------------------------------------------------------------------
create or replace function public.redeem_beta_invite(invite_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid        uuid := auth.uid();
  user_email text;
  convite    public.beta_invites%rowtype;
begin
  if uid is null then
    raise exception 'Faça login antes de resgatar o convite.';
  end if;

  select email into user_email from auth.users where id = uid;

  select * into convite
  from public.beta_invites
  where upper(code) = upper(trim(invite_code))
  limit 1;

  if convite.id is null then
    raise exception 'Convite não encontrado.';
  end if;

  -- O convite é nominal: evita que um código vaze num grupo e entre gente
  -- que você não convidou.
  if lower(convite.email) is distinct from lower(user_email) then
    raise exception 'Este convite foi emitido para outro e-mail.';
  end if;

  if convite.used_by is not null and convite.used_by is distinct from uid then
    raise exception 'Este convite já foi utilizado.';
  end if;

  if convite.expires_at is not null and convite.expires_at < now() then
    raise exception 'Este convite expirou.';
  end if;

  update public.beta_invites
  set used_by = uid, used_at = coalesce(used_at, now())
  where id = convite.id;

  return true;
end;
$$;


-- -----------------------------------------------------------------------------
-- O usuário logado tem acesso liberado?
-- Admin sempre tem. Os demais precisam de convite resgatado.
-- -----------------------------------------------------------------------------
create or replace function public.has_beta_access()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then return false; end if;
  if public.is_admin(uid) then return true; end if;

  return exists (select 1 from public.beta_invites where used_by = uid);
end;
$$;

revoke all on function public.redeem_beta_invite(text) from public, anon;
revoke all on function public.has_beta_access() from public, anon;
grant execute on function public.redeem_beta_invite(text) to authenticated;
grant execute on function public.has_beta_access() to authenticated;


-- =============================================================================
-- 2) ACEITE DE TERMOS (LGPD)
-- =============================================================================
alter table public.profiles
  add column if not exists accepted_terms_at      timestamptz,
  add column if not exists accepted_terms_version text;

comment on column public.profiles.accepted_terms_at      is 'Quando o usuário aceitou os termos. NULL = ainda não aceitou.';
comment on column public.profiles.accepted_terms_version is 'Versão aceita. Mudou a política? Compare com a atual e peça novo aceite.';


-- =============================================================================
-- 3) FEEDBACK
--    O produto do beta. Sem canal dentro do app, o retorno se perde no
--    WhatsApp e some.
-- =============================================================================
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  kind       text not null default 'outro',
  message    text not null,
  -- Contexto técnico ajuda a reproduzir: em que tela estava, que navegador.
  context    jsonb,
  status     text not null default 'novo',
  created_at timestamptz not null default now()
);

comment on table  public.feedback        is 'Retorno dos usuários do beta, enviado de dentro do app.';
comment on column public.feedback.kind   is 'bug | sugestao | duvida | outro';
comment on column public.feedback.status is 'novo | lido | resolvido';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'feedback_kind_check') then
    alter table public.feedback add constraint feedback_kind_check
      check (kind in ('bug','sugestao','duvida','outro'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'feedback_status_check') then
    alter table public.feedback add constraint feedback_status_check
      check (status in ('novo','lido','resolvido'));
  end if;
end $$;

alter table public.feedback enable row level security;

-- O usuário envia e vê o que mandou; o admin vê tudo e muda status.
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "feedback_select_own_or_admin" on public.feedback;
create policy "feedback_select_own_or_admin" on public.feedback for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "feedback_update_admin" on public.feedback;
create policy "feedback_update_admin" on public.feedback for update
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create index if not exists feedback_status_idx on public.feedback (status, created_at desc);


-- =============================================================================
-- 4) REGISTRO DE ERRO
--    Hoje todo erro vai para console.error e morre no navegador do usuário.
--    Num beta, erro que ninguém vê é erro que ninguém corrige.
--
--    Guardamos no próprio Postgres em vez de contratar serviço externo: para
--    20 pessoas isso basta, não adiciona dependência e não manda dado
--    financeiro para terceiro.
-- =============================================================================
create table if not exists public.error_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  message    text not null,
  stack      text,
  context    jsonb,
  created_at timestamptz not null default now()
);

comment on table public.error_log is 'Erros capturados no cliente. Só admin lê; qualquer autenticado escreve o próprio.';

alter table public.error_log enable row level security;

drop policy if exists "error_log_insert_own" on public.error_log;
create policy "error_log_insert_own" on public.error_log for insert
  with check (auth.uid() = user_id);

drop policy if exists "error_log_select_admin" on public.error_log;
create policy "error_log_select_admin" on public.error_log for select
  using (public.is_admin(auth.uid()));

create index if not exists error_log_created_idx on public.error_log (created_at desc);


-- =============================================================================
-- COMO CONVIDAR ALGUÉM (rode como admin)
--
--   insert into public.beta_invites (email, code, invited_by, note)
--   values ('pessoa@email.com', 'NEXA-ABC1', auth.uid(), 'amigo do trabalho');
--
--   Depois mande à pessoa: o endereço do app e o código NEXA-ABC1.
--   Ela se cadastra com AQUELE e-mail e digita o código.
--
-- PARA VER QUEM JÁ ENTROU
--   select email, note, used_at from public.beta_invites order by created_at;
--
-- PARA LER O FEEDBACK
--   select created_at, kind, message from public.feedback
--   where status = 'novo' order by created_at desc;
--
-- PARA VER OS ERROS
--   select created_at, message, context from public.error_log
--   order by created_at desc limit 50;
--
-- =============================================================================
-- CHECKLIST DEPOIS DE RODAR
--
--   a) As 3 tabelas existem com RLS:
--        select tablename, rowsecurity from pg_tables
--        where schemaname='public' and tablename in ('beta_invites','feedback','error_log');
--
--   b) Como ADMIN você já tem acesso (deve retornar true):
--        select public.has_beta_access();
--
--   c) TESTE DE SEGURANÇA — logado como usuário comum SEM convite, deve
--      retornar false, e a linha seguinte deve devolver 0 linhas:
--        select public.has_beta_access();
--        select count(*) from public.beta_invites;
-- =============================================================================
