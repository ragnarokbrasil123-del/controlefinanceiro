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
--   tivesse sido criada antes da correção do componente, salvar o orçamento de
--   um mês apagaria o histórico de todos os outros — exatamente o problema que
--   a migração pretendia resolver.
--
--   Por isso este SQL só saiu junto com o commit que escopa aquele delete ao
--   mês que está sendo editado.
--
-- O QUE ACONTECE COM OS DADOS EXISTENTES
--   As linhas atuais não têm mês. Elas são atribuídas ao mês corrente, que é a
--   leitura mais fiel: foi o último orçamento que o usuário definiu e é o que
--   ele enxerga hoje na tela.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) Coluna de competência
--    Formato 'YYYY-MM' (texto), igual ao usado em advice_history e nos filtros
--    do app, que fatiam a data com slice(0,7). Texto em vez de date porque não
--    existe "dia" num orçamento mensal, e date forçaria um dia fictício.
-- -----------------------------------------------------------------------------
alter table public.budgets
  add column if not exists month text;

comment on column public.budgets.month is 'Competência do orçamento, no formato YYYY-MM. Um orçamento por categoria por mês.';


-- -----------------------------------------------------------------------------
-- 2) Backfill — linhas antigas viram o orçamento do mês corrente
-- -----------------------------------------------------------------------------
update public.budgets
set month = to_char(current_date, 'YYYY-MM')
where month is null;


-- -----------------------------------------------------------------------------
-- 3) Validação de formato
--    Impede que entre 'outubro', '10/2026' ou qualquer outra coisa que o app
--    não saiba comparar com os filtros de período.
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
--    categoria e o consumo seria calculado contra um teto errado.
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
--   a) A coluna existe e nenhuma linha ficou sem mês (deve retornar 0):
--        select count(*) from public.budgets where month is null;
--
--   b) Veja seus orçamentos com a competência atribuída:
--        select category, amount, month from public.budgets where user_id = auth.uid();
--
--   c) O formato é validado — isto deve FALHAR:
--        update public.budgets set month = 'outubro' where user_id = auth.uid();
--
--   d) Depois de salvar o orçamento de um mês pelo app, confirme que os meses
--      anteriores continuam lá:
--        select month, count(*) from public.budgets
--        where user_id = auth.uid() group by month order by month;
-- =============================================================================
