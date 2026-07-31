import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo AutoEscán trata datos personales en el piloto de Ambato, Tungurahua.",
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated="31 de julio de 2026">
      <section className="space-y-2">
        <h2>1. Quiénes somos</h2>
        <p>
          AutoEscán es un marketplace de repuestos automotrices en fase piloto
          en Ambato, Tungurahua (Ecuador). Esta política explica qué datos
          tratamos y para qué.
        </p>
      </section>

      <section className="space-y-2">
        <h2>2. Datos que podemos tratar</h2>
        <ul className="space-y-1">
          <li>
            <strong>Compradores:</strong> uso del catálogo, búsquedas, favoritos
            guardados en el dispositivo (localStorage) y clics hacia WhatsApp.
          </li>
          <li>
            <strong>Vendedores:</strong> nombre, correo, teléfono, datos del
            local, inventario, fotos de productos e información de facturación
            del plan.
          </li>
          <li>
            <strong>Fotos:</strong> imágenes subidas o importadas para el
            catálogo (almacenadas en ImageKit, carpeta <code>/autoescan</code>)
            y fotos enviadas a Gemini solo para identificar la pieza.
          </li>
          <li>
            <strong>Técnicos:</strong> IP, identificadores de sesión y eventos
            de uso (p. ej. búsquedas con IA o clics a WhatsApp) para seguridad y
            mejora del servicio.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>3. Finalidad</h2>
        <p>Usamos los datos para:</p>
        <ul className="space-y-1">
          <li>Mostrar el catálogo y conectar compradores con vendedores locales.</li>
          <li>Identificar piezas por foto (Google Gemini).</li>
          <li>Hospedar y mostrar imágenes de productos (ImageKit).</li>
          <li>Administrar cuentas de vendedor, planes e impulsos.</li>
          <li>Prevenir abusos, medir uso y mejorar la plataforma.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>4. WhatsApp y terceros</h2>
        <p>
          Al pulsar “Consultar por WhatsApp” sales de AutoEscán y abres
          WhatsApp/Meta con un mensaje prellenado. El trato comercial ocurre
          entre tú y el vendedor; AutoEscán no intermedia el pago ni el chat.
        </p>
        <p>
          Proveedores que pueden procesar datos en nuestro nombre: MongoDB
          (base de datos), Google (Gemini), ImageKit (imágenes), el servicio de
          búsqueda de fotos configurado y el hosting de la aplicación (p. ej.
          Vercel).
        </p>
      </section>

      <section className="space-y-2">
        <h2>5. Conservación y seguridad</h2>
        <p>
          Conservamos la información mientras la cuenta o el inventario estén
          activos, o el tiempo necesario para el piloto y obligaciones legales.
          Aplicamos medidas razonables de acceso y cifrado en tránsito (HTTPS).
        </p>
      </section>

      <section className="space-y-2">
        <h2>6. Tus derechos</h2>
        <p>
          Puedes solicitar acceso, corrección o eliminación de datos de cuenta
          de vendedor contactándonos. Los favoritos del comprador se pueden borrar
          limpiando el almacenamiento del navegador o desde “Guardados”.
        </p>
      </section>

      <section className="space-y-2">
        <h2>7. Contacto</h2>
        <p>
          Para consultas de privacidad del piloto:{" "}
          <a
            className="text-primary hover:underline"
            href="mailto:privacidad@autoescan.ec"
          >
            privacidad@autoescan.ec
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
