"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  generateDescriptionAction,
  updatePartAction,
} from "@/lib/actions/parts";
import {
  CATEGORIAS,
  MARCAS_COMUNES,
  MARCAS_REPUESTO,
  MAX_PART_IMAGES,
  SECTORES_AMBATO,
} from "@/lib/constants";
import type { PartDTO } from "@/lib/types";

interface EditPartDialogProps {
  part: PartDTO;
}

export function EditPartDialog({ part }: EditPartDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);

  const [title, setTitle] = useState(part.title);
  const [brand, setBrand] = useState(part.brand);
  const [model, setModel] = useState(part.model);
  const [yearRange, setYearRange] = useState(part.yearRange);
  const [category, setCategory] = useState(String(part.category));
  const [partBrand, setPartBrand] = useState(part.partBrand ?? "");
  const [partCode, setPartCode] = useState(part.partCode ?? "");
  const [description, setDescription] = useState(part.description ?? "");
  const [price, setPrice] = useState(String(part.price));
  const [stockQuantity, setStockQuantity] = useState(
    String(part.stockQuantity),
  );
  const [location, setLocation] = useState(String(part.location));
  const [images, setImages] = useState(
    part.images.slice(0, MAX_PART_IMAGES),
  );

  const suggestedQuery = useMemo(
    () =>
      [title, partBrand, partCode, brand, model].filter(Boolean).join(" "),
    [title, partBrand, partCode, brand, model],
  );

  function resetFromPart() {
    setTitle(part.title);
    setBrand(part.brand);
    setModel(part.model);
    setYearRange(part.yearRange);
    setCategory(String(part.category));
    setPartBrand(part.partBrand ?? "");
    setPartCode(part.partCode ?? "");
    setDescription(part.description ?? "");
    setPrice(String(part.price));
    setStockQuantity(String(part.stockQuantity));
    setLocation(String(part.location));
    setImages(part.images.slice(0, MAX_PART_IMAGES));
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
        if (result.depleted) {
          toast.warning("Último crédito IA del mes usado.");
        } else if (result.softWarned) {
          toast.warning(
            `Cupo IA al límite (${result.creditsRemaining} restantes este mes).`,
          );
        } else {
          toast.success(
            `Descripción generada · ${result.creditsRemaining} créditos IA restantes`,
          );
        }
      } else {
        toast.error(result.error);
      }
    } finally {
      setGenerating(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brand || !category || !location) {
      toast.error("Completa marca del auto, categoría y sector");
      return;
    }

    startTransition(async () => {
      const result = await updatePartAction(part._id, {
        title,
        brand,
        model,
        yearRange,
        category,
        partBrand,
        partCode,
        description,
        price: Number(price),
        stockQuantity: Number(stockQuantity),
        location,
        images: images.slice(0, MAX_PART_IMAGES),
      });
      if (result.ok) {
        toast.success("Producto actualizado", {
          description: result.part.title,
        });
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetFromPart();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="size-3.5" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
          <DialogDescription>
            CRUD completo: datos, precio, stock, descripción y fotos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`title-${part._id}`}>Título</Label>
            <Input
              id={`title-${part._id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Marca del auto</Label>
              <Select value={brand || undefined} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Marca" />
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
              <Label htmlFor={`model-${part._id}`}>Modelo</Label>
              <Input
                id={`model-${part._id}`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`year-${part._id}`}>Años</Label>
              <Input
                id={`year-${part._id}`}
                value={yearRange}
                onChange={(e) => setYearRange(e.target.value)}
                placeholder="2015-2020"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select
                value={category || undefined}
                onValueChange={setCategory}
              >
                <SelectTrigger>
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
            <div className="space-y-1.5">
              <Label>Marca del repuesto</Label>
              <Select
                value={partBrand || undefined}
                onValueChange={setPartBrand}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fabricante" />
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
            <div className="space-y-1.5">
              <Label htmlFor={`code-${part._id}`}>Código / OEM</Label>
              <Input
                id={`code-${part._id}`}
                className="font-mono uppercase"
                value={partCode}
                onChange={(e) => setPartCode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`price-${part._id}`}>Precio (USD)</Label>
              <Input
                id={`price-${part._id}`}
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`stock-${part._id}`}>Stock</Label>
              <Input
                id={`stock-${part._id}`}
                type="number"
                min="0"
                step="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Sector</Label>
              <Select
                value={location || undefined}
                onValueChange={setLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sector" />
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
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`desc-${part._id}`}>Descripción</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => void onGenerateDescription()}
                disabled={generating || pending}
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
              id={`desc-${part._id}`}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <ImageSearchPicker
            value={images}
            onChange={setImages}
            suggestedQuery={suggestedQuery}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || generating}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
