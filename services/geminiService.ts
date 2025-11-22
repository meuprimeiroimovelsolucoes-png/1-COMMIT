import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateCaption = async (topic: string, tone: string = 'profissional'): Promise<string> => {
  if (!apiKey) {
    console.warn("Chave de API ausente");
    return "Chave de API não configurada. Por favor, configure sua API Key para gerar legendas.";
  }

  try {
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
    return "Erro ao gerar legenda. Tente novamente mais tarde.";
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
   if (!apiKey) return [{ style: "Erro", message: "Configure sua API Key para gerar mensagens com IA." }];
   
   try {
    const prompt = `
      Você é um assistente de marketing para corretores de imóveis.
      Crie 3 variações de mensagem para WhatsApp.
      
      Contexto:
      - Objetivo da campanha: "${objective}"
      - Público: ${leadCount} leads selecionados (ex: ${leadSampleName})
      - Variável disponível: {{name}} para o nome do cliente.

      Formato de Resposta (JSON Array estrito):
      [
        {"style": "Formal", "message": "..."},
        {"style": "Persuasiva", "message": "..."},
        {"style": "Curta e Direta", "message": "..."}
      ]
      
      Não inclua markdown code blocks, apenas o JSON raw.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Nenhum texto retornado pela IA");
    
    return JSON.parse(text) as CampaignVariation[];
   } catch (e) {
     console.error(e);
     return [
       { style: "Padrão", message: `Olá {{name}}, gostaria de retomar nosso contato sobre o imóvel.` },
       { style: "Erro", message: "Não foi possível conectar à IA. Verifique sua chave de API." }
     ];
   }
}