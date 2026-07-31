"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageSearchPicker } from "@/components/seller/image-search-picker";
import {
  createPartAction,
  generateDescriptionAction,
} from "@/lib/actions/parts";
import {
  CATEGORIAS,
  MARCAS_COMUNES,
  MARCAS_REPUESTO,
  MAX_PART_IMAGES,
  SECTORES_AMBATO,
} from "@/lib/constants";
import { uploadImageFile } from "@/lib/upload-client";

export function NewPartForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [yearRange, setYearRange] = useState("");
  const [category, setCategory] = useState("");
  const [partBrand, setPartBrand] = useState("");
  const [partCode, setPartCode] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const suggestedQuery = useMemo(
    () =>
      [title, partCode, partBrand, brand, model].filter(Boolean).join(" ").trim(),
    [title, partCode, partBrand, brand, model],
  );

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const slots = MAX_PART_IMAGES - images.length;
    if (slots <= 0) {
      toast.message(`Máximo ${MAX_PART_IMAGES} fotos`);
      e.target.value = "";
      return;
    }

    const toUpload = files.slice(0, slots);
    const toastId = toast.loading(
      `Subiendo ${toUpload.length} foto(s) a ImageKit…`,
    );

    Promise.all(toUpload.map((file) => uploadImageFile(file)))
      .then((urls) => {
        setImages((prev) => [...prev, ...urls].slice(0, MAX_PART_IMAGES));
        toast.success("Fotos listas en ImageKit", { id: toastId });
      })
      .catch((error) =>
        toast.error("No se pudo subir la foto", {
          id: toastId,
          description:
            error instanceof Error ? error.message : "Revisa ImageKit",
        }),
      )
      .finally(() => {
        e.target.value = "";
      });
  }

  async function onGenerateDescription() {
    if (!title.trim() || !brand) {
      toast.error("Completa título y marca del auto primero");
      return;
    }
    setGenerating(true);
    try {
      const result = await generateDescriptionAction({
        title,
        brand,
        model,
        yearRange: yearRange || "—",
        category: category || "Otro",
        partBrand,
        partCode,
      });
      if (result.ok) {
        setDescription(result.description);
        toast.success("Descripción generada con IA");
      } else {
        toast.error(result.error);
      }
    } finally {
      setGenerating(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (!brand || !category || !location) {
      toast.error("Completa marca del auto, categoría y sector");
      return;
    }

    const price = Number(form.get("price"));
    const stockQuantity = Number(form.get("stockQuantity"));

    startTransition(async () => {
      const result = await createPartAction({
        title,
        description,
        brand,
        model,
        yearRange,
        category,
        partBrand,
        partCode,
        price,
        stockQuantity,
        location,
        images: images.slice(0, MAX_PART_IMAGES),
      });

      if (result.ok) {
        toast.success("Repuesto publicado", {
          description: `${result.part.title}${
            result.part.partCode ? ` · ${result.part.partCode}` : ""
          } ya está en tu inventario.`,
        });
        router.push("/vendedor/inventario");
      } else {
        toast.error("No se pudo publicar", { description: result.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Nombre / Título</Label>
        <Input
          id="title"
          name="title"
          placeholder="Ej. Pastillas de freno delanteras"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="partCode">Código genérico / OEM</Label>
          <Input
            id="partCode"
            name="partCode"
            placeholder="Ej. GDB1330, 90915-YZZD3"
            value={partCode}
            onChange={(e) => setPartCode(e.target.value.toUpperCase())}
            className="font-mono tracking-wide"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Marca del repuesto</Label>
          <Select
            value={partBrand || undefined}
            onValueChange={(v) => setPartBrand(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ej. Bosch, TRW…" />
            </SelectTrigger>
            <SelectContent>
              {MARCAS_REPUESTO.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Marca del auto</Label>
          <Select value={brand} onValueChange={(v) => setBrand(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona marca" />
            </SelectTrigger>
            <SelectContent>
              {MARCAS_COMUNES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model">Modelo</Label>
          <Input
            id="model"
            name="model"
            placeholder="Ej. Aveo"
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">Subir fotos propias</Label>
        <label
          htmlFor="photo"
          className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border/80 bg-card/50 transition-colors hover:border-primary/50"
        >
          <Camera className="size-7 text-primary" />
          <span className="px-4 text-center text-sm text-muted-foreground">
            Toma o sube hasta {MAX_PART_IMAGES} fotos
            {images.length > 0 ? ` (${images.length} ya listas)` : ""}
          </span>
        </label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={onFileChange}
        />
      </div>

      <ImageSearchPicker
        value={images}
        onChange={setImages}
        suggestedQuery={suggestedQuery}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="yearRange">Años compatibles</Label>
          <Input
            id="yearRange"
            name="yearRange"
            placeholder="2015-2020"
            required
            value={yearRange}
            onChange={(e) => setYearRange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="price">Precio (USD)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
            inputMode="decimal"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stockQuantity">Cantidad</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            step="1"
            defaultValue={1}
            required
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Sector de Ambato</Label>
        <Select value={location} onValueChange={(v) => setLocation(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="¿Dónde está el local?" />
          </SelectTrigger>
          <SelectContent>
            {SECTORES_AMBATO.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="description">Descripción</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => void onGenerateDescription()}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5 text-primary" />
            )}
            Generar con IA
          </Button>
        </div>
        <Textarea
          id="description"
          name="description"
          placeholder="Opcional: si la dejas vacía, la IA la crea al publicar…"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          Si no escribes descripción, Gemini genera una al publicar.
        </p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Publicando...
          </>
        ) : (
          "Publicar repuesto"
        )}
      </Button>
    </form>
  );
}
