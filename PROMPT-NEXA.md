# PAPEL

Você é um engenheiro sênior full-stack e designer de produto, especialista em apps de finanças pessoais para o mercado brasileiro. Vai evoluir o app **Nexa** (contexto completo no CONTEXTO-IA.md anexo: stack, schema, convenções e defeitos conhecidos). Leia-o inteiro antes de qualquer coisa e siga todas as regras da seção 10 dele.

# OBJETIVO DO PRODUTO

O Nexa deve responder, de forma clara e sem esforço, a três perguntas do cliente:

1. **Para onde está indo o meu dinheiro?**
2. **Como eu saio das dívidas e me protejo de entrar de novo?**
3. **O que vai acontecer com meu dinheiro nos próximos meses e o que eu faço a respeito?**

Hoje o app é um retrovisor: mostra o que já aconteceu, sem contexto, sem projeção e sem plano. A meta é transformá-lo em um app que **mede, explica, projeta e orienta**.

# PÚBLICO

Brasileiro de classe média, com cartão parcelado, possível dívida cara (rotativo, cheque especial) e pouca educação financeira. Isso define:

- Vocabulário do dia a dia, sem jargão. Todo rótulo deve mostrar um número ou usar palavra comum. Exemplo: "38% DA RENDA", não "GARGALO".
- Taxas de juros realistas para o Brasil (rotativo do cartão acima de 15% a.m., cheque especial, empréstimo pessoal).
- Tom de aliado, nunca de julgamento. Quem está endividado já se sente mal.

# DEFINIÇÕES (use exatamente estas, não invente)

- **Dívida cara:** taxa **maior ou igual a 3% ao mês**. É ela que bloqueia o Estágio 1 e impede a sugestão de aporte. Dívidas abaixo desse corte (consignado, financiamento imobiliário, parcelamento sem juros) são registradas e acompanhadas, mas **não** bloqueiam nada.
- **Renda de referência:** mediana das receitas dos últimos 6 meses, **excluindo** a categoria Investimentos. Na ausência de histórico, usa o valor declarado no perfil.
- **Custo de vida:** mediana das despesas mensais, **excluindo** a categoria Investimentos.
- **Aporte:** lançamento `type: 'expense'` com categoria `Investimentos`. Sai do saldo, mas não é consumo.
- **Resgate:** lançamento `type: 'income'` com categoria `Investimentos`. Não é renda recorrente.

# PRINCÍPIOS INEGOCIÁVEIS

1. **Cada número tem um dono único.** Toda regra de negócio vive em `lib/` (funções puras, sem I/O, testáveis). Nenhuma tela recalcula o que já existe. Consolide o `formatMoney` duplicado em um único helper com `Intl.NumberFormat('pt-BR')`.
2. **Mostre o cálculo, não só o resultado.** Quando exibir um valor derivado (reserva, custo dos juros, data de quitação), deixe acessível "como chegamos nisso".
3. **Degradação graciosa.** Defina o que cada tela mostra quando não há dado suficiente (conta nova, menos de 3 meses de histórico, sem dívidas). Nunca exiba "R$ 0,00" em todos os degraus nem gráficos vazios. Mostre um estado vazio que oriente a próxima ação.
4. **Dinheiro:** `amount` é sempre positivo, o sinal vem de `type`. Venda de ativo não é renda recorrente. Investimento não entra no denominador da renda. Preserve o ajuste de `getTimezoneOffset()` nas parcelas.
5. **Segurança:** toda tabela nova com RLS por `user_id` desde o início. Para cada mudança de schema, entregue o `ALTER TABLE`/`CREATE TABLE` e as policies em um arquivo SQL em `supabase/`, pronto para eu rodar manualmente no painel. Não invente colunas fora do schema documentado.
6. **Sem biblioteca de UI nova.** Mantenha Tailwind, motion, recharts e o visual existente (neutral-950, rounded-3xl, indigo/emerald/rose/amber).
7. **Não faça aconselhamento enganoso.** Os cálculos devem ser transparentes e as projeções devem deixar claro que são estimativas.
8. **Não quebre número que já funciona.** Antes de alterar qualquer cálculo existente, escreva um teste que trave o comportamento atual. Mudança de resultado só passa se for intencional e declarada na entrega.

# O QUE CONSTRUIR

## A. Módulo de Dívidas (prioridade máxima)

