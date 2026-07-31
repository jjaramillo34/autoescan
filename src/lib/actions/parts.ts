"use server";

import { revalidatePath } from "next/cache";
import {
  countFeaturedParts,
  createPart,
  deletePart,
  duplicatePart,
  getSellerParts,
  setPartArchived,
  setPartFeatured,
  updatePart,
  updatePartInventory,
  upsertPartsForSeller,
  type CreatePartInput,
  type UpdatePartData,
} from "@/lib/parts-service";
import { parsePartsCsv } from "@/lib/csv";
import { MAX_PART_IMAGES } from "@/lib/constants";
import {
  assertCanConsumeAiCredit,
  consumeAiCredit,
} from "@/lib/ai-credits";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import { PLANS, type PlanId } from "@/lib/plans";
import { requireSellerSession } from "@/lib/session";
import {
  generatePartDescription,
  type GenerateDescriptionInput,
} from "@/lib/gemini";

function parseImagesJson(raw: FormDataEntryValue | null): string[] | undefined {
  if (raw == null) return undefined;
  try {
    const parsed = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      .map((u) => u.trim())
      .slice(0, MAX_PART_IMAGES);
  } catch {
    return [];
  }
}

export async function updateInventoryAction(formData: FormData) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }

  const id = String(formData.get("id") ?? "");
  const price = Number(formData.get("price"));
  const stockQuantity = Number(formData.get("stockQuantity"));
  const images = parseImagesJson(formData.get("imagesJson"));
  const partBrandRaw = formData.get("partBrand");
  const partCodeRaw = formData.get("partCode");
  const descriptionRaw = formData.get("description");
  const partBrand =
    partBrandRaw == null ? undefined : String(partBrandRaw);
  const partCode =
    partCodeRaw == null ? undefined : String(partCodeRaw);
  const description =
    descriptionRaw == null ? undefined : String(descriptionRaw);

  if (!id) {
    return { ok: false as const, error: "Falta el identificador del repuesto." };
  }

  if (Number.isNaN(price) || price < 0) {
    return { ok: false as const, error: "El precio debe ser un número válido." };
  }

  if (Number.isNaN(stockQuantity) || stockQuantity < 0) {
    return {
      ok: false as const,
      error: "La cantidad en inventario debe ser un número válido.",
    };
  }

  try {
    const updated = await updatePartInventory(
      id,
      {
        price,
        stockQuantity,
        ...(images !== undefined ? { images } : {}),
        ...(partBrand !== undefined ? { partBrand } : {}),
        ...(partCode !== undefined ? { partCode } : {}),
        ...(description !== undefined ? { description } : {}),
      },
      session.user.id,
    );
    if (!updated) {
      return {
        ok: false as const,
        error: "No se encontró el repuesto o no te pertenece.",
      };
    }

    revalidatePath("/vendedor/inventario");
    revalidatePath("/");
    return { ok: true as const, part: updated };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: "No se pudo actualizar el inventario. Intenta de nuevo.",
    };
  }
}

export async function createPartAction(input: CreatePartInput) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }

  try {
    if (!input.title?.trim()) {
      return { ok: false as const, error: "El título es obligatorio." };
    }
    if (!input.brand?.trim() || !input.model?.trim()) {
      return {
        ok: false as const,
        error: "Marca y modelo del vehículo son obligatorios.",
      };
    }
    if (Number.isNaN(input.price) || input.price < 0) {
      return { ok: false as const, error: "Precio inválido." };
    }
    if (Number.isNaN(input.stockQuantity) || input.stockQuantity < 0) {
      return { ok: false as const, error: "Cantidad inválida." };
    }

    let description = input.description?.trim() ?? "";
    if (!description) {
      const credit = await assertCanConsumeAiCredit(session.user.id);
      if (!credit.ok) {
        return { ok: false as const, error: credit.error };
      }
      description = await generatePartDescription({
        title: input.title,
        brand: input.brand,
        model: input.model,
        yearRange: input.yearRange,
        category: input.category,
        partBrand: input.partBrand,
        partCode: input.partCode,
      });
      const spent = await consumeAiCredit(session.user.id);
      if (!spent.ok) {
        return { ok: false as const, error: spent.error };
      }
    }

    const part = await createPart({
      ...input,
      description,
      partCode: input.partCode?.trim().toUpperCase(),
      partBrand: input.partBrand?.trim(),
      images: (input.images ?? []).slice(0, MAX_PART_IMAGES),
      sellerId: session.user.id,
    });
    revalidatePath("/vendedor/inventario");
    revalidatePath("/");
    return { ok: true as const, part };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: "No se pudo crear el repuesto. Revisa los datos e intenta de nuevo.",
    };
  }
}

