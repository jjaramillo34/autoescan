"use client";

import { useState, useTransition } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportPartAction } from "@/lib/actions/report-part";
import { getReportReasonOptions } from "@/lib/report-reasons";

interface ReportPartButtonProps {
  partId: string;
  partTitle: string;
}

export function ReportPartButton({ partId, partTitle }: ReportPartButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("precio_absurdo");
  const [detail, setDetail] = useState("");
  const [pending, startTransition] = useTransition();
  const options = getReportReasonOptions();

  function onSubmit() {
    startTransition(async () => {
      const res = await reportPartAction({ partId, reason, detail });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Reporte enviado", {
        description: "El equipo de AutoEscán lo revisará.",
      });
      setOpen(false);
      setDetail("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto gap-1.5 px-0 text-xs text-muted-foreground hover:text-foreground"
        >
          <Flag className="size-3.5" />
          Reportar publicación
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar publicación</DialogTitle>
          <DialogDescription>
            ¿Hay un problema con &ldquo;{partTitle}&rdquo;? Tu reporte ayuda a
            mantener el catálogo limpio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Detalle (opcional)</Label>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Ej. el precio no coincide con el mercado / la foto es de otro producto"
              rows={3}
              maxLength={280}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Enviar reporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
