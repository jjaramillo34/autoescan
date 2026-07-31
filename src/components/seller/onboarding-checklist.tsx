"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingStatus } from "@/lib/seller-onboarding";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "autoescan-onboarding-dismissed";

interface OnboardingChecklistProps {
  status: OnboardingStatus;
  /** Si true, muestra versión expandida (bienvenida). */
  welcome?: boolean;
}

export function OnboardingChecklist({
  status,
  welcome = false,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  if (status.isComplete) return null;
  if (!ready) return null;
  if (dismissed && !welcome) {
    return (
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.removeItem(DISMISS_KEY);
          } catch {
            /* ignore */
          }
          setDismissed(false);
        }}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-left text-sm transition-colors hover:bg-primary/10"
      >
        <span>
          Configuración de tienda:{" "}
          <strong>
            {status.completed}/{status.total}
          </strong>{" "}
          · {status.percent}%
        </span>
        <span className="text-primary">Continuar</span>
      </button>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/35 bg-gradient-to-br from-primary/15 via-card to-card p-4 sm:p-5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Rocket className="size-5" />
          </div>
          <div>
            <h2 className="font-heading text-xl tracking-wide">
              {welcome ? "¡Bienvenido a AutoEscán!" : "Completa tu tienda"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {welcome
                ? "En unos minutos tu local queda listo para recibir consultas."
                : `${status.completed} de ${status.total} pasos listos.`}
            </p>
          </div>
        </div>
        {!welcome && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Ocultar por ahora"
            onClick={() => {
              try {
                localStorage.setItem(DISMISS_KEY, "1");
              } catch {
                /* ignore */
              }
              setDismissed(true);
            }}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${status.percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{status.percent}% completado</p>

      <ul className="mt-4 space-y-2">
        {status.steps.map((step, index) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                step.done
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-border/60 bg-background/60 hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs",
                  step.done
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "border-border text-muted-foreground",
                )}
              >
                {step.done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    step.done && "text-muted-foreground line-through",
                  )}
                >
                  {step.title}
                </span>
                {!step.done && (
                  <span className="block text-xs text-muted-foreground">
                    {step.detail}
                  </span>
                )}
              </span>
              {!step.done && (
                <ChevronRight className="size-4 shrink-0 text-primary" />
              )}
            </Link>
          </li>
        ))}
      </ul>

      {status.nextStep && (
        <Button asChild className="mt-4 w-full gap-1.5 sm:w-auto">
          <Link href={status.nextStep.href}>
            Siguiente: {status.nextStep.title}
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      )}
    </section>
  );
}
