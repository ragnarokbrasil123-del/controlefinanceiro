import { createClient } from '@supabase/supabase-js';

// Colocando as suas chaves reais direto no código para a Vercel não se perder!
const supabaseUrl = 'https://rwdbmpxchubsjtevcqyh.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ji5fpwZTBSbQ5zacrld-xg_M21-MOlN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