Hoje `has_debt` é um booleano. Substitua por um módulo real.

**Dados (nova tabela `debts`, com RLS):** nome, credor, tipo (rotativo de cartão, cheque especial, empréstimo pessoal, financiamento, consignado, parcelamento de loja, outro), saldo atual, taxa de juros ao mês, parcela mínima, dia de vencimento, status (ativa/quitada), data de criação. Registre pagamentos em `debt_payments` (debt_id, valor, data), para acompanhar o progresso real.

**Cálculos (funções puras em `lib/debt.ts`, com testes):**

- Custo mensal dos juros = saldo × taxa mensal. Exiba como "essa dívida cobra R$ X por mês só para existir".
- Tempo de quitação com pagamento mensal P, saldo B e taxa mensal r: n = -ln(1 - r·B/P) / ln(1 + r). Se P ≤ r·B, avise que **a dívida nunca zera** nesse ritmo e mostre o pagamento mínimo necessário.
- Total de juros pagos até a quitação e data prevista de quitação.
- Comparação **avalanche** (maior juro primeiro) × **bola de neve** (menor saldo primeiro) com o mesmo orçamento mensal total para dívidas: tempo, juros totais e economia de uma sobre a outra. Recomende a avalanche pela matemática, mas explique a bola de neve como opção motivacional.
- Simulação de "pagamento extra": "se eu colocar +R$ 200/mês, quito X meses antes e economizo R$ Y".
- Linha do tempo de quitação (gráfico de saldo restante ao longo dos meses).

**Integração:** o Estágio 1 (Emergência) deixa de ser um checkbox e passa a ter meta mensurável: "dívida cara restante: R$ X, previsão de quitação: mês/ano". Saída do estágio 1 = saldo de dívidas caras zerado.

**Transição a partir do `has_debt` (obrigatório, não quebre usuários existentes):**
A função `computeStage` em `lib/profile.ts` hoje usa `if (hasDebt || ...) return STAGES.emergencia`. Trocar isso sem cuidado deixa usuários presos no Estágio 1 para sempre (responderam "tenho dívida" e não cadastraram nada) ou solta todo mundo de uma vez. Regra da transição:

- `has_debt = true` **e nenhuma dívida cadastrada** → permanece no Estágio 1 e a interface exibe um convite para cadastrar a dívida, explicando que sem isso o app não consegue calcular quitação.
- **A partir da primeira dívida cadastrada**, quem manda é a soma dos saldos de dívidas caras; `has_debt` deixa de ser consultado para decidir estágio.
- `has_debt = false` continua significando ausência de dívida cara.
- Ao quitar a última dívida cara, atualize `has_debt` para `false` para manter os dois consistentes.

**Orientação:** sugira quanto do orçamento direcionar às dívidas a partir do que sobra após custos fixos. Destaque a dívida de maior juro como "a que mais te custa". Se o usuário tem dívida cara e investimento ao mesmo tempo, mostre o contraste entre o juro da dívida e o rendimento provável.

## B. Para onde vai o dinheiro (diagnóstico de gastos)

- **Raio-x do mês:** quanto da renda vai para cada categoria (em R$ e em % da renda), comparado com a mediana dos últimos 3 meses.
- **Top maiores gastos e maiores aumentos** em relação ao histórico, em linguagem simples ("Você gastou R$ 340 a mais em Variáveis do que o normal").
- **Detecção de anomalias:** alerta quando o gasto variável do mês está X% acima da mediana de 3 meses (use `monthlyMedian` existente). Use número e texto junto da cor, nunca só cor.
- **Detecção real de recorrência:** substitua a lista de 21 marcas de `SubscriptionTrackerModal` por detecção por padrão: mesmo título (ou similar, normalizando caixa/acento/números) com valor parecido em meses consecutivos. Mostre custo mensal e anual das assinaturas e a confiança da detecção. Permita o usuário confirmar ou ignorar.
- **Gastos "invisíveis":** pequenos gastos frequentes somados por mês (delivery, apps, tarifas).
- **Orçamento mensal de verdade:** hoje `budgets` não tem período. Proponha a migração (coluna `month`) com o SQL, preservando os dados existentes, e mostre consumo do orçamento por categoria com alerta preventivo (ex.: 80% e 100%).

  **Atenção — risco de perda de dados:** o `BudgetModal` hoje salva com `delete().eq('user_id', userId)` seguido de `insert`, ou seja, **apaga todos os orçamentos do usuário** antes de gravar os novos. Introduzir a coluna `month` sem corrigir isso faz com que salvar o orçamento de um mês apague o histórico de todos os outros. A destruição está no código do app, não no SQL. Corrija o `delete` para ficar escopado ao mês que está sendo editado, **na mesma entrega** da migração, e descreva como os registros atuais (sem mês) serão atribuídos a um período.

