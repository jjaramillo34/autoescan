import { createHash } from "crypto";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { AiUsage } from "@/lib/models/AiUsage";
import {
  AnalyticsEvent,
  type AnalyticsEventType,
} from "@/lib/models/AnalyticsEvent";
import { PlatformSettings } from "@/lib/models/PlatformSettings";
import { DEFAULT_GEMINI_COST_PER_REQUEST } from "@/lib/plans";
import {
  demoAiLogs,
  platformSettingsDemo,
} from "@/lib/admin/demo-admin";

function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

export async function checkAiRateLimit(ip: string, sessionId: string) {
  const ipHash = hashIp(ip || "unknown");

  if (!isDatabaseConfigured()) {
    return { allowed: true as const, ipHash };
  }

  await connectDB();
  const settings =
    (await PlatformSettings.findOne({ key: "default" }).lean()) ??
    platformSettingsDemo;

  const sinceHour = new Date(Date.now() - 60 * 60 * 1000);
  const sinceDay = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [ipCount, sessionCount] = await Promise.all([
    AiUsage.countDocuments({ ipHash, createdAt: { $gte: sinceHour } }),
    sessionId
      ? AiUsage.countDocuments({ sessionId, createdAt: { $gte: sinceDay } })
      : Promise.resolve(0),
  ]);

  if (ipCount >= (settings.aiRateLimitPerIpHour ?? 30)) {
    return {
      allowed: false as const,
      ipHash,
      error: "Límite de búsquedas por foto alcanzado. Intenta más tarde.",
    };
  }

  if (sessionId && sessionCount >= (settings.aiRateLimitPerSessionDay ?? 40)) {
    return {
      allowed: false as const,
      ipHash,
      error: "Alcanzaste el límite diario de búsquedas por foto.",
    };
  }

  return { allowed: true as const, ipHash };
}

export async function logAiUsage(input: {
  ipHash: string;
  sessionId?: string;
  success: boolean;
  pieza?: string;
  categoria?: string;
  brandFilter?: string;
  model?: string;
}) {
  const cost =
    platformSettingsDemo.geminiCostPerRequest || DEFAULT_GEMINI_COST_PER_REQUEST;
  const dk = dateKey();
  const mk = monthKey();

  if (!isDatabaseConfigured()) {
    demoAiLogs.unshift({
      id: String(Date.now()),
      dateKey: dk,
      costUsd: cost,
      success: input.success,
      pieza: input.pieza ?? "",
      ipHash: input.ipHash,
    });
    return;
  }

  await connectDB();
  const settings = await PlatformSettings.findOne({ key: "default" }).lean();
  await AiUsage.create({
    dateKey: dk,
    monthKey: mk,
    ipHash: input.ipHash,
    sessionId: input.sessionId ?? "",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    costUsd: settings?.geminiCostPerRequest ?? cost,
    success: input.success,
    pieza: input.pieza ?? "",
    categoria: input.categoria ?? "",
    brandFilter: input.brandFilter ?? "",
  });
}

export async function trackAnalyticsEvent(input: {
  type: AnalyticsEventType;
  query?: string;
  brand?: string;
  model?: string;
  year?: string;
  location?: string;
  partId?: string;
  sellerId?: string;
  userId?: string;
  sessionId?: string;
  meta?: Record<string, unknown>;
}) {
  if (!isDatabaseConfigured()) {
    const demo = await import("@/lib/demo-analytics");
    if (input.type === "whatsapp_click") {
      demo.recordDemoWhatsappClick({
        sellerId: input.sellerId,
        partId: input.partId,
        userId: input.userId,
        sessionId: input.sessionId,
      });
    } else if (input.type === "part_view") {
      demo.recordDemoPartView({
        sellerId: input.sellerId,
        partId: input.partId,
      });
    } else if (input.type === "favorite") {
      demo.recordDemoFavorite({
        sellerId: input.sellerId,
        partId: input.partId,
      });
    }
    return;
  }

  await connectDB();
  await AnalyticsEvent.create({
    type: input.type,
    query: input.query ?? "",
    brand: input.brand ?? "",
    model: input.model ?? "",
    year: input.year ?? "",
    location: input.location ?? "",
    partId: input.partId || undefined,
    sellerId: input.sellerId || undefined,
    userId: input.userId || undefined,
    sessionId: input.sessionId ?? "",
    meta: input.meta,
  });
}
