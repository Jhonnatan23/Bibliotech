
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

/**
 * Recupera a melhor chave disponível (Prioridade: Manual > Ambiente > Bridge)
 */
const getEffectiveApiKey = (): string | null => {
  // 1. Tenta a chave injetada via window pelo App.tsx (vinda do Supabase)
  const savedKey = (window as any).__BIBLIOTECH_USER_KEY;
  if (savedKey && savedKey !== 'undefined') return savedKey;

  // 2. Tenta a chave do ambiente de compilação/deploy
  const envKey = process.env.API_KEY;
  if (envKey && envKey !== 'undefined' && envKey !== '') return envKey;

  return null;
};

/**
 * Helper robusto para inicializar e lidar com erros de chave da IA
 */
const callGenAI = async (task: (ai: GoogleGenAI) => Promise<any>) => {
  const apiKey = getEffectiveApiKey();
  
  if (!apiKey) {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
    }
    throw new Error("API_KEY_MISSING");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    return await task(ai);
  } catch (error: any) {
    const errorMsg = stringifyError(error);
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404")) {
        if (window.aistudio) await window.aistudio.openSelectKey();
    }
    throw error;
  }
};

export const generateBookSummary = async (title: string, author: string): Promise<string> => {
  try {
    return await callGenAI(async (ai) => {
      const prompt = `Escreva um resumo curto (um parágrafo) e envolvente em Português para o livro "${title}" de ${author}. Não dê spoilers.`;
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "Não foi possível gerar um resumo.";
    });
  } catch (error: any) {
    return `A IA não conseguiu processar o resumo no momento. Verifique sua chave de API nas Configurações.`;
  }
};

export const generateBookCover = async (title: string, genre: string, type: string): Promise<string> => {
  try {
    return await callGenAI(async (ai) => {
      const prompt = `Capa de livro profissional para a obra "${title}". Gênero: ${genre}. Sem texto na imagem. Arte conceitual de alta qualidade.`;
      const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: prompt,
          config: { imageConfig: { aspectRatio: "3:4" } }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
    });
  } catch (error: any) {
    return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
  }
};

export const getAIRecommendations = async (readBooks: { title: string, genre: string }[]): Promise<Recommendation[]> => {
  if (readBooks.length === 0) return [];
  try {
    return await callGenAI(async (ai) => {
      const booksDescription = readBooks.map(b => `${b.title} (${b.genre})`).join(', ');
      const prompt = `Com base em: ${booksDescription}. Recomende 3 livros novos em Português com links de busca na Amazon Brasil.`;
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
                buyLink: { type: Type.STRING },
              },
              required: ["title", "author", "reason", "genre", "buyLink"]
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    });
  } catch (error: any) {
    return [];
  }
};
