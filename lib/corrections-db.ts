import { supabase } from './supabase';
import { normalizeTitle, type CategoryCorrection } from './corrections';

/**
 * Acesso ao banco das correções de categoria.
 * Separado de corrections.ts para manter a lógica pura testável sem
 * configuração de ambiente.
 */

/**
 * Registra uma correção. Se o mesmo padrão já existir, incrementa `hits` —
 * quanto mais vezes o usuário repete a correção, mais confiança ela tem.
 */
export async function recordCorrection(
  userId: string,
  title: string,
  fromCategory: string | null,
  toCategory: string,
): Promise<void> {
  const pattern = normalizeTitle(title);
  if (!pattern || fromCategory === toCategory) return;

  try {
    const { data } = await supabase
      .from('category_corrections')
      .select('id, hits')
      .eq('user_id', userId)
      .eq('title_pattern', pattern)
      .maybeSingle();

    if (data) {
      await supabase
        .from('category_corrections')
        .update({ to_category: toCategory, hits: data.hits + 1 })
        .eq('id', data.id);
    } else {
      await supabase.from('category_corrections').insert([{
        user_id: userId,
        title_pattern: pattern,
        from_category: fromCategory,
        to_category: toCategory,
      }]);
    }
  } catch {
    // Aprendizado é um bônus: nunca deve impedir o usuário de salvar.
  }
}

/** As correções mais repetidas, para injetar no prompt do OCR. */
export async function getTopCorrections(userId: string, limit = 15): Promise<CategoryCorrection[]> {
  try {
    const { data } = await supabase
      .from('category_corrections')
      .select('title_pattern, from_category, to_category, hits')
      .eq('user_id', userId)
      .order('hits', { ascending: false })
      .limit(limit);
    return (data as CategoryCorrection[]) ?? [];
  } catch {
    return [];
  }
}