## C. Previsão e planejamento

- **Projeção dos próximos 3 a 6 meses:** parcelas já lançadas (`installment_group`), custos fixos medianos e renda mediana. Responda "em novembro você já tem R$ X comprometidos antes de gastar um real" e "saldo projetado no fim de cada mês".
- **Calendário de vencimentos:** contas a pagar, parcelas e dívidas na ordem de data, com aviso de semanas apertadas.
- **Simulador "e se":** "se eu cortar R$ 300 por mês, quando bato minha reserva?", "se eu quitar essa dívida primeiro, o que muda?", "e se minha renda cair 20%?". Funções puras, resultado imediato.
- **Reserva de emergência:** custo de vida mediano × 3 (mínimo) e × 6 (ideal); × 6 e × 12 se a renda for variável. Mostre o quanto falta e a data prevista para completar no ritmo atual. Nenhum valor fixo universal.
- **Metas:** previsão de conclusão de cada meta no ritmo atual e sugestão de aporte mensal necessário para uma data-alvo.

## D. IA com contexto, memória e aprendizado

Mantenha o Gemini. O ganho está em alimentar melhor o prompt, não em trocar de modelo.

- **Payload enriquecido do advisor:** monte no servidor (ou em `lib/`) um resumo calculado com: renda e custo de vida medianos, estágio e limites do perfil, falta para a reserva, dívidas (saldo, juros, custo mensal), parcelas dos próximos meses, tendência versus 3 meses, composição do gargalo (cartões × variáveis), anomalias detectadas e assinaturas. A IA interpreta números prontos, não os recalcula.
- **Memória:** tabela `advice_history` (RLS) guardando cada conselho, as ações recomendadas e um snapshot dos números. No mês seguinte, inclua no prompt o que foi recomendado e o que aconteceu, para o advisor dizer "você cortou R$ 200 em variáveis como combinamos, continue assim".
- **OCR que aprende:** tabela `category_corrections` (de → para, por estabelecimento/título). Injete as correções mais recentes no prompt de `/api/extract`, e aplique-as também a lançamentos manuais com título parecido.
- **Rate limit** nas três rotas de IA, com mensagem amigável quando atingido.

  **O contador precisa viver fora do processo.** O app roda em funções serverless: cada chamada pode cair numa instância diferente, então `Map` ou variável de módulo em memória **não limita nada em produção**, apesar de parecer funcionar em desenvolvimento. Não há Redis no projeto — use uma tabela no Supabase com `user_id` + janela de tempo, com RLS, e documente o limite escolhido.
- A IA nunca inventa números. Se faltar dado, diz o que falta.

## E. Navegação e UX

- **Rotas no lugar de modais** para as telas principais (relatórios, dívidas, previsão, metas, casais, configurações, assinaturas), com URL própria. O botão voltar do Android deve voltar de tela, não fechar o app. Migre por rota, não tudo de uma vez. Modais ficam para ações rápidas (novo lançamento).
- Elimine o `CustomEvent('openModal')` global do BottomNav, substituindo por navegação tipada.
- **Seletor de mês global e visível** no topo do dashboard, deixando claro que escopa tudo.
- **Substitua os 7 `window.confirm`** por diálogo próprio no padrão visual do app e adicione **desfazer** (toast com "Desfazer" por alguns segundos) para exclusões, especialmente de séries de parcelas.
- **Onboarding guiado:** conta nova segue um caminho: lance a primeira receita, depois as contas fixas, depois as dívidas (se houver), depois veja o diagnóstico. Cada etapa com progresso visível e estado vazio orientado.
- **Tela inicial orientada à ação:** no topo, "o que fazer agora" (ex.: "Você tem 2 contas vencendo esta semana", "Sua dívida do cartão custa R$ 480/mês"), seguida dos números principais.

## F. Acessibilidade (correção barata, obrigatória)

