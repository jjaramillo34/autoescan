import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Oswald } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { FavoritesSync } from "@/components/favorites/favorites-sync";
import { FavoritesUserProvider } from "@/components/favorites/favorites-user";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { auth } from "@/auth";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "AutoEscán | Escanea y encuentra repuestos en Ambato",
    template: "%s | AutoEscán",
  },
  description:
    "Escanea y encuentra repuestos en Ambato. Marketplace con búsqueda por foto e inventario de locales reales en Tungurahua, Ecuador.",
  applicationName: "AutoEscán",
  keywords: [
    "repuestos",
    "Ambato",
    "Tungurahua",
    "autopartes",
    "Ecuador",
    "AutoEscán",
    "buscar por foto",
  ],
  openGraph: {
    type: "website",
    locale: "es_EC",
    siteName: "AutoEscán",
    title: "AutoEscán | Escanea y encuentra repuestos en Ambato",
    description:
      "Catálogo inteligente de repuestos: foto o filtros, contacto directo por WhatsApp con locales en Ambato.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "AutoEscán" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoEscán | Repuestos en Ambato",
    description:
      "Escanea y encuentra repuestos en Ambato. Catálogo local + búsqueda por foto.",
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AutoEscán",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1f2e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="es-EC"
      suppressHydrationWarning
      className={`${ibmPlex.variable} ${oswald.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
          <FavoritesUserProvider userId={session?.user?.id}>
            <FavoritesSync userId={session?.user?.id} />
            <SiteHeader
              user={
                session?.user
                  ? {
                      name: session.user.name,
                      email: session.user.email,
                      storeName: session.user.storeName,
                      role: session.user.role,
                    }
                  : null
              }
            />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <MobileTabBar />
            <InstallPrompt />
            <RegisterServiceWorker />
            <Toaster richColors position="top-center" closeButton />
          </FavoritesUserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
