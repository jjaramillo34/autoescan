import { auth } from "@/auth";

export async function requireSellerSession() {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user?.id || (role !== "vendedor" && role !== "admin")) {
    return null;
  }

  return session;
}

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return null;
  }
  return session;
}
