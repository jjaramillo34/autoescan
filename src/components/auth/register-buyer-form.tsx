"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { registerBuyerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterBuyerForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await registerBuyerAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Tu nombre" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Celular / WhatsApp</Label>
        <Input
          id="phone"
          name="phone"
          required
          placeholder="+5939XXXXXXXX"
          pattern="^\+593\d{9}$"
        />
        <p className="text-xs text-muted-foreground">Formato +593 + 9 dígitos</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <input type="hidden" name="city" value="Ambato" />

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          "Crear cuenta gratis"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Tienes un local?{" "}
        <Link
          href="/registro-vendedor"
          className="font-medium text-primary hover:underline"
        >
          Regístrate como vendedor
        </Link>
      </p>
    </form>
  );
}
