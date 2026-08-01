/**
 * Mapea el CSV de inventario “Sebas” al formato CreatePartInput de AutoEscán.
 *
 * Columnas origen:
 * id,codigo,codigo_alterno,marca,aplicacion,linea,familia,aux1,aux2,aux3,
 * stock,precio,precio_iva,precio_22,precio_24,precio_almacen,ganancia1,
 * precio_taller,ganancia2,date_created
 */

import { CATEGORIAS, MARCAS_COMUNES, type Categoria } from "@/lib/constants";
import type { CreatePartInput } from "@/lib/parts-service";

export type SebasRow = {
  id: string;
  codigo: string;
  codigo_alterno: string;
  marca: string;
  aplicacion: string;
  linea: string;
  familia: string;
  stock: string;
  precio: string;
  precio_iva: string;
  precio_taller: string;
};

const LINEA_TO_CATEGORY: Record<string, Categoria> = {
  rulimanes: "Suspensión",
  ruliman: "Suspensión",
  frenos: "Frenos",
  pastillas: "Frenos",
  discos: "Frenos",
  suspension: "Suspensión",
  amortiguador: "Suspensión",
  motor: "Motor",
  filtro: "Motor",
  electrico: "Eléctrico",
  eléctrico: "Eléctrico",
  sensor: "Eléctrico",
  transmision: "Transmisión",
  transmisión: "Transmisión",
  carroceria: "Carrocería",
  carrocería: "Carrocería",
};

const BRAND_ALIASES: Record<string, string> = {
  chev: "Chevrolet",
  chevrolet: "Chevrolet",
  toy: "Toyota",
  toyo: "Toyota",
  toyota: "Toyota",
  hyun: "Hyundai",
  hyundai: "Hyundai",
  kia: "Kia",
  nissan: "Nissan",
  mazda: "Mazda",
  ford: "Ford",
  volkswagen: "Volkswagen",
  vw: "Volkswagen",
  renault: "Renault",
  peugeot: "Peugeot",
  suzuki: "Suzuki",
  mitsubishi: "Mitsubishi",
  honda: "Honda",
  great: "Great Wall",
  hino: "Hino",
  isuzu: "Isuzu",
  volvo: "Volvo",
  tata: "Tata",
};

