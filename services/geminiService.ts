
import { Recommendation } from "../types";
import { supabase } from "./supabase";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const extractErrorMessage = (data: any): string => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data.error === 'string') return data.error;
  if (data.error?.message && typeof data.error.message === 'string') return data.error.message;
  if (data.message && typeof data.message === 'string') return data.message;
  return '';
};

async function fetchWithRetry(url: string, options: RequestInit, retries = 4, backoff = 1000): Promise<Response> {
  let { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;

  const buildHeaders = (t?: string) => ({
    ...(options.headers || {}),
    ...(t ? { "Authorization": `Bearer ${t}` } : {})
  });

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { ...options, headers: buildHeaders(token) });

      // Se der 401 por token expirado ou inválido, tenta renovar a sessão uma vez
      if (response.status === 401 && i === 0 && token) {
        try {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session?.access_token) {
            token = refreshData.session.access_token;
            continue;
          }
        } catch {
          // Ignora falha de refresh silenciosamente
        }
      }

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
      const errMsg = extractErrorMessage(data);
      const errCode = data?.error?.code || data?.code || '';

      if (data.isQuotaExceeded || response.status === 429 || errCode === 'LIMIT_EXCEEDED') {
        return "Resumo indisponível no momento devido ao limite de uso da IA. Tente mais tarde.";
      }
      if (data.isHighDemand || response.status === 503 || response.status === 504 || errCode === 'SERVICE_UNAVAILABLE') {
        return "O modelo de IA está com muita demanda no momento. O resumo falhou, mas você pode tentar novamente em instantes.";
      }
      throw new Error(errMsg || 'Falha no servidor ao gerar resumo');
    }

    return data.text || "Não foi possível gerar um resumo.";
  } catch (error: any) {
    console.error("Erro ao gerar resumo:", error?.message || error);
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
      const errMsg = extractErrorMessage(data);
      const errCode = data?.error?.code || data?.code || '';
      const lowerMsg = errMsg.toLowerCase();

      const isQuota = data?.isQuotaExceeded ||
        response.status === 429 ||
        errCode === 'LIMIT_EXCEEDED' ||
        lowerMsg.includes('quota') ||
        lowerMsg.includes('resource_exhausted');

      const isHighDemand = data?.isHighDemand ||
        response.status === 503 ||
        response.status === 504 ||
        errCode === 'SERVICE_UNAVAILABLE' ||
        errCode === 'GATEWAY_TIMEOUT' ||
        lowerMsg.includes('high demand') ||
        lowerMsg.includes('demanda') ||
        lowerMsg.includes('indisponível') ||
        lowerMsg.includes('unavailable') ||
        lowerMsg.includes('deadline');

      if (isQuota) {
        throw new Error('QUOTA_EXCEEDED');
      }
      if (isHighDemand) {
        throw new Error('HIGH_DEMAND');
      }
      throw new Error(errMsg || 'Falha no servidor ao obter recomendações');
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
    console.error("Erro ao obter recomendações:", error?.message || error);
    return [];
  }
};

export interface AIInsightReport {
  readingProfile: string;
  strengths: string[];
  growthOpportunities: string[];
  curatedQuote: string;
  quoteAuthor: string;
}

export const getAIInsights = async (booksList: { title: string; author: string; genre: string; status: string; rating?: number; pages?: number }[]): Promise<AIInsightReport | null> => {
  try {
    const response = await fetchWithRetry('/api/ai-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booksList })
    });

    if (!response.ok) {
      console.warn('Erro ao carregar insights literários:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Erro ao conectar ao endpoint de insights:', error);
    return null;
  }
};

export interface IdentifiedCoverInfo {
  title: string;
  author: string;
  publisher: string;
  volumeOrIssue: string;
  confidence: string;
  isComicOrManga: boolean;
  description: string;
}

export interface IdentifyCoverResult {
  identified: IdentifiedCoverInfo;
  searchResults: any[];
}

export const identifyCoverImage = async (imageBase64: string): Promise<IdentifyCoverResult> => {
  const response = await fetchWithRetry('/api/identify-cover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 })
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = extractErrorMessage(data);
    const errCode = data?.error?.code || data?.code || '';
    const lowerMsg = errMsg.toLowerCase();

    if (data.isQuotaExceeded || response.status === 429 || errCode === 'LIMIT_EXCEEDED' || lowerMsg.includes('quota')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    if (response.status === 503 || response.status === 504 || data.isHighDemand || errCode === 'SERVICE_UNAVAILABLE' || lowerMsg.includes('demand') || lowerMsg.includes('demanda')) {
      throw new Error('HIGH_DEMAND');
    }
    throw new Error(errMsg || 'Falha ao identificar capa do livro');
  }

  return data;
};

export interface ReadBarcodeResult {
  isbn: string;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
}

export const readBarcodeFromImage = async (imageBase64: string): Promise<ReadBarcodeResult> => {
  const response = await fetchWithRetry('/api/read-barcode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 })
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = extractErrorMessage(data);
    const errCode = data?.error?.code || data?.code || '';
    const lowerMsg = errMsg.toLowerCase();

    if (data.isQuotaExceeded || response.status === 429 || errCode === 'LIMIT_EXCEEDED' || lowerMsg.includes('quota')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    if (response.status === 503 || response.status === 504 || data.isHighDemand || errCode === 'SERVICE_UNAVAILABLE' || lowerMsg.includes('demand') || lowerMsg.includes('demanda')) {
      throw new Error('HIGH_DEMAND');
    }
    throw new Error(errMsg || 'Falha ao ler o código de barras');
  }

  return data;
};

