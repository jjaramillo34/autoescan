"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PartDTO } from "@/lib/types";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M14 8.5V6.8c0-.7.1-1.1 1.1-1.1H17V3h-2.3C11.9 3 11 4.5 11 6.6V8.5H9v2.7h2V21h3v-9.8h2.3l.4-2.7H14z" />
    </svg>
  );
}

interface SharePartProps {
  part: PartDTO;
}

export function SharePart({ part }: SharePartProps) {
  const [copied, setCopied] = useState(false);

  function getUrl() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/repuesto/${part._id}`;
  }

  const text = `${part.title} — ${part.brand} ${part.model} (${part.yearRange}) por $${part.price.toFixed(2)} en AutoEscán · Ambato`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      toast.success("Enlace copiado", {
        description: "Pégalo en Instagram, WhatsApp o Facebook.",
      });
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
        /* canceló */
      }
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
  }

  function shareFacebook() {
    const url = encodeURIComponent(getUrl());
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "noopener,noreferrer,width=600,height=480",
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Compartir
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={shareNative}
        >
          <Share2 className="size-3.5" />
          WhatsApp / más
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={shareFacebook}
        >
          <FacebookIcon className="size-3.5" />
          Facebook
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="col-span-2 gap-1.5 sm:col-span-1"
          onClick={copyLink}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copiado" : "Copiar (Instagram)"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Instagram no abre el enlace solo: copia y pégalo en tu historia o bio.
        La vista previa usa la foto y el título del repuesto.
      </p>
    </div>
  );
}
