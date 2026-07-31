import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "comprador" | "vendedor" | "admin";
    phone?: string;
    storeName?: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "comprador" | "vendedor" | "admin";
      phone?: string;
      storeName?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "comprador" | "vendedor" | "admin";
    phone?: string;
    storeName?: string;
  }
}
