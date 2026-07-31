/** Cliente browser para subir imágenes al folder ImageKit /autoescan. */

export async function uploadImageFromUrl(sourceUrl: string): Promise<string> {
  const res = await fetch("/api/images/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceUrl }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "No se pudo subir la imagen");
  }
  return data.url;
}

export async function uploadImageFromDataUrl(
  dataUrl: string,
  fileName?: string,
): Promise<string> {
  const res = await fetch("/api/images/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, fileName }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "No se pudo subir la imagen");
  }
  return data.url;
}

export async function uploadImageFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/images/upload", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "No se pudo subir la imagen");
  }
  return data.url;
}
