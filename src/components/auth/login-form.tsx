"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({
  callbackUrl = "/",
}: LoginFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await loginAction(formData);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(result.redirectTo);
        router.refresh();
      } catch {
        setError("No se pudo iniciar sesión. Recarga la página e intenta de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@tienda.ec"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Ingresando...
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Buscas repuestos?{" "}
        <Link
          href="/registro"
          className="font-medium text-primary hover:underline"
        >
          Crear cuenta
        </Link>
        {" · "}
        <Link
          href="/registro-vendedor"
          className="font-medium text-primary hover:underline"
        >
          Soy vendedor
        </Link>
      </p>

      <div className="space-y-1 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <p>
          Vendedor: <code>vendedor@autoescan.ec</code> /{" "}
          <code>Vendedor123!</code>
        </p>
        <p>
          Admin: <code>admin@autoescan.ec</code> / <code>Admin123!</code>
        </p>
        <p>
          Comprador: <code>comprador@autoescan.ec</code> /{" "}
          <code>Comprador123!</code>
        </p>
      </div>
    </form>
  );
}
