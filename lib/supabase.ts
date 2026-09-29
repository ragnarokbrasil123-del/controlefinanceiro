import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase do navegador.
 *
 * Sem fallback hardcoded de propósito: antes havia a URL e a anon key gravadas
 * no código como valor padrão. Isso publicava as credenciais no repositório e,
 * pior, fazia o app conectar no projeto errado EM SILÊNCIO quando a variável
 * de ambiente faltava em produção — o tipo de falha que só aparece depois que
 * os dados já foram para o lugar errado.
 *
 * Agora falta de configuração quebra na hora, com mensagem clara.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e ' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local (veja .env.example).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
