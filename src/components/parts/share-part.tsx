"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PartDTO } from "@/lib/types";

interface SharePartProps {
  part: PartDTO;
}

export function SharePart({ part }: SharePartProps) {
  const [copied, setCopied] = useState(false);

  function getUrl() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/repuesto/${part._id}`;
  }

  const text = `${part.title} — ${part.brand} ${part.model} (${part.yearRange}) por $${part.price.toFixed(2)} en AutoEscán`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      toast.success("Enlace copiado");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  async function shareNative() {
    const url = getUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: part.title, text, url });
        return;
      } catch {
        // usuario canceló o no soportado → WhatsApp
      }
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1 gap-1.5"
        onClick={shareNative}
      >
        <Share2 className="size-3.5" />
        Compartir
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1 gap-1.5"
        onClick={copyLink}
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-600" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? "Copiado" : "Copiar enlace"}
      </Button>
    </div>
  );
}
