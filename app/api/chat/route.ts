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
    const { message, history, financialContext } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave do Gemini não configurada." }, { status: 500 });
    }

    const { income, expense, balance, transactions, userName } = financialContext || {};

    const systemPrompt = `Você é o Nexa AI, um assistente financeiro pessoal de altíssimo nível, extremamente inteligente, ágil e acolhedor.
O seu cliente é: ${userName || "Usuário"}.
Dados financeiros DESTE MÊS do cliente:
- Renda Total: R$ ${income || 0}
- Despesas Totais: R$ ${expense || 0}
- Saldo Restante: R$ ${balance || 0}
- Últimas transações cadastradas (limite de 10): ${JSON.stringify(transactions?.slice(0, 10))}

Seu papel é responder às perguntas do usuário sobre a vida financeira dele.
REGRAS CRÍTICAS:
1. Seja direto, conciso e use linguagem natural de chat (como WhatsApp). Não faça textos longos, a menos que o usuário peça uma análise profunda.
2. Use emojis com moderação para dar um tom amigável.
3. Formate valores monetários bonitos (ex: R$ 1.500,00).
4. Se o usuário perguntar se pode gastar, analise o Saldo Restante e seja realista/prudente.
5. Se a pergunta não for sobre finanças, responda educadamente, mas puxe o assunto de volta para o controle financeiro do Nexa.
`;

    let promptText = `${systemPrompt}\n\nHISTÓRICO DA CONVERSA:\n`;

    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        promptText += `${msg.role === 'user' ? 'Usuário' : 'Nexa AI'}: ${msg.content}\n\n`;
      });
    }

    promptText += `Usuário: ${message}\nNexa AI:`;

    // AQUI ESTÁ A CORREÇÃO: Usando o modelo exato que o Google aprova (gemini-flash-latest)
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
      console.error("Gemini Error:", err);
      return NextResponse.json({ error: "O Google recusou a requisição: " + err }, { status: 500 });
    }

    const data = await response.json();
    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, meu cérebro deu um branco! Pode repetir?";
    reply = reply.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Erro na API Chat:", error);
    return NextResponse.json({ error: "Erro ao conversar com a IA: " + error.message }, { status: 500 });
  }
}
