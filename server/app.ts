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

async function generateContentWithFallback(
  ai: any,
  params: {
    contents: any;
    config?: any;
    model?: string;
  },
  fallbackModels: string[] = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-latest"
  ]
): Promise<any> {
  let lastError: any = null;
  const modelsToTry = [...fallbackModels];
  if (params.model && !modelsToTry.includes(params.model)) {
    modelsToTry.unshift(params.model);
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
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        serverLogger.info(`[Gemini API] Requesting ${model} (attempt ${attempt}/2)`);
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
        const isInvalidOrNotFound = errStr.includes("not found") || errStr.includes("404") || errStr.includes("INVALID_ARGUMENT") || errStr.includes("validation");

        let statusMsg = "Unavailable";
        if (isQuotaExceeded) {
          statusMsg = "Quota exceeded";
        } else if (isHighDemand) {
          statusMsg = "High demand or model temporarily busy";
        } else if (isInvalidOrNotFound) {
          statusMsg = "Invalid argument or model not found";
        } else {
          statusMsg = errStr.length > 80 ? errStr.substring(0, 80).replace(/["'{}]/g, "") : errStr.replace(/["'{}]/g, "");
        }

        serverLogger.info(`[Gemini API] ${model} status: ${statusMsg}`);

        if (isQuotaExceeded) {
          serverLogger.info(`[Gemini API] ${model} quota limit. Moving to next model.`);
          break; // Fallback immediately to the next model
        }

        if (isHighDemand) {
          serverLogger.info(`[Gemini API] ${model} busy. Moving to next model.`);
          break; // Fallback immediately to the next model
        }

        if (isInvalidOrNotFound) {
          serverLogger.info(`[Gemini API] ${model} invalid or not found. Moving to next model.`);
          break; // Fallback immediately to the next model
        }

        // For other generic transient/network errors, retry once after a short delay
        if (attempt < 2) {
          serverLogger.info(`[Gemini API] Retrying ${model} in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          break; // Switch to the next model immediately
        }
      }
    }
  }
  throw lastError;
}

export async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLoggerMiddleware);

  // Google Books API Proxy
  app.get("/api/search-books", asyncHandler(async (req: any, res: any) => {
    const { q, isbn } = req.query;
    const apiKey = serverConfig.googleBooksApiKey;
    
    let url = "";
    if (isbn) {
      url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(String(isbn))}${apiKey ? `&key=${apiKey}` : ''}`;
    } else if (q) {
      url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(String(q))}&maxResults=20&printType=books${apiKey ? `&key=${apiKey}` : ''}`;
    } else {
      throw new AppError(400, "VALIDATION_ERROR", "Parâmetro 'q' ou 'isbn' é obrigatório.");
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new AppError(response.status === 429 ? 429 : 502, response.status === 429 ? "LIMIT_EXCEEDED" : "INTEGRATION_ERROR", "Erro ao buscar na API do Google Books");
    }

    const data: any = await response.json();
    
    if (isbn) {
      if (!data.items || data.items.length === 0) {
        return res.json(null);
      }
      const item = data.items[0];
      return res.json({
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
      });
    } else {
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
        timeout: 180000
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
      const status = error.status || (error.message?.includes('429') ? 429 : (error.message?.includes('503') ? 503 : 500));
      const code = status === 429 ? "LIMIT_EXCEEDED" : (status === 503 ? "SERVICE_UNAVAILABLE" : "INTEGRATION_ERROR");
      const safeMsg = status === 429 
        ? "Limite de requisições excedido. Tente novamente mais tarde." 
        : (status === 503 ? "O modelo de IA está temporariamente indisponível devido à alta demanda." : "Falha na comunicação com o serviço do Gemini.");
      throw new AppError(status, code, safeMsg, error.message);
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
        timeout: 180000
      }
    });

    try {
      const response = await generateContentWithFallback(ai, { 
        model: modelName || 'gemini-3.5-flash', 
        contents: prompt,
        config: { systemInstruction } 
      });
      res.json(response);
    } catch (error: any) {
      const status = error.status || (error.message?.includes('429') ? 429 : (error.message?.includes('503') ? 503 : 500));
      const code = status === 429 ? "LIMIT_EXCEEDED" : (status === 503 ? "SERVICE_UNAVAILABLE" : "INTEGRATION_ERROR");
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
        timeout: 180000
      }
    });
    const prompt = `Escreva um resumo curto (um parágrafo) e envolvente em Português para o livro "${title}" de ${author}. Não dê spoilers.`;

    try {
      const response = await generateContentWithFallback(ai, {
        contents: prompt,
      });
      res.json({ text: response.text });
    } catch (error: any) {
      const status = error.status || (error.message?.includes('429') ? 429 : (error.message?.includes('503') ? 503 : 500));
      const code = status === 429 ? "LIMIT_EXCEEDED" : (status === 503 ? "SERVICE_UNAVAILABLE" : "INTEGRATION_ERROR");
      const safeMsg = status === 429 
        ? "Limite de requisições excedido. Tente novamente mais tarde." 
        : (status === 503 ? "O modelo de IA está com alta demanda no momento." : "Erro ao gerar resumo do livro.");
      throw new AppError(status, code, safeMsg, error.message);
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
        timeout: 180000
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
      const status = error.status || (error.message?.includes('429') ? 429 : (error.message?.includes('503') ? 503 : 500));
      const code = status === 429 ? "LIMIT_EXCEEDED" : (status === 503 ? "SERVICE_UNAVAILABLE" : "INTEGRATION_ERROR");
      const safeMsg = status === 429 
        ? "Limite de requisições excedido. Tente novamente mais tarde." 
        : (status === 503 ? "O modelo de IA está temporariamente indisponível." : "Erro ao obter recomendações.");
      throw new AppError(status, code, safeMsg, error.message);
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
  if (serverConfig.env !== "produção") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
