import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Acceso a AutoEscán para compradores, vendedores y admin.",
};

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function IniciarSesionPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Zona segura
        </p>
        <h1 className="font-heading text-3xl tracking-wide">
          Iniciar sesión
        </h1>
        <p className="text-sm text-muted-foreground">
          Compradores: favoritos sincronizados. Vendedores: inventario y
          panel.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm">
        <LoginForm callbackUrl={params.callbackUrl} />
      </div>
    </div>
  );
}
