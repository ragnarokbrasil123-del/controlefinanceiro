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

    const body = await req.json();
    const { income, expense, balance, transactions, strategy } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave do Gemini não configurada." }, { status: 500 });
    }

    const promptText = `Você é um conselheiro financeiro carismático, proativo, extremamente inteligente e levemente sarcástico.
O usuário está pedindo um conselho sobre as finanças dele deste mês. 
Aqui estão os dados dele:
- Renda Total: R$ ${income}
- Despesas Totais: R$ ${expense}
- Saldo Restante: R$ ${balance}
- Perfil Estratégico do Usuário: ${strategy || 'Equilibrado (50/30/20)'}
- Algumas transações recentes: ${JSON.stringify(transactions?.slice(0, 5))}

Seja direto e humano. Analise os gastos baseando-se MUITO no Perfil Estratégico escolhido. Dê um "puxão de orelha" se ele não estiver respeitando o perfil escolhido, e faça um elogio se o saldo estiver positivo ou alinhado com o perfil.
Dê 3 dicas curtas e práticas em bullet points para ele melhorar no próximo mês.
Termine com uma frase motivacional.
Use emojis. NUNCA DEVOLVA JSON OU CÓDIGO. Escreva em formato Markdown, como se fosse um texto de WhatsApp bonito.`;

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
      return NextResponse.json({ error: "O Google recusou o conselho: " + err }, { status: 500 });
    }

    const data = await response.json();
    let advice = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui formular um conselho agora.";
    advice = advice.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();

    return NextResponse.json({ advice });
  } catch (error: any) {
    console.error("Erro na API Advisor:", error);
    return NextResponse.json({ error: "Erro ao gerar conselho: " + error.message }, { status: 500 });
  }
}
