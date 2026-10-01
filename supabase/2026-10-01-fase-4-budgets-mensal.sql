-- =============================================================================
-- Nexa (controlefinanceiro) — FASE 4: orçamento por mês
-- 2026-10-01
--
-- Rode isto inteiro no SQL Editor do painel Supabase (Project -> SQL Editor).
-- É seguro rodar mais de uma vez.
--
-- POR QUE ISTO VEM SEPARADO DO SQL DA FASE 1
--   O `BudgetModal` salvava assim:
--
--       delete from budgets where user_id = <eu>;   -- APAGA TUDO
--       insert into budgets (...)                   -- grava os novos
--
--   Ou seja: a destruição estava no CÓDIGO, não no schema. Se a coluna `month`
--   tivesse passado a ser usada antes da correção do componente, salvar o
--   orçamento de um mês apagaria o histórico de todos os outros — exatamente o
--   problema que a migração pretendia resolver.
--
--   Por isso este SQL só saiu junto com o commit que escopa aquele delete ao
--   mês que está sendo editado.
--
-- A COLUNA `month` JÁ EXISTIA, COMO INTEGER
--   Descoberto ao rodar a primeira versão deste arquivo, que falhou com
--   "column month is of type integer but expression is of type text".
--
--   Ela nunca foi lida nem gravada pelo app — o BudgetModal até recebe
--   `activeMonth` como prop, mas não a usava ao salvar. Era uma coluna morta,
--   provavelmente de uma versão anterior do produto.
--
--   Número de mês sem ano é ambíguo de qualquer forma (março de qual ano?),
--   então o formato correto é texto 'YYYY-MM' — o mesmo usado em
--   advice_history e nos filtros do app, que fatiam a data com slice(0,7).
--   Texto em vez de date porque não existe "dia" num orçamento mensal, e date
--   forçaria um dia fictício.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) Converte a coluna existente de integer para text
--    Condicional para o arquivo continuar idempotente e para não falhar em
--    ambientes onde a coluna já esteja no tipo certo.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'budgets'
      and column_name = 'month' and data_type = 'integer'
  ) then
    alter table public.budgets
      alter column month type text using month::text;
    raise notice 'Coluna month convertida de integer para text.';
  end if;
end $$;

-- Em ambiente onde a coluna não exista, cria já no tipo certo.
alter table public.budgets
  add column if not exists month text;

comment on column public.budgets.month is 'Competência do orçamento, no formato YYYY-MM. Um orçamento por categoria por mês.';


-- -----------------------------------------------------------------------------
-- 2) Backfill — linhas sem competência viram o mês corrente
--    No ambiente de produção a tabela estava vazia, então isto é no-op lá.
--    Fica para quem rodar este arquivo com dados já existentes: atribuir ao
--    mês corrente é a leitura mais fiel, por ser o último orçamento definido.
-- -----------------------------------------------------------------------------
update public.budgets
set month = to_char(current_date, 'YYYY-MM')
where month is null;


-- -----------------------------------------------------------------------------
-- 3) Validação de formato
--    Impede que entre 'outubro', '10/2026' ou qualquer coisa que o app não
--    saiba comparar com os filtros de período.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'budgets_month_format_check') then
    alter table public.budgets
      add constraint budgets_month_format_check
      check (month is null or month ~ '^\d{4}-(0[1-9]|1[0-2])$');
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- 4) Uma linha por categoria, por mês, por usuário
--    Sem isto, salvar duas vezes criaria orçamentos duplicados para a mesma
--    categoria e o consumo seria medido contra um teto errado.
--
--    Cria o índice apenas se não houver duplicata pendente — se houver, avisa
--    em vez de falhar no meio da migração.
-- -----------------------------------------------------------------------------
do $$
declare
  duplicatas integer;
begin
  select count(*) into duplicatas from (
    select user_id, category, month
    from public.budgets
    where month is not null
    group by user_id, category, month
    having count(*) > 1
  ) d;

  if duplicatas > 0 then
    raise notice 'ATENÇÃO: % combinação(ões) de usuário+categoria+mês duplicadas. O índice único NÃO foi criado. Remova as duplicatas e rode este arquivo de novo.', duplicatas;
  else
    create unique index if not exists budgets_user_category_month_idx
      on public.budgets (user_id, category, month);
    raise notice 'Índice único criado com sucesso.';
  end if;
end $$;


create index if not exists budgets_user_month_idx
  on public.budgets (user_id, month);


-- =============================================================================
-- CHECKLIST DEPOIS DE RODAR
--
--   a) A coluna está como text:
--        select data_type from information_schema.columns
--        where table_schema='public' and table_name='budgets' and column_name='month';
--
--   b) Nenhuma linha ficou sem mês (deve retornar 0):
--        select count(*) from public.budgets where month is null;
--
--   c) O formato é validado — isto deve FALHAR:
--        update public.budgets set month = 'outubro' where user_id = auth.uid();
--
--   d) Depois de salvar o orçamento de um mês pelo app, confirme que os meses
--      anteriores continuam lá:
--        select month, count(*) from public.budgets
--        where user_id = auth.uid() group by month order by month;
-- =============================================================================
