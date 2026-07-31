import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PartNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="font-heading text-3xl tracking-wide">
        Repuesto no encontrado
      </h1>
      <p className="text-sm text-muted-foreground">
        Puede haberse agotado o el enlace ya no es válido.
      </p>
      <Button asChild>
        <Link href="/#catalogo">Volver al catálogo</Link>
      </Button>
    </div>
  );
}
