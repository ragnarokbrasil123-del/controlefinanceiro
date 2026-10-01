import { describe, it, expect } from 'vitest';
import { normalizeTitle, applyCorrections, type CategoryCorrection } from './corrections';

describe('normalizeTitle', () => {
  it('ignora caixa, acento e pontuação', () => {
    expect(normalizeTitle('SUPERMERCADO PÃO')).toBe(normalizeTitle('supermercado pao'));
    expect(normalizeTitle('Padaria, do João')).toBe('padaria do joao');
  });

  it('remove números — data e parcela não identificam o lugar', () => {
    // Sem isto, cada recibo do mesmo mercado viraria uma correção diferente
    // e o aprendizado nunca acumularia.
    expect(normalizeTitle('Mercado Silva 12/03')).toBe(normalizeTitle('Mercado Silva 28/04'));
  });

  it('usa só as primeiras palavras, onde mora o nome', () => {
    expect(normalizeTitle('Farmacia Sao Joao Filial Centro Loja')).toBe('farmacia sao joao');
  });

  it('título vazio ou só números vira string vazia', () => {
    expect(normalizeTitle('')).toBe('');
    expect(normalizeTitle('123 456')).toBe('');
  });
});

describe('applyCorrections', () => {
  const corrections: CategoryCorrection[] = [
    { title_pattern: 'mercado silva', from_category: 'Variáveis', to_category: 'Contas Fixas', hits: 3 },
    { title_pattern: 'padaria', from_category: null, to_category: 'Variáveis', hits: 1 },
  ];

  it('substitui a sugestão quando há correção exata', () => {
    expect(applyCorrections('Mercado Silva 12/03', 'Variáveis', corrections)).toBe('Contas Fixas');
  });

  it('casa parcialmente', () => {
    expect(applyCorrections('Padaria do João', 'Cartões', corrections)).toBe('Variáveis');
  });

  it('mantém a sugestão quando não conhece o título', () => {
    expect(applyCorrections('Posto Shell', 'Variáveis', corrections)).toBe('Variáveis');
  });

  it('não quebra sem correções', () => {
    expect(applyCorrections('Qualquer coisa', 'Variáveis', [])).toBe('Variáveis');
  });
});
