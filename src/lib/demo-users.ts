import bcrypt from "bcryptjs";
import { DEMO_SELLER_ID } from "@/lib/constants";

export interface DemoAuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "comprador" | "vendedor" | "admin";
  phone: string;
  whatsappPhone?: string;
  city: string;
  province: string;
  storeName: string;
  storeLogo?: string;
  storeDescription?: string;
  storeSpecializations?: string[];
  storeSector?: string;
  businessHours?: string;
}

const DEMO_PASSWORD_HASH = bcrypt.hashSync("Vendedor123!", 10);
const ADMIN_PASSWORD_HASH = bcrypt.hashSync("Admin123!", 10);
const BUYER_PASSWORD_HASH = bcrypt.hashSync("Comprador123!", 10);

let demoUsers: DemoAuthUser[] = [
  {
    id: "000000000000000000000099",
    name: "Super Admin",
    email: "admin@autoescan.ec",
    passwordHash: ADMIN_PASSWORD_HASH,
    role: "admin",
    phone: "+593999999999",
    city: "Ambato",
    province: "Tungurahua",
    storeName: "AutoEscán Admin",
  },
  {
    id: "000000000000000000000088",
    name: "Ana Compradora",
    email: "comprador@autoescan.ec",
    passwordHash: BUYER_PASSWORD_HASH,
    role: "comprador",
    phone: "+593991112233",
    city: "Ambato",
    province: "Tungurahua",
    storeName: "Ana Compradora",
  },
  {
    id: DEMO_SELLER_ID,
    name: "Carlos Mendoza",
    email: "vendedor@autoescan.ec",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "vendedor",
    phone: "+593987654321",
    whatsappPhone: "+593987654321",
    city: "Ambato",
    province: "Tungurahua",
    storeName: "Repuestos Ambato Center",
    storeDescription:
      "Local especializado en frenos, sensores y repuestos para autos japoneses y coreanos en el Centro de Ambato.",
    storeSpecializations: ["Frenos", "Motor y sensores", "Japoneses"],
    storeSector: "Centro de Ambato",
    businessHours: "Lun–Sáb 8:30–18:30",
  },
];

export function findDemoUserByEmail(email: string): DemoAuthUser | undefined {
  return demoUsers.find((u) => u.email === email.toLowerCase());
}

export function findDemoUserById(id: string): DemoAuthUser | undefined {
  return demoUsers.find((u) => u.id === id);
}

export function createDemoUser(
  input: Omit<DemoAuthUser, "id" | "passwordHash"> & { password: string },
): DemoAuthUser {
  if (findDemoUserByEmail(input.email)) {
    throw new Error("Ya existe una cuenta con este correo.");
  }

  const user: DemoAuthUser = {
    id: String(Date.now()),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: bcrypt.hashSync(input.password, 10),
    role: input.role,
    phone: input.phone,
    whatsappPhone: input.whatsappPhone,
    city: input.city,
    province: input.province,
    storeName: input.storeName,
    storeLogo: input.storeLogo,
    storeDescription: input.storeDescription,
    storeSpecializations: input.storeSpecializations,
    storeSector: input.storeSector,
    businessHours: input.businessHours,
  };

  demoUsers = [...demoUsers, user];
  return user;
}

export function updateDemoUser(
  id: string,
  patch: Partial<
    Omit<DemoAuthUser, "id" | "email" | "passwordHash" | "role">
  >,
): DemoAuthUser | null {
  const index = demoUsers.findIndex((u) => u.id === id);
  if (index === -1) return null;
  demoUsers[index] = { ...demoUsers[index], ...patch };
  return demoUsers[index];
}

export function getDemoUsers() {
  return demoUsers;
}
