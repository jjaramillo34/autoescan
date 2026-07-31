"use server";

import { revalidatePath } from "next/cache";
import { requireSellerSession } from "@/lib/session";
import {
  getSellerProfile,
  updateSellerProfile,
  type StoreProfileInput,
} from "@/lib/seller-profile";

export async function getMyStoreProfileAction() {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }
  const profile = await getSellerProfile(session.user.id);
  if (!profile) {
    return { ok: false as const, error: "No se encontró tu perfil." };
  }
  return { ok: true as const, profile };
}

export async function updateStoreProfileAction(input: StoreProfileInput) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }

  try {
    const profile = await updateSellerProfile(session.user.id, input);
    if (!profile) {
      return { ok: false as const, error: "No se pudo actualizar el perfil." };
    }

    revalidatePath("/vendedor/perfil");
    revalidatePath("/tiendas");
    revalidatePath(`/tienda/${session.user.id}`);
    revalidatePath("/");

    return { ok: true as const, profile };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar el perfil.",
    };
  }
}
