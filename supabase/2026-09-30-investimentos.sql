-- =============================================================================
-- Nexa (controlefinanceiro) — Posições de investimento
-- 2026-09-30
--
-- Rode isto inteiro no SQL Editor do painel Supabase (Project -> SQL Editor).
-- É seguro rodar mais de uma vez.
--
-- POR QUE ISTO EXISTE
--   Até aqui o app só sabia quanto o usuário APORTOU — a soma dos lançamentos
--   com categoria "Investimentos". Isso registra o dinheiro saindo da conta
--   corrente, que é correto para fluxo de caixa, mas não diz nada sobre quanto
--   aquilo VALE hoje. Quem comprou R$ 3.800 de ação e viu virar R$ 4.200
--   continuava vendo R$ 3.800.
--
--   Esta tabela guarda a posição: o que você tem, quanto colocou e quanto vale
--   agora. O rendimento é a diferença entre os dois — calculado no app, não
--   gravado, para nunca ficar desatualizado.
--
-- COMO CONVIVE COM transactions
--   As duas coisas coexistem de propósito e NÃO são a mesma informação:
--     - transactions (categoria Investimentos) = o dinheiro saindo da conta.
--       É fluxo de caixa: afeta seu saldo do mês.
--     - investments (esta tabela)              = o que você possui hoje.
--       É patrimônio: não afeta saldo nenhum.
--   O app usa o valor de mercado daqui para o patrimônio quando existir
--   posição cadastrada, e cai na soma dos aportes quando não existir. Assim
--   nada é contado duas vezes.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) Tabela
-- -----------------------------------------------------------------------------
create table if not exists public.investments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  kind            text,
  invested_amount numeric not null default 0,
  current_value   numeric not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  public.investments                 is 'Posições de investimento do usuário: o que ele possui e quanto vale hoje. Patrimônio, não fluxo de caixa.';
comment on column public.investments.name            is 'Nome livre do ativo. Ex.: "BBAS3", "Tesouro Selic 2029", "CDB Banco X".';
comment on column public.investments.kind            is 'acoes | fii | renda_fixa | cripto | outro';
comment on column public.investments.invested_amount is 'Total aportado nesta posição, somando todas as compras.';
comment on column public.investments.current_value   is 'Valor de mercado hoje. Atualizado à mão pelo usuário — o app não consulta cotação.';


-- -----------------------------------------------------------------------------
-- 2) Constraints
--    Valor negativo não existe em nenhum dos dois campos. O rendimento pode ser
--    negativo (prejuízo), mas isso é a DIFERENÇA entre eles, não um valor.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'investments_kind_check') then
    alter table public.investments
      add constraint investments_kind_check
      check (kind is null or kind in ('acoes', 'fii', 'renda_fixa', 'cripto', 'outro'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'investments_amounts_check') then
    alter table public.investments
      add constraint investments_amounts_check
      check (invested_amount >= 0 and current_value >= 0);
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- 3) RLS — cada usuário só enxerga as próprias posições.
--    Obrigatório: sem isto, qualquer pessoa logada leria o patrimônio de todo
--    mundo pela REST API do Supabase, ignorando o frontend inteiro.
-- -----------------------------------------------------------------------------
alter table public.investments enable row level security;

drop policy if exists "investments_select_own" on public.investments;
create policy "investments_select_own"
  on public.investments for select
  using (auth.uid() = user_id);

drop policy if exists "investments_insert_own" on public.investments;
create policy "investments_insert_own"
  on public.investments for insert
  with check (auth.uid() = user_id);

drop policy if exists "investments_update_own" on public.investments;
create policy "investments_update_own"
  on public.investments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "investments_delete_own" on public.investments;
create policy "investments_delete_own"
  on public.investments for delete
  using (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 4) Índice para a listagem do usuário
-- -----------------------------------------------------------------------------
create index if not exists investments_user_id_idx
  on public.investments (user_id);


-- -----------------------------------------------------------------------------
-- 5) updated_at automático — para o app mostrar "atualizado há X dias" e
--    lembrar o usuário de revisar o valor de mercado.
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_investments_touch on public.investments;
create trigger trg_investments_touch
  before update on public.investments
  for each row
  execute function public.touch_updated_at();


-- =============================================================================
-- CHECKLIST DEPOIS DE RODAR
--
--   a) A tabela existe e tem RLS ligada:
--        select relname, relrowsecurity from pg_class where relname = 'investments';
--
--   b) As 4 policies foram criadas:
--        select policyname from pg_policies where tablename = 'investments';
--
--   c) Insira uma posição de teste pela sua conta logada e confirme que ela
--      aparece no app, em Patrimônio.
-- =============================================================================
