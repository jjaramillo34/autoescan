export interface SavedVehicle {
  brand: string;
  model: string;
  year: string;
}

export const VEHICLE_STORAGE_KEY = "autoescan:mi-vehiculo";

export function readSavedVehicle(): SavedVehicle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VEHICLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedVehicle>;
    if (!parsed.brand?.trim()) return null;
    return {
      brand: parsed.brand.trim(),
      model: (parsed.model ?? "").trim(),
      year: (parsed.year ?? "").trim(),
    };
  } catch {
    return null;
  }
}

export function writeSavedVehicle(vehicle: SavedVehicle | null) {
  if (typeof window === "undefined") return;
  if (!vehicle?.brand.trim()) {
    localStorage.removeItem(VEHICLE_STORAGE_KEY);
    window.dispatchEvent(new Event("autoescan:vehicle"));
    return;
  }
  localStorage.setItem(
    VEHICLE_STORAGE_KEY,
    JSON.stringify({
      brand: vehicle.brand.trim(),
      model: vehicle.model.trim(),
      year: vehicle.year.trim(),
    }),
  );
  window.dispatchEvent(new Event("autoescan:vehicle"));
}

export function formatVehicleLabel(vehicle: SavedVehicle): string {
  return [vehicle.brand, vehicle.model, vehicle.year]
    .filter(Boolean)
    .join(" ");
}
