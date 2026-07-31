"use client";

import { useEffect, useRef } from "react";

interface TrackStoreViewProps {
  sellerId: string;
  storeName?: string;
  location?: string;
}

export function TrackStoreView({
  sellerId,
  storeName,
  location,
}: TrackStoreViewProps) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !sellerId) return;
    sent.current = true;
    void fetch("/api/analytics/store-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId,
        location,
        query: storeName,
      }),
      keepalive: true,
    });
  }, [sellerId, storeName, location]);

  return null;
}
