import type { Metadata } from "next";
import { NewPartForm } from "@/components/seller/new-part-form";
import { CsvUpload } from "@/components/seller/csv-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Cargar repuestos",
  description:
    "Publica repuestos uno a uno o importa tu inventario completo con una plantilla CSV.",
};

export default function NuevoRepuestoPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-lg space-y-2 text-center sm:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Carga de inventario
        </p>
        <h1 className="font-heading text-3xl tracking-wide">
          Publicar repuestos
        </h1>
        <p className="text-sm text-muted-foreground">
          Carga manual desde el celular o importa muchos productos con la
          plantilla CSV.
        </p>
      </div>

      <Tabs defaultValue="manual" className="mx-auto max-w-lg">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="csv">Plantilla CSV</TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className="mt-6">
          <NewPartForm />
        </TabsContent>
        <TabsContent value="csv" className="mt-6">
          <CsvUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}
