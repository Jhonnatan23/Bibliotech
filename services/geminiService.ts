
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
 * Executes a Gemini task using the environment's API key.
 * Always creates a new GoogleGenAI instance right before the call.
 */
const callGenAI = async (task: (ai: GoogleGenAI) => Promise<any>, modelName?: string) => {
  const isProModel = modelName === 'gemini-3-pro-image-preview' || modelName?.includes('pro');

  // Mandatory key selection for Pro models as per guidelines
  if (isProModel && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      console.warn(`O modelo ${modelName} requer uma chave paga. Abrindo seletor...`);
      await window.aistudio.openSelectKey();
      // Proceed immediately after triggering dialog as per race condition mitigation rules
    }
  }

  // Always use process.env.API_KEY directly
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    throw new Error("API_KEY_MISSING");
  }

  try {
    // CRITICAL: Create new instance right before making the call
    const ai = new GoogleGenAI({ apiKey });
    return await task(ai);
  } catch (error: any) {
    const errorMsg = stringifyError(error);
    console.error(`Gemini API Error [${modelName || 'unknown'}]:`, errorMsg);

    // Handle PERMISSION_DENIED (403) and Not Found (404) by prompting for a new key
    if (
      errorMsg.includes("PERMISSION_DENIED") ||
      errorMsg.includes("403") ||
      errorMsg.includes("Requested entity was not found") ||
      errorMsg.includes("404")
    ) {
      if (window.aistudio) {
        console.warn("A chave atual não tem permissão para este modelo. Solicitando nova chave...");
        await window.aistudio.openSelectKey();
      }
    }
    throw error;
  }
};

export const generateBookSummary = async (title: string, author: string): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  try {
    return await callGenAI(async (ai) => {
      const prompt = `Escreva um resumo curto (um parágrafo) e envolvente em Português para o livro "${title}" de ${author}. Não dê spoilers.`;
      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text || "Não foi possível gerar um resumo.";
    }, model);
  } catch (error: any) {
    return `A IA não conseguiu processar o resumo no momento. Verifique sua chave de API nas Configurações.`;
  }
};

export const generateBookCover = async (title: string, genre: string, type: string, author?: string): Promise<string> => {
  const model = 'gemini-3-pro-image-preview';
  try {
    return await callGenAI(async (ai) => {
      const prompt = `Capa profissional de alta qualidade para o livro "${title}" ${author ? `de ${author}` : ''}. 
      Gênero: ${genre}. Estilo visual: cinematográfico, artístico, sem textos.
      Regras: Proporção 3:4. Alta definição.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K"
          },
          tools: [{ googleSearch: {} }]
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
    }, model);
  } catch (error: any) {
    console.error("Erro fatal na geração de capa:", error);
    // Silent fallback to avoid breaking the UX when permissions fail
    return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
  }
};

export const getAIRecommendations = async (readBooks: { title: string, genre: string }[]): Promise<Recommendation[]> => {
  if (readBooks.length === 0) return [];
  const model = 'gemini-3-flash-preview';
  try {
    return await callGenAI(async (ai) => {
      const booksDescription = readBooks.map(b => `${b.title} (${b.genre})`).join(', ');
      const prompt = `Com base em: ${booksDescription}. Recomende 3 livros novos em Português com links de busca na Amazon Brasil.`;
      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
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
    }, model);
  } catch (error: any) {
    return [];
  }
};
