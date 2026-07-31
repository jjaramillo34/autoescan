"use client";

import { getOrCreateClientSessionId } from "@/lib/client-session";
import type { PartDTO } from "@/lib/types";

export async function trackWhatsAppClick(part: PartDTO) {
  const sellerId =
    typeof part.seller === "string" ? part.seller : part.seller?._id;
  const sessionId = getOrCreateClientSessionId();

  try {
    await fetch("/api/analytics/whatsapp-click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({
        partId: part._id,
        sellerId,
        query: part.title,
        brand: part.brand,
        model: part.model,
        location: part.location,
        sessionId,
      }),
    });
  } catch {
    /* analytics no debe romper el flujo */
  }
}
