-- =============================================================================
-- Nexa (controlefinanceiro) — FASE 1: tabelas das próximas fases
-- 2026-10-01
--
-- Rode isto inteiro no SQL Editor do painel Supabase (Project -> SQL Editor).
-- É seguro rodar mais de uma vez (IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS).
--
-- O QUE ESTE ARQUIVO FAZ
--   Cria de uma vez todas as tabelas que as fases 2 a 5 vão usar, já com RLS.
--   Rodar tudo agora evita que você precise voltar ao painel a cada entrega.
--   As tabelas nascem vazias e nenhuma tela depende delas ainda — criar antes
--   não quebra nada do que já está no ar.
--
--   1) debts               -> módulo de dívidas (fase 2)
--   2) debt_payments       -> pagamentos de dívida (fase 2)
--   3) advice_history      -> memória do conselheiro IA (fase 3)
--   4) category_corrections-> OCR que aprende (fase 3)
--   5) ai_rate_limits      -> limite de uso das rotas de IA (fase 3)
--
-- O QUE ESTE ARQUIVO *NÃO* FAZ
--   Não adiciona a coluna `month` em `budgets`. Essa migração precisa sair
--   junto com a correção do BudgetModal, que hoje apaga TODOS os orçamentos do
--   usuário antes de gravar. Separar as duas coisas apagaria histórico. Fica
--   para a fase 4, com o código.
--
-- SEGURANÇA
--   Toda tabela nasce com RLS habilitada e policies por dono. Sem isso, qualquer
--   pessoa logada leria a dívida de todo mundo pela REST API do Supabase,
--   ignorando o frontend inteiro.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0) Função de updated_at (já pode existir, do arquivo de investimentos)
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


-- =============================================================================
-- 1) DÍVIDAS
-- =============================================================================
create table if not exists public.debts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  creditor       text,
  kind           text not null default 'outro',
  current_balance numeric not null default 0,
  monthly_rate   numeric not null default 0,
  minimum_payment numeric not null default 0,
  due_day        smallint,
  status         text not null default 'ativa',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table  public.debts                  is 'Dívidas do usuário. Substitui o booleano profiles.has_debt por saldo, juros e plano de quitação.';
comment on column public.debts.kind             is 'rotativo_cartao | cheque_especial | emprestimo_pessoal | financiamento | consignado | parcelamento_loja | outro';
comment on column public.debts.current_balance  is 'Saldo devedor hoje, em R$.';
comment on column public.debts.monthly_rate     is 'Taxa de juros AO MÊS, em fração decimal. 0.15 = 15% a.m. Dívida cara = >= 0.03.';
comment on column public.debts.minimum_payment  is 'Parcela mínima exigida pelo credor, em R$.';
comment on column public.debts.due_day          is 'Dia do mês do vencimento (1 a 31).';
comment on column public.debts.status           is 'ativa | quitada';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'debts_kind_check') then
    alter table public.debts add constraint debts_kind_check
      check (kind in ('rotativo_cartao','cheque_especial','emprestimo_pessoal',
                      'financiamento','consignado','parcelamento_loja','outro'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'debts_status_check') then
    alter table public.debts add constraint debts_status_check
      check (status in ('ativa','quitada'));
  end if;

  -- Saldo e parcela não são negativos. A taxa é fração: 0.15 = 15% a.m.
  -- O teto de 2 (200% a.m.) existe só para pegar quem digitar 15 em vez de 0.15.
  if not exists (select 1 from pg_constraint where conname = 'debts_amounts_check') then
    alter table public.debts add constraint debts_amounts_check
      check (current_balance >= 0 and minimum_payment >= 0
             and monthly_rate >= 0 and monthly_rate <= 2);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'debts_due_day_check') then
    alter table public.debts add constraint debts_due_day_check
      check (due_day is null or (due_day >= 1 and due_day <= 31));
  end if;
end $$;

alter table public.debts enable row level security;

