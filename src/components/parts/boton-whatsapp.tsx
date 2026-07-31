"use client";

import Link from "next/link";
import { MessageCircle, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFavoritesUserId } from "@/components/favorites/favorites-user";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { trackWhatsAppClick } from "@/lib/track-whatsapp-click";
import {
  dismissWhatsAppSoftPrompt,
  isWhatsAppLoginRequired,
  loginUrlForWhatsApp,
  registerUrlForWhatsApp,
  shouldShowWhatsAppSoftPrompt,
} from "@/lib/whatsapp-gate";
import type { PartDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BotonWhatsAppProps {
  part: PartDTO;
  className?: string;
  size?: "default" | "sm" | "lg";
  /** Texto del botón cuando WA está disponible. */
  label?: string;
}

function showSoftPrompt(partId: string) {
  if (!shouldShowWhatsAppSoftPrompt()) return;

  toast("Guarda esta consulta", {
    description:
      "Crea una cuenta gratis para retomar favoritos y seguir tus piezas.",
    duration: 9000,
    action: {
      label: "Crear cuenta",
      onClick: () => {
        dismissWhatsAppSoftPrompt(30);
        window.location.href = registerUrlForWhatsApp(partId);
      },
    },
    cancel: {
      label: "Ahora no",
      onClick: () => dismissWhatsAppSoftPrompt(7),
    },
  });
}

export function BotonWhatsApp({
  part,
  className,
  size = "default",
  label = "Consultar por WhatsApp",
}: BotonWhatsAppProps) {
  const userId = useFavoritesUserId();
  const href = buildWhatsAppUrl(part);
  const outOfStock = part.stockQuantity <= 0;
  const requireLogin = isWhatsAppLoginRequired();
  const locked = requireLogin && !userId;

  if (outOfStock) {
    return (
      <Button
        size={size}
        disabled
        className={cn("w-full gap-2", className)}
      >
        Sin stock
      </Button>
    );
  }

  if (locked) {
    return (
      <Button
        asChild
        size={size}
        className={cn(
          "w-full gap-2 bg-[#25D366]/90 text-white hover:bg-[#1ebe57]",
          className,
        )}
      >
        <Link href={loginUrlForWhatsApp(part._id)}>
          <LogIn className="size-4" />
          Inicia sesión para WhatsApp
        </Link>
      </Button>
    );
  }

  return (
    <Button
      asChild
      size={size}
      className={cn(
        "w-full gap-2 bg-[#25D366] text-white hover:bg-[#1ebe57]",
        className,
      )}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          void trackWhatsAppClick(part);
          if (!userId) showSoftPrompt(part._id);
        }}
      >
        <MessageCircle className="size-4" />
        {label}
      </a>
    </Button>
  );
}
