import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Registro de vendedor",
  description:
    "Crea tu cuenta de vendedor para publicar repuestos en AutoEscán Ambato.",
};

export default function RegistroVendedorPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Únete al piloto
        </p>
        <h1 className="font-heading text-3xl tracking-wide">
          Registro de vendedor
        </h1>
        <p className="text-sm text-muted-foreground">
          Publica tu inventario en Ambato y recibe consultas por WhatsApp.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
