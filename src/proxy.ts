import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export async function proxy(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const isSellerRoute = url.pathname.startsWith("/vendedor");
  const isAdminRoute = url.pathname.startsWith("/admin");
  const isAuthPage =
    url.pathname.startsWith("/iniciar-sesion") ||
    url.pathname.startsWith("/registro-vendedor") ||
    url.pathname === "/registro";

  if (isAdminRoute) {
    if (session?.user?.role !== "admin") {
      const loginUrl = new URL("/iniciar-sesion", url.origin);
      loginUrl.searchParams.set("callbackUrl", url.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isSellerRoute) {
    const role = session?.user?.role;
    const allowed = session?.user && (role === "vendedor" || role === "admin");

    if (!allowed) {
      const loginUrl = new URL("/iniciar-sesion", url.origin);
      loginUrl.searchParams.set("callbackUrl", url.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAuthPage && session?.user) {
    const role = session.user.role;
    const dest =
      role === "admin" ? "/admin" : role === "vendedor" ? "/vendedor" : "/guardados";
    return NextResponse.redirect(new URL(dest, url.origin));
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: [
    "/vendedor/:path*",
    "/admin/:path*",
    "/iniciar-sesion",
    "/registro-vendedor",
    "/registro",
  ],
};
