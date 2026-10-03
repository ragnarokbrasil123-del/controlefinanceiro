import { describe, it, expect } from 'vitest';
import {
  parseMoney, validateMoney, validateText, validateMonthlyRate,
  validateDate, validateInteger, firstError, MAX_MONEY,
} from './validation';

describe('parseMoney', () => {
  it('aceita formato brasileiro colado de planilha ou app de banco', () => {
    expect(parseMoney('1.234,56')).toBe(1234.56);
    expect(parseMoney('1234,56')).toBe(1234.56);
  });

  it('aceita formato com ponto decimal', () => {
    expect(parseMoney('1234.56')).toBe(1234.56);
    expect(parseMoney(1234.56)).toBe(1234.56);
  });

  it('devolve null para o que não é número', () => {
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('')).toBeNull();
    expect(parseMoney(NaN)).toBeNull();
    expect(parseMoney(Infinity)).toBeNull();
  });
});

describe('validateMoney', () => {
  it('aceita valor positivo e arredonda aos centavos', () => {
    // Sem arredondar, um valor colado com 6 casas reaparece como R$ 10,999999
    // nas somas do dashboard.
    const r = validateMoney('10.999999');
    expect(r.ok).toBe(true);
    expect(r.value).toBe(11);
  });

  it('recusa zero por padrão e aceita quando permitido', () => {
    expect(validateMoney('0').ok).toBe(false);
    expect(validateMoney('0', 'valor', { allowZero: true }).ok).toBe(true);
  });

  it('recusa negativo', () => {
    expect(validateMoney('-50').ok).toBe(false);
  });

  it('recusa valor absurdo', () => {
    // Um trilhão e um: erro de digitação, não patrimônio. Valor assim
    // distorce média, mediana e todo o diagnóstico junto.
    expect(validateMoney(String(MAX_MONEY + 1)).ok).toBe(false);
  });

  it('usa o rótulo na mensagem', () => {
    expect(validateMoney('', 'saldo devedor').error).toContain('saldo devedor');
  });
});

describe('validateText', () => {
  it('corta espaço em volta', () => {
    expect(validateText('  Conta de luz  ').value).toBe('Conta de luz');
  });

  it('exige preenchimento por padrão', () => {
    expect(validateText('   ').ok).toBe(false);
  });

  it('aceita vazio quando não é obrigatório', () => {
    expect(validateText('', 'observação', { required: false }).ok).toBe(true);
  });

  it('recusa texto longo demais', () => {
    // Sem limite, dá para colar um romance no título e quebrar o layout
    // de todas as listas.
    expect(validateText('x'.repeat(200)).ok).toBe(false);
  });
});

describe('validateMonthlyRate', () => {
  it('converte porcentagem da tela em fração do banco', () => {
    expect(validateMonthlyRate('14').value).toBe(0.14);
    expect(validateMonthlyRate('1,8').value).toBe(0.018);
  });

  it('pega quem digita 1500 achando que é porcentagem', () => {
    const r = validateMonthlyRate('1500');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('% ao mês');
  });

  it('aceita zero — dívida sem juros existe', () => {
    expect(validateMonthlyRate('0').ok).toBe(true);
  });
});

describe('validateDate', () => {
  const ano = new Date().getUTCFullYear();

  it('aceita data do período esperado', () => {
    expect(validateDate(`${ano}-10-15`).ok).toBe(true);
  });

  it('recusa formato errado', () => {
    expect(validateDate('15/10/2026').ok).toBe(false);
  });

  it('recusa ano absurdo — quase sempre erro de digitação', () => {
    expect(validateDate('1900-01-01').ok).toBe(false);
    expect(validateDate(`${ano + 50}-01-01`).ok).toBe(false);
  });

  it('aceita parcela dentro do horizonte de 20 anos', () => {
    expect(validateDate(`${ano + 2}-03-10`).ok).toBe(true);
  });
});

describe('validateInteger', () => {
  it('valida parcelas dentro do intervalo', () => {
    expect(validateInteger(12, 'parcelas', { min: 2, max: 48 }).ok).toBe(true);
    expect(validateInteger(60, 'parcelas', { min: 2, max: 48 }).ok).toBe(false);
  });

  it('recusa fração', () => {
    expect(validateInteger(2.5).ok).toBe(false);
  });

  it('valida dia de vencimento', () => {
    expect(validateInteger(31, 'dia', { min: 1, max: 31 }).ok).toBe(true);
    expect(validateInteger(32, 'dia', { min: 1, max: 31 }).ok).toBe(false);
  });
});

describe('firstError', () => {
  it('devolve só a primeira falha', () => {
    // Quatro toasts de uma vez na cara do usuário não ajuda ninguém.
    const erro = firstError(
      validateText('ok'),
      validateMoney('-1', 'valor'),
      validateMoney('0', 'outro'),
    );
    expect(erro).toContain('valor');
  });

  it('devolve null quando está tudo certo', () => {
    expect(firstError(validateText('ok'), validateMoney('10'))).toBeNull();
  });
});
