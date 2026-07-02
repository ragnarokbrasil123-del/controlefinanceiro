import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rwdbmpxchubsjtevcqyh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Ji5fpwZTBSbQ5zacrld-xg_M21-MOlN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
