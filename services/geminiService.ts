
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Recommendation } from "../types";

const stringifyError = (err: any): string => {
    if (!err) return "Erro desconhecido";
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    try {
        return JSON.stringify(err);
    } catch {
        return String(err);
    }
};

export const generateBookSummary = async (title: string, author: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Escreva um resumo curto (um parágrafo) e envolvente em Português para o livro "${title}" de ${author}. Não dê spoilers.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar um resumo.";
  } catch (error: any) {
    const errorMsg = stringifyError(error);
    console.error("Error generating book summary:", errorMsg);
    if (errorMsg.includes("Requested entity was not found")) {
        if (window.aistudio) window.aistudio.openSelectKey();
    }
    return `A IA não conseguiu processar o resumo no momento.`;
  }
};

export const generateBookCover = async (title: string, genre: string, type: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Capa de livro profissional para a obra "${title}". 
    Gênero principal: ${genre}. 
    Formato: ${type}. 
    Estilo visual: Minimalista, cinematográfico e evocativo. 
    A arte deve capturar a essência do título e ser esteticamente agradável. Sem texto na imagem, apenas arte conceitual de alta qualidade.`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
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
  } catch (error: any) {
    const errorMsg = stringifyError(error);
    console.error("Error generating book cover:", errorMsg);
    if (errorMsg.includes("Requested entity was not found")) {
        if (window.aistudio) window.aistudio.openSelectKey();
    }
    return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
  }
};

export const getAIRecommendations = async (readBooks: { title: string, genre: string }[]): Promise<Recommendation[]> => {
  if (readBooks.length === 0) return [];
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const booksDescription = readBooks.map(b => `${b.title} (${b.genre})`).join(', ');
    const prompt = `Com base nos seguintes livros que eu já li: ${booksDescription}. Recomende 3 livros novos que eu possa gostar. Para cada livro, sugira um link de busca/compra direto na Amazon Brasil ou Google Books. Explique o motivo de forma curta e direta em Português.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              reason: { type: Type.STRING },
              genre: { type: Type.STRING },
              buyLink: { type: Type.STRING, description: "URL sugerida para compra ou busca do livro" },
            },
            propertyOrdering: ["title", "author", "reason", "genre", "buyLink"],
            required: ["title", "author", "reason", "genre", "buyLink"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error: any) {
    const errorMsg = stringifyError(error);
    console.error("Error fetching AI recommendations:", errorMsg);
    return [];
  }
};
