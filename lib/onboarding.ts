/**
 * Primeiros passos — o caminho guiado de quem acabou de entrar.
 *
 * Conta nova via zeros em todas as telas: abria, não entendia o que fazer e
 * fechava. O onboarding de perfil pergunta quem a pessoa é, mas não a leva a
 * usar o app.
 *
 * O estado de cada passo é DERIVADO dos dados reais, nunca gravado. Flag de
 * "já fez o passo 2" sai de sincronia no instante em que o usuário apaga o
 * lançamento — e aí o app afirma uma coisa e mostra outra.
 */

export type StepId = 'receita' | 'fixas' | 'dividas' | 'diagnostico';

export interface OnboardingStep {
  id: StepId;
  title: string;
  description: string;
  done: boolean;
  /** Rótulo do botão de ação; ausente quando o passo já está concluído */
  actionLabel: string;
  /**
   * Saída alternativa, para passos que nem todo mundo precisa cumprir.
   *
   * Sem isto, quem respondeu "tenho dívida" no onboarding e depois não quer
   * cadastrar fica num beco sem saída: o único botão pede um dado que a
   * pessoa não tem ou não quer dar.
   */
  secondaryLabel?: string;
}

type Tx = { type?: string; category?: string };

export interface OnboardingState {
  steps: OnboardingStep[];
  completedCount: number;
  total: number;
  /** true quando todos os passos foram cumpridos — a lista some */
  complete: boolean;
  /** Primeiro passo pendente, para destacar */
  currentStep: OnboardingStep | null;
}

export function getOnboardingState(params: {
  transactions: Tx[];
  hasDebtsRegistered: boolean;
  /** profiles.has_debt — `false` significa "respondi que não tenho" */
  declaredNoDebt: boolean;
}): OnboardingState {
  const { transactions, hasDebtsRegistered, declaredNoDebt } = params;

  const temReceita = transactions.some(t => t.type === 'income' && t.category !== 'Investimentos');
  const temFixas = transactions.some(t => t.type === 'expense' && t.category === 'Contas Fixas');

  // Dívida é o único passo que pode ser concluído sem cadastrar nada: quem
  // respondeu "não tenho" no perfil já resolveu o passo. Exigir cadastro de
  // quem não tem dívida seria pedir um dado que não existe.
  const dividasResolvido = hasDebtsRegistered || declaredNoDebt;

  const steps: OnboardingStep[] = [
    {
      id: 'receita',
      title: 'Lance sua renda',
      description: 'Salário, pró-labore ou o que entra todo mês. Sem isso o Nexa não tem com o que comparar seus gastos.',
      done: temReceita,
      actionLabel: 'Lançar renda',
    },
    {
      id: 'fixas',
      title: 'Cadastre suas contas fixas',
      description: 'Aluguel, luz, internet. É o que define seu custo de vida — e a meta da sua reserva.',
      done: temFixas,
      actionLabel: 'Lançar conta fixa',
    },
    {
      id: 'dividas',
      title: 'Tem dívida? Cadastre',
      description: 'Cartão no rotativo, cheque especial, empréstimo. O Nexa calcula quanto custa e quando acaba.',
      done: dividasResolvido,
      actionLabel: 'Cadastrar dívida',
      secondaryLabel: 'Não tenho dívidas',
    },
    {
      id: 'diagnostico',
      title: 'Veja seu diagnóstico',
      description: 'Com os dados acima, o Nexa mostra em que estágio financeiro você está e o que fazer primeiro.',
      // Só faz sentido depois dos dados: diagnóstico sem base é chute.
      done: temReceita && temFixas && dividasResolvido,
      actionLabel: 'Ver minha jornada',
    },
  ];

  const completedCount = steps.filter(s => s.done).length;

  return {
    steps,
    completedCount,
    total: steps.length,
    complete: completedCount === steps.length,
    currentStep: steps.find(s => !s.done) ?? null,
  };
}
