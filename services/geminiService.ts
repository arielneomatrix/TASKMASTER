
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { decodeBase64, decodeAudioData } from "./audioUtils";
import { AiTaskResponse, Task } from "../types";

// Helper to get client securely using the hard-coded requirement for process.env.API_KEY
const getAiClient = () => {
  // Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) as per guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 1. Generate Auto-Title from Description (Spanish Prompt)
export const generateTitleFromDescription = async (description: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Genera un título muy corto y conciso (máximo 5 palabras) en Español para una tarea con esta descripción: "${description}". Devuelve SOLAMENTE el texto del título.`,
    });
    return response.text?.trim() || "Nueva Tarea";
  } catch (error) {
    console.error("Error generating title:", error);
    return "Nueva Tarea";
  }
};

// 2. Transcribe Audio and Extract Task Details (Spanish Context)
export const transcribeAndExtractTask = async (audioBase64: string): Promise<AiTaskResponse> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: audioBase64
            }
          },
          {
            text: `Escucha este audio. Es un usuario dictando una tarea en Español. 
            Extrae la siguiente información en formato JSON:
            - title: Un título resumido en Español.
            - description: La transcripción completa de lo que dijo en Español.
            - time: Si se menciona una hora (ej. "a las 5pm"), formatéala como HH:mm (24h). Si no, null.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            time: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    });

    // Access response.text directly (not as a method)
    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No response text");
    return JSON.parse(jsonStr) as AiTaskResponse;

  } catch (error) {
    console.error("Error transcribing:", error);
    throw error;
  }
};

// 3. Text-to-Speech (TTS) - Play a summary
export const playAudioSummary = async (text: string): Promise<void> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, assistant-like voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decodeBase64(base64Audio),
      audioContext,
      24000,
      1
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

// 4. "What's New" Summary Generator (Spanish Prompt)
export const generateDailySummary = async (tasks: Task[], dateContext: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const taskList = tasks.map(t => `- [${t.time || 'Todo el día'}] ${t.title}: ${t.description}`).join('\n');
    
    const prompt = `
      Eres un asistente personal útil llamado Jarvis. Hablas Español.
      Hoy es ${dateContext}.
      Aquí están las tareas del usuario para hoy:
      ${taskList}
      
      Por favor, escribe un resumen hablado amigable, conciso y motivador del día en Español.
      Menciona qué tan ocupado está el día y resalta los elementos más importantes (inferidos de la descripción).
      Manténlo en menos de 100 palabras.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No pude generar un resumen para hoy.";
  } catch (error) {
    console.error("Summary Gen Error:", error);
    return "Tengo problemas para conectar con mi cerebro en este momento.";
  }
};
