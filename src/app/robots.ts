import type { MetadataRoute } from "next";

function siteUrl() {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://autoescan.ec"
  );
}

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/vendedor", "/api/", "/iniciar-sesion"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
