"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { simulatePayAction } from "@/lib/actions/billing";

export function SimulatePayButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await simulatePayAction(paymentId);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success("Pago simulado");
          router.refresh();
        });
      }}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      Simular pago (dev)
    </Button>
  );
}
