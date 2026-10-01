import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Limite de uso das rotas de IA.
 *
 * O contador vive no banco, não em memória. O app roda em funções serverless:
 * cada chamada pode cair numa instância diferente, então um `Map` de módulo
 * parece funcionar em desenvolvimento e não limita absolutamente nada em
 * produção.
 *
 * O objetivo aqui não é segurança forte — é impedir que um laço acidental ou
 * um clique repetido queime a cota do Gemini. Por isso a implementação é
 * simples e tolerante: se a checagem falhar por qualquer motivo, a chamada
 * passa. Bloquear o usuário por causa de um erro no contador seria pior que o
 * problema que ele resolve.
 */

export type AiRoute = 'advisor' | 'auto-budget' | 'extract';

/** Chamadas permitidas por janela, por rota. */
const LIMITS: Record<AiRoute, { max: number; windowMinutes: number }> = {
  // Conselho é caro e muda pouco dentro do mesmo dia.
  advisor: { max: 10, windowMinutes: 60 },
  // Orçamento automático é pontual.
  'auto-budget': { max: 10, windowMinutes: 60 },
  // Leitura de recibo é a mais usada: alguém pode lançar vários de uma vez.
  extract: { max: 40, windowMinutes: 60 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Minutos até a janela reabrir, quando bloqueado */
  retryInMinutes: number;
}

export async function checkRateLimit(
  db: SupabaseClient,
  userId: string,
  route: AiRoute,
): Promise<RateLimitResult> {
  const { max, windowMinutes } = LIMITS[route];
  const now = Date.now();

  try {
    const { data, error } = await db
      .from('ai_rate_limits')
      .select('id, window_start, call_count')
      .eq('user_id', userId)
      .eq('route', route)
      .maybeSingle();

    // Falha de leitura não bloqueia o usuário.
    if (error) return { allowed: true, remaining: max, retryInMinutes: 0 };

    if (!data) {
      await db.from('ai_rate_limits').insert([{
        user_id: userId, route, window_start: new Date(now).toISOString(), call_count: 1,
      }]);
      return { allowed: true, remaining: max - 1, retryInMinutes: 0 };
    }

    const windowStart = new Date(data.window_start).getTime();
    const elapsedMinutes = (now - windowStart) / 60000;

    // Janela vencida: zera e começa de novo.
    if (elapsedMinutes >= windowMinutes) {
      await db.from('ai_rate_limits')
        .update({ window_start: new Date(now).toISOString(), call_count: 1 })
        .eq('id', data.id);
      return { allowed: true, remaining: max - 1, retryInMinutes: 0 };
    }

    if (data.call_count >= max) {
      return {
        allowed: false,
        remaining: 0,
        retryInMinutes: Math.max(1, Math.ceil(windowMinutes - elapsedMinutes)),
      };
    }

    await db.from('ai_rate_limits')
      .update({ call_count: data.call_count + 1 })
      .eq('id', data.id);

    return { allowed: true, remaining: max - data.call_count - 1, retryInMinutes: 0 };
  } catch {
    return { allowed: true, remaining: max, retryInMinutes: 0 };
  }
}

/** Resposta pronta para a rota devolver quando o limite estourou. */
export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    {
      error: `Você usou a IA muitas vezes seguidas. Tente de novo em ${result.retryInMinutes} ${result.retryInMinutes === 1 ? 'minuto' : 'minutos'}.`,
    },
    { status: 429 },
  );
}
