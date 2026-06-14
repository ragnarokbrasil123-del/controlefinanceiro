import { createClient } from '@supabase/supabase-js';

// Adicionamos um texto provisório (placeholder) para a Vercel não travar o build
// caso ela não ache as variáveis de ambiente na hora da compilação.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sua-url-provisoria.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'chave-provisoria';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
