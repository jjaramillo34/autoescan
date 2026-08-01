import type { MetadataRoute } from "next";
import { getParts } from "@/lib/parts-service";
import { getSiteUrl } from "@/lib/site-url";
import { getPublicStores } from "@/lib/stores";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/tiendas",
    "/buscar-por-imagen",
    "/guardados",
    "/registro",
    "/registro-vendedor",
    "/privacidad",
    "/terminos",
  ].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const [catalog, stores] = await Promise.all([
      getParts({ page: 1, limit: 100, sort: "recientes" }),
      getPublicStores(),
    ]);

    const partRoutes: MetadataRoute.Sitemap = catalog.items.map((p) => ({
      url: `${base}/repuesto/${p._id}`,
      changeFrequency: "weekly",
      priority: 0.6,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    }));

    const storeRoutes: MetadataRoute.Sitemap = stores.map((s) => ({
      url: `${base}/tienda/${s._id}`,
      changeFrequency: "weekly",
      priority: 0.65,
    }));

    return [...staticRoutes, ...storeRoutes, ...partRoutes];
  } catch {
    return staticRoutes;
  }
}
