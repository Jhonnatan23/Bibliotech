
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Fixed: Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateBookSummary = async (title: string, author: string): Promise<string> => {
  if (!process.env.API_KEY) return "AI-powered summaries are currently unavailable.";
  try {
    const prompt = `Write a short, engaging, one-paragraph summary in Portuguese for the book titled "${title}" by ${author}. Do not include spoilers.`;
    // Fixed: Updated model to 'gemini-3-flash-preview' for text generation tasks.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fixed: Use .text property directly.
    return response.text || "Não foi possível gerar um resumo.";
  } catch (error) {
    console.error("Error generating book summary:", error);
    return "Erro ao gerar resumo. Tente novamente.";
  }
};

export const generateBookCover = async (title: string, genre: string, type: string): Promise<string> => {
  if (!process.env.API_KEY) return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
  try {
    const prompt = `Create a minimalist, abstract book cover for a ${type} titled "${title}" in the ${genre} genre. The style should be elegant and modern, focusing on symbolic imagery rather than literal depiction. High contrast, clean typography.`;
    
    // Fixed: Using gemini-2.5-flash-image for image generation tasks.
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
            imageConfig: {
                aspectRatio: "3:4"
            }
        }
    });

    // Fixed: Iterate through parts to find the image part.
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
              const base64EncodeString: string = part.inlineData.data;
              return `data:image/png;base64,${base64EncodeString}`;
          }
      }
    }
    
    // Fallback if no image part is found
    return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;

  } catch (error) {
    console.error("Error generating book cover:", error);
    return `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
  }
};
