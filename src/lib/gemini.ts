import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IdentifyPartResult } from "@/lib/types";

const DEFAULT_MODEL = "gemini-2.5-flash";

const PROMPT = `Analiza esta imagen de una pieza automotriz. Identifica el nombre de la pieza en español, la categoría probable, palabras clave, un nivel de confianza (0-100) y hasta 3 alternativas si hay duda.

Responde únicamente en formato JSON válido:
{ "pieza": string, "categoria": string, "keywords": [string], "confianza": number, "alternativas": [string] }

Categorías posibles: Motor, Suspensión, Frenos, Eléctrico, Carrocería, Transmisión, Otro.
Las keywords y alternativas deben estar en español y ser útiles para buscar en un marketplace de repuestos en Ecuador (Ambato).`;

function extractJson(text: string): IdentifyPartResult {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("La IA no devolvió un JSON válido.");
  }

  const parsed = JSON.parse(match[0]) as Partial<IdentifyPartResult>;

  if (!parsed.pieza || !parsed.categoria || !Array.isArray(parsed.keywords)) {
    throw new Error("El JSON de la IA está incompleto.");
  }

  const confianzaRaw = Number(parsed.confianza);
  const confianza = Number.isFinite(confianzaRaw)
    ? Math.min(100, Math.max(0, Math.round(confianzaRaw)))
    : undefined;

  return {
    pieza: String(parsed.pieza),
    categoria: String(parsed.categoria),
    keywords: parsed.keywords.map(String),
    confianza,
    alternativas: Array.isArray(parsed.alternativas)
      ? parsed.alternativas.map(String).filter(Boolean).slice(0, 3)
      : [],
  };
}

export async function identifyPartFromImage(
  base64: string,
  mimeType: string,
): Promise<IdentifyPartResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    // Modo demo sin API key: respuesta simulada para desarrollo local.
    return {
      pieza: "Pastillas de freno",
      categoria: "Frenos",
      keywords: ["pastillas", "freno", "delanteras", "cerámica"],
      confianza: 72,
      alternativas: ["Pastillas de freno traseras", "Disco de freno"],
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
  });

  const result = await model.generateContent([
    { text: PROMPT },
    {
      inlineData: {
        data: base64,
        mimeType: mimeType || "image/jpeg",
      },
    },
  ]);

  const text = result.response.text();
  return extractJson(text);
}

export interface GenerateDescriptionInput {
  title: string;
  brand: string;
  model: string;
  yearRange: string;
  category: string;
  partBrand?: string;
  partCode?: string;
}

/** Genera una descripción corta de venta en español (Ecuador). */
export async function generatePartDescription(
  input: GenerateDescriptionInput,
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  const fallback = [
    `${input.title} para ${input.brand} ${input.model} (${input.yearRange}).`,
    input.partCode ? `Código: ${input.partCode}.` : "",
    input.partBrand ? `Marca del repuesto: ${input.partBrand}.` : "",
    "Consulta disponibilidad y precio por WhatsApp con el local en Ambato.",
  ]
    .filter(Boolean)
    .join(" ");

  if (!apiKey) return fallback;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
  });

  const prompt = `Escribe una descripción breve (2-3 oraciones, máximo 320 caracteres) en español de Ecuador para un anuncio de marketplace de repuestos en Ambato.

Datos:
- Pieza: ${input.title}
- Vehículo: ${input.brand} ${input.model} (${input.yearRange})
- Categoría: ${input.category}
- Marca del repuesto: ${input.partBrand || "no indicada"}
- Código genérico/OEM: ${input.partCode || "no indicado"}

Tono: claro, útil para el comprador, sin promesas falsas ni emojis. No uses comillas ni markdown. Solo el texto de la descripción.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/^["']|["']$/g, "");
    if (!text || text.length < 20) return fallback;
    return text.slice(0, 400);
  } catch (error) {
    console.error("Error generando descripción:", error);
    return fallback;
  }
}
