import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBookSummary = async (title: string, author: string): Promise<string> => {
  if (!process.env.API_KEY) return "A IA está indisponível no momento.";
  try {
    const prompt = `Escreva um resumo curto (um parágrafo) e envolvente em Português para o livro "${title}" de ${author}. Não dê spoilers.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar um resumo.";
  } catch (error) {
    console.error("Error generating book summary:", error);
    return "Erro ao gerar resumo. Tente novamente.";
  }
};

export const generateBookCover = async (title: string, genre: string, type: string): Promise<string> => {
  if (!process.env.API_KEY) return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
  try {
    const prompt = `Capa de livro minimalista e moderna para "${title}", gênero ${genre}, formato ${type}. Arte abstrata, elegante, alta qualidade.`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
            imageConfig: {
                aspectRatio: "3:4"
            }
        }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
              const base64EncodeString: string = part.inlineData.data;
              return `data:image/png;base64,${base64EncodeString}`;
          }
      }
    }
    
    return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
  } catch (error) {
    console.error("Error generating book cover:", error);
    return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
  }
};