const KNOWN_BRANDS = [
  ...MARCAS_COMUNES,
  "Renault",
  "Peugeot",
  "Suzuki",
  "Hino",
  "Isuzu",
  "Volvo",
  "Tata",
  "Great Wall",
].sort((a, b) => b.length - a.length);

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else inQuotes = false;
      } else current += char;
    } else if (char === '"') inQuotes = true;
    else if (char === ",") {
      result.push(current.trim());
      current = "";
    } else current += char;
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(h: string) {
  return h
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function toYearRange(token: string): string | null {
  // 2012-2018
  if (/^\d{4}-\d{4}$/.test(token)) return token;
  // 86-00 → 1986-2000
  const m = token.match(/^(\d{2})-(\d{2})$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  // Evitar confundir con cilindradas tipo "1.5-1.6" (tienen punto)
  if (token.includes(".")) return null;
  // Chasis B13-B14: letras
  if (/[a-zA-Z]/.test(token)) return null;
  const start = a >= 50 ? 1900 + a : 2000 + a;
  const end = b >= 50 ? 1900 + b : 2000 + b;
  if (end < start) return `${start}-${start + (b < a ? 100 + b - a : b - a)}`;
  return `${start}-${end}`;
}

export function parseAplicacion(aplicacion: string): {
  brand: string;
  model: string;
  yearRange: string;
} {
  let clean = aplicacion.replace(/\s+/g, " ").trim();
  if (!clean) {
    return { brand: "Genérico", model: "Universal", yearRange: "—" };
  }

  // Prefijos de descripción del producto (no del vehículo)
  clean = clean
    .replace(/^ruliman\s+emb\.?\s*/i, "")
    .replace(/^ruliman\s*/i, "")
    .trim();

  let brand = "Genérico";
  let rest = clean;

  for (const b of KNOWN_BRANDS) {
    const re = new RegExp(`^${b}\\b`, "i");
    if (re.test(clean)) {
      brand = b;
      rest = clean.slice(b.length).replace(/^[\s./,-]+/, "");
      break;
    }
  }

  // Alias abreviado al inicio: "Chev ", "Toyo.", "Hyun "
  if (brand === "Genérico") {
    const first = clean.split(/[\s./]/)[0]?.toLowerCase() ?? "";
    if (BRAND_ALIASES[first]) {
      brand = BRAND_ALIASES[first];
      rest = clean.slice(first.length).replace(/^[\s./,-]+/, "");
    }
  }

  // Años al final: 86-00 / 2012-2018
  const tokens = rest.split(/[\s,]+/).filter(Boolean);
  let yearRange = "—";
  const yearIdx = tokens.findIndex((t) => toYearRange(t));
  if (yearIdx >= 0) {
    yearRange = toYearRange(tokens[yearIdx])!;
    tokens.splice(yearIdx, 1);
  }

  let model = tokens.join(" ").trim() || "Universal";
  if (!model) model = "Universal";
  if (model.length > 80) model = model.slice(0, 77) + "…";

  return { brand, model, yearRange };
}

function mapLineaToCategory(linea: string): Categoria {
  const key = linea
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (LINEA_TO_CATEGORY[key]) return LINEA_TO_CATEGORY[key];
  for (const [k, cat] of Object.entries(LINEA_TO_CATEGORY)) {
    if (key.includes(k)) return cat;
  }
  return CATEGORIAS.includes(linea as Categoria) ? (linea as Categoria) : "Otro";
}

function num(value: string): number {
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
}

export function parseSebasCsv(text: string): {
  rows: SebasRow[];
  errors: string[];
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV vacío o sin datos."] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const idx = (name: string) => headers.indexOf(name);

  const required = ["codigo", "aplicacion", "precio"];
  for (const r of required) {
    if (idx(r) < 0) {
      return {
        rows: [],
        errors: [`Falta columna requerida: ${r}. Headers: ${headers.join(", ")}`],
      };
    }
  }

  const rows: SebasRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const get = (name: string) => {
      const j = idx(name);
      return j >= 0 ? (cols[j] ?? "") : "";
    };
    const codigo = get("codigo").trim();
    if (!codigo) {
      errors.push(`Fila ${i + 1}: sin código.`);
      continue;
    }
    rows.push({
      id: get("id"),
      codigo,
      codigo_alterno: get("codigo_alterno"),
      marca: get("marca"),
      aplicacion: get("aplicacion"),
      linea: get("linea"),
      familia: get("familia"),
      stock: get("stock"),
      precio: get("precio"),
      precio_iva: get("precio_iva"),
      precio_taller: get("precio_taller"),
    });
  }

  return { rows, errors };
}

/** Deduplica por código: prioriza la aplicación más descriptiva. */
export function dedupeSebasRows(rows: SebasRow[]): SebasRow[] {
  const map = new Map<string, SebasRow>();
  for (const row of rows) {
    const key = row.codigo.toUpperCase();
    const prev = map.get(key);
    if (!prev) {
      map.set(key, row);
      continue;
    }
    const score = (r: SebasRow) =>
      (r.aplicacion.toLowerCase().includes("ruliman") ? 10 : 0) +
      r.aplicacion.length;
    if (score(row) > score(prev)) map.set(key, row);
  }
  return [...map.values()];
}

export function sebasRowToPart(
  row: SebasRow,
  opts: { sector: string; priceField?: "precio" | "precio_iva" | "precio_taller" },
): CreatePartInput | { error: string } {
  const priceField = opts.priceField ?? "precio";
  const price = num(row[priceField] || row.precio);
  const stockQuantity = num(row.stock);
  if (Number.isNaN(price) || price < 0) {
    return { error: `Precio inválido para ${row.codigo}` };
  }
  const stock = Number.isNaN(stockQuantity) ? 0 : Math.max(0, stockQuantity);

  const { brand, model, yearRange } = parseAplicacion(row.aplicacion);
  const category = mapLineaToCategory(row.linea || "Otro");
  const partCode = row.codigo.trim().toUpperCase();
  const partBrand = row.marca.trim() || "NWO";
  const title =
    row.aplicacion.trim().length > 8
      ? row.aplicacion.trim().slice(0, 120)
      : `${row.linea || "Repuesto"} ${partCode}`.trim();

  return {
    title,
    description: [
      row.aplicacion.trim(),
      row.linea ? `Línea: ${row.linea}` : "",
      row.familia ? `Familia: ${row.familia}` : "",
      row.codigo_alterno ? `Código alterno: ${row.codigo_alterno}` : "",
    ]
      .filter(Boolean)
      .join(". "),
    brand,
    model,
    yearRange,
    category,
    partBrand,
    partCode,
    price,
    stockQuantity: stock,
    location: opts.sector,
    images: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
    ],
  };
}
