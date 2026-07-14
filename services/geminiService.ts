
import { Recommendation } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: RequestInit, retries = 5, backoff = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        if (text.includes("wait while your application starts") || text.includes("Please wait while your application starts")) {
          console.warn(`[GeminiService] Server warmup detected (attempt ${i + 1}/${retries}). Retrying in ${backoff}ms...`);
          if (i === retries - 1) {
            throw new Error('WARMUP');
          }
          await delay(backoff);
          backoff *= 1.5;
          continue;
        }
        // If it's a different non-JSON format, wait or throw
        if (i === retries - 1) {
          throw new Error('INVALID_FORMAT');
        }
        await delay(backoff);
        backoff *= 1.5;
        continue;
      }
      return response;
    } catch (err: any) {
      if (err.message === 'WARMUP' || err.message === 'INVALID_FORMAT') {
        throw err;
      }
      if (i === retries - 1) throw err;
      console.warn(`[GeminiService] Fetch error (attempt ${i + 1}/${retries}). Retrying in ${backoff}ms...`, err);
      await delay(backoff);
      backoff *= 1.5;
    }
  }
  throw new Error('WARMUP');
}

export const generateBookSummary = async (title: string, author: string): Promise<string> => {
  try {
    const response = await fetchWithRetry('/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.isQuotaExceeded) {
        return "Resumo indisponível no momento devido ao limite de uso da IA. Tente mais tarde.";
      }
      if (data.isHighDemand) {
        return "O modelo de IA está com muita demanda no momento. O resumo falhou, mas você pode tentar novamente em instantes.";
      }
      throw new Error(data.error || 'Falha no servidor ao gerar resumo');
    }

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

    const response = await fetchWithRetry('/api/get-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, responseSchema })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.isQuotaExceeded) {
        throw new Error('QUOTA_EXCEEDED');
      }
      if (response.status === 503 || data.isHighDemand || data.error?.includes('high demand')) {
        throw new Error('HIGH_DEMAND');
      }
      throw new Error(data.error || 'Falha no servidor ao obter recomendações');
    }

    return JSON.parse(data.text || '[]');
  } catch (error: any) {
    if (error.message === 'QUOTA_EXCEEDED') {
      throw error;
    }
    if (error.message === 'HIGH_DEMAND') {
      throw error;
    }
    if (error.message === 'WARMUP') {
      throw new Error('O servidor ainda está inicializando as ferramentas literárias. Por favor, aguarde alguns segundos e tente novamente.');
    }
    console.error("Erro ao obter recomendações:", error);
    return [];
  }
};
