/** Rate limit simple en memoria para reportes de productos. */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hora
const MAX_PER_WINDOW = 5;

export function checkReportRateLimit(key: string): {
  allowed: boolean;
  error?: string;
} {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (existing.count >= MAX_PER_WINDOW) {
    return {
      allowed: false,
      error:
        "Demasiados reportes desde este dispositivo. Intenta más tarde o escribe a soporte.",
    };
  }

  existing.count += 1;
  return { allowed: true };
}
