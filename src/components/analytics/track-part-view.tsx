"use client";

import { useEffect, useRef } from "react";

interface TrackPartViewProps {
  partId: string;
  sellerId?: string;
  title?: string;
  brand?: string;
  model?: string;
  year?: string;
  location?: string;
}

/** Dispara una sola vista de producto por montaje (detalle). */
export function TrackPartView({
  partId,
  sellerId,
  title,
  brand,
  model,
  year,
  location,
}: TrackPartViewProps) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !partId) return;
    sent.current = true;
    void fetch("/api/analytics/part-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partId,
        sellerId,
        query: title,
        brand,
        model,
        year,
        location,
      }),
      keepalive: true,
    });
  }, [partId, sellerId, title, brand, model, year, location]);

  return null;
}
