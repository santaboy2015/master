
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "./constants";

export class LoveAIService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;
  private currentInstruction: string = SYSTEM_INSTRUCTION;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.initChat(SYSTEM_INSTRUCTION);
  }

  private initChat(instruction: string) {
    this.currentInstruction = instruction;
    this.chat = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: instruction,
        temperature: 0.8,
        topP: 0.9,
        topK: 40
      }
    });
  }

  async setSystemInstruction(instruction: string) {
    if (this.currentInstruction !== instruction) {
      this.initChat(instruction);
    }
  }

  async sendMessageStream(
    message: string, 
    onChunk: (chunk: string) => void, 
    imageParts: { data: string, mimeType: string }[] = []
  ) {
    try {
      if (!this.chat) this.initChat(this.currentInstruction);
      
      const parts: Part[] = [{ text: message }];
      
      imageParts.forEach(img => {
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType
          }
        });
      });

      // chat.sendMessageStream only accepts the 'message' parameter. 
      // 'message' can be a string or an array of Parts.
      const result = await this.chat!.sendMessageStream({ 
        message: parts.length === 1 ? message : (parts as any)
      });

      for await (const chunk of result) {
        const responseChunk = chunk as GenerateContentResponse;
        if (responseChunk.text) {
          onChunk(responseChunk.text);
        }
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async generateWithCustomPrompt(prompt: string, instruction: string, onChunk: (chunk: string) => void) {
    // One-off generation for specific tasks like Bio Generation with its own system prompt
    const result = await this.ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: instruction,
        temperature: 0.7
      }
    });

    for await (const chunk of result) {
      if (chunk.text) onChunk(chunk.text);
    }
  }
}

export const loveAI = new LoveAIService();
