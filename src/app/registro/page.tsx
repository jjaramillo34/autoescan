import type { Metadata } from "next";
import Link from "next/link";
import { RegisterBuyerForm } from "@/components/auth/register-buyer-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Guarda favoritos y retoma tus búsquedas de repuestos en Ambato.",
};

export default function RegistroCompradorPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Compradores
        </p>
        <h1 className="font-heading text-3xl tracking-wide">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Sincroniza tus favoritos entre dispositivos. El contacto con la tienda
          sigue siendo por WhatsApp.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm">
        <RegisterBuyerForm />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/iniciar-sesion?callbackUrl=/guardados"
          className="font-medium text-primary hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