drop policy if exists "debts_select_own" on public.debts;
create policy "debts_select_own" on public.debts for select
  using (auth.uid() = user_id);

drop policy if exists "debts_insert_own" on public.debts;
create policy "debts_insert_own" on public.debts for insert
  with check (auth.uid() = user_id);

drop policy if exists "debts_update_own" on public.debts;
create policy "debts_update_own" on public.debts for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "debts_delete_own" on public.debts;
create policy "debts_delete_own" on public.debts for delete
  using (auth.uid() = user_id);

create index if not exists debts_user_status_idx on public.debts (user_id, status);

drop trigger if exists trg_debts_touch on public.debts;
create trigger trg_debts_touch before update on public.debts
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- 2) PAGAMENTOS DE DÍVIDA
-- =============================================================================
create table if not exists public.debt_payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  debt_id    uuid not null references public.debts(id) on delete cascade,
  amount     numeric not null,
  paid_at    date not null default current_date,
  note       text,
  created_at timestamptz not null default now()
);

comment on table public.debt_payments is 'Pagamentos feitos em cada dívida, para acompanhar o progresso real contra o previsto.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'debt_payments_amount_check') then
    alter table public.debt_payments add constraint debt_payments_amount_check
      check (amount > 0);
  end if;
end $$;

alter table public.debt_payments enable row level security;

drop policy if exists "debt_payments_select_own" on public.debt_payments;
create policy "debt_payments_select_own" on public.debt_payments for select
  using (auth.uid() = user_id);

drop policy if exists "debt_payments_insert_own" on public.debt_payments;
create policy "debt_payments_insert_own" on public.debt_payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "debt_payments_update_own" on public.debt_payments;
create policy "debt_payments_update_own" on public.debt_payments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "debt_payments_delete_own" on public.debt_payments;
create policy "debt_payments_delete_own" on public.debt_payments for delete
  using (auth.uid() = user_id);

create index if not exists debt_payments_debt_idx on public.debt_payments (debt_id, paid_at desc);


-- =============================================================================
-- 3) MEMÓRIA DO CONSELHEIRO IA
-- =============================================================================
create table if not exists public.advice_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  period      text not null,
  advice      text not null,
  snapshot    jsonb,
  created_at  timestamptz not null default now()
);

comment on table  public.advice_history          is 'Conselhos gerados pela IA, para o advisor lembrar o que recomendou e cobrar no mês seguinte.';
comment on column public.advice_history.period   is 'Competência do conselho, no formato YYYY-MM.';
comment on column public.advice_history.snapshot is 'Números do usuário no momento do conselho, para comparar depois.';

alter table public.advice_history enable row level security;

drop policy if exists "advice_history_select_own" on public.advice_history;
create policy "advice_history_select_own" on public.advice_history for select
  using (auth.uid() = user_id);

drop policy if exists "advice_history_insert_own" on public.advice_history;
create policy "advice_history_insert_own" on public.advice_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "advice_history_delete_own" on public.advice_history;
create policy "advice_history_delete_own" on public.advice_history for delete
  using (auth.uid() = user_id);

create index if not exists advice_history_user_period_idx
  on public.advice_history (user_id, period desc);


-- =============================================================================
-- 4) CORREÇÕES DE CATEGORIA (OCR que aprende)
-- =============================================================================
create table if not exists public.category_corrections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title_pattern text not null,
  from_category text,
  to_category   text not null,
  hits          integer not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table  public.category_corrections               is 'Correções de categoria feitas pelo usuário, usadas para melhorar as próximas sugestões da IA.';
comment on column public.category_corrections.title_pattern is 'Título normalizado (minúsculo, sem acento) do lançamento corrigido.';
comment on column public.category_corrections.hits          is 'Quantas vezes a mesma correção se repetiu — quanto maior, mais confiança.';

alter table public.category_corrections enable row level security;

drop policy if exists "category_corrections_select_own" on public.category_corrections;
create policy "category_corrections_select_own" on public.category_corrections for select
  using (auth.uid() = user_id);

