"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { PartDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BotonWhatsAppProps {
  part: PartDTO;
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function BotonWhatsApp({
  part,
  className,
  size = "default",
}: BotonWhatsAppProps) {
  const href = buildWhatsAppUrl(part);
  const disabled = part.stockQuantity <= 0;
  const sellerId =
    typeof part.seller === "string" ? part.seller : part.seller?._id;

  return (
    <Button
      asChild
      size={size}
      disabled={disabled}
      className={cn(
        "w-full gap-2 bg-[#25D366] text-white hover:bg-[#1ebe57] disabled:opacity-50",
        className,
      )}
    >
      <a
        href={disabled ? undefined : href}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={disabled}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          void fetch("/api/analytics/whatsapp-click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              partId: part._id,
              sellerId,
              query: part.title,
              brand: part.brand,
              model: part.model,
              location: part.location,
            }),
          });
        }}
      >
        <MessageCircle className="size-4" />
        {disabled ? "Sin stock" : "Consultar por WhatsApp"}
      </a>
    </Button>
  );
}
