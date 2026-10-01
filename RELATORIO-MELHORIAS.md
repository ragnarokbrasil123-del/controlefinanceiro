# Relatório de Melhorias — Nexa (Controle Financeiro)

> Diagnóstico de **inteligência financeira** e **estrutura de UI/UX** do app Nexa,
> com os pontos ancorados em arquivos e linhas do código real.
> Base para escrever um prompt de evolução do produto.
>
> Data: 2026-10-01

---

## Sumário

- [Parte 1 — Inteligência financeira](#parte-1--inteligência-financeira)
- [Parte 2 — Estrutura de UI/UX](#parte-2--estrutura-de-uiux)
- [Parte 3 — Prioridades](#parte-3--prioridades)
- [Parte 4 — Como transformar em prompt](#parte-4--como-transformar-isso-em-prompt)
- [Anexo — Estado atual do app](#anexo--estado-atual-do-app)

---

## Parte 1 — Inteligência financeira

O que o app chama de IA hoje são **três chamadas avulsas ao Google Gemini**, sem
memória entre si:

| Rota | Função |
|---|---|
| `/api/extract` | Lê recibo/comprovante por foto (OCR + extração) |
| `/api/advisor` | Gera conselho financeiro em texto |
| `/api/auto-budget` | Sugere orçamento pela regra 50/30/20 |

A inteligência de verdade está em `lib/profile.ts` — determinística, bem
estruturada e **subaproveitada**. É lá que vivem os 5 estágios financeiros, os
limites adaptativos por perfil e o cálculo de reserva.

### 1.1 O buraco maior: dívida é um booleano

`has_debt` (boolean) é **tudo** que o app sabe sobre dívida. Não há saldo, taxa
de juros, credor, nem plano de quitação.

Isso é grave porque o **Estágio 1** — o mais crítico da jornada — manda
*"quitar a dívida cara antes de qualquer outra coisa"*. O app dá uma ordem que
não consegue medir, acompanhar nem planejar.

A tese do produto é tirar a pessoa do buraco, e a ferramenta não enxerga o
tamanho do buraco.

**O que falta:**

- Tabela de dívidas: saldo atual, taxa de juros ao mês, credor, parcela mínima
- Custo mensal dos juros (quanto a dívida cobra só para existir)
- Comparação entre estratégias: avalanche (maior juro primeiro) × bola de neve
  (menor saldo primeiro)
- Previsão da data de quitação conforme o valor pago por mês
- Integração com o Estágio 1: sair dele deixa de ser um checkbox e vira meta
  mensurável

Rotativo de cartão no Brasil passa de 15% ao mês. Qualquer outra decisão
financeira é ruído perto disso — é aqui que um app brasileiro ganha ou perde.

### 1.2 Assinaturas detectadas por lista de marcas

Em `components/SubscriptionTrackerModal.tsx`, linha 10:

```js
const keywords = ['netflix', 'spotify', 'amazon', 'prime', 'academia',
                  'gympass', 'smartfit', 'internet', 'claro', 'vivo', 'tim',
                  'youtube', 'hbo', 'disney', 'apple', 'icloud', 'xbox',
                  'playstation', 'oi', 'banda larga', 'wifi'];
```

São **21 palavras fixas**. Isso não detecta recorrência — detecta marcas que
alguém listou um dia.

**Problemas:**

- Perde Alura, Duolingo, seguro do carro, mensalidade do contador, qualquer
  serviço regional ou novo
- Marca **toda** despesa da categoria "Contas Fixas" como assinatura
- Exige manutenção eterna da lista

**O dado para fazer certo já está no banco:** mesmo título (ou título similar)
com valor parecido se repetindo em meses consecutivos. Detecção por padrão, não
por dicionário.

### 1.3 O app é um retrovisor — não projeta nada

Não existe previsão em lugar nenhum. E os dados estão todos disponíveis:

- Parcelas futuras já lançadas (`installment_group`, com datas)
- Custo fixo mediano (a função `monthlyMedian` já existe em `lib/profile.ts`)
- Renda mediana

Dá para responder **"em novembro você já tem R$ 2.400 comprometidos antes de
gastar um real"** — e o app não responde. Quem usa parcelamento precisa
exatamente disso.

### 1.4 Nenhuma detecção de anomalia

*"Seus gastos variáveis estão 60% acima da sua mediana de 3 meses"* é trivial de
calcular com o que já existe, e é o tipo de aviso que muda comportamento.

Hoje o app mostra o número do mês sem nenhum contexto histórico.

### 1.5 A IA recebe dados crus, não inteligência

O payload enviado ao advisor (`components/AdvisorModal.tsx`, linha 70):

```js
{ income, expense, balance, transactions, strategy, stage }
```

**Não envia:**

- Quanto falta para completar a reserva de emergência
- Parcelas já comprometidas nos próximos meses
- Custo de vida apurado
- Os limites de alerta do perfil
- Tendência contra os meses anteriores
- Composição do gargalo (cartões × variáveis separados)

O `lib/profile.ts` calcula tudo isso muito bem, e a IA é obrigada a adivinhar do
zero com cinco transações.

> **O maior ganho de qualidade está em alimentar melhor o prompt, não em trocar
> de modelo.**

### 1.6 A IA não tem memória

Cada conselho nasce zerado. Não sabe o que recomendou no mês anterior, nem se o
usuário seguiu. Não há como dizer *"você cortou R$ 200 em variáveis como
combinamos — continue assim"*.

Guardar os conselhos e o resultado do mês seguinte transformaria o advisor de
gerador de texto em acompanhamento.

### 1.7 Não há simulação

*"Se eu cortar R$ 300 por mês, quando bato minha reserva?"*

Não existe. É a pergunta mais natural de quem está nos estágios 2 e 3, e uma das
mais fáceis de calcular.

### 1.8 O OCR não aprende

O usuário corrige a categoria sugerida pela IA e o app esquece. A próxima foto do
mesmo mercado erra igual.

Guardar as correções (de → para) e injetá-las no prompt resolveria boa parte.

---

## Parte 2 — Estrutura de UI/UX

### 2.1 O problema número um: 24 modais, 4 rotas

Praticamente todo o app vive dentro de modal. **Nada tem URL.**

Consequências concretas:

| Sintoma | Causa |
|---|---|
| Botão voltar do Android **fecha o app** em vez do modal | modal não é rota |
| Não dá para mandar link de uma tela específica | sem URL |
| Atualizar a página perde onde o usuário estava | estado só em memória |
| Analytics não enxerga navegação interna | sem mudança de rota |
| Impossível abrir duas coisas em abas | sem URL |

Num app mobile-first, o botão voltar fechando o app é um problema sério de
percepção: o usuário acha que perdeu o que estava fazendo.

### 2.2 Navegação por evento global

O `BottomNav` dispara:

```js
window.dispatchEvent(new CustomEvent('openModal', { detail: 'relatorios' }));
```

E o dashboard escuta. Sem tipagem, sem rastreabilidade, e quebra em silêncio se
o nome mudar — foi assim que o botão "Início" ficou sem função por tempo
indeterminado, disparando um evento que ninguém escutava.

### 2.3 Acessibilidade: praticamente zero

A varredura encontrou **1 atributo `aria` no app inteiro**.

- **Nenhum modal fecha com a tecla Esc**
- **Nenhum focus trap** — o teclado continua navegando pelos elementos atrás do
  modal aberto
- **Zoom bloqueado** (`userScalable: false` em `app/layout.tsx`)
- **O semáforo de alerta comunica apenas por cor** — quem tem daltonismo não
  distingue âmbar de verde
- Sem `aria-label` nos botões que só têm ícone

Para um app financeiro, muito usado com a visão cansada no fim do dia, isso pesa
mais que a média.

### 2.4 Sete diálogos nativos do navegador

`window.confirm` aparece em 7 lugares. Eles quebram o idioma visual do app, não
são estilizáveis e se comportam de forma inconsistente em navegadores mobile.

Pior: **não existe desfazer em lugar nenhum**. A confirmação é a única rede de
segurança. Num app de dinheiro, excluir uma série de parcelas sem undo é
arriscado.

### 2.5 Navegação de mês escondida

Todo o dashboard é escopado pelo mês ativo, mas o seletor de mês fica dentro do
cabeçalho da seção "Organização", no meio da página. O usuário muda os quatro
cards do topo sem perceber de onde veio a mudança.

### 2.6 Sem estado vazio orientado

Uma conta nova vê zeros em todas as telas. Não existe um caminho guiado do tipo:

1. Lance sua primeira receita
2. Agora suas contas fixas
3. Veja seu diagnóstico

O onboarding coleta o perfil, mas não conduz ao primeiro uso real.

---

## Parte 3 — Prioridades

Ordenadas por **impacto no cliente ÷ esforço**:

| # | Item | Por quê |
|---|---|---|
| 1 | **Módulo de dívidas** | O app manda quitar e não sabe medir. Fecha o buraco da própria tese |
| 2 | **Enriquecer o prompt da IA** | Maior ganho de qualidade pelo menor esforço — os dados já existem |
| 3 | **Previsão dos próximos 3 meses** | Dados prontos; responde à dor de quem parcela |
| 4 | **Rotas no lugar de modais** | Conserta o voltar do Android e destrava compartilhamento |
| 5 | **Detecção de recorrência real** | Substitui o dicionário de 21 marcas |
| 6 | **Alertas de anomalia** | Muda comportamento; usa `monthlyMedian`, que já existe |
| 7 | **Acessibilidade** | Esc, focus trap, zoom, texto junto da cor. Correção barata |
| 8 | **Simulador "e se"** | Diferencial competitivo com cálculo simples |

---

## Parte 4 — Como transformar isso em prompt

Elementos que fazem diferença na qualidade do resultado:

### Contexto obrigatório

Anexe o `CONTEXTO-IA.md`, que já contém schema do banco e convenções do projeto.
Acrescente que **`lib/profile.ts` é onde a regra de negócio mora** e que nada de
I/O entra lá — é o que o mantém testável.

### Defina o público

> "Brasileiro, classe média, com cartão parcelado e pouca educação financeira."

Gera decisões diferentes de "investidor experiente". Isso muda a taxa de juros
assumida, o vocabulário da interface e o que merece destaque.

### Peça o cálculo explícito, não o resultado

Em vez de *"mostre a reserva de emergência"*, escreva:

> "Reserva = custo de vida mediano × 3 (mínimo) e × 6 (ideal); sendo × 6 e × 12
> se a renda for variável."

Foi exatamente isso que evitou que um valor fixo de R$ 21.000 virasse regra para
todos os usuários — número que só faz sentido para quem gasta R$ 3.500/mês.

### Proíba jargão na interface

Caso real: a etiqueta "Gargalo" precisou ser explicada até para o dono do
produto. Peça que **todo rótulo mostre o número ou use palavra do dia a dia**.

Exemplo de melhoria aplicada: a etiqueta fixa `GARGALO` virou `38% DA RENDA`,
com cor variando pelo semáforo — passou a responder "isso está bom ou ruim?" em
vez de exigir que o usuário decorasse um termo.

### Exija que cada número tenha dono único

Metade dos bugs encontrados vinha de duas telas calculando a mesma coisa de
formas diferentes:

- `formatMoney` reimplementado 4 vezes, com resultados divergentes
  (`R$ 1500,50` × `R$ 1.500,50`)
- Reserva de emergência calculada sobre salário numa tela e sobre custo de vida
  em outra
- Investimento contado como receita no dashboard e como despesa no relatório

### Peça degradação graciosa

O que cada tela mostra quando **não há dado suficiente**?

Foi isso que evitou a escada de estágios exibir "faltam R$ 0,00" em todos os
degraus para uma conta nova.

---

## Anexo — Estado atual do app

### Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Supabase (Auth + Postgres + Storage) · Google Gemini · Recharts · Motion

Aplicação 100% client-side: os componentes falam direto com o Supabase, e as
rotas em `app/api/` existem apenas para manter a chave do Gemini fora do
navegador.

### O que já foi resolvido recentemente

- **Perfil financeiro adaptativo**: 5 estágios (Emergência → Estabilidade →
  Reserva → Acumulação → Independência), com limites de alerta e metas de
  reserva calculados por perfil em vez de constantes universais
- **Reserva sobre custo de vida**, não sobre salário (3–6 meses, ou 6–12 se
  renda variável)
- **Investimento fora da renda**: venda de ativo não é renda recorrente e
  inflava o denominador de todos os percentuais
- **Patrimônio com valor de mercado**: posições com aportado × vale hoje ×
  rendimento
- **Credenciais fora do código**, com falha explícita se faltar configuração
- **PWA para de pedir instalação** em toda visita

### Pendências de segurança (fora do código)

- **Rotacionar a anon key do Supabase** — a atual esteve exposta no histórico
  público do repositório
- **Confirmar se o bucket `receipts` é privado** — se for público, comprovantes
  ficam acessíveis por URL

### Pendências técnicas conhecidas

- Nenhum teste automatizado (o `lib/profile.ts` está isolado e pronto para
  receber os primeiros)
- Queries sem paginação: o dashboard baixa todo o histórico do usuário
- Painel `/admin` não escala (agrega no navegador) e exibe e-mails fabricados
- Rotas de IA sem rate limit
- Service worker é fachada: o app não funciona offline apesar de ser PWA
