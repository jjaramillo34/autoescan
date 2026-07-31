/**
 * Semilla de datos para el piloto Ambato.
 * Uso: npm run seed
 *
 * Vendedor: vendedor@autoescan.ec / Vendedor123!
 * Admin:    admin@autoescan.ec / Admin123!
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Define MONGODB_URI en .env.local antes de ejecutar el seed.");
  process.exit(1);
}

const DEMO_SELLER_ID = "000000000000000000000001";

const IMG = {
  brakes:
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
  suspension:
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  filter:
    "https://images.unsplash.com/photo-1625047509248-39af1e79bd5d?w=800&q=80",
  battery:
    "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80",
  car: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
  engine:
    "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80",
  brakesClose:
    "https://images.unsplash.com/photo-1729522795290-fba8f0784534?w=800&q=80",
  spark:
    "https://images.unsplash.com/photo-1760713174351-4e7350ff797e?w=800&q=80",
  caliper:
    "https://images.unsplash.com/photo-1760317890322-364a810cd4da?w=800&q=80",
};

async function seed() {
  await mongoose.connect(MONGODB_URI!);

  const userSchema = new mongoose.Schema(
    {
      name: String,
      email: String,
      passwordHash: String,
      role: String,
      phone: String,
      whatsappPhone: String,
      city: String,
      province: String,
      storeName: String,
      storeLogo: String,
      storeDescription: String,
      storeSpecializations: [String],
      storeSector: String,
      businessHours: String,
      storeStatus: String,
      planId: String,
      billingStatus: String,
      currentPeriodEnd: Date,
      productLimit: Number,
      aiCreditsIncluded: Number,
      aiCreditsUsed: Number,
      aiCreditsExtra: Number,
      aiPriority: Boolean,
    },
    { timestamps: true },
  );

  const partSchema = new mongoose.Schema(
    {
      title: String,
      description: String,
      brand: String,
      model: String,
      yearRange: String,
      category: String,
      partBrand: String,
      partCode: String,
      price: Number,
      stockQuantity: Number,
      images: [String],
      seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      location: String,
      moderationStatus: String,
      isFeatured: Boolean,
      featuredUntil: Date,
      isArchived: Boolean,
    },
    { timestamps: true },
  );

  const analyticsSchema = new mongoose.Schema(
    {
      type: String,
      query: String,
      partId: { type: mongoose.Schema.Types.ObjectId, ref: "Part" },
      sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true },
  );

  const User = mongoose.models.User || mongoose.model("User", userSchema);
  const Part = mongoose.models.Part || mongoose.model("Part", partSchema);
  const AnalyticsEvent =
    mongoose.models.AnalyticsEvent ||
    mongoose.model("AnalyticsEvent", analyticsSchema);

  await Part.deleteMany({});
  await AnalyticsEvent.deleteMany({
    sellerId: new mongoose.Types.ObjectId(DEMO_SELLER_ID),
  });
  await User.deleteMany({
    email: { $in: ["vendedor@autoescan.ec", "admin@autoescan.ec"] },
  });

  const passwordHash = await bcrypt.hash("Vendedor123!", 12);
  const adminHash = await bcrypt.hash("Admin123!", 12);
  const periodEnd = new Date();
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  await User.create({
    _id: new mongoose.Types.ObjectId("000000000000000000000099"),
    name: "Super Admin",
    email: "admin@autoescan.ec",
    passwordHash: adminHash,
    role: "admin",
    phone: "+593999999999",
    city: "Ambato",
    province: "Tungurahua",
    storeName: "AutoEscán Admin",
    storeStatus: "active",
    planId: "empresa",
    billingStatus: "active",
  });

  const seller = await User.create({
    _id: new mongoose.Types.ObjectId(DEMO_SELLER_ID),
    name: "Carlos Mendoza",
    email: "vendedor@autoescan.ec",
    passwordHash,
    role: "vendedor",
    phone: "+593987654321",
    whatsappPhone: "+593987654321",
    city: "Ambato",
    province: "Tungurahua",
    storeName: "Repuestos Ambato Center",
    storeDescription:
      "Local especializado en frenos, sensores y repuestos para autos japoneses y coreanos en el Centro de Ambato.",
    storeSpecializations: ["Frenos", "Motor y sensores", "Japoneses"],
    storeSector: "Centro de Ambato",
    businessHours: "Lun–Sáb 8:30–18:30",
    storeStatus: "active",
    planId: "pro",
    billingStatus: "active",
    currentPeriodEnd: periodEnd,
    productLimit: 300,
    aiCreditsIncluded: 500,
    aiCreditsUsed: 128,
    aiCreditsExtra: 50,
    aiPriority: true,
  });

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + 30);

  const inserted = await Part.insertMany([
    {
      title: "Pastillas de freno delanteras",
      description: "Juego de pastillas cerámicas para eje delantero.",
      brand: "Chevrolet",
      model: "Aveo",
      yearRange: "2012-2018",
      category: "Frenos",
      partBrand: "TRW",
      partCode: "GDB1330",
      price: 28.5,
      stockQuantity: 12,
      images: [IMG.brakes],
      location: "Centro de Ambato",
      seller: seller._id,
      isFeatured: true,
      featuredUntil,
    },
    {
      title: "Sensor de oxígeno (O2) / sonda lambda",
      description:
        "Sensor de oxígeno upstream, sonda lambda 4 pines. Ideal para códigos de mezcla y gases de escape.",
      brand: "Nissan",
      model: "Versa",
      yearRange: "2014-2019",
      category: "Motor",
      partBrand: "Denso",
      partCode: "234-9005",
      price: 42,
      stockQuantity: 7,
      images: [IMG.engine],
      location: "Centro de Ambato",
      seller: seller._id,
    },
    {
      title: "Sensor de oxígeno trasero O2",
      description:
        "Sonda lambda downstream post-catalizador. Sensor de gases de escape.",
      brand: "Chevrolet",
      model: "Aveo",
      yearRange: "2012-2018",
      category: "Motor",
      partBrand: "Bosch",
      partCode: "0258006491",
      price: 38,
      stockQuantity: 5,
      images: [IMG.engine],
      location: "Ficoa",
      seller: seller._id,
    },
    {
      title: "Sonda lambda universal 4 cables",
      description:
        "Sensor de oxígeno universal con conector. Compatible con varios modelos.",
      brand: "Toyota",
      model: "Corolla",
      yearRange: "2010-2018",
      category: "Motor",
      partBrand: "NGK",
      partCode: "OZA659EE1",
      price: 35,
      stockQuantity: 14,
      images: [IMG.suspension],
      location: "Huachi Chico",
      seller: seller._id,
    },
    {
      title: "Sensor MAF de flujo de aire",
      description:
        "Medidor de masa de aire (MAF). Sensor de mezcla y admisión para motor.",
      brand: "Hyundai",
      model: "Tucson",
      yearRange: "2016-2022",
      category: "Eléctrico",
      partBrand: "Bosch",
      partCode: "0280218251",
      price: 78,
      stockQuantity: 4,
      images: [IMG.engine],
      location: "Centro de Ambato",
      seller: seller._id,
    },
    {
      title: "Sensor MAP de presión",
      description:
        "Sensor de presión del múltiple de admisión. Controla mezcla aire-combustible.",
      brand: "Kia",
      model: "Sportage",
      yearRange: "2015-2021",
      category: "Eléctrico",
      partBrand: "Delphi",
      partCode: "PS10125",
      price: 32,
      stockQuantity: 9,
      images: [IMG.filter],
      location: "Atocha",
      seller: seller._id,
    },
    {
      title: "Sensor de temperatura del refrigerante (ECT)",
      description: "Sensor ECT del motor. Influencia en mezcla y ventilador.",
      brand: "Chevrolet",
      model: "Spark",
      yearRange: "2013-2020",
      category: "Eléctrico",
      partBrand: "Standard",
      partCode: "TX3",
      price: 14.5,
      stockQuantity: 22,
      images: [IMG.filter],
      location: "Izamba",
      seller: seller._id,
    },
    {
      title: "Sensor de posición del cigüeñal (CKP)",
      description: "Sensor CKP. Fallas de arranque e inestabilidad del motor.",
      brand: "Mazda",
      model: "3",
      yearRange: "2014-2019",
      category: "Eléctrico",
      partBrand: "Denso",
      partCode: "196-2001",
      price: 48,
      stockQuantity: 6,
      images: [IMG.spark],
      location: "Miraflores",
      seller: seller._id,
    },
    {
      title: "Sensor ABS de rueda delantera",
      description: "Sensor de velocidad ABS. Luz de frenos / ABS en tablero.",
      brand: "Volkswagen",
      model: "Gol",
      yearRange: "2015-2022",
      category: "Frenos",
      partBrand: "ATE",
      partCode: "24.0711-5203.3",
      price: 29,
      stockQuantity: 8,
      images: [IMG.brakesClose],
      location: "Centro de Ambato",
      seller: seller._id,
    },
    {
      title: "Bujías iridium (juego x4)",
      description: "Bujías de iridio para motor a gasolina.",
      brand: "Toyota",
      model: "Yaris",
      yearRange: "2015-2020",
      category: "Motor",
      partBrand: "NGK",
      partCode: "ILKAR7B11",
      price: 48,
      stockQuantity: 11,
      images: [IMG.spark],
      location: "Centro de Ambato",
      seller: seller._id,
    },
    {
      title: "Disco de freno delantero",
      description: "Disco ventilado. Incluye 1 unidad.",
      brand: "Chevrolet",
      model: "Sail",
      yearRange: "2015-2021",
      category: "Frenos",
      partBrand: "Brembo",
      partCode: "09.9772.11",
      price: 34,
      stockQuantity: 10,
      images: [IMG.caliper],
      location: "Atocha",
      seller: seller._id,
    },
    {
      title: "Amortiguador delantero",
      description: "Amortiguador hidráulico compatible.",
      brand: "Toyota",
      model: "Yaris",
      yearRange: "2015-2020",
      category: "Suspensión",
      partBrand: "KYB",
      partCode: "333004",
      price: 65,
      stockQuantity: 2,
      images: [IMG.suspension],
      location: "Ficoa",
      seller: seller._id,
    },
    {
      title: "Batería 12V 45Ah",
      description: "Batería sellada libre de mantenimiento.",
      brand: "Kia",
      model: "Rio",
      yearRange: "2017-2022",
      category: "Eléctrico",
      partBrand: "Bosch",
      partCode: "S4-004",
      price: 95,
      stockQuantity: 0,
      images: [IMG.battery],
      location: "Atocha",
      seller: seller._id,
    },
    {
      title: "Bomba de combustible",
      description: "Bomba eléctrica en tanque.",
      brand: "Nissan",
      model: "Sentra",
      yearRange: "2013-2019",
      category: "Motor",
      partBrand: "Delphi",
      partCode: "FE0478-12B1",
      price: 85,
      stockQuantity: 2,
      images: [IMG.car],
      location: "Miraflores",
      seller: seller._id,
    },
  ]);

  const top = inserted.slice(0, 3);
  const waEvents = [];
  for (let i = 0; i < 14; i++) waEvents.push({ part: top[0], daysAgo: i % 5 });
  for (let i = 0; i < 9; i++) waEvents.push({ part: top[1], daysAgo: i % 6 });
  for (let i = 0; i < 7; i++) waEvents.push({ part: top[2], daysAgo: i % 4 });

  await AnalyticsEvent.insertMany(
    waEvents.map(({ part, daysAgo }) => ({
      type: "whatsapp_click",
      query: part.title,
      partId: part._id,
      sellerId: seller._id,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    })),
  );

  console.log("Seed completado.");
  console.log(`Partes: ${inserted.length} · WhatsApp clicks demo: ${waEvents.length}`);
  console.log("Vendedor: vendedor@autoescan.ec / Vendedor123!");
  console.log("Admin:    admin@autoescan.ec / Admin123!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
