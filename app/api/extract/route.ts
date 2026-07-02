import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: "Acesso Negado. Faça login." }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sessão inválida. Acesso Negado." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo recebido" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave do Gemini não configurada." }, { status: 500 });
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;

    // URL OFICIAL E ESTÁVEL DO GOOGLE
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const promptText = `
Você é um assistente financeiro de elite. Analise a imagem ou documento em anexo (recibo, nota fiscal ou folha de anotações).
Extraia TODOS os itens ou despesas individuais e retorne EXATAMENTE E APENAS uma LISTA (Array) JSON válida, sem crases de markdown e sem nenhum texto adicional.
O JSON deve ter esta estrutura exata de lista:
[
  {
    "description": "Nome do item 1",
    "amount": 10.50,
    "category": "Alimentação"
  },
  {
    "description": "Nome do item 2",
    "amount": 40.00,
    "category": "Contas Fixas"
  }
]
Se houver apenas um gasto, retorne uma lista com 1 objeto. O "amount" deve ser sempre um número float. 
REGRA CRUCIAL: O campo "category" DEVE OBRIGATORIAMENTE ser um destes quatro: "Contas Fixas", "Variáveis", "Cartões" ou "Investimentos". É terminantemente proibido usar outras categorias. Mapeie itens de água/luz/moradia para "Contas Fixas". Mapeie compras/mercado/alimentação para "Variáveis". Mapeie faturas/bancos para "Cartões". Mapeie ações/cripto/poupança para "Investimentos".
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
