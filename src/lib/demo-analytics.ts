import { DEMO_SELLER_ID } from "@/lib/constants";

type SellerCounters = {
  waTotal: number;
  waRecent: number;
  viewsTotal: number;
  viewsRecent: number;
  waByPart: Record<string, number>;
  viewsByPart: Record<string, number>;
};

const bySeller = new Map<string, SellerCounters>();

function ensure(sellerId: string): SellerCounters {
  let row = bySeller.get(sellerId);
  if (!row) {
    if (sellerId === DEMO_SELLER_ID) {
      row = {
        waTotal: 47,
        waRecent: 12,
        viewsTotal: 186,
        viewsRecent: 41,
        waByPart: {
          "100000000000000000000001": 14,
          "100000000000000000000002": 9,
          "100000000000000000000010": 7,
        },
        viewsByPart: {
          "100000000000000000000001": 52,
          "100000000000000000000002": 38,
          "100000000000000000000010": 29,
        },
      };
    } else {
      row = {
        waTotal: 0,
        waRecent: 0,
        viewsTotal: 0,
        viewsRecent: 0,
        waByPart: {},
        viewsByPart: {},
      };
    }
    bySeller.set(sellerId, row);
  }
  return row;
}

export function recordDemoWhatsappClick(input: {
  sellerId?: string;
  partId?: string;
}) {
  if (!input.sellerId) return;
  const row = ensure(input.sellerId);
  row.waTotal += 1;
  row.waRecent += 1;
  if (input.partId) {
    row.waByPart[input.partId] = (row.waByPart[input.partId] ?? 0) + 1;
  }
}

export function recordDemoPartView(input: {
  sellerId?: string;
  partId?: string;
}) {
  if (!input.sellerId) return;
  const row = ensure(input.sellerId);
  row.viewsTotal += 1;
  row.viewsRecent += 1;
  if (input.partId) {
    row.viewsByPart[input.partId] = (row.viewsByPart[input.partId] ?? 0) + 1;
  }
}

export function getDemoWhatsappStats(sellerId: string) {
  const row = ensure(sellerId);
  const topPartIds = Object.entries(row.waByPart)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  return {
    total: row.waTotal,
    last7Days: row.waRecent,
    topPartIds,
    clicksByPart: row.waByPart,
  };
}

export function getDemoViewStats(sellerId: string) {
  const row = ensure(sellerId);
  const views = row.viewsRecent;
  const wa = row.waRecent;
  return {
    total: row.viewsTotal,
    last7Days: views,
    conversionViewToWa: views > 0 ? Math.round((wa / views) * 100) : 0,
  };
}

export function getDemoStoreRanking() {
  return [
    {
      sellerId: DEMO_SELLER_ID,
      storeName: "Repuestos Ambato Center",
      views: 186,
      whatsapp: 47,
      conversion: 25,
      sector: "Centro de Ambato",
    },
    {
      sellerId: "000000000000000000000002",
      storeName: "AutoPartes Ficoa",
      views: 64,
      whatsapp: 11,
      conversion: 17,
      sector: "Ficoa",
    },
    {
      sellerId: "000000000000000000000003",
      storeName: "Repuestos Huachi",
      views: 42,
      whatsapp: 8,
      conversion: 19,
      sector: "Huachi Chico",
    },
  ];
}

export function getDemoDemandBySector() {
  return [
    { sector: "Centro de Ambato", views: 120, whatsapp: 38 },
    { sector: "Ficoa", views: 55, whatsapp: 14 },
    { sector: "Atocha", views: 41, whatsapp: 9 },
    { sector: "Huachi Chico", views: 33, whatsapp: 7 },
  ];
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Tendencia + horarios pico demo para el panel del vendedor. */
let demoFavorites = 24;

export function recordDemoFavorite(_input: {
  sellerId?: string;
  partId?: string;
}) {
  demoFavorites += 1;
}

export function getDemoFavoriteCount() {
  return demoFavorites;
}

export function getDemoDemandMap() {
  return [
    { sector: "Centro de Ambato", brand: "Chevrolet", model: "Aveo", count: 42 },
    { sector: "Centro de Ambato", brand: "Toyota", model: "Yaris", count: 31 },
    { sector: "Ficoa", brand: "Hyundai", model: "Accent", count: 22 },
    { sector: "Atocha", brand: "Nissan", model: "Versa", count: 18 },
    { sector: "Huachi Chico", brand: "Kia", model: "Rio", count: 14 },
    { sector: "Ficoa", brand: "Chevrolet", model: "Spark", count: 12 },
  ];
}

export function getDemoMarketplaceHealth() {
  return {
    activeStores: 3,
    pendingStores: 1,
    storesWithLogoPct: 67,
    totalActiveParts: 42,
    outOfStockPct: 12,
    aiCreditsBurnedPct: 48,
    favorites: getDemoFavoriteCount(),
  };
}

export function getDemoCatalogQuality() {
  return {
    withoutPhoto: 3,
    withoutCode: 8,
    priceOutliers: 2,
    reported: 1,
    pendingReview: 2,
  };
}

export function getDemoOpsAlerts(): {
  id: string;
  severity: "warning" | "danger" | "info";
  message: string;
}[] {
  return [
    {
      id: "silent-store",
      severity: "warning",
      message:
        "1 tienda activa con inventario no recibió WhatsApp en 14 días",
    },
    {
      id: "ai-cost",
      severity: "info",
      message: "Costo Gemini del mes dentro del umbral configurado",
    },
  ];
}

export function getDemoSellerInsights(sellerId: string) {
  const isDemo = sellerId === DEMO_SELLER_ID;
  const daily = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const base = isDemo ? (weekend ? 2 : 5) : 0;
    daily.push({
      date: dayKey(d),
      views: isDemo ? base + ((i * 3) % 5) : 0,
      whatsapp: isDemo ? Math.max(0, Math.floor(base / 2) + (i % 3) - 1) : 0,
    });
  }

  const peakHours = [...Array(24)].map((_, hour) => {
    let clicks = 0;
    if (isDemo) {
      if (hour >= 10 && hour <= 13) clicks = 4 + (hour % 3);
      else if (hour >= 15 && hour <= 18) clicks = 6 + (hour % 2);
      else if (hour >= 19 && hour <= 21) clicks = 2;
    }
    return { hour, clicks };
  });

  return {
    daily,
    peakHours,
    whatsapp30Days: daily.reduce((s, d) => s + d.whatsapp, 0),
    views30Days: daily.reduce((s, d) => s + d.views, 0),
  };
}
