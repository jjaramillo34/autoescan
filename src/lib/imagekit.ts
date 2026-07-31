import ImageKit, { toFile } from "@imagekit/nodejs";

export const IMAGEKIT_FOLDER = "/autoescan";

export function isImageKitConfigured(): boolean {
  return Boolean(
    process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.IMAGEKIT_PUBLIC_KEY &&
      process.env.IMAGEKIT_URL_ENDPOINT,
  );
}

export function getImageKitClient() {
  if (!isImageKitConfigured()) {
    throw new Error(
      "ImageKit no está configurado. Agrega IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY y IMAGEKIT_URL_ENDPOINT.",
    );
  }

  return new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  });
}

function slugFileName(name: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return `${base || "repuesto"}-${Date.now()}.jpg`;
}

export interface UploadImageResult {
  url: string;
  fileId: string;
  name: string;
  folder: string;
}

/**
 * Sube una imagen a ImageKit en /autoescan.
 * Acepta URL pública, data URL / base64, o buffer.
 */
export async function uploadToImageKit(input: {
  file: string | Buffer;
  fileName?: string;
  tags?: string[];
}): Promise<UploadImageResult> {
  const client = getImageKitClient();
  const fileName = slugFileName(input.fileName || "repuesto.jpg");

  const file =
    typeof input.file === "string"
      ? input.file
      : await toFile(input.file, fileName);

  const response = await client.files.upload({
    file,
    fileName,
    folder: IMAGEKIT_FOLDER,
    useUniqueFileName: true,
    tags: input.tags ?? ["autoescan", "repuesto"],
  });

  const url = response.url || response.thumbnailUrl;
  if (!url) {
    throw new Error("ImageKit no devolvió una URL de imagen.");
  }

  return {
    url,
    fileId: response.fileId || "",
    name: response.name || fileName,
    folder: IMAGEKIT_FOLDER,
  };
}

export function isAlreadyOnImageKit(url: string): boolean {
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT || "";
  if (!endpoint || !url.startsWith("http")) return false;
  try {
    const host = new URL(endpoint).hostname;
    return url.includes(host);
  } catch {
    return false;
  }
}
