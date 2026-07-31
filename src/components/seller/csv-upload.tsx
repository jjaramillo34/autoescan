"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { importPartsCsvAction } from "@/lib/actions/parts";
import { CSV_TEMPLATE_CONTENT } from "@/lib/csv";

export function CsvUpload() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE_CONTENT], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-repuestos-autoescan.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setCsvText(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Archivo no válido", {
        description: "Sube un archivo .csv",
      });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result));
    reader.readAsText(file, "UTF-8");
  }

  function onImport() {
    if (!csvText) {
      toast.error("Selecciona un archivo CSV primero");
      return;
    }

    startTransition(async () => {
      const result = await importPartsCsvAction(csvText);
      if (!result.ok) {
        toast.error("Error al importar", {
          description: result.error,
        });
        if (result.rowErrors?.length) {
          console.warn(result.rowErrors);
        }
        return;
      }

      toast.success(`${result.count} fila(s) procesadas`, {
        description: result.warnings?.length
          ? result.warnings.slice(0, 2).join(" ")
          : `${result.created} nuevos · ${result.updated} actualizados por código.`,
      });
      router.push("/vendedor/inventario");
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="font-medium">Plantilla CSV oficial</p>
            <p className="text-sm text-muted-foreground">
              Si el CSV trae <span className="font-mono">codigo</span> ya
              publicado, actualiza stock/precio en lugar de duplicar.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full gap-2"
          onClick={downloadTemplate}
        >
          <Download className="size-4" />
          Descargar plantilla
        </Button>
      </div>

      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-card/50 px-4 py-8 text-center transition-colors hover:border-primary/50">
        <Upload className="size-7 text-primary" />
        <span className="font-medium">
          {fileName ? fileName : "Selecciona tu archivo CSV"}
        </span>
        <span className="text-xs text-muted-foreground">
          Columnas: titulo, descripcion, marca, modelo, anios, categoria,
          precio, cantidad, sector, imagen_url
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={onFileChange}
        />
      </label>

      <Button
        type="button"
        className="w-full"
        size="lg"
        disabled={!csvText || pending}
        onClick={onImport}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Importando...
          </>
        ) : (
          "Importar productos"
        )}
      </Button>
    </div>
  );
}
