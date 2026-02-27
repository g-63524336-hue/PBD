import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseStudentList(fileData: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Extract a list of student names from this file. Return as a JSON array of strings." },
          { inlineData: { data: fileData, mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

export async function parseDSKP(fileData: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Extract Standard Kandungan (SK) and Standard Pembelajaran (SP) from this DSKP document. Return as a JSON array of objects with 'sk' and 'sp' fields." },
          { inlineData: { data: fileData, mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sk: { type: Type.STRING },
            sp: { type: Type.STRING }
          },
          required: ["sk", "sp"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}
