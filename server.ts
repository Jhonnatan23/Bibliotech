
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { fetch as undiciFetch, Agent, setGlobalDispatcher } from "undici";
import nodemailer from "nodemailer";

// Configure custom timeouts on the global Node.js fetch dispatcher to avoid Headers Timeout Error
const globalAgent = new Agent({
  headersTimeout: 180000, // 3 minutes
  bodyTimeout: 180000,    // 3 minutes
  connectTimeout: 60000,  // 1 minute
});
setGlobalDispatcher(globalAgent);

// Override native fetch with the configured undici fetch
globalThis.fetch = undiciFetch as any;

async function generateContentWithFallback(
  ai: any,
  params: {
    contents: any;
    config?: any;
    model?: string;
  },
  fallbackModels: string[] = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ]
): Promise<any> {
  let lastError: any = null;
  const modelsToTry = [...fallbackModels];
  if (params.model && !modelsToTry.includes(params.model)) {
    modelsToTry.unshift(params.model);
  }

  for (const model of modelsToTry) {
    // Attempt up to 2 times per model with a slight delay if it is a 503/temporary error
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini API] Attempting generation with model: ${model} (attempt ${attempt}/2)`);
        const response = await ai.models.generateContent({
          ...params,
          model: model,
        });
        console.log(`[Gemini API] Generation succeeded using model: ${model}`);
        return response;
      } catch (err: any) {
        console.warn(`[Gemini API] Model ${model} attempt ${attempt} failed with message:`, err.message || err);
        lastError = err;
        
        // If it's a 503 (high demand) or rate limit, wait a brief moment before retrying or switching models
        const isTemporary = err.message?.includes("503") || err.message?.includes("RESOURCE_EXHAUSTED") || err.message?.includes("UNAVAILABLE") || err.message?.includes("high demand");
        if (isTemporary && attempt < 2) {
          console.log("[Gemini API] Temporary error detected, waiting 1.5 seconds before retrying...");
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
          break; // Switch to the next model immediately for non-temporary or final attempt errors
        }
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google Books API Proxy
  app.get("/api/search-books", async (req, res) => {
    try {
      const { q, isbn } = req.query;
      const apiKey = process.env.VITE_GOOGLE_BOOKS_API_KEY || process.env.GOOGLE_BOOKS_API_KEY;
      
      let url = "";
      if (isbn) {
        url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(String(isbn))}${apiKey ? `&key=${apiKey}` : ''}`;
      } else if (q) {
        url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(String(q))}&maxResults=20&printType=books${apiKey ? `&key=${apiKey}` : ''}`;
      } else {
        return res.status(400).json({ error: "Parâmetro 'q' ou 'isbn' é obrigatório." });
      }

      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: "Erro ao buscar na API do Google Books" });
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
    } catch (error: any) {
      console.error("Erro na busca de livros:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor" });
    }
  });

  // AI Insights Endpoint
  app.post("/api/ai-insights", async (req, res) => {
    try {
      const { booksList } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      
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
      console.error("AI Insights Error:", error);
      res.status(500).json({ error: error.message || "Erro interno ao gerar insights" });
    }
  });

  // Gemini API Proxy
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction, model: modelName } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { 
          headers: { 'User-Agent': 'aistudio-build' },
          timeout: 180000
        }
      });
      const response = await generateContentWithFallback(ai, { 
        model: modelName || 'gemini-3.5-flash', 
        contents: prompt,
        config: { systemInstruction } 
      });
      res.json(response);
    } catch (error: any) {
      const status = error.status || (error.message?.includes('429') ? 429 : (error.message?.includes('503') ? 503 : 500));
      if (status !== 429 && status !== 503) {
        console.error('AI Error:', error);
      }
      res.status(status).json({ 
        error: error.message || 'Error generating content',
        isQuotaExceeded: status === 429,
        isHighDemand: status === 503
      });
    }
  });

  app.post("/api/generate-summary", async (req, res) => {
    try {
      const { title, author } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { 
          headers: { 'User-Agent': 'aistudio-build' },
          timeout: 180000
        }
      });
      const prompt = `Escreva um resumo curto (um parágrafo) e envolvente em Português para o livro "${title}" de ${author}. Não dê spoilers.`;
      const response = await generateContentWithFallback(ai, {
        contents: prompt,
      });
      res.json({ text: response.text });
    } catch (error: any) {
      const status = error.status || (error.message?.includes('429') ? 429 : (error.message?.includes('503') ? 503 : 500));
      if (status !== 429 && status !== 503) {
        console.error('Summary Error:', error);
      }
      res.status(status).json({ 
        error: error.message || 'Error generating summary',
        isQuotaExceeded: status === 429,
        isHighDemand: status === 503
      });
    }
  });

  app.post("/api/get-recommendations", async (req, res) => {
    try {
      const { context, responseSchema } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
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
      if (status !== 429 && status !== 503) {
        console.error('Recommendations Error:', error);
      }
      res.status(status).json({ 
        error: error.message || 'Error generating recommendations',
        isQuotaExceeded: status === 429,
        isHighDemand: status === 503
      });
    }
  });

  // Real Email Dispatcher Endpoint
  app.post("/api/send-email", async (req: any, res: any) => {
    try {
      const { to, subject, html } = req.body;
      if (!to || !subject || !html) {
        return res.status(400).json({ error: "Parâmetros 'to', 'subject' e 'html' são obrigatórios." });
      }

      const emailUser = "asuabibliotecavirtualbibliotec@gmail.com";
      const emailPass = process.env.EMAIL_PASS;

      if (!emailPass) {
        console.warn(`[Email Service] EMAIL_PASS não configurada. Simulando envio com sucesso para: ${to}`);
        return res.json({ 
          success: true, 
          simulated: true, 
          message: "E-mail simulado com sucesso (configure a variável EMAIL_PASS no painel de controle do AI Studio para disparos reais)." 
        });
      }

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

      console.log(`[Email Service] E-mail real enviado com sucesso para ${to}. MessageId: ${info.messageId}`);
      res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error("[Email Service] Falha ao enviar e-mail real:", error);
      res.status(500).json({ error: error.message || "Falha ao enviar e-mail." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
