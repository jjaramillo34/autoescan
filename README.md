# AutoEscán

Marketplace de repuestos automotrices en Ecuador — piloto en **Ambato, Tungurahua**.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · MongoDB/Mongoose · Google Gemini · Framer Motion · Sonner.

## Inicio rápido

```bash
npm install
cp .env.example .env.local   # si aún no existe
# Genera AUTH_SECRET: openssl rand -base64 32
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Sin `MONGODB_URI` ni `GOOGLE_GEMINI_API_KEY` la app corre en **modo demostración** (inventario en memoria + identificación IA simulada).

### Accesos demo

| Rol | Correo | Contraseña |
|---|---|---|
| Vendedor | `vendedor@autoescan.ec` | `Vendedor123!` |
| Vendedor 2 | `ficoa@autoescan.ec` | `Vendedor123!` |
| Super-admin | `admin@autoescan.ec` | `Admin123!` |
| Comprador | `comprador@autoescan.ec` | `Comprador123!` |

Panel admin: [/admin](http://localhost:3000/admin) — MRR, vendedores, billing, IA, precios, moderación, analytics e impulsos.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `AUTH_SECRET` | Secreto de sesión Auth.js (obligatorio) |
| `MONGODB_URI` | URI de MongoDB |
| `GOOGLE_GEMINI_API_KEY` | API key de Google AI Studio |
| `GEMINI_MODEL` | Modelo multimodal (default `gemini-2.5-flash`) |
| `FAST_API_KEY` | API key para búsqueda de fotos de productos (Railway) |
| `IMAGE_SEARCH_API_URL` | Opcional: override del endpoint de búsqueda |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key (solo servidor) |
| `IMAGEKIT_URL_ENDPOINT` | Ej. `https://ik.imagekit.io/tu_id` — fotos en `/autoescan` |
| `AUTOESCAN_SUPPORT_WHATSAPP` | WhatsApp de soporte (planes / impulsos) |
| `CRON_SECRET` | Bearer para `/api/cron/stock-alerts` |
| `STRIPE_SECRET_KEY` | Checkout Stripe (opcional; sin clave = manual + simulación) |
| `STRIPE_WEBHOOK_SECRET` | Webhook de Stripe |
| `BILLING_ALLOW_SIMULATE` | `1` permite simular pago en dev |

## Seed (MongoDB)

```bash
npm run seed
```

## Rutas principales

| Ruta | Módulo |
|---|---|
| `/` | Catálogo + filtros, orden y paginación |
| `/repuesto/[id]` | Detalle del producto (galería, vendedor, relacionados) |
| `/tienda/[id]` | Página pública de la tienda |
| `/guardados` | Favoritos (local + sync si hay cuenta comprador) |
| `/tiendas` | Directorio de locales en Ambato |
| `/buscar-por-imagen` | Búsqueda visual con Gemini (presupuesto global) |
| `/api/ai/identify-part` | Route Handler multimodal |
| `/iniciar-sesion` | Login (vendedor / admin / comprador) |
| `/registro` | Alta de cuenta comprador |
| `/registro-vendedor` | Alta de cuenta vendedor |
| `/vendedor` | Panel (WA, stock, créditos IA, insights) |
| `/vendedor/inventario` | Inventario CRUD (protegido) |
| `/vendedor/nuevo-repuesto` | Carga manual o CSV (protegido) |
| `/vendedor/perfil` | Logo, WhatsApp, especialización |
| `/vendedor/impulsos` | Planes e impulsos (Stripe o manual) |
| `/vendedor/respuestas` | Plantillas de respuesta WhatsApp |
| `/vendedor/checkout/[paymentId]` | Checkout / simulación de pago |
| `/admin/ia` | Control IA, pricing, presupuesto Gemini |
| `/admin/precios` | Comparador de precios entre tiendas |
| `/privacidad` | Política de privacidad |
| `/terminos` | Términos de uso |

## Deploy rápido (Vercel)

