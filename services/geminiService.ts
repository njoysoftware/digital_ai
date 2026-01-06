"use server";
import { Modality } from "@google/genai";
import { BAWASLU_SYSTEM_PROMPT } from "@/constants";
import {ai} from "@/lib/gemini-config";

export const getGeminiResponse = async (
  prompt: string, 
  history: 
  { 
    role: string, 
    parts: {text: string}[]
  }[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: BAWASLU_SYSTEM_PROMPT,
        temperature: 0.2,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Maaf, terjadi kesalahan teknis. Silakan coba beberapa saat lagi.";
  }
};

export const getGeminiTTS = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Bacakan dengan nada formal dan ramah: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

