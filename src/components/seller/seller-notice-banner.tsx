"use client";

import { useTransition } from "react";
import { CheckCircle2, X } from "lucide-react";
import { dismissSellerNoticeAction } from "@/lib/actions/seller-notice";
import { Button } from "@/components/ui/button";

const COPY: Record<string, { title: string; body: string; tone: string }> = {
  approved: {
    title: "¡Tu tienda fue aprobada!",
    body: "Ya aparece en el directorio y el catálogo público de AutoEscán.",
    tone: "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  },
  paused: {
    title: "Tu tienda fue pausada",
    body: "No aparece en el catálogo hasta que un admin la reactive.",
    tone: "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  },
  rejected: {
    title: "Tu tienda fue rechazada",
    body: "Revisa tu perfil y contacta a soporte para volver a solicitar aprobación.",
    tone: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200",
  },
};

export function SellerNoticeBanner({ notice }: { notice?: string | null }) {
  const [pending, startTransition] = useTransition();
  if (!notice || !COPY[notice]) return null;
  const copy = COPY[notice];

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${copy.tone}`}
    >
      <div className="flex gap-2">
        {notice === "approved" && (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        )}
        <div>
          <p className="font-medium">{copy.title}</p>
          <p className="mt-0.5 opacity-90">{copy.body}</p>
        </div>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-8 shrink-0"
        disabled={pending}
        aria-label="Cerrar aviso"
        onClick={() => startTransition(() => dismissSellerNoticeAction())}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
