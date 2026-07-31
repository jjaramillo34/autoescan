import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 30;

interface SearchImagesRequest {
  query: string;
  max_results?: number;
  region?: string;
  safesearch?: string;
  validate_images?: boolean;
}

interface ImageResult {
  url: string;
  title?: string;
  source?: string;
  width?: number;
  height?: number;
}

function normalizeImages(data: unknown, query: string): ImageResult[] {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray((data as { images?: unknown })?.images)
      ? (data as { images: unknown[] }).images
      : Array.isArray((data as { results?: unknown })?.results)
        ? (data as { results: unknown[] }).results
        : [];

  const images: ImageResult[] = [];
  for (const img of raw) {
    const item = img as Record<string, unknown>;
    const url = String(
      item.url || item.image_url || item.link || item.thumbnail || "",
    ).trim();
    if (!url.startsWith("http")) continue;
    images.push({
      url,
      title: String(item.title || query),
      source: "Búsqueda de imágenes",
      width: typeof item.width === "number" ? item.width : undefined,
      height: typeof item.height === "number" ? item.height : undefined,
    });
  }
  return images;
}

export async function POST(request: Request) {
  const session = await requireSellerSession();
  if (!session) {
    return NextResponse.json(
      { error: "Debes iniciar sesión como vendedor." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as SearchImagesRequest;
    const {
      query,
      max_results = 12,
      region = "ec-es",
      safesearch = "moderate",
      validate_images = true,
    } = body;

    const trimmed = query?.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "Escribe qué imagen buscas (ej. pastillas freno Chevrolet Aveo)." },
        { status: 400 },
      );
    }

    const fastApiKey = process.env.FAST_API_KEY;
    if (!fastApiKey) {
      return NextResponse.json(
        {
          error:
            "FAST_API_KEY no está configurada. Agrégala en .env.local para buscar fotos en internet.",
        },
        { status: 500 },
      );
    }

    const pythonApiUrl =
      process.env.IMAGE_SEARCH_API_URL ||
      "https://python-scripts-production-9406.up.railway.app/api/search";

    const response = await fetch(pythonApiUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": fastApiKey,
      },
      body: JSON.stringify({
        max_results: Math.min(Math.max(max_results, 1), 24),
        query: trimmed,
        region,
        safesearch,
        validate_images,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image search API error:", errorText);
      return NextResponse.json(
        {
          error: `Error del servicio de imágenes (${response.status}). Intenta de nuevo.`,
        },
        { status: response.status },
      );
    }

    const data: unknown = await response.json();
    const images = normalizeImages(data, trimmed);

    return NextResponse.json({ images, query: trimmed });
  } catch (error) {
    console.error("Error searching images:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron buscar imágenes.",
      },
      { status: 500 },
    );
  }
}
