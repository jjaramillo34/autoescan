import bcrypt from "bcryptjs";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User, type IUserWithPassword } from "@/lib/models/User";
import {
  createDemoUser,
  findDemoUserByEmail,
  type DemoAuthUser,
} from "@/lib/demo-users";
import { PLANS } from "@/lib/plans";

export interface AuthUserDTO {
  id: string;
  name: string;
  email: string;
  role: "comprador" | "vendedor" | "admin";
  phone: string;
  storeName: string;
  city: string;
  province: string;
}

function mapDemo(user: DemoAuthUser): AuthUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    storeName: user.storeName,
    city: user.city,
    province: user.province,
  };
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthUserDTO | null> {
  const normalized = email.toLowerCase().trim();

  if (!isDatabaseConfigured()) {
    const demo = findDemoUserByEmail(normalized);
    if (!demo) return null;
    const ok = await bcrypt.compare(password, demo.passwordHash);
    return ok ? mapDemo(demo) : null;
  }

  await connectDB();
  const user = (await User.findOne({ email: normalized })
    .select("+passwordHash")
    .lean()) as IUserWithPassword | null;

  if (!user?.passwordHash) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as AuthUserDTO["role"],
    phone: user.phone,
    storeName: user.storeName ?? "",
    city: user.city ?? "Ambato",
    province: user.province ?? "Tungurahua",
  };
}

export interface RegisterSellerInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  storeName: string;
  city?: string;
  province?: string;
}

export interface RegisterBuyerInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  city?: string;
}

export async function registerBuyer(
  input: RegisterBuyerInput,
): Promise<{ ok: true; user: AuthUserDTO } | { ok: false; error: string }> {
  const email = input.email.toLowerCase().trim();
  const phone = input.phone.trim();
  const name = input.name.trim();

  if (!name) return { ok: false, error: "El nombre es obligatorio." };
  if (!/^\+593\d{9}$/.test(phone)) {
    return {
      ok: false,
      error: "El celular debe tener formato +593XXXXXXXXX (9 dígitos).",
    };
  }
  if (input.password.length < 8) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  if (!isDatabaseConfigured()) {
    try {
      const user = createDemoUser({
        name,
        email,
        password: input.password,
        role: "comprador",
        phone,
        city: input.city?.trim() || "Ambato",
        province: "Tungurahua",
        storeName: name,
      });
      return { ok: true, user: mapDemo(user) };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo registrar la cuenta.",
      };
    }
  }

  try {
    await connectDB();
    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return { ok: false, error: "Ya existe una cuenta con este correo." };
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const created = await User.create({
      name,
      email,
      passwordHash,
      role: "comprador",
      phone,
      city: input.city?.trim() || "Ambato",
      province: "Tungurahua",
      storeName: name,
      storeStatus: "active",
      planId: "basico",
      billingStatus: "active",
      productLimit: 0,
      aiCreditsIncluded: 0,
    });

    return {
      ok: true,
      user: {
        id: String(created._id),
        name: created.name,
        email: created.email,
        role: "comprador",
        phone: created.phone,
        storeName: created.storeName ?? "",
        city: created.city ?? "Ambato",
        province: created.province ?? "Tungurahua",
      },
    };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "No se pudo registrar. Intenta de nuevo." };
  }
}

export async function registerSeller(
  input: RegisterSellerInput,
): Promise<{ ok: true; user: AuthUserDTO } | { ok: false; error: string }> {
  const email = input.email.toLowerCase().trim();
  const phone = input.phone.trim();

  if (!/^\+593\d{9}$/.test(phone)) {
    return {
      ok: false,
      error: "El WhatsApp debe tener formato +593XXXXXXXXX (9 dígitos).",
    };
  }

  if (input.password.length < 8) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  if (!input.storeName.trim()) {
    return { ok: false, error: "El nombre de la tienda es obligatorio." };
  }

  if (!isDatabaseConfigured()) {
    try {
      const user = createDemoUser({
        name: input.name.trim(),
        email,
        password: input.password,
        role: "vendedor",
        phone,
        city: input.city?.trim() || "Ambato",
        province: input.province?.trim() || "Tungurahua",
        storeName: input.storeName.trim(),
      });
      return { ok: true, user: mapDemo(user) };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo registrar la cuenta.",
      };
    }
  }

  try {
    await connectDB();
    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return { ok: false, error: "Ya existe una cuenta con este correo." };
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 14); // trial 14 días
    const created = await User.create({
      name: input.name.trim(),
      email,
      passwordHash,
      role: "vendedor",
      phone,
      city: input.city?.trim() || "Ambato",
      province: input.province?.trim() || "Tungurahua",
      storeName: input.storeName.trim(),
      storeStatus: "pending",
      planId: "basico",
      billingStatus: "trial",
      currentPeriodEnd: periodEnd,
      productLimit: 50,
      aiCreditsIncluded: PLANS.basico.aiCreditsMonthly,
      aiCreditsUsed: 0,
      aiCreditsExtra: 0,
    });

    return {
      ok: true,
      user: {
        id: String(created._id),
        name: created.name,
        email: created.email,
        role: "vendedor",
        phone: created.phone,
        storeName: created.storeName ?? "",
        city: created.city ?? "Ambato",
        province: created.province ?? "Tungurahua",
      },
    };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "No se pudo registrar. Intenta de nuevo." };
  }
}
