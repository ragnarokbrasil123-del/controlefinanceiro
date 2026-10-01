import { createClient } from '@supabase/supabase-js';
import type { User, SupabaseClient } from '@supabase/supabase-js';

/**
 * Valida o JWT do Supabase enviado pelo cliente nas rotas de IA.
 *
 * Este bloco estava copiado igual nas três rotas (/api/advisor,
 * /api/auto-budget, /api/extract), cada uma com a URL e a anon key hardcoded
 * como fallback. Centralizar resolve as duas coisas: a duplicação e o
 * vazamento de credencial.
 *
 * Devolve `{ user }` em caso de sucesso, ou `{ response }` com a resposta HTTP
 * pronta para a rota devolver direto.
 */
export async function requireUser(
  req: Request,
): Promise<
  | { user: User; db: SupabaseClient; response?: never }
  | { user?: never; db?: never; response: Response }
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Erro de configuração do servidor — não expõe detalhe ao cliente.
    console.error('Supabase não configurado: faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    return {
      response: Response.json({ error: 'Serviço indisponível no momento.' }, { status: 503 }),
    };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return {
      response: Response.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 }),
    };
  }

  const token = authHeader.replace('Bearer ', '');

  // Cliente com o token do usuário no header: assim a RLS enxerga auth.uid()
  // e a rota consegue ler e gravar como ele (rate limit, histórico de
  // conselhos) sem precisar de service role.
  const db = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error } = await db.auth.getUser(token);

  if (error || !user) {
    return {
      response: Response.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 }),
    };
  }

  return { user, db };
}
