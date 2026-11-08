# ITALCOMPU — Ecommerce de tecnología (Ecuador)

Eslogan: **"Vendemos soluciones"**. Logo: `public/logo-italcompu.webp`.
Lógica de referencia: tecnomegastore.ec (solo la lógica; marca, textos e imágenes propios).
Guía de pasos: `../GUIA_PROMPTS_ECOMMERCE.md`. Avanzar **un paso a la vez**.

## Negocio
- Categorías: computadores, laptops, componentes, periféricos, monitores, impresión, móviles, TV y video, energía, hogar, audio, redes, servidores, software, gaming (con subcategorías).
- Moneda USD. Precios mostrados "Precio incluye IVA" (IVA 15 %, configurable). Se guarda `precioSinIva` y el IVA se calcula.
- Producto: código (SKU), nombre, marca, categoría/subcategoría, descripción, especificaciones clave/valor, imágenes, precio, stock, estado (BORRADOR / PENDIENTE / PUBLICADO / RECHAZADO), destacado, nuevo.
- **NO es marketplace**: todo lo vende ITALCOMPU. Los VENDEDORES son el personal de la tienda.
- **Distribuidores**: un CLIENTE con local del mismo giro solicita ser distribuidor (RUC, nombre del local…) → el ADMIN aprueba → ve todos los precios con el % general `descuento_distribuidor` (Setting, por defecto 10 %). Mientras está PENDIENTE ve precios normales.
- Precios SIEMPRE calculados en el servidor con `lib/precios.ts` (`getTarifa()` + `calcularPrecio()`); el pedido guarda el precio cobrado y el % aplicado.
- Envíos en Ecuador (Servientrega u otro). Pagos: tarjeta (Placetopay/PayPhone), transferencia, contra entrega.
- WhatsApp flotante, redes sociales, "¿Quiénes somos?", enlace "¿Tienes un local? Sé distribuidor" (`/registro-distribuidor`).

## Roles y paneles
- **ADMIN → /admin**: dashboard, usuarios y roles (crea al personal), aprobar productos, **aprobar/rechazar/suspender distribuidores**, categorías, marcas, banners, pedidos, configuración (IVA, envío, % descuento distribuidor, datos de la tienda). También puede entrar a /vendedor.
- **VENDEDOR (personal de ITALCOMPU) → /vendedor**: dashboard, cargar/editar productos (quedan PENDIENTES hasta que el admin aprueba), atender pedidos (preparar, enviar, guía). No toca usuarios ni configuración. No hay registro público: los crea el admin.
- **CLIENTE → /cuenta**: mis pedidos, direcciones, datos, lista de deseos, estado de su solicitud de distribuidor (`/cuenta/distribuidor`).
- Visitante: navega y usa el carrito; para pagar inicia sesión.
- La autorización se valida SIEMPRE en el servidor (middleware + `requireRole` en Server Actions), nunca solo ocultando botones.

## Stack
- Next.js 15 (App Router, Turbopack) + TypeScript + Tailwind CSS v4 + shadcn/ui (`components/ui`)
- PostgreSQL (Neon) + Prisma 6
- Auth.js (next-auth v5 beta) con Credentials + bcryptjs, sesión JWT con `id` y `rol`
- Zod + react-hook-form, zustand (carrito), lucide-react (iconos), sonner (toasts)
- Imágenes en Cloudinary · Emails con Resend · Deploy en Vercel

## Diseño (paleta del logo)
| Token Tailwind | Color | Uso |
|---|---|---|
| `marca-navy` / `secondary` | #0b2f8a | títulos, header, barra de categorías, sidebar de paneles |
| `marca-azul` / `primary` | #0a6db3 | botones principales, enlaces, precios |
| `marca-cyan` / `ring` | #12b4e6 | acentos, hover, etiquetas "Nuevo", foco |
| `marca-gris` | #7a7a7a | textos secundarios, eslogan |
| `marca-fondo` / `background` | #f4f5f7 | fondo general (tarjetas en blanco) |

Estilo moderno y limpio, responsive (móvil primero). Degradados navy→azul→cyan permitidos en banners y header.

## Estructura de carpetas
- `app/(tienda)` tienda pública · `app/admin` · `app/vendedor` · `app/cuenta`
- `components/` (ui = shadcn) · `lib/` (prisma, auth, utils) · `prisma/` (schema, seed)

## Autenticación (Paso 4)
- `auth.config.ts` (sin Prisma, lo usa el middleware) · `auth.ts` (Credentials + bcrypt) · `middleware.ts` (1ª barrera por rol).
- `lib/auth-guards.ts`: `getUsuarioActual()`, `requireUser()`, `requireRole(...)`, `esDistribuidorAprobado()` — leen la BD en cada llamada; usarlos en TODA página de panel y Server Action.
- `lib/roles.ts`: `panelPorRol`, `rutaPermitida`, `destinoTrasLogin` (solo rutas internas como callbackUrl).
- Páginas en `app/(auth)`; acciones en `app/(auth)/actions.ts`; validaciones Zod en `lib/validaciones/`.

## Layout de la tienda (Paso 5)
- `app/(tienda)/layout.tsx` arma: `BarraSuperior` → header sticky (`Header` + `MenuCategorias`) → contenido → `Footer` → `WhatsAppFlotante` (todo en `components/tienda/`).
- Datos: `lib/config-tienda.ts` (contacto/redes desde Setting), `lib/catalogo.ts` (`getMenuCategorias`, caché con tag "categorias"), `lib/formato.ts` (`formatoUSD`).
- Buscador con sugerencias → `GET /api/buscar?q=` (precio según tarifa del usuario, sin caché).
- Carrito: `lib/carrito-store.ts` (zustand + localStorage, solo ids y cantidades; precios siempre del servidor).
- Iconos: categorías con lucide (`IconoCategoria`), redes con `simple-icons` (`IconoMarca`).

## Home y tarjetas (Paso 6)
- `app/(tienda)/page.tsx`: banners → beneficios → grilla de categorías → Destacados → vitrinas por categoría (con invitación a distribuidor intercalada) → Nuevos.
- `lib/catalogo.ts`: `getVitrinasHome`, `getBannersActivos` (caché por tags "productos"/"categorias"/"banners"), `getIdsDeseos()`, tipo `ProductoTarjeta`.
- `components/producto/`: `ProductCard` (reutilizable), `Precio` (público o distribuidor tachado), `BotonComprar` (carrito + aviso), `BotonDeseo` (acción `alternarDeseo` en `app/(tienda)/actions.ts`).
- `components/home/`: `CarruselBanners`, `CarruselProductos` + `ItemCarrusel`, `GridCategorias`, `Vitrina`/`VitrinaCategoria`, `Beneficios`, `InvitacionDistribuidor`.
- Banners de ejemplo: fondos SVG sin texto en `public/banners/`; el título y botón se dibujan encima.

## Reglas de trabajo
- Toda la interfaz en español.
- Al terminar cada paso: decir qué archivos se crearon, qué comandos ejecutar y cómo probarlo.
- No avanzar al siguiente paso hasta que el usuario lo pida.
- Secretos solo en `.env` (nunca en el código ni en git).
