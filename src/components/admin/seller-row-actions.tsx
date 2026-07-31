"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  updateSellerAdminAction,
  simulatePastDueWebhookAction,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminSellerRow } from "@/lib/admin/demo-admin";
import { useState } from "react";

export function SellerRowActions({ seller }: { seller: AdminSellerRow }) {
  const [pending, startTransition] = useTransition();
  const [storeStatus, setStoreStatus] = useState(seller.storeStatus);
  const [planId, setPlanId] = useState(seller.planId);
  const [billingStatus, setBillingStatus] = useState(seller.billingStatus);

  function save() {
    const fd = new FormData();
    fd.set("id", seller.id);
    fd.set("storeStatus", storeStatus);
    fd.set("planId", planId);
    fd.set("billingStatus", billingStatus);
    startTransition(async () => {
      const res = await updateSellerAdminAction(fd);
      if (res.ok) toast.success("Vendedor actualizado");
      else toast.error(res.error);
    });
  }

  function pastDue() {
    const fd = new FormData();
    fd.set("sellerId", seller.id);
    startTransition(async () => {
      await simulatePastDueWebhookAction(fd);
      toast.message("Webhook simulado", {
        description: "Tienda pausada por falta de pago.",
      });
    });
  }

  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      <Select
        value={storeStatus}
        onValueChange={(v) => setStoreStatus((v as typeof storeStatus) ?? storeStatus)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pendiente</SelectItem>
          <SelectItem value="active">Activa</SelectItem>
          <SelectItem value="paused">Pausada</SelectItem>
          <SelectItem value="banned">Baneada</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={planId}
        onValueChange={(v) => setPlanId((v as typeof planId) ?? planId)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="basico">Básico</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="empresa">Empresa</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={billingStatus}
        onValueChange={(v) =>
          setBillingStatus((v as typeof billingStatus) ?? billingStatus)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="trial">Trial</SelectItem>
          <SelectItem value="active">Pagado</SelectItem>
          <SelectItem value="past_due">Vencido</SelectItem>
          <SelectItem value="canceled">Cancelado</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending}>
          Guardar
        </Button>
        <Button size="sm" variant="outline" onClick={pastDue} disabled={pending}>
          Simular no-pago
        </Button>
      </div>
    </div>
  );
}
