/**
 * Correções de categoria — lógica pura do OCR que aprende.
 *
 * Sem I/O aqui de propósito: importar o cliente do Supabase faria este módulo
 * explodir no teste, porque o cliente valida as variáveis de ambiente ao ser
 * carregado. O acesso ao banco mora em corrections-db.ts.
 *
 * Hoje o usuário corrige a categoria sugerida pela IA e o app esquece: a
 * próxima foto do mesmo mercado erra igual. Aqui cada correção é guardada e
 * devolvida ao prompt de /api/extract, para a sugestão melhorar com o uso.
 *
 * A chave é o título NORMALIZADO: "Supermercado Pão de Açúcar 12/03" e
 * "SUPERMERCADO PAO DE ACUCAR" precisam cair no mesmo padrão, senão cada
 * recibo vira uma correção nova e nada se acumula.
 */

export interface CategoryCorrection {
  title_pattern: string;
  from_category: string | null;
  to_category: string;
  hits: number;
}

/**
 * Reduz o título a um padrão estável: minúsculo, sem acento, sem números,
 * sem pontuação, e limitado às primeiras palavras — que é onde mora o nome do
 * estabelecimento. O resto costuma ser data, número de nota ou parcela.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // remove acentos
    .replace(/\d+/g, ' ')              // números não identificam o lugar
    .replace(/[^\w\s]/g, ' ')          // pontuação
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)                       // nome do estabelecimento
    .join(' ');
}

/**
 * Aplica as correções conhecidas a um título, antes de mostrar a sugestão.
 * Vale também para lançamento manual, não só para foto.
 */
export function applyCorrections(
  title: string,
  suggested: string,
  corrections: CategoryCorrection[],
): string {
  const pattern = normalizeTitle(title);
  if (!pattern) return suggested;

  const exact = corrections.find(c => c.title_pattern === pattern);
  if (exact) return exact.to_category;

  // Casamento parcial: "padaria" bate com "padaria do joao".
  const partial = corrections.find(c =>
    pattern.includes(c.title_pattern) || c.title_pattern.includes(pattern),
  );
  return partial ? partial.to_category : suggested;
}
