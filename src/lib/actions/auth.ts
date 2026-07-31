"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { registerSeller, verifyCredentials } from "@/lib/auth-users";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "");

  try {
    const user = await verifyCredentials(email, password);
    if (!user) {
      return { ok: false as const, error: "Correo o contraseña incorrectos." };
    }

    const defaultDest =
      user.role === "admin" ? "/admin" : "/vendedor";
    const redirectTo =
      callbackUrl &&
      ((user.role === "admin" && callbackUrl.startsWith("/admin")) ||
        (user.role !== "admin" && !callbackUrl.startsWith("/admin")))
        ? callbackUrl
        : defaultDest;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      return {
        ok: false as const,
        error: "Correo o contraseña incorrectos.",
      };
    }

    return { ok: true as const, redirectTo };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false as const,
        error: "Correo o contraseña incorrectos.",
      };
    }
    console.error("loginAction:", error);
    return {
      ok: false as const,
      error: "No se pudo iniciar sesión. Intenta de nuevo.",
    };
  }
}

export async function registerSellerAction(formData: FormData) {
  const result = await registerSeller({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    storeName: String(formData.get("storeName") ?? ""),
    city: String(formData.get("city") ?? "Ambato"),
    province: String(formData.get("province") ?? "Tungurahua"),
  });

  if (!result.ok) return result;

  try {
    const signInResult = await signIn("credentials", {
      email: result.user.email,
      password: String(formData.get("password") ?? ""),
      redirect: false,
    });

    if (!signInResult || signInResult.error) {
      return {
        ok: false as const,
        error:
          "Cuenta creada, pero no se pudo iniciar sesión. Intenta ingresar manualmente.",
      };
    }

    return { ok: true as const, redirectTo: "/vendedor?bienvenida=1" };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false as const,
        error:
          "Cuenta creada, pero no se pudo iniciar sesión. Intenta ingresar manualmente.",
      };
    }
    console.error("registerSellerAction:", error);
    return {
      ok: false as const,
      error:
        "Cuenta creada, pero no se pudo iniciar sesión. Intenta ingresar manualmente.",
    };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
