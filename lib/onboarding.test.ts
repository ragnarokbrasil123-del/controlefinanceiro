import { describe, it, expect } from 'vitest';
import { getOnboardingState } from './onboarding';

const receita = { type: 'income', category: 'Salário' };
const fixa = { type: 'expense', category: 'Contas Fixas' };
const variavel = { type: 'expense', category: 'Variáveis' };

const estado = (over: Partial<Parameters<typeof getOnboardingState>[0]> = {}) =>
  getOnboardingState({
    transactions: [],
    hasDebtsRegistered: false,
    declaredNoDebt: false,
    ...over,
  });

describe('getOnboardingState', () => {
  it('conta nova começa com tudo pendente', () => {
    const s = estado();
    expect(s.completedCount).toBe(0);
    expect(s.complete).toBe(false);
    expect(s.currentStep?.id).toBe('receita');
  });

  it('lançar renda conclui o primeiro passo', () => {
    const s = estado({ transactions: [receita] });
    expect(s.steps.find(x => x.id === 'receita')!.done).toBe(true);
    expect(s.currentStep?.id).toBe('fixas');
  });

  it('gasto variável não conta como conta fixa', () => {
    // O custo de vida que define a reserva vem das fixas; aceitar qualquer
    // despesa daria o passo por cumprido sem a informação que importa.
    const s = estado({ transactions: [receita, variavel] });
    expect(s.steps.find(x => x.id === 'fixas')!.done).toBe(false);
  });

  it('resgate de investimento não conta como renda', () => {
    const s = estado({ transactions: [{ type: 'income', category: 'Investimentos' }] });
    expect(s.steps.find(x => x.id === 'receita')!.done).toBe(false);
  });

  it('quem respondeu que não tem dívida já cumpre o passo', () => {
    // Exigir cadastro de quem não tem dívida seria pedir dado inexistente.
    const s = estado({ declaredNoDebt: true });
    expect(s.steps.find(x => x.id === 'dividas')!.done).toBe(true);
  });

  it('cadastrar dívida cumpre o passo mesmo sem ter declarado', () => {
    const s = estado({ hasDebtsRegistered: true });
    expect(s.steps.find(x => x.id === 'dividas')!.done).toBe(true);
  });

  it('o diagnóstico só libera com os três anteriores prontos', () => {
    const quaseLa = estado({ transactions: [receita, fixa] });
    expect(quaseLa.steps.find(x => x.id === 'diagnostico')!.done).toBe(false);

    const completo = estado({ transactions: [receita, fixa], declaredNoDebt: true });
    expect(completo.steps.find(x => x.id === 'diagnostico')!.done).toBe(true);
    expect(completo.complete).toBe(true);
    expect(completo.currentStep).toBeNull();
  });

  it('o estado é derivado: apagar o lançamento volta o passo para pendente', () => {
    // Flag gravada sairia de sincronia aqui, e o app afirmaria uma coisa
    // enquanto mostra outra.
    const comDados = estado({ transactions: [receita, fixa], declaredNoDebt: true });
    expect(comDados.complete).toBe(true);

    const semDados = estado({ transactions: [], declaredNoDebt: true });
    expect(semDados.complete).toBe(false);
    expect(semDados.currentStep?.id).toBe('receita');
  });

  it('todo passo tem título, descrição e rótulo de ação', () => {
    for (const step of estado().steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
      expect(step.actionLabel.length).toBeGreaterThan(0);
    }
  });
});
