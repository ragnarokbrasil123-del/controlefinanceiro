import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    // SUA CHAVE AQUI, COLOCADA DIRETAMENTE NO CÓDIGO
    const geminiKey = 'AIzaSyDi9NHmKbq5pxHn7VDkFqCZzdIT5bMZleI';
    
    const prompt = `Você é um assistente financeiro especialista em extração de dados. 
Analise esta imagem (que pode ser um papel anotado à mão, um comprovante ou uma lista).
Extraia as transações e me devolva ESTRITAMENTE um array JSON puro, sem formatação markdown ou textos ao redor.
Cada item deve seguir a risca este formato:
{
  "title": "nome da despesa/receita (ex: Salário, Conta de Água, Mercado, Ações)",
  "amount": valor em número puro (ex: 3000.00, 80.00, 105.00),
  "type": "expense" (se for saída de dinheiro) ou "income" (se for entrada),
  "category": classifique em uma destas exatamente: "Contas Fixas", "Variáveis", "Cartões" ou "Investimentos",
  "date": "${new Date().toISOString().split('T')[0]}"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Erro de conexão com o Google');

    const text = data.candidates[0].content.parts[0].text;
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const transactions = JSON.parse(cleanedText);

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('Erro na IA:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
