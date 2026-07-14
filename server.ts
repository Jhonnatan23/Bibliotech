
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
      const response = await ai.models.generateContent({ 
        model: modelName || 'gemini-2.5-flash', 
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
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
