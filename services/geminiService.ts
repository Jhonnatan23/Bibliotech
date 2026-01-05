
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Recommendation } from "../types";

const stringifyError = (err: any): string => {
  if (!err) return "Erro desconhecido";
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try {
    const parsed = JSON.stringify(err);
    if (parsed === '{}') return err.toString();
    return parsed;
  } catch {
    return String(err);
  }
};

const callGenAI = async (task: (ai: GoogleGenAI) => Promise<any>, modelName?: string) => {
  const isProModel = modelName === 'gemini-3-pro-image-preview' || modelName?.includes('pro');

  if (isProModel && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }

  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
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
    console.error(`Gemini API Error [${modelName || 'unknown'}]:`, errorMsg);

    if (
      errorMsg.includes("PERMISSION_DENIED") ||
      errorMsg.includes("403") ||
      errorMsg.includes("The caller does not have permission") ||
      errorMsg.includes("Requested entity was not found") ||
      errorMsg.includes("404")
    ) {
      if (window.aistudio) {
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
    return `A IA não conseguiu processar o resumo no momento. Verifique sua chave de API.`;
  }
};

export const getAIRecommendations = async (readBooks: { title: string, genre: string, rating?: number }[]): Promise<Recommendation[]> => {
  const model = 'gemini-3-flash-preview';
  try {
    return await callGenAI(async (ai) => {
      // Ordena livros lidos por nota para dar contexto de prioridade
      const highRated = readBooks.filter(b => (b.rating || 0) >= 8);
      const lowRated = readBooks.filter(b => (b.rating || 0) < 6 && b.rating !== undefined);
      
      let context = "";
      if (readBooks.length > 0) {
        context = `
          O usuário tem o seguinte histórico de leitura:
          LIVROS FAVORITOS (Notas Altas): ${highRated.map(b => `${b.title} (${b.genre}) - Nota: ${b.rating}`).join(', ')}.
          LIVROS QUE NÃO AGRADARAM TANTO (Notas Baixas): ${lowRated.map(b => `${b.title} (${b.genre}) - Nota: ${b.rating}`).join(', ')}.
          OUTROS: ${readBooks.filter(b => (b.rating || 0) >= 6 && (b.rating || 0) < 8).map(b => `${b.title} (${b.genre})`).join(', ')}.
          
          Instrução importante: Dê muito mais peso aos LIVROS FAVORITOS para gerar as novas sugestões. Evite temas similares aos LIVROS QUE NÃO AGRADARAM.
        `;
      } else {
        context = "O usuário ainda não tem livros lidos. Recomende 3 clássicos essenciais de gêneros variados (Ficção, Biografia, Suspense) que costumam ter notas altíssimas.";
      }

      const prompt = `
        Aja como um bibliotecário especialista e curador literário. 
        ${context}
        Com base no perfil psicológico e literário extraído desse histórico, recomende exatamente 3 livros novos em Português.
        Para cada livro, forneça um motivo curto e convincente da recomendação, mencionando por que ele se alinha aos livros que o usuário avaliou com notas altas.
        Gere um link de busca na Amazon Brasil (https://www.amazon.com.br/s?k=NOME+DO+LIVRO) para o campo buyLink.
        Responda estritamente em JSON seguindo o esquema fornecido.
      `;

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
    console.error("Erro ao obter recomendações:", error);
    return [];
  }
};
