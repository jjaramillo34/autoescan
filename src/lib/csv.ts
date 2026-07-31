import { CATEGORIAS, SECTORES_AMBATO } from "@/lib/constants";
import type { CreatePartInput } from "@/lib/parts-service";

export const CSV_TEMPLATE_HEADERS = [
  "titulo",
  "descripcion",
  "marca",
  "modelo",
  "anios",
  "categoria",
  "marca_repuesto",
  "codigo",
  "precio",
  "cantidad",
  "sector",
  "imagen_url",
] as const;

export const CSV_TEMPLATE_CONTENT = [
  CSV_TEMPLATE_HEADERS.join(","),
  [
    "Pastillas de freno delanteras",
    "Juego cerámico eje delantero",
    "Chevrolet",
    "Aveo",
    "2012-2018",
    "Frenos",
    "TRW",
    "GDB1330",
    "28.50",
    "10",
    "Centro de Ambato",
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
  ]
    .map(escapeCsv)
    .join(","),
  [
    "Amortiguador delantero",
    "Hidráulico con buje",
    "Toyota",
    "Yaris",
    "2015-2020",
    "Suspensión",
    "KYB",
    "333418",
    "65",
    "4",
    "Ficoa",
    "",
  ]
    .map(escapeCsv)
    .join(","),
].join("\n");

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

const HEADER_ALIASES: Record<string, (typeof CSV_TEMPLATE_HEADERS)[number]> = {
  titulo: "titulo",
  title: "titulo",
  nombre: "titulo",
  descripcion: "descripcion",
  description: "descripcion",
  marca: "marca",
  brand: "marca",
  modelo: "modelo",
  model: "modelo",
  anios: "anios",
  yearrange: "anios",
  anos: "anios",
  categoria: "categoria",
  category: "categoria",
  precio: "precio",
  price: "precio",
  cantidad: "cantidad",
  stock: "cantidad",
  stockquantity: "cantidad",
  sector: "sector",
  location: "sector",
  ubicacion: "sector",
  imagen_url: "imagen_url",
  imagen: "imagen_url",
  image: "imagen_url",
  images: "imagen_url",
  marca_repuesto: "marca_repuesto",
  partbrand: "marca_repuesto",
  fabricante: "marca_repuesto",
  codigo: "codigo",
  partcode: "codigo",
  sku: "codigo",
  oem: "codigo",
  codigo_oem: "codigo",
};

export type CsvParseResult =
  | { ok: true; parts: CreatePartInput[]; warnings: string[] }
  | { ok: false; error: string; rowErrors?: string[] };

export function parsePartsCsv(text: string): CsvParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      ok: false,
      error: "El CSV debe incluir encabezados y al menos una fila de datos.",
    };
  }

  const rawHeaders = parseCsvLine(lines[0]).map(normalizeHeader);
  const mappedHeaders = rawHeaders.map((h) => HEADER_ALIASES[h]);

  if (mappedHeaders.some((h) => !h)) {
    return {
      ok: false,
      error: `Encabezados no reconocidos. Usa la plantilla oficial: ${CSV_TEMPLATE_HEADERS.join(", ")}`,
    };
  }

  const parts: CreatePartInput[] = [];
  const rowErrors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const row: Partial<Record<(typeof CSV_TEMPLATE_HEADERS)[number], string>> =
      {};

    mappedHeaders.forEach((key, idx) => {
      if (key) row[key] = cols[idx] ?? "";
    });

    const rowNum = i + 1;
    const title = row.titulo?.trim() ?? "";
    const brand = row.marca?.trim() ?? "";
    const model = row.modelo?.trim() ?? "";
    const yearRange = row.anios?.trim() ?? "";
    const category = row.categoria?.trim() ?? "";
    const location = row.sector?.trim() ?? "";
    const price = Number(row.precio?.replace(",", "."));
    const stockQuantity = Number(row.cantidad);

    if (!title || !brand || !model || !yearRange || !category || !location) {
      rowErrors.push(
        `Fila ${rowNum}: faltan campos obligatorios (titulo, marca, modelo, anios, categoria, sector).`,
      );
      continue;
    }

    if (!CATEGORIAS.includes(category as (typeof CATEGORIAS)[number])) {
      rowErrors.push(
        `Fila ${rowNum}: categoría inválida "${category}". Usa: ${CATEGORIAS.join(", ")}.`,
      );
      continue;
    }

    if (!SECTORES_AMBATO.includes(location as (typeof SECTORES_AMBATO)[number])) {
      rowErrors.push(
        `Fila ${rowNum}: sector inválido "${location}". Usa un sector de Ambato de la plantilla.`,
      );
      continue;
    }

    if (Number.isNaN(price) || price < 0) {
      rowErrors.push(`Fila ${rowNum}: precio inválido.`);
      continue;
    }

    if (Number.isNaN(stockQuantity) || stockQuantity < 0) {
      rowErrors.push(`Fila ${rowNum}: cantidad inválida.`);
      continue;
    }

    const imageUrl = row.imagen_url?.trim();
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      warnings.push(
        `Fila ${rowNum}: imagen_url ignorada (debe ser URL http/https).`,
      );
    }

    parts.push({
      title,
      description: row.descripcion?.trim() ?? "",
      brand,
      model,
      yearRange,
      category,
      partBrand: row.marca_repuesto?.trim() ?? "",
      partCode: row.codigo?.trim().toUpperCase() ?? "",
      price,
      stockQuantity,
      location,
      images:
        imageUrl && /^https?:\/\//i.test(imageUrl)
          ? [imageUrl]
          : [
              "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
            ],
    });
  }

  if (parts.length === 0) {
    return {
      ok: false,
      error: "No se pudo importar ninguna fila válida.",
      rowErrors,
    };
  }

  return { ok: true, parts, warnings: [...warnings, ...(rowErrors.length ? [`${rowErrors.length} fila(s) omitida(s).`] : [])] };
}