- Fechar modais com **Esc**, com **focus trap**, retorno de foco ao gatilho e `role="dialog"`/`aria-modal`/`aria-labelledby`.
- `aria-label` em todo botão só com ícone.
- **Remover o bloqueio de zoom** (`userScalable: false`).
- O semáforo nunca comunica só por cor: sempre ícone ou texto junto.
- Contraste adequado no tema dark e alvos de toque de pelo menos 44px.

## G. Base técnica (faça junto, sem desviar do foco)

- Crie um hook/helper único para sessão + query, substituindo o bloco `getSession` duplicado, e use `limit`/filtro por período nas queries novas (o dashboard não deve baixar o histórico inteiro).
- Remova credenciais hardcoded com falha explícita se faltar configuração.
- **Recibos com URL assinada.** O `TransactionModal` usa `supabase.storage.from('receipts').getPublicUrl()`. Se o bucket for público, comprovantes financeiros ficam acessíveis a qualquer pessoa que tenha a URL — e URLs vazam por histórico, logs e compartilhamento. Troque por `createSignedUrl()` com expiração, ajuste a leitura nas telas que exibem o comprovante, e me diga o que preciso conferir no painel do Supabase para o bucket ficar privado. Trate isto como item de segurança, não de melhoria.
- Adicione testes (proponha Vitest) para `lib/profile.ts`, `lib/debt.ts`, recorrência, projeção e simulador.
- **Tipos do Supabase:** não tente rodar `supabase gen types` — exige CLI autenticado com acesso ao projeto, que você não tem. Escreva `lib/database.types.ts` à mão a partir do schema documentado no CONTEXTO-IA.md mais as tabelas novas desta entrega, use esses tipos no código novo em vez de `any`, e me entregue o comando do CLI para eu regenerar oficialmente depois.

# COMO TRABALHAR

Trabalhe em **fases**, nesta ordem, e **pare ao final de cada uma** para eu validar antes de seguir:

1. Fundação: helpers únicos (`formatMoney`, sessão), testes de `lib/profile.ts`, SQL das novas tabelas com RLS, e a correção das URLs assinadas dos recibos.
2. Módulo de Dívidas completo (A).
3. Enriquecimento do prompt da IA, memória e OCR que aprende (D).
4. Diagnóstico de gastos, anomalias e recorrência (B).
5. Previsão, calendário e simulador (C).
6. Rotas, desfazer, seletor de mês e onboarding (E).
7. Acessibilidade (F) e demais itens da base técnica (G).

**Antes de codar cada fase**, apresente em poucas linhas: arquivos que serão criados ou alterados, SQL necessário e decisões que dependem de mim. **Ao final**, entregue: código completo dos arquivos alterados, SQL separado, como testar manualmente e o que ficou de fora.

**Escopo por conversa:** este documento é o plano completo, mas **não tente executar mais de uma fase por vez**. Se eu enviar o documento inteiro, trate como contexto e execute apenas a fase que eu indicar — ou, se eu não indicar, comece pela fase 1 e pare. Entregar sete fases de uma vez produz sete entregas rasas e faz você perder as regras do início do documento.

# CRITÉRIOS DE ACEITE

- Um usuário com uma dívida de R$ 5.000 a 14% a.m. vê quanto ela custa por mês, a data de quitação em pelo menos 2 cenários de pagamento e a comparação avalanche × bola de neve.
- Uma conta nova não vê zeros nem gráficos vazios, e sim um caminho guiado.
- Um usuário com parcelas lançadas vê o valor já comprometido nos próximos meses.
- O botão voltar do Android navega entre telas.
- Nenhum número aparece calculado de forma diferente em duas telas.
- Todos os modais fecham com Esc e nenhum alerta depende só de cor.
- O advisor cita números reais do usuário, incluindo dívidas, e referencia o conselho do mês anterior quando existir.
- Um usuário que respondeu "tenho dívida" no onboarding e ainda não cadastrou nenhuma dívida continua no Estágio 1 e é convidado a cadastrar — não fica preso sem saída nem é liberado sem motivo.
- Salvar o orçamento de um mês não altera o orçamento dos outros meses.
- Cada fase entrega, junto com o código novo, os testes que travam os cálculos que ela tocou.

Se algo no CONTEXTO-IA.md entrar em conflito com este pedido, aponte o conflito e pergunte antes de decidir.
