"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
      <div className="relative min-h-[78vh] sm:min-h-[72vh]">
        <motion.div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=2000&q=85')",
          }}
          animate={{ scale: [1.05, 1.08, 1.05] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-12 pt-28 sm:min-h-[72vh] sm:pb-16 sm:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-xl space-y-5"
          >
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
              Ambato · Tungurahua
            </p>
            <h1 className="font-heading text-5xl tracking-wide text-foreground sm:text-6xl md:text-7xl">
              Auto<span className="text-primary">Escán</span>
            </h1>
            <p className="max-w-md font-heading text-xl tracking-wide text-foreground/90 sm:text-2xl">
              Escanea y encuentra repuestos en Ambato.
            </p>
            <p className="max-w-md text-sm text-muted-foreground sm:text-base">
              Catálogo inteligente + locales reales. Busca por foto o por tu
              vehículo y escribe al local por WhatsApp.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button asChild size="lg" className="gap-2 text-base">
                <Link href="#catalogo">
                  <Search className="size-4" />
                  Ver repuestos
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="gap-2 text-base"
              >
                <Link href="/buscar-por-imagen">
                  <Camera className="size-4" />
                  Buscar por foto
                </Link>
              </Button>
            </motion.div>
            <Link
              href="/registro-vendedor"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Store className="size-3.5" />
              ¿Tienes local? Vende ahora
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
