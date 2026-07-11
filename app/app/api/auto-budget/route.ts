import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: "Acesso Negado. Faça login." }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rwdbmpxchubsjtevcqyh.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Ji5fpwZTBSbQ5zacrld-xg_M21-MOlN';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sessão inválida. Acesso Negado." }, { status: 401 });
    }

    // --- PAYWALL CHECK ---
    const { count } = await supabase.from('ai_usage_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { data: profile } = await supabase.from('profiles').select('plan_type, role').eq('id', user.id).single();
    
    if (profile && profile.role !== 'admin' && profile.plan_type === 'free' && count !== null && count >= 3) {
      return NextResponse.json({ error: "PAYWALL_LIMIT_REACHED" }, { status: 403 });
    }
    // ---------------------

    const body = await req.json();
    const { income } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave do Gemini não configurada." }, { status: 500 });
    }

    const promptText = `Atue como um planejador financeiro de elite.
O usuário ganha R$ ${income} por mês.
Usando a regra 50/30/20 como base, sugira um orçamento realista dividido nestas exatas categorias: "Contas Fixas", "Variáveis" e "Investimentos".
Retorne APENAS um objeto JSON válido, sem NENHUM texto antes ou depois, e sem marcação de crases (markdown). O objeto deve ter esta estrutura:
{
  "Contas Fixas": 1500,
  "Variáveis": 900,
  "Investimentos": 600
}
Os valores numéricos (sem vírgula e sem símbolo de moeda) devem somar no máximo ${income}.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [{ parts: [{ text: promptText }] }]
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: "Erro no Google Gemini: " + err }, { status: 500 });
    }

    const data = await response.json();
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedJson = JSON.parse(textResponse);
    
    // Registrar uso da IA
    await supabase.from('ai_usage_logs').insert([{ user_id: user.id, feature: 'auto-budget' }]);

    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error("Erro no auto-budget:", error);
    return NextResponse.json({ error: "Erro ao gerar orçamento: " + error.message }, { status: 500 });
  }
}
