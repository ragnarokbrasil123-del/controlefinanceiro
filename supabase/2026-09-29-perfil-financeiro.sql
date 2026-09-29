-- =============================================================================
-- Nexa (controlefinanceiro) — Perfil Financeiro do usuário
-- 2026-09-29
--
-- Rode isto inteiro no SQL Editor do painel Supabase (Project -> SQL Editor).
-- É seguro rodar mais de uma vez (usa IF NOT EXISTS / CREATE OR REPLACE /
-- DROP ... IF EXISTS).
--
-- POR QUE ISTO EXISTE
--   Até aqui o app tratava todo usuário como a mesma pessoa: os limites de
--   alerta (30% / 50% da renda) e a meta de reserva eram constantes fixas no
--   código. Isso quebra na prática — R$ 21.000 de reserva é pouco pra quem
--   ganha R$ 15.000 e inalcançável pra quem ganha R$ 1.800.
--
--   Estas colunas guardam o que o usuário declara no onboarding. O "estágio
--   financeiro" (emergência / estabilidade / reserva / acumulação /
--   independência) NÃO é gravado aqui de propósito: ele é calculado em tempo
--   real no lib/profile.ts a partir destas colunas + das transações reais,
--   pra nunca ficar desatualizado.
--
-- SEGURANÇA
--   Não é preciso criar policy nova. As policies de profiles criadas em
--   2026-08-16-critical-security-fixes.sql já cobrem estas colunas:
--     - profiles_select_own_or_admin  (lê a própria linha, ou qualquer uma se admin)
--     - profiles_update_own           (só edita a própria linha)
--   E o trigger trg_prevent_self_role_escalation continua impedindo que o
--   usuário mexa na coluna role ao salvar o próprio perfil financeiro.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) Colunas do perfil financeiro
--    Todas nullable: usuário que ainda não fez o onboarding tem tudo NULL, e o
--    app cai em valores padrão conservadores (ver lib/profile.ts).
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists monthly_income numeric,        -- renda mensal declarada
  add column if not exists income_type    text,           -- 'fixa' | 'variavel'
  add column if not exists strategy       text,           -- '50_30_20' | '40_20_40' | '80_20'
  add column if not exists has_debt       boolean,        -- dívida cara (rotativo/empréstimo)
  add column if not exists main_goal      text,           -- objetivo declarado
  add column if not exists onboarded_at   timestamptz;    -- null = nunca respondeu

comment on column public.profiles.monthly_income is 'Renda mensal declarada no onboarding. Usada como fallback quando não há receitas lançadas no mês.';
comment on column public.profiles.income_type    is 'fixa = CLT/aposentado; variavel = autônomo/comissionado. Renda variável exige reserva maior.';
comment on column public.profiles.strategy       is 'Estratégia de alocação escolhida. Define o % sugerido de aporte e os limites de alerta.';
comment on column public.profiles.has_debt       is 'Se true, o app prioriza quitar dívida ANTES de sugerir aporte (juros do rotativo > rendimento da reserva).';
comment on column public.profiles.main_goal      is 'Objetivo declarado. Usado para ordenar o que o dashboard destaca.';
comment on column public.profiles.onboarded_at   is 'Quando o onboarding foi concluído. NULL dispara o questionário.';


-- -----------------------------------------------------------------------------
-- 2) Constraints de domínio
--    Garantem que só entram os valores que o app sabe interpretar — inclusive
--    se alguém escrever direto pela REST API do Supabase, sem passar pela UI.
--    Feito em bloco condicional porque ADD CONSTRAINT não aceita IF NOT EXISTS.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_income_type_check') then
    alter table public.profiles
      add constraint profiles_income_type_check
      check (income_type is null or income_type in ('fixa', 'variavel'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_strategy_check') then
    alter table public.profiles
      add constraint profiles_strategy_check
      check (strategy is null or strategy in ('50_30_20', '40_20_40', '80_20'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_main_goal_check') then
    alter table public.profiles
      add constraint profiles_main_goal_check
      check (main_goal is null or main_goal in ('quitar_dividas', 'reserva', 'investir', 'organizar'));
  end if;

  -- Renda negativa não existe. Zero é permitido (desempregado declarando).
  if not exists (select 1 from pg_constraint where conname = 'profiles_monthly_income_check') then
    alter table public.profiles
      add constraint profiles_monthly_income_check
      check (monthly_income is null or monthly_income >= 0);
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- 3) Criação automática da linha em profiles
--    O app NUNCA faz insert em profiles — ele só lê. Se a linha não existir,
--    o .single() do dashboard falha em silêncio e o usuário fica sem role e
--    sem perfil. Este trigger garante que todo cadastro novo nasça com linha.
--
--    Se você já tinha um handle_new_user criado à mão no painel, este
--    CREATE OR REPLACE atualiza a função preservando o comportamento de role.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 4) Backfill — usuários que já existem mas não têm linha em profiles
--    (criados antes do trigger). Sem isto, quem se cadastrou antes continua
--    quebrado.
-- -----------------------------------------------------------------------------
insert into public.profiles (id, role)
select u.id, 'client'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;


-- -----------------------------------------------------------------------------
-- 5) Semente de renda para quem já usa o app
--    Para usuários que já têm receitas lançadas, pré-preenche monthly_income
--    com a MEDIANA das receitas mensais dos últimos 6 meses. Mediana e não
--    média: um 13º ou uma venda grande distorceria a média e faria o app
--    superestimar a renda recorrente.
--
--    Isto só preenche quem está com monthly_income NULL — não sobrescreve
--    nada que o usuário tenha declarado.
-- -----------------------------------------------------------------------------
with receitas_por_mes as (
  select
    user_id,
    date_trunc('month', date::date) as mes,
    sum(amount) as total
  from public.transactions
  where type = 'income'
    and date::date >= (current_date - interval '6 months')
  group by user_id, date_trunc('month', date::date)
),
mediana as (
  select
    user_id,
    percentile_cont(0.5) within group (order by total) as renda_mediana
  from receitas_por_mes
  group by user_id
)
update public.profiles p
set monthly_income = round(m.renda_mediana::numeric, 2)
from mediana m
where p.id = m.user_id
  and p.monthly_income is null
  and m.renda_mediana > 0;


-- -----------------------------------------------------------------------------
-- 6) Índice para o painel /admin
--    Permite segmentar usuários por estágio de onboarding sem varrer a tabela.
-- -----------------------------------------------------------------------------
create index if not exists profiles_onboarded_at_idx
  on public.profiles (onboarded_at);


-- =============================================================================
-- CHECKLIST DEPOIS DE RODAR
--
--   a) Confira que as colunas existem:
--        select column_name, data_type
--        from information_schema.columns
--        where table_schema = 'public' and table_name = 'profiles'
--        order by ordinal_position;
--
--   b) Confira que ninguém ficou sem linha em profiles (deve retornar 0):
--        select count(*) from auth.users u
--        left join public.profiles p on p.id = u.id
--        where p.id is null;
--
--   c) Veja a semente de renda que o passo 5 aplicou na SUA conta:
--        select id, monthly_income, onboarded_at from public.profiles
--        where id = auth.uid();
--
--   d) Teste a constraint (deve dar erro):
--        update public.profiles set strategy = 'invalido' where id = auth.uid();
--
--   e) Teste que a trava de role continua de pé (deve dar erro, se não for admin):
--        update public.profiles set role = 'admin' where id = auth.uid();
-- =============================================================================
