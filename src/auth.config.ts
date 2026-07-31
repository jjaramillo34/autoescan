import type { NextAuthConfig } from "next-auth";

/**
 * Config edge-safe (sin mongoose) para proxy de Next.js 16.
 */
export const authConfig = {
  pages: {
    signIn: "/iniciar-sesion",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isSellerRoute = request.nextUrl.pathname.startsWith("/vendedor");
      if (!isSellerRoute) return true;

      const role = auth?.user?.role;
      return Boolean(auth?.user && (role === "vendedor" || role === "admin"));
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.storeName = user.storeName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "comprador" | "vendedor" | "admin";
        session.user.phone = token.phone as string;
        session.user.storeName = token.storeName as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
