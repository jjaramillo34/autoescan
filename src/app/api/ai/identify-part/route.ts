import { NextResponse } from "next/server";
import { identifyPartFromImage } from "@/lib/gemini";
import { checkAiRateLimit, logAiUsage, trackAnalyticsEvent } from "@/lib/tracking";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const sessionId = request.headers.get("x-session-id") || "";

  try {
    const rate = await checkAiRateLimit(ip, sessionId);
    if (!rate.allowed) {
      return NextResponse.json({ error: rate.error }, { status: 429 });
    }

    const contentType = request.headers.get("content-type") || "";

    let base64 = "";
    let mimeType = "image/jpeg";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        imageBase64?: string;
        mimeType?: string;
      };

      if (!body.imageBase64) {
        return NextResponse.json(
          { error: "Debes enviar la imagen en base64 (imageBase64)." },
          { status: 400 },
        );
      }

      const dataUrlMatch = body.imageBase64.match(
        /^data:([^;]+);base64,(.+)$/,
      );
      if (dataUrlMatch) {
        mimeType = dataUrlMatch[1];
        base64 = dataUrlMatch[2];
      } else {
        base64 = body.imageBase64;
        mimeType = body.mimeType || "image/jpeg";
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Debes adjuntar un archivo de imagen (campo: image)." },
          { status: 400 },
        );
      }

      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { error: "La imagen no puede superar los 8 MB." },
          { status: 400 },
        );
      }

      mimeType = file.type || "image/jpeg";
      const buffer = Buffer.from(await file.arrayBuffer());
      base64 = buffer.toString("base64");
    } else {
      return NextResponse.json(
        {
          error:
            "Content-Type no soportado. Usa multipart/form-data o application/json.",
        },
        { status: 415 },
      );
    }

    const result = await identifyPartFromImage(base64, mimeType);

    await logAiUsage({
      ipHash: rate.ipHash,
      sessionId,
      success: true,
      pieza: result.pieza,
      categoria: result.categoria,
    });

    await trackAnalyticsEvent({
      type: "ai_search",
      query: [result.pieza, ...result.keywords].join(" "),
    });

    return NextResponse.json({
      ok: true,
      ...result,
      demo: !process.env.GOOGLE_GEMINI_API_KEY,
    });
  } catch (error) {
    console.error("Error en identify-part:", error);
    try {
      const rate = await checkAiRateLimit(ip, sessionId);
      await logAiUsage({
        ipHash: rate.ipHash,
        sessionId,
        success: false,
      });
    } catch {
      /* ignore secondary log errors */
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo identificar la pieza. Intenta con otra foto.",
      },
      { status: 500 },
    );
  }
}