drop policy if exists "category_corrections_insert_own" on public.category_corrections;
create policy "category_corrections_insert_own" on public.category_corrections for insert
  with check (auth.uid() = user_id);

drop policy if exists "category_corrections_update_own" on public.category_corrections;
create policy "category_corrections_update_own" on public.category_corrections for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "category_corrections_delete_own" on public.category_corrections;
create policy "category_corrections_delete_own" on public.category_corrections for delete
  using (auth.uid() = user_id);

-- Uma correção por padrão de título, por usuário: a repetição incrementa hits
-- em vez de criar linha nova.
create unique index if not exists category_corrections_user_pattern_idx
  on public.category_corrections (user_id, title_pattern);

drop trigger if exists trg_category_corrections_touch on public.category_corrections;
create trigger trg_category_corrections_touch before update on public.category_corrections
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- 5) LIMITE DE USO DAS ROTAS DE IA
--    O app roda em funções serverless: contador em memória não limita nada,
--    porque cada chamada pode cair numa instância diferente. O estado precisa
--    viver no banco.
-- =============================================================================
create table if not exists public.ai_rate_limits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  route        text not null,
  window_start timestamptz not null default now(),
  call_count   integer not null default 0
);

comment on table  public.ai_rate_limits             is 'Contador de chamadas às rotas de IA por usuário e janela de tempo.';
comment on column public.ai_rate_limits.route       is 'advisor | auto-budget | extract';
comment on column public.ai_rate_limits.window_start is 'Início da janela corrente de contagem.';

alter table public.ai_rate_limits enable row level security;

-- Só leitura para o dono. A escrita acontece pela rota de API, no servidor.
drop policy if exists "ai_rate_limits_select_own" on public.ai_rate_limits;
create policy "ai_rate_limits_select_own" on public.ai_rate_limits for select
  using (auth.uid() = user_id);

drop policy if exists "ai_rate_limits_insert_own" on public.ai_rate_limits;
create policy "ai_rate_limits_insert_own" on public.ai_rate_limits for insert
  with check (auth.uid() = user_id);

drop policy if exists "ai_rate_limits_update_own" on public.ai_rate_limits;
create policy "ai_rate_limits_update_own" on public.ai_rate_limits for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create unique index if not exists ai_rate_limits_user_route_idx
  on public.ai_rate_limits (user_id, route);


-- =============================================================================
-- CHECKLIST DEPOIS DE RODAR
--
--   a) As 5 tabelas existem e TODAS com RLS ligada (rowsecurity deve ser true
--      nas cinco linhas):
--        select tablename, rowsecurity
--        from pg_tables
--        where schemaname = 'public'
--          and tablename in ('debts','debt_payments','advice_history',
--                            'category_corrections','ai_rate_limits')
--        order by tablename;
--
--   b) Contagem de policies por tabela (debts e debt_payments devem ter 4;
--      advice_history 3; category_corrections 4; ai_rate_limits 3):
--        select tablename, count(*)
--        from pg_policies
--        where schemaname = 'public'
--          and tablename in ('debts','debt_payments','advice_history',
--                            'category_corrections','ai_rate_limits')
--        group by tablename order by tablename;
--
--   c) Teste de isolamento — logado como você, deve retornar 0 linhas
--      (ninguém cadastrou dívida ainda, e você não deve ver a de outros):
--        select count(*) from public.debts;
--
--   d) Teste de constraint — deve FALHAR (taxa acima do teto de sanidade):
--        insert into public.debts (user_id, name, monthly_rate)
--        values (auth.uid(), 'teste', 15);
--      Se passar, o constraint não foi criado. O certo seria 0.15 para 15% a.m.
--
-- SEPARADO, FORA DESTE SQL — no painel do Supabase:
--   Storage -> bucket "receipts" -> deixe PRIVADO (desmarque "Public bucket").
--   O código já foi alterado para gerar URL assinada; se o bucket continuar
--   público, os comprovantes seguem acessíveis por link direto.
-- =============================================================================