```bash
# 1) Login y vincular el repo
npx vercel login
npx vercel link

# 2) Subir env (Production + Preview) — obligatorias
npx vercel env add AUTH_SECRET
npx vercel env add MONGODB_URI
npx vercel env add GOOGLE_GEMINI_API_KEY
npx vercel env add IMAGEKIT_PUBLIC_KEY
npx vercel env add IMAGEKIT_PRIVATE_KEY
npx vercel env add IMAGEKIT_URL_ENDPOINT
npx vercel env add FAST_API_KEY
npx vercel env add AUTOESCAN_SUPPORT_WHATSAPP   # número real, ej. +5939...
npx vercel env add CRON_SECRET                  # openssl rand -base64 32

# 3) Opcionales
# npx vercel env add GEMINI_MODEL
# npx vercel env add IMAGE_SEARCH_API_URL
# npx vercel env add AUTH_URL
# npx vercel env add STRIPE_SECRET_KEY
# npx vercel env add STRIPE_WEBHOOK_SECRET
# npx vercel env add BILLING_ALLOW_SIMULATE      # solo Preview/dev

# 4) Deploy
npx vercel --prod
```

Luego define `AUTH_URL` con la URL de producción y vuelve a desplegar si hace falta.

### Stripe (si cobras en app)

1. Crea un webhook en Stripe → `https://tu-dominio.com/api/billing/webhook`
2. Eventos: `checkout.session.completed`
3. Copia el signing secret a `STRIPE_WEBHOOK_SECRET`
4. Sin `STRIPE_SECRET_KEY` el checkout sigue en modo manual + WhatsApp de soporte

### Cron de stock

`vercel.json` llama a `/api/cron/stock-alerts` a diario. En producción exige  
`Authorization: Bearer $CRON_SECRET`.

## Checklist de producción (piloto Ambato)

### 1. Variables en el hosting (Vercel u otro)

- [ ] `AUTH_SECRET` (único y fuerte: `openssl rand -base64 32`)
- [ ] `MONGODB_URI` (Atlas o instancia gestionada)
- [ ] `GOOGLE_GEMINI_API_KEY` + `GEMINI_MODEL`
- [ ] `FAST_API_KEY` (+ `IMAGE_SEARCH_API_URL` si aplica)
- [ ] `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`
- [ ] `AUTH_URL` (URL canónica de producción)
- [ ] `AUTOESCAN_SUPPORT_WHATSAPP` (**obligatorio** en prod — no uses el fallback demo)
- [ ] `CRON_SECRET` (alertas de stock)
- [ ] Stripe opcional: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`

### 2. Datos y cuentas

- [ ] `npm run seed` (o alta real del primer vendedor)
- [ ] Cambiar o desactivar contraseñas demo en producción
- [ ] Aprobar al menos 1–2 tiendas activas en `/admin/vendedores`
- [ ] Publicar un banner home de prueba en Impulsos (opcional)

### 3. Smoke test en dominio real

- [ ] Home: filtros, sector, vehículo, paginación
- [ ] Detalle → WhatsApp abre `wa.me` con mensaje correcto
- [ ] Guardar favorito → `/guardados`
- [ ] `/buscar-por-imagen` identifica y redirige al catálogo
- [ ] Login vendedor → subir foto (ImageKit `/autoescan`) → aparece en catálogo
- [ ] `/tiendas` lista locales y enlaza a `/tienda/[id]`
- [ ] `/privacidad` y `/terminos` visibles desde el footer

### 4. Operación

- [ ] Dominio + HTTPS
- [ ] Revisar costos Gemini / ImageKit / Railway de búsqueda
- [ ] Correos de contacto reales (`hola@` / `privacidad@`) o actualizar páginas legales
- [ ] Backup de Mongo y rotación de secretos

## Estructura

```
src/
  app/                  # App Router (páginas + API)
  components/
    ai/                 # Dropzone búsqueda por imagen
    layout/             # Header / footer
    parts/              # Tarjeta, filtros, WhatsApp, stock
    seller/             # Inventario y formulario
    ui/                 # shadcn/ui
  lib/
    models/             # User, Part (Mongoose)
    actions/            # Server Actions
    db.ts               # Cliente MongoDB
    gemini.ts           # Cliente Gemini
    parts-service.ts    # Capa de datos (+ fallback demo)
```

## Contacto local

El botón **Consultar por WhatsApp** abre `wa.me/593...` con el mensaje:

> Hola [Tienda], vi su publicación de [Repuesto] por $[Precio] en la app y deseo saber si aún lo tienen disponible.