export async function generateDescriptionAction(
  input: GenerateDescriptionInput,
) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }
  if (!input.title?.trim() || !input.brand?.trim()) {
    return {
      ok: false as const,
      error: "Completa al menos título y marca del vehículo.",
    };
  }
  try {
    const credit = await assertCanConsumeAiCredit(session.user.id);
    if (!credit.ok) {
      return { ok: false as const, error: credit.error };
    }
    const description = await generatePartDescription(input);
    const spent = await consumeAiCredit(session.user.id);
    if (!spent.ok) {
      return { ok: false as const, error: spent.error };
    }
    const remaining = Math.max(0, credit.credits.remaining - 1);
    const total = credit.credits.included + credit.credits.extra;
    const usedAfter = credit.credits.used + 1;
    const softWarned =
      total > 0 && usedAfter / total >= 0.9;
    return {
      ok: true as const,
      description,
      creditsRemaining: remaining,
      softWarned,
      depleted: remaining <= 0,
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: "No se pudo generar la descripción.",
    };
  }
}

export async function importPartsCsvAction(csvText: string) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }

  const parsed = parsePartsCsv(csvText);
  if (!parsed.ok) {
    return {
      ok: false as const,
      error: parsed.error,
      rowErrors: parsed.rowErrors,
    };
  }

  try {
    const enriched = [];
    for (const p of parsed.parts) {
      if (p.description?.trim()) {
        enriched.push(p);
        continue;
      }
      const credit = await assertCanConsumeAiCredit(session.user.id);
      if (!credit.ok) {
        // Sin créditos: deja descripción corta local, no llama Gemini.
        enriched.push({
          ...p,
          description: `${p.title} para ${p.brand} ${p.model} (${p.yearRange}).`,
        });
        continue;
      }
      const description = await generatePartDescription({
        title: p.title,
        brand: p.brand,
        model: p.model,
        yearRange: p.yearRange,
        category: p.category,
        partBrand: p.partBrand,
        partCode: p.partCode,
      });
      await consumeAiCredit(session.user.id);
      enriched.push({ ...p, description });
    }
    const { created, updated } = await upsertPartsForSeller(
      enriched,
      session.user.id,
    );
    revalidatePath("/vendedor/inventario");
    revalidatePath("/vendedor");
    revalidatePath("/");
    return {
      ok: true as const,
      count: created.length + updated.length,
      created: created.length,
      updated: updated.length,
      warnings: parsed.warnings,
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: "No se pudo importar el CSV. Intenta de nuevo.",
    };
  }
}

function revalidateSellerPaths(sellerId: string, partId?: string) {
  revalidatePath("/vendedor/inventario");
  revalidatePath("/");
  revalidatePath(`/tienda/${sellerId}`);
  if (partId) revalidatePath(`/repuesto/${partId}`);
}

