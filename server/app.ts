import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { fetch as undiciFetch, Agent, setGlobalDispatcher } from "undici";
import nodemailer from "nodemailer";
import { serverConfig } from "../services/serverConfig";
import { requestLoggerMiddleware, errorHandlerMiddleware, serverLogger } from "../services/serverLogger";
import { AppError, asyncHandler } from "../services/appError";
import { authMiddleware } from "./middleware/authMiddleware";
import loansRouter from "./routes/loansRoutes";

// Configure custom timeouts on the global Node.js fetch dispatcher to avoid Headers Timeout Error
const globalAgent = new Agent({
  headersTimeout: 180000, // 3 minutes
  bodyTimeout: 180000,    // 3 minutes
  connectTimeout: 60000,  // 1 minute
});
setGlobalDispatcher(globalAgent);

// Override native fetch with the configured undici fetch
globalThis.fetch = undiciFetch as any;

// In-memory rate limiter per user for AI endpoints
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const aiRateLimits = new Map<string, RateLimitRecord>();

function aiRateLimiter(req: any, res: any, next: any) {
  const userId = req.user?.id;
  if (!userId) {
    return next(new AppError(401, "UNAUTHORIZED", "Não autorizado: Usuário não identificado."));
  }
  const now = Date.now();
  const limitWindowMs = 15 * 60 * 1000; // 15 minutes
  const limitCount = 20;

  let record = aiRateLimits.get(userId);
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + limitWindowMs
    };
  }

  if (record.count >= limitCount) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader("Retry-After", retryAfterSec);
    return next(new AppError(
      429,
      "LIMIT_EXCEEDED",
      "Limite de requisições de IA excedido (máximo de 20 requisições a cada 15 minutos). Tente novamente mais tarde.",
      undefined,
      true,
      { retryAfter: retryAfterSec }
    ));
  }

  record.count++;
  aiRateLimits.set(userId, record);
  next();
}

function flexibleAiRateLimiter(req: any, res: any, next: any) {
  const identifier = req.user?.id || req.ip || req.headers?.['x-forwarded-for'] || 'client-default';
  const now = Date.now();
  const limitWindowMs = 15 * 60 * 1000;
  const limitCount = 30;

  let record = aiRateLimits.get(identifier);
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + limitWindowMs
    };
  }

  if (record.count >= limitCount) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader("Retry-After", retryAfterSec);
    return next(new AppError(
      429,
      "LIMIT_EXCEEDED",
      "Limite de leituras temporariamente atingido. Aguarde alguns minutos.",
      undefined,
      true,
      { retryAfter: retryAfterSec }
    ));
  }

  record.count++;
  aiRateLimits.set(identifier, record);
  next();
}

async function optionalAuthMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1]?.trim();
  if (!token) return next();
  try {
    const { getSupabaseClient } = await import("./services/authenticatedSupabase");
    const client = getSupabaseClient();
    const { data } = await client.auth.getUser(token);
    if (data?.user) {
      req.user = data.user;
      req.token = token;
    }
  } catch {
    // Continue sem autenticação se falhar
  }
  next();
}


function normalizeSchema(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;
  
  const normalized: any = Array.isArray(schema) ? [] : {};
  
  for (const key in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, key)) {
      if (key === "type" && typeof schema[key] === "string") {
        normalized[key] = schema[key].toUpperCase();
      } else {
        normalized[key] = normalizeSchema(schema[key]);
      }
    }
  }
  return normalized;
}

const VALID_GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest"
];

function sanitizeModelName(modelName?: string): string {
  if (!modelName) return "gemini-3.1-flash-lite";
  const m = modelName.trim().toLowerCase();
  if (VALID_GEMINI_MODELS.includes(m)) return m;
  if (m.includes("lite")) return "gemini-3.1-flash-lite";
  if (m.includes("2.5")) return "gemini-2.5-flash";
  return "gemini-3.1-flash-lite";
}

