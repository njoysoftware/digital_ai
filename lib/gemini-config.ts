

import { GoogleGenAI } from "@google/genai";
const Key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
//console.log("Cek API Key:", Key ? "Terdeteksi" : "KOSONG");

if (!Key) {
  // Memberikan pesan yang jelas jika lupa setting .env
  throw new Error("API KEY tidak ditemukan");
}


// Ekspor instance AI sebagai objek (Boleh dilakukan karena tidak ada "use server")
export const ai = new GoogleGenAI({apiKey: Key});
