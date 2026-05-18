
import { Recommendation } from "../types";

export const generateBookSummary = async (title: string, author: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author })
    });

    if (!response.ok) {
      throw new Error('Falha no servidor ao gerar resumo');
    }

    const data = await response.json();
    return data.text || "Não foi possível gerar um resumo.";
  } catch (error: any) {
    console.error("Erro ao gerar resumo:", error);
    return `A IA não conseguiu processar o resumo no momento.`;
  }
};

export const getAIRecommendations = async (readBooks: { title: string, genre: string, rating?: number }[]): Promise<Recommendation[]> => {
  try {
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

    const responseSchema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          author: { type: "string" },
          reason: { type: "string" },
          genre: { type: "string" },
          buyLink: { type: "string" },
        },
        required: ["title", "author", "reason", "genre", "buyLink"]
      }
    };

    const response = await fetch('/api/get-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, responseSchema })
    });

    if (!response.ok) {
      throw new Error('Falha no servidor ao obter recomendações');
    }

    const data = await response.json();
    return JSON.parse(data.text || '[]');
  } catch (error: any) {
    console.error("Erro ao obter recomendações:", error);
    return [];
  }
};
