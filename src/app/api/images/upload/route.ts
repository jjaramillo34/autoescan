import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/session";
import {
  isAlreadyOnImageKit,
  isImageKitConfigured,
  uploadToImageKit,
} from "@/lib/imagekit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await requireSellerSession();
  if (!session) {
    return NextResponse.json(
      { error: "Debes iniciar sesión como vendedor." },
      { status: 401 },
    );
  }

  if (!isImageKitConfigured()) {
    return NextResponse.json(
      {
        error:
          "ImageKit no está configurado. Agrega IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY y IMAGEKIT_URL_ENDPOINT en .env.local.",
      },
      { status: 500 },
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Debes enviar un archivo en el campo file." },
          { status: 400 },
        );
      }
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Solo se permiten imágenes." },
          { status: 400 },
        );
      }
      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { error: "La imagen no puede superar 8 MB." },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadToImageKit({
        file: buffer,
        fileName: file.name || "repuesto.jpg",
        tags: ["autoescan", "upload", session.user.id],
      });

      return NextResponse.json(uploaded);
    }

    const body = (await request.json()) as {
      sourceUrl?: string;
      fileName?: string;
      dataUrl?: string;
    };

    if (body.sourceUrl?.startsWith("http")) {
      if (isAlreadyOnImageKit(body.sourceUrl)) {
        return NextResponse.json({
          url: body.sourceUrl,
          fileId: "",
          name: "existing",
          folder: "/autoescan",
        });
      }

      const uploaded = await uploadToImageKit({
        file: body.sourceUrl,
        fileName: body.fileName || "busqueda-web.jpg",
        tags: ["autoescan", "web-search", session.user.id],
      });
      return NextResponse.json(uploaded);
    }

    if (body.dataUrl?.startsWith("data:image/")) {
      const uploaded = await uploadToImageKit({
        file: body.dataUrl,
        fileName: body.fileName || "camara.jpg",
        tags: ["autoescan", "camera", session.user.id],
      });
      return NextResponse.json(uploaded);
    }

    return NextResponse.json(
      { error: "Envía file (multipart), sourceUrl o dataUrl." },
      { status: 400 },
    );
  } catch (error) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo subir la imagen a ImageKit.",
      },
      { status: 500 },
    );
  }
}