function getSmartCuratedRecommendations(contextStr?: string): any[] {
  const context = (contextStr || "").toLowerCase();

  const catalog = [
    {
      title: "Torto Arado",
      author: "Itamar Vieira Junior",
      genre: "Ficção",
      reason: "Uma narrativa épica e emocionante sobre família, resistência e ancestralidade no sertão baiano, aclamada pela crítica nacional.",
      keywords: ["ficção", "história", "romance", "drama", "literatura", "brasileira", "nacional"]
    },
    {
      title: "Flores para Algernon",
      author: "Daniel Keyes",
      genre: "Ficção Científica",
      reason: "Um clássico profundamente comovente e reflexivo sobre inteligência humana, empatia e a brevidade dos momentos marcantes.",
      keywords: ["ficção", "científico", "psicológico", "filosofia", "drama", "mente"]
    },
    {
      title: "O Homem de Giz",
      author: "C. J. Tudor",
      genre: "Suspense",
      reason: "Um thriller psicológico instigante com atmosfera envolvente, reviravoltas e ritmo dinâmico para quem aprecia mistérios e investigações.",
      keywords: ["suspense", "terror", "mistério", "investigação", "policial", "thriller"]
    },
    {
      title: "O Nome do Vento",
      author: "Patrick Rothfuss",
      genre: "Fantasia",
      reason: "Narrativa primorosa com construção de mundo e magia poética, ideal para quem aprecia sagas épicas e ricas em detalhes.",
      keywords: ["fantasia", "aventura", "épica", "magia"]
    },
    {
      title: "Sapiens: Uma Breve História da Humanidade",
      author: "Yuval Noah Harari",
      genre: "História",
      reason: "Uma visão fascinante e acessível sobre as revoluções cognitivas, científicas e sociais que moldaram a nossa espécie.",
      keywords: ["história", "biografia", "ciência", "não-ficção", "filosofia", "sociedade"]
    },
    {
      title: "A Menina que Roubava Livros",
      author: "Markus Zusak",
      genre: "Drama",
      reason: "Uma ode comovente ao poder transformador das palavras e dos livros em períodos históricos desafiadores.",
      keywords: ["drama", "história", "romance", "emocionante", "guerra", "livros"]
    },
    {
      title: "Orgulho e Preconceito",
      author: "Jane Austen",
      genre: "Romance",
      reason: "Um clássico imortal que equilibra inteligência, crítica social afiada e romance atemporal com personagens inesquecíveis.",
      keywords: ["romance", "clássico", "literatura", "época"]
    },
    {
      title: "O Alquimista",
      author: "Paulo Coelho",
      genre: "Autoajuda",
      reason: "Uma fábula inspiradora e poética sobre seguir sua lenda pessoal e prestar atenção aos sinais que a vida oferece.",
      keywords: ["autoajuda", "espiritualidade", "aventura", "filosofia", "misticismo"]
    }
  ];

  const scored = catalog.map(item => {
    let score = 0;
    for (const kw of item.keywords) {
      if (context.includes(kw)) score += 2;
    }
    if (context.includes(item.genre.toLowerCase())) score += 3;
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(({ item }) => ({
    title: item.title,
    author: item.author,
    genre: item.genre,
    reason: item.reason,
    buyLink: `https://www.amazon.com.br/s?k=${encodeURIComponent(item.title)}`
  }));
}

async function generateContentWithFallback(
  ai: any,
  params: {
    contents: any;
    config?: any;
    model?: string;
  },
  fallbackModels: string[] = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest"
  ]
): Promise<any> {
  let lastError: any = null;
  const requestedModel = sanitizeModelName(params.model);
  const modelsToTry: string[] = [requestedModel];
  for (const m of fallbackModels) {
    if (!modelsToTry.includes(m)) {
      modelsToTry.push(m);
    }
  }

  // Pre-normalize the responseSchema if it exists
  const sanitizedParams = { ...params };
  if (sanitizedParams.config?.responseSchema) {
    sanitizedParams.config = {
      ...sanitizedParams.config,
      responseSchema: normalizeSchema(sanitizedParams.config.responseSchema)
    };
  }

  for (const model of modelsToTry) {
    try {
      serverLogger.info(`[Gemini API] Requesting ${model}`);
      const response = await ai.models.generateContent({
        ...sanitizedParams,
        model: model,
      });
      serverLogger.info(`[Gemini API] Success with ${model}`);
      return response;
    } catch (err: any) {
      lastError = err;
      const errStr = String(err.message || err);

      const isQuotaExceeded = errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("429");
      const isHighDemand = errStr.includes("503") || errStr.includes("UNAVAILABLE") || errStr.includes("high demand") || errStr.includes("experiencing high demand");
      const isTimeout = errStr.includes("504") || errStr.includes("DEADLINE_EXCEEDED") || errStr.includes("Deadline expired") || errStr.includes("timeout") || errStr.includes("ETIMEDOUT");
      const isInvalidOrNotFound = errStr.includes("not found") || errStr.includes("404") || errStr.includes("INVALID_ARGUMENT") || errStr.includes("validation");

      let statusMsg = "Unavailable";
      if (isQuotaExceeded) {
        statusMsg = "Quota exceeded (429)";
      } else if (isHighDemand) {
        statusMsg = "High demand (503)";
      } else if (isTimeout) {
        statusMsg = "Deadline expired or timeout (504)";
      } else if (isInvalidOrNotFound) {
        statusMsg = "Invalid argument or model not found";
      } else {
        statusMsg = errStr.length > 80 ? errStr.substring(0, 80).replace(/["'{}]/g, "") : errStr.replace(/["'{}]/g, "");
      }

      serverLogger.warn(`[Gemini API] ${model} status: ${statusMsg}. Failing over to next fallback.`);
      // Immediately failover to next model in sequence
      continue;
    }
  }
  throw lastError;
}

export async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLoggerMiddleware);

  // Health check endpoint
  app.get("/api/health", (req: any, res: any) => {
    res.json({ status: "ok", port: 3000 });
  });

  // Resolve book by ISBN across multiple providers (Brasil API, Google Books, Open Library, Gemini AI)
  async function resolveBookByIsbn(isbn: string, apiKey?: string): Promise<any> {
    const cleanIsbn = String(isbn).replace(/[^0-9X]/gi, '').toUpperCase();
    if (!cleanIsbn || cleanIsbn.length < 9) return null;

    // 1. Try Brasil API first (very fast and accurate for Brazilian/Portuguese publications via CBL)
    try {
      const brasilRes = await fetch(`https://brasilapi.com.br/api/isbn/v1/${cleanIsbn}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3500)
      });
      if (brasilRes.ok) {
        const bData: any = await brasilRes.json();
        if (bData && bData.title) {
          serverLogger.info(`[ISBN Resolver] Sucesso via Brasil API para ISBN ${cleanIsbn}: "${bData.title}"`);
          return {
            id: `brasilapi-${cleanIsbn}`,
            title: bData.title + (bData.subtitle ? `: ${bData.subtitle}` : ''),
            authors: Array.isArray(bData.authors) && bData.authors.length > 0 ? bData.authors : ['Autor Desconhecido'],
            pageCount: bData.page_count || 0,
            categories: Array.isArray(bData.subjects) && bData.subjects.length > 0 ? bData.subjects : ['Literatura'],
            description: bData.synopsis ? bData.synopsis.trim() : '',
            publishedDate: bData.year ? String(bData.year) : '',
            publisher: bData.publisher || '',
            previewLink: `https://www.google.com/search?q=livro+isbn+${cleanIsbn}`,
            infoLink: `https://www.google.com/search?q=livro+isbn+${cleanIsbn}`,
            coverUrl: bData.cover_url || null
          };
        }
      }
    } catch {
      serverLogger.info(`[ISBN Resolver] Brasil API indisponível para ISBN ${cleanIsbn}`);
    }

    // 2. Try Google Books API
    try {
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(cleanIsbn)}${apiKey ? `&key=${apiKey}` : ''}`;
      const gbRes = await fetch(gbUrl, { signal: AbortSignal.timeout(3500) });
      if (gbRes.ok) {
        const gbData: any = await gbRes.json();
        if (gbData.items && gbData.items.length > 0) {
          const item = gbData.items[0];
          serverLogger.info(`[ISBN Resolver] Sucesso via Google Books para ISBN ${cleanIsbn}: "${item.volumeInfo.title}"`);
          return {
            id: item.id,
            title: item.volumeInfo.title || 'Título Desconhecido',
            authors: item.volumeInfo.authors || ['Autor Desconhecido'],
            pageCount: item.volumeInfo.pageCount || 0,
            categories: item.volumeInfo.categories || [],
            description: item.volumeInfo.description || '',
            publishedDate: item.volumeInfo.publishedDate || '',
            publisher: item.volumeInfo.publisher,
            averageRating: item.volumeInfo.averageRating,
            ratingsCount: item.volumeInfo.ratingsCount,
            previewLink: item.volumeInfo.previewLink,
            infoLink: item.volumeInfo.infoLink,
            coverUrl: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail || null
          };
        }
      } else {
        serverLogger.info(`[ISBN Resolver] Google Books retornou status ${gbRes.status} para ISBN ${cleanIsbn}`);
      }
    } catch {
      serverLogger.info(`[ISBN Resolver] Google Books falhou para ISBN ${cleanIsbn}`);
    }

    // 3. Fallback to Gemini AI (Fast & comprehensive for any global or Brazilian publication)
    if (serverConfig.geminiApiKey) {
      try {
        serverLogger.info(`[ISBN Resolver] Consultando Gemini AI para resolver ISBN ${cleanIsbn}`);
        const ai = new GoogleGenAI({ 
          apiKey: serverConfig.geminiApiKey,
          httpOptions: { 
            headers: { 'User-Agent': 'aistudio-build' },
            timeout: 15000 
          }
        });
        const prompt = `Identifique com precisão as informações oficiais do livro, gibi, HQ ou mangá correspondente ao código ISBN: ${cleanIsbn}.
Se for uma publicação existente, retorne estritamente em JSON com campos title, authors, pageCount, categories, description, publisher, publishedDate em Português. Se o código for totalmente inválido ou não encontrado, retorne title com string vazia "".`;

        const response = await generateContentWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                authors: { type: Type.ARRAY, items: { type: Type.STRING } },
                pageCount: { type: Type.INTEGER },
                categories: { type: Type.ARRAY, items: { type: Type.STRING } },
                description: { type: Type.STRING },
                publisher: { type: Type.STRING },
                publishedDate: { type: Type.STRING }
              },
              required: ["title", "authors", "pageCount", "categories", "description", "publisher"]
            }
          }
        });

        if (response?.text) {
          const parsed = JSON.parse(response.text);
          if (parsed.title && parsed.title.trim().length > 0) {
            serverLogger.info(`[ISBN Resolver] Sucesso via Gemini AI para ISBN ${cleanIsbn}: "${parsed.title}"`);
            return {
              id: `ai-${cleanIsbn}`,
              title: parsed.title.trim(),
              authors: Array.isArray(parsed.authors) && parsed.authors.length > 0 ? parsed.authors : ['Autor Desconhecido'],
              pageCount: parsed.pageCount || 0,
              categories: Array.isArray(parsed.categories) ? parsed.categories : [],
              description: parsed.description || '',
              publishedDate: parsed.publishedDate || '',
              publisher: parsed.publisher || '',
              previewLink: `https://www.google.com/search?q=livro+isbn+${cleanIsbn}`,
              infoLink: `https://www.google.com/search?q=livro+isbn+${cleanIsbn}`,
              coverUrl: null
            };
          }
        }
      } catch (aiErr: any) {
        serverLogger.warn(`[ISBN Resolver] Gemini AI falhou para ISBN ${cleanIsbn}:`, { error: aiErr.message || aiErr });
      }
    }

    // 4. Try Open Library API as secondary fallback
    try {
      const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&jscmd=data&format=json`;
      const olRes = await fetch(olUrl, { signal: AbortSignal.timeout(2500) });
      if (olRes.ok) {
        const olData: any = await olRes.json();
        const bookKey = `ISBN:${cleanIsbn}`;
        if (olData && olData[bookKey]) {
          const item = olData[bookKey];
          serverLogger.info(`[ISBN Resolver] Sucesso via Open Library para ISBN ${cleanIsbn}: "${item.title}"`);
          return {
            id: `ol-${cleanIsbn}`,
            title: item.title || 'Título Desconhecido',
            authors: Array.isArray(item.authors) ? item.authors.map((a: any) => a.name) : ['Autor Desconhecido'],
            pageCount: item.number_of_pages || 0,
            categories: Array.isArray(item.subjects) ? item.subjects.map((s: any) => s.name).slice(0, 3) : [],
            description: typeof item.notes === 'string' ? item.notes : (item.notes?.value || ''),
            publishedDate: item.publish_date || '',
            publisher: Array.isArray(item.publishers) ? item.publishers.map((p: any) => p.name).join(', ') : '',
            previewLink: item.url,
            infoLink: item.url,
            coverUrl: item.cover?.large || item.cover?.medium || null
          };
        }
      }
    } catch {
      serverLogger.info(`[ISBN Resolver] Open Library indisponível para ISBN ${cleanIsbn}`);
    }


    return null;
  }

  // Books search and ISBN lookup
  app.get("/api/search-books", asyncHandler(async (req: any, res: any) => {
    const { q, isbn } = req.query;
    const apiKey = serverConfig.googleBooksApiKey;
    
    if (isbn) {
      const bookData = await resolveBookByIsbn(String(isbn), apiKey);
      return res.json(bookData);
    }

    if (q) {
      // Try Google Books first
      try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(String(q))}&maxResults=20&printType=books${apiKey ? `&key=${apiKey}` : ''}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (response.ok) {
          const data: any = await response.json();
          const results = (data.items || []).map((item: any) => ({
            id: item.id,
            title: item.volumeInfo.title || 'Título Desconhecido',
            authors: item.volumeInfo.authors || ['Autor Desconhecido'],
            pageCount: item.volumeInfo.pageCount || 0,
            categories: item.volumeInfo.categories || [],
            description: item.volumeInfo.description || '',
            publishedDate: item.volumeInfo.publishedDate || '',
            publisher: item.volumeInfo.publisher,
            averageRating: item.volumeInfo.averageRating,
            ratingsCount: item.volumeInfo.ratingsCount,
            previewLink: item.volumeInfo.previewLink,
            infoLink: item.volumeInfo.infoLink,
          }));
          return res.json(results);
        }
      } catch (err: any) {
        serverLogger.info(`[Search Books] Google Books indisponível para query "${q}"`);
      }

      // Fallback search Open Library
      try {
        const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(String(q))}&limit=10`;
        const olRes = await fetch(olUrl, { signal: AbortSignal.timeout(4000) });
        if (olRes.ok) {
          const olData: any = await olRes.json();
          const results = (olData.docs || []).map((doc: any) => ({
            id: doc.key || `ol-${doc.cover_i || Math.random()}`,
            title: doc.title || 'Título Desconhecido',
            authors: Array.isArray(doc.author_name) ? doc.author_name : ['Autor Desconhecido'],
            pageCount: doc.number_of_pages_median || 0,
            categories: Array.isArray(doc.subject) ? doc.subject.slice(0, 3) : [],
            description: '',
            publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : '',
            publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : undefined,
            previewLink: undefined,
            infoLink: undefined,
          }));
          return res.json(results);
        }
      } catch {
        serverLogger.info(`[Search Books] Open Library fallback falhou para query "${q}"`);
      }

      return res.json([]);
    }

    throw new AppError(400, "VALIDATION_ERROR", "Parâmetro 'q' ou 'isbn' é obrigatório.");
  }));

  // Barcode / ISBN Visual Scanner Endpoint
  app.post("/api/read-barcode", optionalAuthMiddleware, flexibleAiRateLimiter, asyncHandler(async (req: any, res: any) => {
    const { image, imageBase64 } = req.body;
    const rawImage = image || imageBase64;

    if (!rawImage || typeof rawImage !== 'string') {
      throw new AppError(400, "VALIDATION_ERROR", "A imagem em base64 é obrigatória para a leitura do código de barras.");
    }

    const apiKey = serverConfig.geminiApiKey;
    if (!apiKey) {
      throw new AppError(500, "INTERNAL_ERROR", "A chave de API do Gemini não está configurada no servidor.");
    }

    let mimeType = "image/jpeg";
    let base64Data = rawImage.trim();
    const dataUriMatch = rawImage.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/s);
    if (dataUriMatch) {
      mimeType = dataUriMatch[1];
      base64Data = dataUriMatch[2].trim();
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { 
        headers: { 'User-Agent': 'aistudio-build' },
        timeout: 25000 
      }
    });

    const imagePart = {
      inlineData: { mimeType, data: base64Data },
    };

    const textPart = {
      text: `Você é um leitor óptico especialista em livros e códigos de barras editoriais (ISBN / EAN-13 / Bookland).
Analise a imagem com máxima atenção e procure:
1. Um código de barras no padrão EAN-13 (geralmente começando com 978 ou 979, com 13 dígitos numéricos).
2. Ou o número de ISBN impresso acima ou abaixo das barras ou na contracapa (ex: "ISBN 978-85-359-1484-9" ou "ISBN 85-359-1484-6").

Extraia o código e retorne EXCLUSIVAMENTE o seguinte formato JSON:
{
  "isbn": "somente os dígitos numéricos do ISBN limpos sem traços e sem espaços, ex: 9788535914849. Se não encontrar nenhum ISBN ou código de barras, retorne string vazia",
  "rawText": "o texto exato como lido na imagem",
  "confidence": "high" | "medium" | "low"
}`
    };

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.8-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isbn: { type: Type.STRING },
              rawText: { type: Type.STRING },
              confidence: { type: Type.STRING }
            },
            required: ["isbn", "rawText", "confidence"]
          }
        }
      });

      if (response?.text) {
        const parsed = JSON.parse(response.text);
        const cleanIsbn = (parsed.isbn || "").replace(/[^0-9X]/gi, "");
        return res.json({
          isbn: cleanIsbn,
          rawText: parsed.rawText || "",
          confidence: parsed.confidence || (cleanIsbn ? "high" : "low")
        });
      }

      return res.json({ isbn: "", rawText: "", confidence: "low" });
    } catch (error: any) {
      serverLogger.error("Erro na leitura óptica de código de barras:", error);
      throw new AppError(500, "INTEGRATION_ERROR", "Não foi possível realizar a leitura óptica do código de barras.", error.message);
    }
  }));


  // AI Cover Recognition & Auto Metadata Endpoint
  app.post("/api/identify-cover", authMiddleware, aiRateLimiter, asyncHandler(async (req: any, res: any) => {
    const { image, imageBase64 } = req.body;
    const rawImage = image || imageBase64;

    if (!rawImage || typeof rawImage !== 'string') {
      throw new AppError(400, "VALIDATION_ERROR", "A imagem em base64 é obrigatória para o reconhecimento da capa.");
    }

    const apiKey = serverConfig.geminiApiKey;
    if (!apiKey) {
      throw new AppError(500, "INTERNAL_ERROR", "A chave de API do Gemini não está configurada no servidor.");
    }

    // Extract mime type and raw base64 payload
    let mimeType = "image/jpeg";
    let base64Data = rawImage.trim();

    const dataUriMatch = rawImage.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/s);
    if (dataUriMatch) {
      mimeType = dataUriMatch[1];
      base64Data = dataUriMatch[2].trim();
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { 
        headers: { 'User-Agent': 'aistudio-build' },
        timeout: 30000
      }
    });

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: `Analise atentamente a imagem da capa do livro, gibi, HQ, revista em quadrinhos ou mangá fornecida.
Identifique com o máximo de precisão possível:
1. Título principal do livro ou título da série/volume de HQ.
2. Autor(es), roteirista, desenhista, ilustrador ou criador principal.
3. Editora (se visível ou claramente conhecida).
4. Número da edição ou volume (caso seja HQ, mangá ou série, ex: "1", "Vol. 2", "#15", "Edição 4").
5. Nível de confiança do reconhecimento: "high" (capa clara e legível), "medium" (alguns dados legíveis), ou "low" (imagem borrada, ilegível ou não é um livro/HQ).
6. Se a obra é uma HQ, gibi, quadrinho ou mangá (isComicOrManga: true/false).
7. Breve descrição/observação sobre os elementos visuais identificados na capa.

Caso a foto esteja ilegível ou não seja a capa de um livro/HQ, retorne confidence como "low" e título/autor vazios.`
    };

    let identified = {
      title: "",
      author: "",
      publisher: "",
      volumeOrIssue: "",
      confidence: "low",
      isComicOrManga: false,
      description: ""
    };

    try {
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.8-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              publisher: { type: Type.STRING },
              volumeOrIssue: { type: Type.STRING },
              confidence: { type: Type.STRING },
              isComicOrManga: { type: Type.BOOLEAN },
              description: { type: Type.STRING }
            },
            required: ["title", "author", "publisher", "volumeOrIssue", "confidence", "isComicOrManga", "description"]
          }
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        identified = {
          title: (parsed.title || "").trim(),
          author: (parsed.author || "").trim(),
          publisher: (parsed.publisher || "").trim(),
          volumeOrIssue: (parsed.volumeOrIssue || "").trim(),
          confidence: (parsed.confidence || "low").toLowerCase().trim(),
          isComicOrManga: Boolean(parsed.isComicOrManga),
          description: (parsed.description || "").trim()
        };
      }
    } catch (error: any) {
      serverLogger.error("Erro no reconhecimento de capa via Gemini:", error);
      const status = error.status || (error.message?.includes('429') ? 429 : (error.message?.includes('503') ? 503 : 500));
      const code = status === 429 ? "LIMIT_EXCEEDED" : (status === 503 ? "SERVICE_UNAVAILABLE" : "INTEGRATION_ERROR");
      const safeMsg = status === 429 
        ? "Limite de requisições excedido. Tente novamente mais tarde." 
        : (status === 503 ? "O modelo de IA está temporariamente indisponível devido à alta demanda." : "Não foi possível reconhecer a capa na imagem enviada.");
      throw new AppError(status, code, safeMsg, error.message);
    }

    // Busca interna complementar no Google Books com o título/autor reconhecido
    let searchResults: any[] = [];
    if (identified.title) {
      const searchQuery = [identified.title, identified.author, identified.volumeOrIssue].filter(Boolean).join(" ");
      const googleBooksApiKey = serverConfig.googleBooksApiKey;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=10&printType=books${googleBooksApiKey ? `&key=${googleBooksApiKey}` : ''}`;
      
      try {
        const gbRes = await fetch(url);
        if (gbRes.ok) {
          const gbData: any = await gbRes.json();
          searchResults = (gbData.items || []).map((item: any) => ({
            id: item.id,
            title: item.volumeInfo.title || identified.title,
            authors: item.volumeInfo.authors || (identified.author ? [identified.author] : ['Autor Desconhecido']),
            pageCount: item.volumeInfo.pageCount || 0,
            categories: item.volumeInfo.categories || [],
            description: item.volumeInfo.description || '',
            publishedDate: item.volumeInfo.publishedDate || '',
            publisher: item.volumeInfo.publisher || identified.publisher,
            averageRating: item.volumeInfo.averageRating,
            ratingsCount: item.volumeInfo.ratingsCount,
            previewLink: item.volumeInfo.previewLink,
            infoLink: item.volumeInfo.infoLink,
            coverUrl: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail || null
          }));
        }
      } catch (err) {
        serverLogger.warn("Erro ao consultar o Google Books durante o processo de scanner de capa:", err);
      }
    }

    return res.json({
      identified,
      searchResults
    });
  }));

  // AI Insights Endpoint
  app.post("/api/ai-insights", authMiddleware, aiRateLimiter, asyncHandler(async (req: any, res: any) => {
    const { booksList } = req.body;
    const apiKey = serverConfig.geminiApiKey;
    if (!apiKey) {
      throw new AppError(500, "INTERNAL_ERROR", "A chave de API do Gemini não está configurada no servidor.");
    }
    
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { 
        headers: { 'User-Agent': 'aistudio-build' },
        timeout: 30000
      }
    });

    const booksSummary = (booksList || []).map((b: any) => 
      `- "${b.title}" por ${b.author} (${b.genre || 'gênero não especificado'}), Status: ${b.status || 'N/A'}, Nota: ${b.rating || 'N/A'}, Páginas: ${b.pages || 0}`
    ).join("\n");

    const prompt = `
      Aja como um analista literário e psicólogo de leitura sênior.
      Aqui está a lista de livros lidos ou na estante do usuário:
      ${booksSummary || "O usuário ainda não possui livros cadastrados."}

      Com base nessa estante de livros, gere um relatório de insights literários em Português estruturado exatamente com os seguintes campos JSON:
      - "readingProfile": um parágrafo envolvente que descreve o perfil literário e psicológico do usuário de forma acolhedora e inspiradora.
      - "strengths": uma lista de 3 pontos fortes sobre seus hábitos de leitura (ex: dedicação, diversidade de temas, foco).
      - "growthOpportunities": uma lista de 2 sugestões para expandir seus horizontes literários (ex: experimentar clássicos, estabelecer rituais de leitura).
      - "curatedQuote": uma frase inspiradora famosa sobre livros que se alinhe ao perfil dele.
      - "quoteAuthor": o autor da frase inspiradora.

      Responda estritamente em formato JSON válido seguindo esse esquema de resposta. Não inclua blocos de markdown.
    `;

    try {
      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              readingProfile: { type: Type.STRING },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              growthOpportunities: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              curatedQuote: { type: Type.STRING },
              quoteAuthor: { type: Type.STRING }
            },
            required: ["readingProfile", "strengths", "growthOpportunities", "curatedQuote", "quoteAuthor"]
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      serverLogger.warn("[Gemini API] Falha na geração de insights via IA. Retornando análise padrão de contingência.", {
        error: error.message
      });
      res.json({
        readingProfile: "Você é um leitor engajado que valoriza o aprendizado contínuo e a descoberta de novas histórias que expandem a imaginação.",
        strengths: [
          "Curiosidade literária constante",
          "Apreço pela diversidade de temas",
          "Comprometimento com sua biblioteca pessoal"
        ],
        growthOpportunities: [
          "Experimentar novos gêneros e autores fora de sua zona de conforto",
          "Reservar um momento diário dedicado exclusivamente à imersão na leitura"
        ],
        curatedQuote: "Um leitor vive mil vidas antes de morrer. O homem que nunca lê vive apenas uma.",
        quoteAuthor: "George R. R. Martin"
      });
    }
  }));

  // Gemini API Proxy
  app.post("/api/generate", authMiddleware, aiRateLimiter, asyncHandler(async (req: any, res: any) => {
    const { prompt, systemInstruction, model: modelName } = req.body;
    const apiKey = serverConfig.geminiApiKey;
    if (!apiKey) {
      throw new AppError(500, "INTERNAL_ERROR", "A chave de API do Gemini não está configurada no servidor.");
    }
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { 
        headers: { 'User-Agent': 'aistudio-build' },
        timeout: 30000
      }
    });

    try {
      const response = await generateContentWithFallback(ai, { 
        model: sanitizeModelName(modelName), 
        contents: prompt,
        config: { systemInstruction } 
      });
      res.json(response);
    } catch (error: any) {
      const errStr = String(error?.message || error);
      const isQuota = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota');
      const isHighDemand = errStr.includes('503') || errStr.includes('504') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand') || errStr.includes('DEADLINE_EXCEEDED') || errStr.includes('Deadline expired') || errStr.includes('timeout');
      const status = isQuota ? 429 : (isHighDemand ? 503 : (error.status || 500));
      const code = status === 429 ? "LIMIT_EXCEEDED" : (isHighDemand ? "SERVICE_UNAVAILABLE" : "INTEGRATION_ERROR");
      const safeMsg = status === 429 
        ? "Limite de requisições excedido. Tente novamente mais tarde." 
        : (status === 503 ? "O modelo de IA está temporariamente ocupado." : "Erro na geração de conteúdo.");
      throw new AppError(status, code, safeMsg, error.message);
    }
  }));

  app.post("/api/generate-summary", authMiddleware, aiRateLimiter, asyncHandler(async (req: any, res: any) => {
    const { title, author } = req.body;
    const apiKey = serverConfig.geminiApiKey;
    if (!apiKey) {
      throw new AppError(500, "INTERNAL_ERROR", "A chave de API do Gemini não está configurada no servidor.");
    }
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { 
        headers: { 'User-Agent': 'aistudio-build' },
        timeout: 30000
      }
    });
    const prompt = `Escreva um resumo curto (um parágrafo) e envolvente em Português para o livro "${title}" de ${author}. Não dê spoilers.`;

    try {
      const response = await generateContentWithFallback(ai, {
        contents: prompt,
      });
      res.json({ text: response.text });
    } catch (error: any) {
      serverLogger.warn("[Gemini API] Falha ao gerar resumo via IA, retornando sinopse de contingência.", {
        error: error.message
      });
      res.json({ 
        text: `Uma obra marcante de ${author}, convidando o leitor a explorar sua temática envolvente e narrativa cativante.` 
      });
    }
  }));

  app.post("/api/get-recommendations", authMiddleware, aiRateLimiter, asyncHandler(async (req: any, res: any) => {
    const { context, responseSchema } = req.body;
    const apiKey = serverConfig.geminiApiKey;
    if (!apiKey) {
      throw new AppError(500, "INTERNAL_ERROR", "A chave de API do Gemini não está configurada no servidor.");
    }
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { 
        headers: { 'User-Agent': 'aistudio-build' },
        timeout: 30000
      }
    });
    
    const prompt = `
      Aja como um bibliotecário especialista e curador literário. 
      ${context}
      Com base no perfil psicológico e literário extraído desse histórico, recomende exatamente 3 livros novos em Português.
      Para cada livro, forneça um motivo curto e convincente da recomendação, mencionando por que ele se alinha aos livros que o usuário avaliou com notas altas.
      Gere um link de busca na Amazon Brasil (https://www.amazon.com.br/s?k=NOME+DO+LIVRO) para o campo buyLink.
      Responda estritamente em JSON seguindo o esquema fornecido.
    `;

    try {
      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      serverLogger.warn("[Gemini API] Serviço de IA indisponível ou sob alta demanda. Ativando curadoria inteligente de contingência.", {
        error: error.message
      });
      
      const fallbackRecs = getSmartCuratedRecommendations(context);
      res.json({ 
        text: JSON.stringify(fallbackRecs),
        isCuratedFallback: true
      });
    }
  }));

  // Real Email Dispatcher Endpoint
  app.post("/api/send-email", authMiddleware, asyncHandler(async (req: any, res: any) => {
    const { subject, html } = req.body;
    if (!subject || !html) {
      throw new AppError(400, "VALIDATION_ERROR", "Parâmetros 'subject' e 'html' são obrigatórios.");
    }

    const to = req.user?.email;
    const getRecipientDomain = (email: string) => email && email.includes('@') ? email.split('@')[1] : undefined;

    if (!to) {
      serverLogger.warn("Envio de e-mail cancelado: Usuário autenticado não possui e-mail cadastrado.", { requestId: req.requestId });
      throw new AppError(400, "VALIDATION_ERROR", "Usuário não possui um e-mail cadastrado.");
    }

    const emailUser = serverConfig.emailUser;
    const emailPass = serverConfig.emailPass;

    if (!emailPass || !emailUser) {
      serverLogger.warn("Envio de e-mail simulado", {
        provider: "simulated-provider",
        requestId: req.requestId,
        recipientDomain: getRecipientDomain(to),
      });
      return res.json({ 
        success: true, 
        simulated: true, 
        message: "E-mail simulado com sucesso (configure as variáveis EMAIL_USER e EMAIL_PASS no painel de controle do AI Studio para disparos reais)." 
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"BiblioTech" <${emailUser}>`,
        to,
        subject,
        html,
      });

      serverLogger.info("Envio de e-mail concluído", {
        provider: "gmail-provider",
        requestId: req.requestId,
        recipientDomain: getRecipientDomain(to),
        messageId: info.messageId,
      });
      res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      serverLogger.error("Falha ao enviar e-mail real", {
        provider: "gmail-provider",
        requestId: req.requestId,
        recipientDomain: getRecipientDomain(to),
        error: error.message || error,
      });
      throw new AppError(500, "INTERNAL_ERROR", "Falha ao enviar e-mail.", error.message);
    }
  }));

  // Mount loans routing module
  app.use("/api", loansRouter);

  // Centralized Error Handling Middleware for APIs
  app.use(errorHandlerMiddleware);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
