import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/api-auth';
import { checkRateLimit, rateLimitResponse } from '../../../lib/rate-limit';

export async function POST(req: Request) {
  try {
    const auth = await requireUser(req);
    if (auth.response) return auth.response;

    const limit = await checkRateLimit(auth.db, auth.user.id, 'advisor');
    if (!limit.allowed) return rateLimitResponse(limit);

    const body = await req.json();
    // `context` é o resumo já calculado pelo lib/advisor-context.ts.
    const { context } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Recursos de IA estão desativados nesta instalação." }, { status: 503 });
    }

    if (!context) {
      return NextResponse.json({ error: "Dados insuficientes para gerar o conselho." }, { status: 400 });
    }

    const promptText = `Você é um conselheiro financeiro brasileiro: direto, acolhedor e prático.
Fala com alguém de classe média, com cartão parcelado e pouca educação financeira.
Tom de aliado, NUNCA de julgamento — quem está endividado já se sente mal.

Abaixo está a situação financeira REAL do usuário, já calculada. Todos os
números estão em reais (R$) e os percentuais já vêm prontos.

${JSON.stringify(context, null, 2)}

REGRAS OBRIGATÓRIAS:

1. NUNCA invente números. Use apenas os que estão acima. Se algo não estiver
   nos dados, diga que falta a informação em vez de estimar.
2. Se "aporte.deveSugerir" for false, está PROIBIDO sugerir investir ou guardar
   dinheiro. O motivo está em "aporte.motivoSeNao". Nesse caso a prioridade é
   cortar gastos e quitar dívida cara.
3. Se "dividas" não for null, cite o valor dos juros por mês ("jurosPorMes") —
   é o número que mais ajuda a pessoa a entender a urgência. Nomeie a pior
   dívida e explique por que ela vem primeiro.
4. Se "conselhoAnterior" não for null, comece reconhecendo o que foi combinado
   no mês passado e compare com o que aconteceu. Elogie o que melhorou e seja
   honesto sobre o que não andou.
5. Se "compromissosFuturos.proximosTresMeses" for maior que zero, avise quanto
   da renda futura já está comprometido com parcelas.
6. Nada de jargão. Em vez de "comprometimento de renda", diga "quanto da sua
   renda já tem dono".

FORMATO:
- Um parágrafo curto de diagnóstico, citando 2 ou 3 números concretos.
- 3 ações práticas em bullet points, começando pela mais urgente, cada uma com
  o valor em reais quando fizer sentido.
- Uma frase final de incentivo, honesta e sem exagero.

Escreva em Markdown, em português do Brasil, como uma mensagem de WhatsApp bem
escrita. Use emojis com moderação. NÃO devolva JSON nem código.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
    });

    if (!response.ok) {
      console.error("Gemini recusou:", await response.text());
      return NextResponse.json({ error: "Não consegui gerar o conselho agora. Tente de novo em instantes." }, { status: 502 });
    }

    const data = await response.json();
    let advice = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui formular um conselho agora.";
    advice = advice.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();

    // Memória: guarda o conselho e o retrato dos números do mês, para a próxima
    // análise poder cobrar o que foi combinado. Falha aqui não derruba a
    // resposta — o conselho já é útil mesmo sem o histórico.
    const { error: historyError } = await auth.db.from('advice_history').insert([{
      user_id: auth.user.id,
      period: context.periodo,
      advice,
      snapshot: context,
    }]);
    if (historyError) console.error("Falha ao gravar advice_history:", historyError.message);

    return NextResponse.json({ advice });
  } catch (error: any) {
    console.error("Erro na API Advisor:", error);
    return NextResponse.json({ error: "Erro ao gerar conselho. Tente novamente." }, { status: 500 });
  }
}
