
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ 
        model: modelName || 'gemini-3-flash-preview', 
        contents: prompt,
        config: { systemInstruction } 
      });
      res.json(response);
    } catch (error: any) {
      console.error('AI Error:', error);
      res.status(500).json({ error: error.message || 'Error generating content' });
    }
  });

  app.post("/api/generate-summary", async (req, res) => {
    try {
      const { title, author } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Escreva um resumo curto (um parágrafo) e envolvente em Português para o livro "${title}" de ${author}. Não dê spoilers.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Summary Error:', error);
      res.status(500).json({ error: error.message || 'Error generating summary' });
    }
  });

  app.post("/api/get-recommendations", async (req, res) => {
    try {
      const { context, responseSchema } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Aja como um bibliotecário especialista e curador literário. 
        ${context}
        Com base no perfil psicológico e literário extraído desse histórico, recomende exatamente 3 livros novos em Português.
        Para cada livro, forneça um motivo curto e convincente da recomendação, mencionando por que ele se alinha aos livros que o usuário avaliou com notas altas.
        Gere um link de busca na Amazon Brasil (https://www.amazon.com.br/s?k=NOME+DO+LIVRO) para o campo buyLink.
        Responda estritamente em JSON seguindo o esquema fornecido.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Recommendations Error:', error);
      res.status(500).json({ error: error.message || 'Error generating recommendations' });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
