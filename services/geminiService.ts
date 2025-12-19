import { GoogleGenAI, Type } from "@google/genai";

export const generateCaption = async (topic: string, tone: string = 'profissional'): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    const prompt = `
      Atue como um especialista em marketing imobiliário para Instagram.
      Crie uma legenda envolvente para um post sobre: "${topic}".
      Tom de voz: ${tone}.
      Inclua 5 hashtags relevantes.
      Use emojis.
      O texto deve ser focado em conversão e despertar desejo.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a legenda.";
  } catch (error) {
    console.error("Erro ao gerar legenda:", error);
    return "Erro ao gerar legenda. Verifique sua chave de API ou tente novamente.";
  }
};

export interface CampaignVariation {
  style: string;
  message: string;
}

export const generateCampaignVariations = async (
  objective: string, 
  leadCount: number,
  leadSampleName: string
): Promise<CampaignVariation[]> => {
   try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Você é um assistente de marketing para corretores de imóveis.
      Crie 3 variações de mensagem para WhatsApp.
      
      Contexto:
      - Objetivo da campanha: "${objective}"
      - Público: ${leadCount} leads selecionados (ex: ${leadSampleName})
      - Variável disponível: {{name}} para o nome do cliente.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              style: { 
                type: Type.STRING,
                description: 'O estilo da mensagem (ex: Formal, Persuasiva, Curta)'
              },
              message: { 
                type: Type.STRING,
                description: 'O conteúdo da mensagem para envio no WhatsApp'
              }
            },
            propertyOrdering: ["style", "message"],
            required: ['style', 'message']
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Nenhum texto retornado pela IA");
    
    return JSON.parse(text) as CampaignVariation[];
   } catch (e) {
     console.error(e);
     return [
       { style: "Padrão", message: `Olá {{name}}, gostaria de retomar nosso contato sobre o imóvel.` },
       { style: "Erro", message: "Não foi possível conectar à IA. Verifique sua configuração." }
     ];
   }
}