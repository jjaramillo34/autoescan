"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Camera, ExternalLink, Loader2 } from "lucide-react";
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
import { updateStoreProfileAction } from "@/lib/actions/store-profile";
import {
  ESPECIALIZACIONES,
  SECTORES_AMBATO,
} from "@/lib/constants";
import { uploadImageFile } from "@/lib/upload-client";
import type { SellerInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StoreProfileFormProps {
  profile: SellerInfo;
}

export function StoreProfileForm({ profile }: StoreProfileFormProps) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [storeName, setStoreName] = useState(profile.storeName ?? "");
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [whatsappPhone, setWhatsappPhone] = useState(
    profile.whatsappPhone || profile.phone,
  );
  const [storeLogo, setStoreLogo] = useState(profile.storeLogo ?? "");
  const [storeDescription, setStoreDescription] = useState(
    profile.storeDescription ?? "",
  );
  const [specializations, setSpecializations] = useState<string[]>(
    profile.storeSpecializations ?? [],
  );
  const [storeSector, setStoreSector] = useState(profile.storeSector ?? "");
  const [businessHours, setBusinessHours] = useState(
    profile.businessHours ?? "",
  );

  function toggleSpec(spec: string) {
    setSpecializations((prev) =>
      prev.includes(spec)
        ? prev.filter((s) => s !== spec)
        : prev.length >= 6
          ? prev
          : [...prev, spec],
    );
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading("Subiendo logo a ImageKit…");
    try {
      const url = await uploadImageFile(file);
      setStoreLogo(url);
      toast.success("Logo listo", { id: toastId });
    } catch (error) {
      toast.error("No se pudo subir el logo", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "Revisa ImageKit",
      });
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateStoreProfileAction({
        storeName,
        name,
        phone,
        whatsappPhone,
        storeLogo,
        storeDescription,
        storeSpecializations: specializations,
        storeSector,
        businessHours,
        city: profile.city ?? "Ambato",
        province: profile.province ?? "Tungurahua",
      });
      if (result.ok) {
        toast.success("Perfil de tienda guardado", {
          description: "Sigue con el checklist del panel si aún faltan pasos.",
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <div
        id="logo"
        className="flex scroll-mt-24 flex-col gap-4 rounded-xl border border-border/60 bg-card/50 p-4 sm:flex-row sm:items-center"
      >
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-primary/15">
          {storeLogo ? (
            <Image
              src={storeLogo}
              alt={storeName || "Logo"}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <div className="flex size-full items-center justify-center font-heading text-2xl text-primary">
              {(storeName || "T").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium">Logo de la tienda</p>
          <p className="text-xs text-muted-foreground">
            Se muestra en el directorio y en tu ficha pública.
          </p>
          <div className="flex flex-wrap gap-2">
            <label
              className={cn(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted",
                (uploading || pending) && "pointer-events-none opacity-50",
              )}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Camera className="size-3.5" />
              )}
              {storeLogo ? "Cambiar logo" : "Subir logo"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading || pending}
                onChange={(e) => void onLogoChange(e)}
              />
            </label>
            {storeLogo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStoreLogo("")}
              >
                Quitar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="storeName">Nombre de la tienda</Label>
          <Input
            id="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre de contacto</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div id="sector" className="scroll-mt-24 space-y-1.5">
          <Label htmlFor="storeSector">Sector</Label>
          <Select value={storeSector || undefined} onValueChange={setStoreSector}>
            <SelectTrigger id="storeSector">
              <SelectValue placeholder="Sector en Ambato" />
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
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+5939XXXXXXXX"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            placeholder="+5939XXXXXXXX"
          />
        </div>
        <div id="horario" className="scroll-mt-24 space-y-1.5 sm:col-span-2">
          <Label htmlFor="hours">Horario</Label>
          <Input
            id="hours"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
            placeholder="Lun–Sáb 8:30–18:30"
          />
        </div>
      </div>

      <div id="descripcion" className="scroll-mt-24 space-y-1.5">
        <Label htmlFor="desc">Descripción de la tienda</Label>
        <Textarea
          id="desc"
          rows={4}
          value={storeDescription}
          onChange={(e) => setStoreDescription(e.target.value)}
          placeholder="Cuéntale a los compradores en qué se especializa tu local…"
        />
      </div>

      <div id="especializacion" className="scroll-mt-24 space-y-2">
        <Label>Especialización (máx. 6)</Label>
        <div className="flex flex-wrap gap-2">
          {ESPECIALIZACIONES.map((spec) => {
            const active = specializations.includes(spec);
            return (
              <button
                key={spec}
                type="button"
                onClick={() => toggleSpec(spec)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/70 text-muted-foreground hover:border-primary/40",
                )}
              >
                {spec}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button asChild type="button" variant="outline" className="gap-1.5">
          <Link href={`/tienda/${profile._id}`} target="_blank">
            <ExternalLink className="size-4" />
            Ver tienda pública
          </Link>
        </Button>
        <Button type="submit" disabled={pending || uploading}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando…
            </>
          ) : (
            "Guardar perfil"
          )}
        </Button>
      </div>
    </form>
  );
}
