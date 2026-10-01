import { supabase } from './supabase';

/**
 * Acesso à sessão do Supabase — ponto único.
 *
 * O bloco abaixo estava copiado 24 vezes em 14 arquivos:
 *
 *   const { data: { session } } = await supabase.auth.getSession();
 *   if (!session) return;
 *   ... .eq('user_id', session.user.id)
 *
 * Além da repetição, cada cópia tratava a ausência de sessão de um jeito:
 * umas redirecionavam, outras retornavam em silêncio, outras seguiam e
 * gravavam `user_id: null` no banco.
 */

/** Id do usuário logado, ou null. Use quando a ausência de sessão é tolerável. */
export async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/** Token de acesso para chamar as rotas de IA. */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Id do usuário, redirecionando para /login se não houver sessão.
 * Use nas telas que não fazem sentido sem usuário.
 *
 * Devolve null quando redirecionou, para o chamador poder parar.
 */
export async function requireUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }
  return session.user.id;
}

/** Sessão completa, quando o chamador precisa de email ou token junto. */
export async function getSessionUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    accessToken: session.access_token,
  };
}
