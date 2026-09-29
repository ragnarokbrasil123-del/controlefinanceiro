import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/api-auth';

export async function POST(req: Request) {
  try {
    const auth = await requireUser(req);
    if (auth.response) return auth.response;

    const body = await req.json();
    const { income, expense, balance, transactions, strategy, stage } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Recursos de IA estão desativados nesta instalação." }, { status: 503 });
    }

    const promptText = `Você é um conselheiro financeiro carismático, proativo, extremamente inteligente e levemente sarcástico.
O usuário está pedindo um conselho sobre as finanças dele deste mês. 
Aqui estão os dados dele:
- Renda Total: R$ ${income}
- Despesas Totais: R$ ${expense}
- Saldo Restante: R$ ${balance}
- Perfil Estratégico do Usuário: ${strategy || 'Equilibrado (50/30/20)'}
- Estágio Financeiro Atual: ${stage || 'não informado'}
- Algumas transações recentes: ${JSON.stringify(transactions?.slice(0, 5))}

REGRA CRUCIAL: se o Estágio Financeiro for "Modo Emergência", NÃO sugira investir nem guardar dinheiro. Nesse estágio a prioridade é cortar gastos e quitar dívida cara — juros de rotativo superam qualquer rendimento.

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
