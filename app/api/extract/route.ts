import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo recebido" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave da API não configurada no cofre da Vercel" }, { status: 500 });
    }

    // Prepara a foto para envio
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;

    // Conexão oficial com o Google Gemini Vision
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
Você é um assistente financeiro de elite. Analise a imagem ou documento em anexo (um recibo, nota fiscal, fatura ou anotação).
Extraia os dados da compra e retorne EXATAMENTE E APENAS um objeto JSON válido, sem crases de markdown e sem nenhum texto adicional.
O JSON deve ter esta estrutura exata:
{
  "description": "Nome do local ou produto principal (ex: Mercado Assaí, Posto Ipiranga)",
  "amount": 150.50,
  "category": "Alimentação"
}

Categorias válidas: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Compras, Contas Fixas, Variáveis. (Escolha a que melhor se encaixar).
Se o valor for negativo ou tiver desconto, considere o valor final pago. O "amount" deve ser um número float. Se não houver clareza, deduza pelo nome da loja.
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API Error:", err);
      return NextResponse.json({ error: "A Inteligência Artificial recusou o documento." }, { status: 500 });
    }

    const data = await response.json();
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Limpeza de texto (Tira sujeiras caso a IA coloque formatações)
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    // Transforma a resposta em um pacote de dados pro nosso App
    const parsedJson = JSON.parse(textResponse);

    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error("Erro interno no cérebro:", error);
    return NextResponse.json({ error: "Falha catastrófica ao processar o arquivo" }, { status: 500 });
  }
}
