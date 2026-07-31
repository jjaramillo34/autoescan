"use server";

import { revalidatePath } from "next/cache";
import { dismissSellerStockAlert } from "@/lib/stock-alerts";
import { requireSellerSession } from "@/lib/session";

export async function dismissStockAlertAction() {
  const session = await requireSellerSession();
  if (!session) return { ok: false as const };
  await dismissSellerStockAlert(session.user.id);
  revalidatePath("/vendedor");
  return { ok: true as const };
}
