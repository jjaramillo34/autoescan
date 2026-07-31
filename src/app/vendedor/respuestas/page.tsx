import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppTemplatesPanel } from "@/components/seller/whatsapp-templates-panel";
import { getSellerPartsForTemplates } from "@/lib/seller-templates";
import { requireSellerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Respuestas WhatsApp",
  description: "Plantillas rápidas para contestar consultas de compradores.",
};

export default async function SellerRepliesPage() {
  const session = await requireSellerSession();
  if (!session) {
    redirect("/iniciar-sesion?callbackUrl=/vendedor/respuestas");
  }

  const data = await getSellerPartsForTemplates(session.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-10">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 gap-1.5">
          <Link href="/vendedor">
            <ArrowLeft className="size-4" />
            Panel
          </Link>
        </Button>
        <h1 className="font-heading text-3xl tracking-wide">
          Respuestas WhatsApp
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Copia una respuesta lista y pégala en el chat del comprador. Ahorra
          tiempo en horarios pico.
        </p>
      </div>

      <WhatsAppTemplatesPanel
        storeName={data.storeName}
        products={data.products}
      />
    </div>
  );
}
