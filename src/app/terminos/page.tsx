import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Términos de uso",
  description:
    "Condiciones de uso del marketplace AutoEscán — piloto Ambato, Tungurahua.",
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de uso" updated="31 de julio de 2026">
      <section className="space-y-2">
        <h2>1. Aceptación</h2>
        <p>
          Al usar AutoEscán aceptas estos términos. El servicio está en{" "}
          <strong>piloto</strong> en Ambato, Tungurahua, y puede cambiar o
          interrumpirse sin previo aviso.
        </p>
      </section>

      <section className="space-y-2">
        <h2>2. Qué es AutoEscán</h2>
        <p>
          AutoEscán es un directorio/marketplace que muestra repuestos de
          vendedores locales y facilita el contacto por WhatsApp.{" "}
          <strong>No vendemos</strong> las piezas directamente ni procesamos
          pagos entre comprador y vendedor.
        </p>
      </section>

      <section className="space-y-2">
        <h2>3. Cuentas de vendedor</h2>
        <ul className="space-y-1">
          <li>Debes proporcionar datos verdaderos del local y del contacto.</li>
          <li>
            Eres responsable de precios, stock, descripción y fotos de tus
            publicaciones.
          </li>
          <li>
            Las fotos deben corresponder a la pieza o ser representaciones
            razonables; no subas contenido ilegal o que infrinja derechos de
            terceros.
          </li>
          <li>
            Podemos pausar o retirar cuentas o anuncios por incumplimiento,
            fraude o mala calidad.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>4. Compradores</h2>
        <p>
          Verifica compatibilidad, estado y precio directamente con el
          vendedor. AutoEscán no garantiza disponibilidad, autenticidad OEM ni
          plazos de entrega.
        </p>
      </section>

      <section className="space-y-2">
        <h2>5. IA y búsqueda de imágenes</h2>
        <p>
          La identificación por foto (Gemini) y la búsqueda de imágenes en
          internet son asistencias automáticas y pueden equivocarse. Usa el
          resultado como punto de partida, no como diagnóstico mecánico.
        </p>
      </section>

      <section className="space-y-2">
        <h2>6. Planes e impulsos</h2>
        <p>
          Los planes anuales e impulsos (destacado, banner, prioridad IA) se
          rigen por lo mostrado en el panel admin/vendedor. En piloto, la
          facturación puede ser manual hasta integrar pasarela.
        </p>
      </section>

      <section className="space-y-2">
        <h2>7. Limitación de responsabilidad</h2>
        <p>
          En la medida permitida por la ley ecuatoriana, AutoEscán no responde
          por daños derivados de transacciones entre usuarios, información
          incorrecta de vendedores, interrupciones del piloto o errores de IA.
        </p>
      </section>

      <section className="space-y-2">
        <h2>8. Privacidad</h2>
        <p>
          El tratamiento de datos se describe en la{" "}
          <Link href="/privacidad" className="text-primary hover:underline">
            Política de privacidad
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2>9. Contacto</h2>
        <p>
          Soporte del piloto:{" "}
          <a
            className="text-primary hover:underline"
            href="mailto:hola@autoescan.ec"
          >
            hola@autoescan.ec
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
