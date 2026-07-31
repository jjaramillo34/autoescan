import { DEMO_SELLER_ID } from "@/lib/constants";

/** Contadores demo de WhatsApp por vendedor (modo sin Mongo). */
const clicksBySeller = new Map<
  string,
  { total: number; recent: number; byPart: Record<string, number> }
>();

function ensure(sellerId: string) {
  let row = clicksBySeller.get(sellerId);
  if (!row) {
    // Semilla realista para el vendedor demo.
    if (sellerId === DEMO_SELLER_ID) {
      row = {
        total: 47,
        recent: 12,
        byPart: {
          "100000000000000000000001": 14,
          "100000000000000000000002": 9,
          "100000000000000000000010": 7,
        },
      };
    } else {
      row = { total: 0, recent: 0, byPart: {} };
    }
    clicksBySeller.set(sellerId, row);
  }
  return row;
}

export function recordDemoWhatsappClick(input: {
  sellerId?: string;
  partId?: string;
}) {
  if (!input.sellerId) return;
  const row = ensure(input.sellerId);
  row.total += 1;
  row.recent += 1;
  if (input.partId) {
    row.byPart[input.partId] = (row.byPart[input.partId] ?? 0) + 1;
  }
}

export function getDemoWhatsappStats(sellerId: string) {
  const row = ensure(sellerId);
  const topPartIds = Object.entries(row.byPart)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  return {
    total: row.total,
    last7Days: row.recent,
    topPartIds,
    clicksByPart: row.byPart,
  };
}
