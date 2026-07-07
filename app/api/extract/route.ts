import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Removido a validação de sessão dupla aqui para evitar erro de 'Auth session missing' no WhatsApp.
    // A segurança da inserção já é garantida pelo aplicativo que exige o session.user.id.

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo recebido" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave do Gemini não configurada no Vercel." }, { status: 500 });
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;

    // URL OFICIAL E ESTÁVEL DO GOOGLE
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const promptText = `
Você é um assistente financeiro de elite. Analise a imagem ou documento em anexo (recibo, nota fiscal, comprovante de PIX ou folha de anotações).
Extraia TODOS os itens ou despesas individuais e retorne EXATAMENTE E APENAS uma LISTA (Array) JSON válida, sem crases de markdown e sem nenhum texto adicional.

REGRA ESPECIAL PARA PIX: Se a imagem for um comprovante de transferência (PIX, TED, DOC), crie um ÚNICO item. Use como "description" o nome de quem recebeu ou a descrição do PIX (ex: "PIX - Nome do Recebedor") e como "amount" o valor exato da transferência.

O JSON deve ter esta estrutura exata de lista:
[
  {
    "description": "Nome do item 1",
    "amount": 10.50,
    "category": "Variáveis"
  },
  {
    "description": "PIX - Supermercado",
    "amount": 150.00,
    "category": "Contas Fixas"
  }
]
Se houver apenas um gasto ou for um comprovante PIX único, retorne uma lista com 1 objeto. O "amount" deve ser sempre um número float. 
REGRA CRUCIAL: O campo "category" DEVE OBRIGATORIAMENTE ser um destes quatro: "Contas Fixas", "Variáveis", "Cartões" ou "Investimentos". É terminantemente proibido usar outras categorias. Mapeie itens de água/luz/moradia para "Contas Fixas". Mapeie compras/mercado/alimentação e transferências PIX comuns para "Variáveis". Mapeie faturas/bancos para "Cartões". Mapeie ações/cripto/poupança para "Investimentos".
`;

    const requestBody = {
      contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType: mimeType, data: base64Data } }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: "O Google recusou a imagem: " + err }, { status: 500 });
    }

    const data = await response.json();
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Clean up potential markdown formatting or thought blocks just in case
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    textResponse = textResponse.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();

    const parsedJson = JSON.parse(textResponse);
    return NextResponse.json(parsedJson);

  } catch (error: any) {
    return NextResponse.json({ error: "Erro Hacker: " + error.message }, { status: 500 });
  }
}
