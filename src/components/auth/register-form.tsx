"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { registerSellerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await registerSellerAction(formData);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if ("redirectTo" in result && result.redirectTo) {
          toast.success("Cuenta creada", {
            description: "Completa el checklist para activar tu tienda.",
          });
          router.push(result.redirectTo);
          router.refresh();
        }
      } catch {
        setError("No se pudo registrar. Intenta de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre completo</Label>
        <Input id="name" name="name" required placeholder="Carlos Mendoza" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="storeName">Nombre de la tienda</Label>
        <Input
          id="storeName"
          name="storeName"
          required
          placeholder="Repuestos Ambato Center"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@tienda.ec"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">WhatsApp (+593)</Label>
        <Input
          id="phone"
          name="phone"
          required
          placeholder="+593987654321"
          pattern="^\+593\d{9}$"
          title="Formato: +593 seguido de 9 dígitos"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" name="city" defaultValue="Ambato" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="province">Provincia</Label>
          <Input id="province" name="province" defaultValue="Tungurahua" />
        </div>
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
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Al crear la cuenta aceptas los{" "}
        <Link href="/terminos" className="text-primary hover:underline">
          Términos
        </Link>{" "}
        y la{" "}
        <Link href="/privacidad" className="text-primary hover:underline">
          Privacidad
        </Link>
        .
      </p>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          "Crear cuenta de vendedor"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/iniciar-sesion"
          className="font-medium text-primary hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
