/**
 * Importa productos desde el CSV de inventario “Sebas” (formato distinto al template AutoEscán).
 *
 * Uso:
 *   npm run import:sebas -- --file "/Users/javier/Downloads/productos_sebas.csv"
 *   npm run import:sebas -- --file ./productos_sebas.csv --limit 25
 *   npm run import:sebas -- --file ./productos_sebas.csv --all --dry-run
 *   npm run import:sebas -- --file ./productos_sebas.csv --seller vendedor@autoescan.ec --price precio_iva
 *
 * Flags:
 *   --file <path>     Ruta al CSV (requerido)
 *   --seller <email>  Email del vendedor (default: vendedor@autoescan.ec)
 *   --sector <name>   Sector Ambato (default: Centro de Ambato)
 *   --price <field>   precio | precio_iva | precio_taller (default: precio)
 *   --limit <n>       Solo primeras N filas únicas por código (default: 25)
 *   --all             Importar todo (ignora --limit)
 *   --dry-run         Parsea y muestra muestra; no escribe en Mongo
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });
config();

import { SECTORES_AMBATO } from "@/lib/constants";
import { isDatabaseConfigured } from "@/lib/db";
import type { CreatePartInput } from "@/lib/parts-service";
import {
  dedupeSebasRows,
  parseSebasCsv,
  sebasRowToPart,
} from "./lib/sebas-csv";

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i < 0) return undefined;
  return process.argv[i + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function resolveSellerId(email: string): Promise<string> {
  const User =
    mongoose.models.User ??
    mongoose.model(
      "User",
      new mongoose.Schema(
        {
          email: String,
          role: String,
          name: String,
          storeName: String,
        },
        { timestamps: true },
      ),
    );

  const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (!user) {
    throw new Error(
      `No existe usuario con email ${email}. Ejecuta npm run seed o usa --seller con un vendedor válido.`,
    );
  }
  if (user.role !== "vendedor" && user.role !== "admin") {
    throw new Error(`El usuario ${email} no es vendedor (rol: ${user.role}).`);
  }
  return String(user._id);
}

function printSample(parts: CreatePartInput[], n = 5) {
  console.log("\nMuestra mapeada:");
  for (const p of parts.slice(0, n)) {
    console.log(
      `  • [${p.partCode}] ${p.title.slice(0, 70)}${p.title.length > 70 ? "…" : ""}`,
    );
    console.log(
      `    ${p.brand} / ${p.model} / ${p.yearRange} · ${p.category} · $${p.price} · stock ${p.stockQuantity}`,
    );
  }
}

async function main() {
  const { upsertPartsForSeller } = await import("@/lib/parts-service");

  const fileArg = argValue("--file");
  if (!fileArg) {
    console.error(
      'Falta --file. Ejemplo:\n  npm run import:sebas -- --file "/Users/javierjaramillo/Downloads/productos_sebas.csv" --limit 25',
    );
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  const sellerEmail = argValue("--seller") ?? "vendedor@autoescan.ec";
  const sector = argValue("--sector") ?? "Centro de Ambato";
  const priceField = (argValue("--price") ?? "precio") as
    | "precio"
    | "precio_iva"
    | "precio_taller";
  const dryRun = hasFlag("--dry-run");
  const all = hasFlag("--all");
  const limit = all ? Infinity : Number(argValue("--limit") ?? "25");

  if (!SECTORES_AMBATO.includes(sector as (typeof SECTORES_AMBATO)[number])) {
    console.error(
      `Sector inválido: "${sector}". Usa uno de: ${SECTORES_AMBATO.join(", ")}`,
    );
    process.exit(1);
  }

  if (!["precio", "precio_iva", "precio_taller"].includes(priceField)) {
    console.error("--price debe ser precio | precio_iva | precio_taller");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri && !dryRun) {
    console.error("Define MONGODB_URI en .env.local (o usa --dry-run).");
    process.exit(1);
  }
  if (!dryRun && !isDatabaseConfigured()) {
    console.error(
      "isDatabaseConfigured()=false tras cargar .env — revisa MONGODB_URI.",
    );
    process.exit(1);
  }

  console.log(`Leyendo ${filePath}…`);
  console.log(`Mongo: ${isDatabaseConfigured() ? "OK" : "NO"} · ${uri?.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@").split("?")[0]}`);

  const text = await readFile(filePath, "utf8");
  const { rows, errors } = parseSebasCsv(text);
  if (errors.length) {
    console.warn(`Avisos de parseo (${errors.length}):`);
    for (const e of errors.slice(0, 10)) console.warn(`  - ${e}`);
  }

  const unique = dedupeSebasRows(rows);
  const slice = unique.slice(0, Number.isFinite(limit) ? limit : unique.length);

  console.log(
    `Filas: ${rows.length} · únicas por código: ${unique.length} · a procesar: ${slice.length}`,
  );

  const parts: CreatePartInput[] = [];
  const mapErrors: string[] = [];
  for (const row of slice) {
    const mapped = sebasRowToPart(row, { sector, priceField });
    if ("error" in mapped) {
      mapErrors.push(mapped.error);
      continue;
    }
    parts.push(mapped);
  }

  if (mapErrors.length) {
    console.warn(`Errores de mapeo (${mapErrors.length}):`);
    for (const e of mapErrors.slice(0, 10)) console.warn(`  - ${e}`);
  }

  printSample(parts);

  if (dryRun) {
    console.log(`\n[--dry-run] No se escribió nada. ${parts.length} productos listos.`);
    return;
  }

  await mongoose.connect(uri!);
  try {
    const sellerId = await resolveSellerId(sellerEmail);
    console.log(`\nImportando a vendedor ${sellerEmail} (${sellerId})…`);

    const result = await upsertPartsForSeller(parts, sellerId);
    const { Part } = await import("@/lib/models/Part");
    const inDb = await Part.countDocuments({ seller: sellerId });
    console.log(
      `\nListo: ${result.created.length} creados, ${result.updated.length} actualizados.`,
    );
    console.log(`Verificación Mongo: ${inDb} partes del vendedor en la DB.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
