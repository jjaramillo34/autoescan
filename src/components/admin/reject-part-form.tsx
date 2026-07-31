"use client";

import { useState, useTransition } from "react";
import { moderatePartAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RejectPartForm({ partId }: { partId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        type="button"
        onClick={() => setOpen(true)}
      >
        Rechazar
      </Button>
    );
  }

  return (
    <form
      className="flex min-w-[200px] flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("id", partId);
        fd.set("status", "rejected");
        fd.set("moderationReason", reason.trim());
        startTransition(async () => {
          await moderatePartAction(fd);
          setOpen(false);
          setReason("");
        });
      }}
    >
      <Input
        name="moderationReason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (ej. foto borrosa)"
        required
        maxLength={200}
        className="h-8 text-xs"
      />
      <div className="flex gap-1">
        <Button size="sm" type="submit" variant="destructive" disabled={pending}>
          Confirmar
        </Button>
        <Button
          size="sm"
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
