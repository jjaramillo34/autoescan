"use client";

import Link from "next/link";
import { useTransition } from "react";
import { AlertTriangle, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dismissStockAlertAction } from "@/lib/actions/stock-alerts";
import type { StockAlertDigest } from "@/lib/stock-alerts";

interface StockAlertBannerProps {
  digest: StockAlertDigest;
}

export function StockAlertBanner({ digest }: StockAlertBannerProps) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" />
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-wide">
              Alerta de stock del día
            </h2>
            <p className="text-sm text-muted-foreground">
              {digest.lowStockCount} con pocas unidades
              {digest.outOfStockCount > 0
                ? ` · ${digest.outOfStockCount} agotado${digest.outOfStockCount === 1 ? "" : "s"}`
                : ""}
              . Envía el recordatorio a tu WhatsApp o revisa el inventario.
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {digest.items.slice(0, 4).map((i) => (
                <li key={i._id} className="flex justify-between gap-3">
                  <span className="truncate">{i.title}</span>
                  <span className="shrink-0 tabular-nums text-amber-800 dark:text-amber-200">
                    {i.stockQuantity} und.
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                className="gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe57]"
              >
                <a href={digest.waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-3.5" />
                  Enviar a mi WhatsApp
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/vendedor/inventario">Ver inventario</Link>
              </Button>
            </div>
          </div>
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={pending}
          aria-label="Descartar alerta"
          onClick={() => {
            startTransition(async () => {
              await dismissStockAlertAction();
            });
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
    </section>
  );
}
