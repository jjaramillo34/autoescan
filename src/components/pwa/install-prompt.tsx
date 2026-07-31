"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "autoescan:pwa-dismiss";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div className="fixed inset-x-3 bottom-[4.5rem] z-50 mx-auto max-w-md rounded-xl border border-border/70 bg-card/95 p-3 shadow-lg backdrop-blur-md md:bottom-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Download className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Instalar AutoEscán</p>
          <p className="text-xs text-muted-foreground">
            Acceso rápido al catálogo de Ambato, como una app.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-8"
              onClick={async () => {
                await deferred.prompt();
                await deferred.userChoice;
                setVisible(false);
                setDeferred(null);
              }}
            >
              Instalar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                localStorage.setItem(DISMISS_KEY, "1");
                setVisible(false);
              }}
            >
              Ahora no
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setVisible(false);
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
