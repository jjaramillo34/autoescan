"use server";

import { revalidatePath } from "next/cache";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireSellerSession } from "@/lib/session";

export async function dismissSellerNoticeAction(): Promise<void> {
  const session = await requireSellerSession();
  if (!session) return;

  if (!isDatabaseConfigured()) {
    revalidatePath("/vendedor");
    return;
  }

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { sellerNotice: "" });
  revalidatePath("/vendedor");
}
