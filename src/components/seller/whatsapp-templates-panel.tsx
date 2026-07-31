"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WHATSAPP_TEMPLATES,
  fillWhatsAppTemplate,
  type TemplateProductOption,
  type WhatsAppTemplateId,
} from "@/lib/whatsapp-templates";

interface WhatsAppTemplatesPanelProps {
  storeName: string;
  products: TemplateProductOption[];
}

export function WhatsAppTemplatesPanel({
  storeName,
  products,
}: WhatsAppTemplatesPanelProps) {
  const [templateId, setTemplateId] =
    useState<WhatsAppTemplateId>("disponible");
  const [productId, setProductId] = useState<string>(products[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const template =
    WHATSAPP_TEMPLATES.find((t) => t.id === templateId) ??
    WHATSAPP_TEMPLATES[0];

  const text = fillWhatsAppTemplate(template, {
    title: product?.title,
    partCode: product?.partCode,
    price: product?.price,
    brand: product?.brand,
    model: product?.model,
    location: product?.location,
    storeName,
  });

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Respuesta copiada", {
        description: "Pégala en el chat de WhatsApp del comprador.",
      });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("No se pudo copiar. Selecciona el texto manualmente.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Plantilla</Label>
          <Select
            value={templateId}
            onValueChange={(v) => setTemplateId(v as WhatsAppTemplateId)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WHATSAPP_TEMPLATES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{template.description}</p>
        </div>

        <div className="space-y-2">
          <Label>Producto (opcional)</Label>
          <Select
            value={productId || "__none__"}
            onValueChange={(v) => setProductId(v === "__none__" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sin producto específico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin producto específico</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                  {p.partCode ? ` · ${p.partCode}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="size-4 text-[#25D366]" />
          Vista previa
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" className="gap-1.5" onClick={() => void copyText()}>
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copiado" : "Copiar respuesta"}
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {WHATSAPP_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplateId(t.id)}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              t.id === templateId
                ? "border-primary/50 bg-primary/10"
                : "border-border/50 hover:border-primary/30"
            }`}
          >
            <p className="font-medium">{t.label}</p>
            <p className="text-xs text-muted-foreground">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