export async function updatePartAction(id: string, input: UpdatePartData) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }
  if (!id) {
    return { ok: false as const, error: "Falta el identificador del repuesto." };
  }
  if (!input.title?.trim()) {
    return { ok: false as const, error: "El título es obligatorio." };
  }
  if (!input.brand?.trim() || !input.model?.trim()) {
    return {
      ok: false as const,
      error: "Marca y modelo del vehículo son obligatorios.",
    };
  }
  if (Number.isNaN(input.price) || input.price < 0) {
    return { ok: false as const, error: "Precio inválido." };
  }
  if (Number.isNaN(input.stockQuantity) || input.stockQuantity < 0) {
    return { ok: false as const, error: "Cantidad inválida." };
  }

  try {
    const part = await updatePart(
      id,
      {
        ...input,
        images: (input.images ?? []).slice(0, MAX_PART_IMAGES),
      },
      session.user.id,
    );
    if (!part) {
      return {
        ok: false as const,
        error: "No se encontró el repuesto o no te pertenece.",
      };
    }
    revalidateSellerPaths(session.user.id, id);
    return { ok: true as const, part };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: "No se pudo actualizar el repuesto.",
    };
  }
}

export async function archivePartAction(id: string, archived = true) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }
  try {
    const part = await setPartArchived(id, session.user.id, archived);
    if (!part) {
      return {
        ok: false as const,
        error: "No se encontró el repuesto o no te pertenece.",
      };
    }
    revalidateSellerPaths(session.user.id, id);
    return { ok: true as const, part };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: archived
        ? "No se pudo archivar el repuesto."
        : "No se pudo restaurar el repuesto.",
    };
  }
}

export async function deletePartAction(id: string) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }
  try {
    const ok = await deletePart(id, session.user.id);
    if (!ok) {
      return {
        ok: false as const,
        error: "No se encontró el repuesto o no te pertenece.",
      };
    }
    revalidateSellerPaths(session.user.id, id);
    return { ok: true as const };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: "No se pudo eliminar el repuesto.",
    };
  }
}

export async function duplicatePartAction(id: string) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }
  try {
    const part = await duplicatePart(id, session.user.id);
    if (!part) {
      return {
        ok: false as const,
        error: "No se encontró el repuesto o no te pertenece.",
      };
    }
    revalidateSellerPaths(session.user.id, part._id);
    return { ok: true as const, part };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: "No se pudo duplicar el repuesto.",
    };
  }
}

async function getSellerFeaturedSlots(sellerId: string): Promise<number> {
  if (!isDatabaseConfigured()) {
    return PLANS.pro.featuredSlots;
  }
  await connectDB();
  const user = await User.findById(sellerId).select("planId").lean();
  const planId = (user?.planId as PlanId) || "basico";
  return (PLANS[planId] ?? PLANS.basico).featuredSlots;
}

export async function toggleFeaturedPartAction(
  id: string,
  featured: boolean,
) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }

  try {
    const sellerParts = await getSellerParts(session.user.id);
    const existing = sellerParts.find((p) => p._id === id);
    if (!existing) {
      return {
        ok: false as const,
        error: "No se encontró el repuesto o no te pertenece.",
      };
    }

    if (featured && !existing.isFeatured) {
      const slots = await getSellerFeaturedSlots(session.user.id);
      if (slots <= 0) {
        return {
          ok: false as const,
          error:
            "Tu plan no incluye destacados. Mejora a Pro o Empresa para impulsar productos.",
        };
      }
      const used = await countFeaturedParts(session.user.id);
      if (used >= slots) {
        return {
          ok: false as const,
          error: `Alcanzaste el límite de ${slots} destacados de tu plan.`,
        };
      }
    }

    const part = await setPartFeatured(id, session.user.id, featured);
    if (!part) {
      return {
        ok: false as const,
        error: "No se encontró el repuesto o no te pertenece.",
      };
    }

    revalidateSellerPaths(session.user.id, id);
    revalidatePath("/vendedor");
    return { ok: true as const, part };
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: featured
        ? "No se pudo destacar el producto."
        : "No se pudo quitar el destacado.",
    };
  }
}
