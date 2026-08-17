-- =============================================================================
-- Nexa (controlefinanceiro) — correções críticas de segurança
-- 2026-08-16
--
-- Rode isto inteiro no SQL Editor do painel Supabase (Project -> SQL Editor).
-- É seguro rodar mais de uma vez: usa DROP ... IF EXISTS / CREATE OR REPLACE.
--
-- O que isto corrige:
--   1) Qualquer usuário podia se auto-promover a admin (UPDATE profiles.role
--      feito direto do navegador com a anon key).
--   2) Qualquer usuário logado conseguia ler as metas de casal (couple_goals)
--      e o "cofre" (couple_settings) de TODOS os outros usuários, porque não
--      havia Row Level Security restringindo por dono da linha.
--   3) O painel /admin depende de ler profiles e transactions de todo mundo —
--      isso só deve valer para quem já é admin, então criamos uma exceção
--      explícita pra esse caso.
--
-- Antes de rodar: se você já tem policies com os mesmos nomes usados abaixo,
-- revise cada bloco antes de confirmar (os nomes estão descritivos de propósito).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Função helper: is_admin()
--    SECURITY DEFINER = roda com privilégio do dono da função, então consegue
--    ler a tabela profiles sem disparar recursão de RLS (uma policy que chama
--    uma query na própria tabela protegida por RLS trava em loop se não for
--    assim).
-- -----------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = uid),
    false
  );
$$;

-- -----------------------------------------------------------------------------
-- 2) Trigger anti-escalada de privilégio em profiles
--    Bloqueia qualquer UPDATE que mude a coluna role, a menos que quem está
--    fazendo a alteração já seja admin. Isso fecha a falha #2 mesmo que a
--    policy de UPDATE em profiles esteja permissiva por algum outro motivo.
-- -----------------------------------------------------------------------------
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin(auth.uid()) then
    raise exception 'Apenas administradores podem alterar o campo role.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_escalation on public.profiles;
create trigger trg_prevent_self_role_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_self_role_escalation();

-- -----------------------------------------------------------------------------
-- 3) RLS em couple_goals — cada usuário só vê/edita as próprias metas.
--    (O código do app também foi corrigido para filtrar por user_id, mas
--    isso aqui é o que impede alguém de ler direto pela REST API do Supabase
--    ignorando o frontend inteiramente.)
-- -----------------------------------------------------------------------------
alter table public.couple_goals enable row level security;

drop policy if exists "couple_goals_select_own" on public.couple_goals;
create policy "couple_goals_select_own"
  on public.couple_goals for select
  using (auth.uid() = user_id);

drop policy if exists "couple_goals_insert_own" on public.couple_goals;
create policy "couple_goals_insert_own"
  on public.couple_goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "couple_goals_update_own" on public.couple_goals;
create policy "couple_goals_update_own"
  on public.couple_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "couple_goals_delete_own" on public.couple_goals;
create policy "couple_goals_delete_own"
  on public.couple_goals for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4) RLS em couple_settings — mesmo tratamento (o app já filtrava no
--    código, mas a tabela em si precisa da mesma trava).
-- -----------------------------------------------------------------------------
alter table public.couple_settings enable row level security;

drop policy if exists "couple_settings_select_own" on public.couple_settings;
create policy "couple_settings_select_own"
  on public.couple_settings for select
  using (auth.uid() = user_id);

drop policy if exists "couple_settings_insert_own" on public.couple_settings;
create policy "couple_settings_insert_own"
  on public.couple_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "couple_settings_update_own" on public.couple_settings;
create policy "couple_settings_update_own"
  on public.couple_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "couple_settings_delete_own" on public.couple_settings;
create policy "couple_settings_delete_own"
  on public.couple_settings for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5) profiles — leitura: o próprio usuário, OU um admin lendo qualquer perfil
--    (necessário pro /admin listar todo mundo). Escrita continua restrita ao
--    dono da linha; a troca de role é bloqueada pelo trigger acima independente
--    da policy de UPDATE.
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 6) transactions — leitura: o próprio usuário, OU um admin (necessário pro
--    /admin somar volume/estatísticas da plataforma toda). Escrita/edição
--    continua restrita ao dono.
-- -----------------------------------------------------------------------------
alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own_or_admin" on public.transactions;
create policy "transactions_select_own_or_admin"
  on public.transactions for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- Depois de rodar, teste (veja o checklist completo no plano):
--   a) Logado como usuário comum, tente promover a si mesmo a admin pelo
--      painel /admin (não deve nem aparecer o painel) e via devtools/REST
--      direto (deve retornar erro do trigger).
--   b) /casais só deve mostrar as metas do próprio usuário logado.
--   c) /admin, logado como sua conta admin, deve continuar carregando
--      normalmente a lista de todos os usuários e transações.
-- =============================================================================
