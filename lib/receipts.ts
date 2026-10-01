import { supabase } from './supabase';

/**
 * Comprovantes — acesso por URL assinada.
 *
 * Até aqui o app gravava em `transactions.receipt_url` o retorno de
 * `getPublicUrl()`: um link permanente, sem autenticação, para um documento
 * financeiro. Qualquer pessoa com a URL abria o comprovante de outro usuário,
 * e URLs vazam por histórico de navegador, log de servidor e compartilhamento.
 *
 * Agora o banco guarda apenas o CAMINHO do arquivo, e a URL é assinada no
 * momento de abrir, com validade curta.
 *
 * Compatibilidade: registros antigos guardam a URL pública inteira. Como não dá
 * para reescrevê-los sem migração de dados, eles são detectados e usados como
 * estão — continuam funcionando, mas nenhum registro novo nasce assim.
 */

const BUCKET = 'receipts';
const EXPIRES_IN_SECONDS = 60 * 5;

/** Registro antigo guardava URL completa; o novo guarda caminho relativo. */
function isLegacyPublicUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

/**
 * Resolve o valor de `receipt_url` para um link abrível.
 * Devolve null se o arquivo não existir mais ou o acesso for negado.
 */
export async function getReceiptUrl(stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null;
  if (isLegacyPublicUrl(stored)) return stored;

  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .createSignedUrl(stored, EXPIRES_IN_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
