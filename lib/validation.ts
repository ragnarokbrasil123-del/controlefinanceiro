/**
 * Validação de entrada — limites sãos para dados financeiros.
 *
 * Hoje os campos aceitam quase tudo: um `type="number"` sem teto deixa gravar
 * R$ 999.999.999.999, e um campo de texto sem limite deixa colar um romance
 * inteiro no título. Nenhum dos dois derruba o app, mas os dois sujam o banco
 * e quebram o layout — e valor absurdo distorce média, mediana e todo o
 * diagnóstico junto.
 *
 * Funções puras, para serem testadas e usadas em qualquer formulário.
 * Elas NÃO substituem as constraints do banco: validação de cliente é
 * conveniência, a do banco é a que vale.
 */

/** Um trilhão. Acima disso é erro de digitação, não patrimônio. */
export const MAX_MONEY = 1_000_000_000_000;

/** Caber num título de lista sem quebrar o layout. */
export const MAX_TITLE = 120;

/** Observação livre: generoso, mas finito. */
export const MAX_NOTE = 500;

export interface ValidationResult {
  ok: boolean;
  /** Mensagem pronta para o toast; null quando válido. */
  error: string | null;
  /** Valor normalizado, quando aplicável. */
  value?: number | string;
}

const ok = (value?: number | string): ValidationResult => ({ ok: true, error: null, value });
const fail = (error: string): ValidationResult => ({ ok: false, error });

/**
 * Converte texto para valor monetário.
 *
 * Aceita vírgula decimal: os campos são `type="number"`, mas colar de uma
 * planilha ou de um app de banco traz "1.234,56" com frequência.
 */
export function parseMoney(input: string | number): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;

  const limpo = String(input ?? '').trim();
  if (!limpo) return null;

  // "1.234,56" -> "1234.56"  |  "1234.56" fica igual
  const temVirgula = limpo.includes(',');
  const normalizado = temVirgula
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo;

  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

/**
 * Valor monetário obrigatório e positivo.
 * `allowZero` para campos como "quanto vale hoje", que podem ser zero.
 */
export function validateMoney(
  input: string | number,
  label = 'valor',
  opts: { allowZero?: boolean; max?: number } = {},
): ValidationResult {
  const { allowZero = false, max = MAX_MONEY } = opts;

  const n = parseMoney(input);
  if (n === null) return fail(`Informe um ${label} válido.`);
  if (n < 0) return fail(`O ${label} não pode ser negativo.`);
  if (!allowZero && n === 0) return fail(`O ${label} precisa ser maior que zero.`);
  if (n > max) return fail(`Esse ${label} parece alto demais. Confira o número.`);

  // Arredonda aos centavos: sem isto, um valor colado com 6 casas decimais
  // entra no banco e reaparece como R$ 10,999999 nas somas.
  return ok(Math.round(n * 100) / 100);
}

/** Texto obrigatório, com limite de tamanho. */
export function validateText(
  input: string,
  label = 'texto',
  opts: { max?: number; min?: number; required?: boolean } = {},
): ValidationResult {
  const { max = MAX_TITLE, min = 1, required = true } = opts;

  const limpo = String(input ?? '').trim();

  if (!limpo) {
    return required ? fail(`Preencha o ${label}.`) : ok('');
  }
  if (limpo.length < min) return fail(`O ${label} está curto demais.`);
  if (limpo.length > max) return fail(`O ${label} pode ter no máximo ${max} caracteres.`);

  return ok(limpo);
}

/**
 * Taxa de juros ao mês, digitada em PORCENTAGEM na tela.
 * Devolve a fração usada no banco: 14 -> 0.14.
 */
export function validateMonthlyRate(input: string | number): ValidationResult {
  const n = parseMoney(input);
  if (n === null) return fail('Informe a taxa de juros ao mês.');
  if (n < 0) return fail('A taxa não pode ser negativa.');
  if (n > 200) return fail('Taxa acima de 200% ao mês. Confira — o campo é em % ao mês.');

  return ok(Math.round(n * 10000) / 1000000);
}

/** Data no formato YYYY-MM-DD, dentro de uma janela plausível. */
export function validateDate(input: string, label = 'data'): ValidationResult {
  const limpo = String(input ?? '').trim();
  if (!limpo) return fail(`Informe a ${label}.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(limpo)) return fail(`A ${label} está em formato inválido.`);

  const d = new Date(limpo + 'T12:00:00Z');
  if (Number.isNaN(d.getTime())) return fail(`A ${label} não existe.`);

  // Lançamento de 1900 ou de 2099 é quase sempre erro de digitação no ano.
  const ano = Number(limpo.slice(0, 4));
  const atual = new Date().getUTCFullYear();
  if (ano < atual - 20 || ano > atual + 20) {
    return fail(`A ${label} está fora do período esperado. Confira o ano.`);
  }

  return ok(limpo);
}

/** Número inteiro num intervalo — parcelas, dia de vencimento. */
export function validateInteger(
  input: string | number,
  label = 'número',
  opts: { min?: number; max?: number } = {},
): ValidationResult {
  const { min = 1, max = 999 } = opts;

  const n = Number(input);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return fail(`Informe um ${label} válido.`);
  if (n < min) return fail(`O ${label} mínimo é ${min}.`);
  if (n > max) return fail(`O ${label} máximo é ${max}.`);

  return ok(n);
}

/**
 * Roda várias validações e devolve a primeira falha.
 * Mostrar um erro por vez evita despejar quatro toasts na cara do usuário.
 */
export function firstError(...results: ValidationResult[]): string | null {
  return results.find(r => !r.ok)?.error ?? null;
}
