"use server";

import { revalidatePath } from "next/cache";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Part } from "@/lib/models/Part";
import { demoModeration } from "@/lib/admin/demo-admin";
import {
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  type ReportReason,
} from "@/lib/report-reasons";

export async function reportPartAction(input: {
  partId: string;
  reason: string;
  detail?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const partId = input.partId?.trim();
  const reason = input.reason as ReportReason;
  if (!partId) return { ok: false, error: "Falta el producto." };
  if (!REPORT_REASONS.includes(reason)) {
    return { ok: false, error: "Selecciona un motivo válido." };
  }

  const detail = (input.detail ?? "").trim().slice(0, 280);
  const reportReason = detail
    ? `${REPORT_REASON_LABELS[reason]}: ${detail}`
    : REPORT_REASON_LABELS[reason];

  if (!isDatabaseConfigured()) {
    const existing = demoModeration.find((m) => m.id === partId);
    if (existing) {
      existing.moderationStatus = "reported";
      existing.reportReason = reportReason;
    } else {
      demoModeration.unshift({
        id: partId,
        title: "Producto reportado",
        price: 0,
        brand: "—",
        model: "—",
        storeName: "Tienda",
        moderationStatus: "reported",
        reportReason,
        isFeatured: false,
        images: 0,
      });
    }
    revalidatePath("/admin/moderacion");
    revalidatePath(`/repuesto/${partId}`);
    return { ok: true };
  }

  try {
    await connectDB();
    const updated = await Part.findByIdAndUpdate(partId, {
      moderationStatus: "reported",
      reportReason,
    });
    if (!updated) return { ok: false, error: "Producto no encontrado." };
    revalidatePath("/admin/moderacion");
    revalidatePath("/admin/analytics");
    revalidatePath(`/repuesto/${partId}`);
    return { ok: true };
  } catch (error) {
    console.error("Error reportando producto:", error);
    return { ok: false, error: "No se pudo enviar el reporte." };
  }
}
