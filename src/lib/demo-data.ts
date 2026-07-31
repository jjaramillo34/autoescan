import type { PartDTO } from "@/lib/types";
import { DEMO_SELLER_ID } from "@/lib/constants";

const demoSeller = {
  _id: DEMO_SELLER_ID,
  name: "Carlos Mendoza",
  phone: "+593987654321",
  whatsappPhone: "+593987654321",
  storeName: "Repuestos Ambato Center",
  storeDescription:
    "Local especializado en frenos, sensores y repuestos para autos japoneses y coreanos en el Centro de Ambato.",
  storeSpecializations: ["Frenos", "Motor y sensores", "Japoneses"],
  storeSector: "Centro de Ambato",
  businessHours: "Lun–Sáb 8:30–18:30",
  storeLogo: "",
  city: "Ambato",
  province: "Tungurahua",
};

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
  workshop:
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
};

/** Inventario de demostración para piloto sin MongoDB. */
export let demoParts: PartDTO[] = [
  {
    _id: "100000000000000000000001",
    title: "Pastillas de freno delanteras",
    description: "Juego de pastillas cerámicas para eje delantero. Calidad OEM.",
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
    isFeatured: true,
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000002",
    title: "Amortiguador delantero",
    description: "Amortiguador hidráulico compatible. Incluye buje.",
    brand: "Toyota",
    model: "Yaris",
    yearRange: "2015-2020",
    category: "Suspensión",
    partBrand: "KYB",
    partCode: "333418",
    price: 65,
    stockQuantity: 2,
    images: [IMG.suspension],
    location: "Ficoa",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000003",
    title: "Filtro de aceite",
    description: "Filtro de aceite original equivalente. Rosca estándar.",
    brand: "Hyundai",
    model: "Accent",
    yearRange: "2018-2023",
    category: "Motor",
    partBrand: "Mann-Filter",
    partCode: "W712/75",
    price: 8.75,
    stockQuantity: 40,
    images: [IMG.filter],
    location: "Huachi Chico",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000004",
    title: "Batería 12V 45Ah",
    description: "Batería sellada libre de mantenimiento. Garantía 12 meses.",
    brand: "Kia",
    model: "Rio",
    yearRange: "2017-2022",
    category: "Eléctrico",
    price: 95,
    stockQuantity: 0,
    images: [IMG.battery],
    location: "Atocha",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000005",
    title: "Disco de embrague",
    description: "Kit disco + plato. Ideal para uso urbano en Ambato.",
    brand: "Chevrolet",
    model: "Sail",
    yearRange: "2015-2021",
    category: "Transmisión",
    price: 110,
    stockQuantity: 3,
    images: [IMG.car],
    location: "Miraflores",
    seller: demoSeller,
  },

  // —— Sensores (para probar búsqueda por IA) ——
  {
    _id: "100000000000000000000006",
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
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000007",
    title: "Sensor de oxígeno trasero O2",
    description:
      "Sonda lambda downstream post-catalizador. Sensor de gases de escape.",
    brand: "Chevrolet",
    model: "Aveo",
    yearRange: "2012-2018",
    category: "Motor",
    price: 38,
    stockQuantity: 5,
    images: [IMG.engine],
    location: "Ficoa",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000008",
    title: "Sonda lambda universal 4 cables",
    description:
      "Sensor de oxígeno universal con conector. Compatible con varios modelos.",
    brand: "Toyota",
    model: "Corolla",
    yearRange: "2010-2018",
    category: "Motor",
    price: 35,
    stockQuantity: 14,
    images: [IMG.workshop],
    location: "Huachi Chico",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000009",
    title: "Sensor MAF de flujo de aire",
    description:
      "Medidor de masa de aire (MAF). Sensor de mezcla y admisión para motor.",
    brand: "Hyundai",
    model: "Tucson",
    yearRange: "2016-2022",
    category: "Eléctrico",
    price: 78,
    stockQuantity: 4,
    images: [IMG.engine],
    location: "Centro de Ambato",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000010",
    title: "Sensor MAP de presión",
    description:
      "Sensor de presión del múltiple de admisión. Controla mezcla aire-combustible.",
    brand: "Kia",
    model: "Sportage",
    yearRange: "2015-2021",
    category: "Eléctrico",
    price: 32,
    stockQuantity: 9,
    images: [IMG.workshop],
    location: "Atocha",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000011",
    title: "Sensor de temperatura del refrigerante (ECT)",
    description:
      "Sensor ECT del motor. Influencia en mezcla y ventilador.",
    brand: "Chevrolet",
    model: "Spark",
    yearRange: "2013-2020",
    category: "Eléctrico",
    price: 14.5,
    stockQuantity: 22,
    images: [IMG.filter],
    location: "Izamba",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000012",
    title: "Sensor de posición del cigüeñal (CKP)",
    description:
      "Sensor CKP. Fallas de arranque e inestabilidad del motor.",
    brand: "Mazda",
    model: "3",
    yearRange: "2014-2019",
    category: "Eléctrico",
    price: 48,
    stockQuantity: 6,
    images: [IMG.spark],
    location: "Miraflores",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000013",
    title: "Sensor de posición del árbol de levas (CMP)",
    description: "Sensor CMP / camshaft. Sincronización del motor.",
    brand: "Ford",
    model: "Escape",
    yearRange: "2013-2019",
    category: "Eléctrico",
    price: 45,
    stockQuantity: 3,
    images: [IMG.spark],
    location: "La Merced",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000014",
    title: "Sensor ABS de rueda delantera",
    description: "Sensor de velocidad ABS. Luz de frenos / ABS en tablero.",
    brand: "Volkswagen",
    model: "Gol",
    yearRange: "2015-2022",
    category: "Frenos",
    price: 29,
    stockQuantity: 8,
    images: [IMG.brakesClose],
    location: "Centro de Ambato",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000015",
    title: "Sensor de presión de aceite",
    description: "Sensor interruptor de presión de aceite del motor.",
    brand: "Suzuki",
    model: "Swift",
    yearRange: "2012-2018",
    category: "Motor",
    price: 12,
    stockQuantity: 18,
    images: [IMG.filter],
    location: "Huachi Grande",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000016",
    title: "Sensor TPS acelerador",
    description:
      "Sensor de posición del acelerador (TPS). Afecta respuesta y mezcla.",
    brand: "Honda",
    model: "Civic",
    yearRange: "2012-2017",
    category: "Eléctrico",
    price: 36,
    stockQuantity: 5,
    images: [IMG.workshop],
    location: "Ficoa",
    seller: demoSeller,
  },

  // —— Otros repuestos frecuentes ——
  {
    _id: "100000000000000000000017",
    title: "Bujías iridium (juego x4)",
    description: "Bujías de iridio para motor a gasolina. Mejor arranque.",
    brand: "Toyota",
    model: "Yaris",
    yearRange: "2015-2020",
    category: "Motor",
    price: 48,
    stockQuantity: 11,
    images: [IMG.spark],
    location: "Centro de Ambato",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000018",
    title: "Bobina de encendido",
    description: "Bobina individual. Fallo de cilindro / tip-in irregular.",
    brand: "Hyundai",
    model: "Accent",
    yearRange: "2018-2023",
    category: "Eléctrico",
    price: 55,
    stockQuantity: 6,
    images: [IMG.engine],
    location: "Huachi Chico",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000019",
    title: "Disco de freno delantero",
    description: "Disco ventilado. Incluye 1 unidad (eje delantero).",
    brand: "Chevrolet",
    model: "Sail",
    yearRange: "2015-2021",
    category: "Frenos",
    price: 34,
    stockQuantity: 10,
    images: [IMG.caliper],
    location: "Atocha",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000020",
    title: "Bomba de combustible",
    description: "Bomba eléctrica en tanque. Baja presión / no arranca.",
    brand: "Nissan",
    model: "Sentra",
    yearRange: "2013-2019",
    category: "Motor",
    price: 85,
    stockQuantity: 2,
    images: [IMG.car],
    location: "Miraflores",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000021",
    title: "Radiador completo con abanico",
    description: "Radiador de aluminio con electroventilador.",
    brand: "Kia",
    model: "Rio",
    yearRange: "2017-2022",
    category: "Motor",
    price: 145,
    stockQuantity: 1,
    images: [IMG.workshop],
    location: "Centro de Ambato",
    seller: demoSeller,
  },
  {
    _id: "100000000000000000000022",
    title: "Terminal de dirección",
    description: "Terminal externo de dirección. Holgura en suspensión.",
    brand: "Mazda",
    model: "2",
    yearRange: "2015-2021",
    category: "Suspensión",
    price: 22,
    stockQuantity: 15,
    images: [IMG.suspension],
    location: "Izamba",
    seller: demoSeller,
  },
];

export function getDemoSeller() {
  return demoSeller;
}

export function setDemoParts(parts: PartDTO[]) {
  demoParts = parts;
}

export function updateDemoPart(
  id: string,
  patch: Partial<Omit<PartDTO, "_id" | "seller">>,
): PartDTO | null {
  const index = demoParts.findIndex((p) => p._id === id);
  if (index === -1) return null;
  demoParts[index] = {
    ...demoParts[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return demoParts[index];
}

export function removeDemoPart(id: string): boolean {
  const before = demoParts.length;
  demoParts = demoParts.filter((p) => p._id !== id);
  return demoParts.length < before;
}

export function addDemoPart(
  part: Omit<PartDTO, "_id" | "seller"> & { seller?: PartDTO["seller"] },
): PartDTO {
  const created: PartDTO = {
    ...part,
    _id: String(Date.now()),
    seller: part.seller ?? demoSeller,
  };
  demoParts = [created, ...demoParts];
  return created;
}
