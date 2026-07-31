"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
        Algo falló
      </p>
      <h1 className="font-heading text-3xl tracking-wide">
        No pudimos cargar esta página
      </h1>
      <p className="text-sm text-muted-foreground">
        Puede ser un fallo temporal de red o del servidor. Intenta de nuevo.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Reintentar
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
