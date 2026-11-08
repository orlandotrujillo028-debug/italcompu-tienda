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

## Catálogo y detalle (Paso 7)
- `lib/listado.ts`: `leerFiltros(searchParams)` + `listarProductos(contexto, filtros, tarifa)` → productos, total, página, facetas (marcas, subcategorías, rango de precio). Lo usan /categoria/[slug], /marca/[slug], /nuevos y /buscar.
- Filtros en la URL: `marca` (slugs separados por coma), `sub`, `min`/`max` (precio CON IVA según tarifa), `stock=1`, `orden` (relevancia|precio-asc|precio-desc|nuevos), `page` (24 por página; si no existe se muestra la última).
- `components/listado/`: `Listado` (página completa), `FiltrosLateral`/`FiltrosMovil`, `Ordenar`, `Migas`, `conParams()`.
- `/producto/[slug]`: solo PUBLICADO; `Galeria`, `AccionesProducto` (cantidad ≤ stock, Agregar / Comprar ahora), desglose con IVA, WhatsApp con nombre y código, pestañas y relacionados.

## Carrito y checkout (Paso 8)
- `lib/pedido.ts` → `cotizar(items, tarifa, metodoEnvio)`: única fuente de precios, stock y totales (carrito, checkout y crearPedido). Ajusta cantidades al stock y devuelve `avisos`. Total productos = Σ (precio con IVA × cantidad); IVA = total − subtotal. Envío `costo_envio` salvo retiro o total ≥ `envio_gratis_desde`.
- Carrito: `/carrito` + `useCotizacion()` (pide la cotización al servidor y corrige el store con `sincronizar`).
- `/checkout` (requiere sesión): envío (DOMICILIO | RETIRO), dirección (guardadas o nueva con `guardarDireccion`), pago (TARJETA | TRANSFERENCIA | CONTRA_ENTREGA), notas.
- `crearPedido` (`app/(tienda)/checkout/actions.ts`): recotiza; si hay avisos no crea nada; descuenta stock con `updateMany ... stock >= cantidad` dentro de una transacción; guarda copia de dirección y precios; `revalidateTag("productos")`.
- `/pedido/[numero]/confirmacion`: solo el dueño (o personal). Transferencia muestra `datos_bancarios` (Setting). Tarjeta: botón "Simular pago aprobado" SOLO en desarrollo (pasarela real en Paso 12).
- Ojo: un pedido que falla dentro de la transacción igual consume un número de la secuencia (Postgres no los reutiliza).

## Panel del cliente (Paso 9)
- `app/cuenta/layout.tsx`: `PanelShell` + `NavPanel` (menú lateral en escritorio, fila deslizable en móvil). Secciones: inicio, pedidos (lista + `/cuenta/pedidos/[numero]`), direcciones, datos, deseos, distribuidor.
- Componentes de pedido compartidos (`components/pedidos/`): `EstadoBadge`, `LineaTiempo`, `DetallePedido`, `InstruccionesPago`. Textos/colores de estados en `lib/pedidos-ui.ts`.
- Acciones en `app/cuenta/actions.ts` (direcciones, datos, contraseña): SIEMPRE filtran por el usuario con sesión.
- `lib/validaciones/cuenta.ts`: `cedulaORucValido` (módulo 10 + RUC). Fechas SIEMPRE con `fechaEC()` de `lib/formato.ts` (hora de Ecuador; el servidor en Vercel está en UTC).

## Panel de ventas del personal (Paso 10)
- `/vendedor` (VENDEDOR y ADMIN): resumen con `lib/ventas.ts` (ventas = PAGADO/PREPARANDO/ENVIADO/ENTREGADO, días en hora de Ecuador) y `GraficoVentas` (columnas hechas a mano, sin recharts; tooltip + tabla).
- Productos: lista con filtros por estado/búsqueda/stock bajo; `ProductoForm` + `guardarProducto` (`app/vendedor/productos/actions.ts`). Reglas: borrador → BORRADOR; ADMIN → PUBLICADO; personal → PENDIENTE, salvo que en un PUBLICADO solo cambie el stock.
- Imágenes: firma Cloudinary en el servidor (`firmarSubidaImagen`) y subida directa desde el navegador; enlaces manuales solo de `HOSTS_IMAGEN` (`lib/validaciones/producto.ts`). Requiere CLOUDINARY_* en .env.
- Pedidos: `siguientesEstados()` en `lib/flujo-pedido.ts` (contra entrega/pagado → preparando → enviado con guía | retiro → entregado). `cambiarEstadoPedido` usa updateMany con el estado anterior para no pisar cambios simultáneos. Confirmar transferencias y cancelar: ADMIN (Paso 11).
- `lib/actividad.ts` → `registrarActividad()` en cada cambio (tabla ActivityLog).

## Panel del admin (Paso 11)
- `/admin`: dashboard (ventas del mes público vs distribuidores, pedidos de hoy, clientes nuevos, pendientes, gráfico, más vendidos). El menú muestra contadores de pendientes.
- `/admin/productos`: aprobar / rechazar con motivo (acciones en `app/admin/productos/actions.ts`), destacado/nuevo, despublicar. Edición del producto: se reutiliza `/vendedor/productos/[id]`.
- `/admin/distribuidores`: aprobar, rechazar (motivo), suspender, reactivar; muestra compras de cada uno.
- `/admin/usuarios`: rol, activar/desactivar (nunca a uno mismo), crear personal (VENDEDOR).
- `/admin/catalogo`: categorías/subcategorías (orden, icono, visible; el slug NO cambia al renombrar) y marcas; solo se borra lo que no tiene productos.
- `/admin/banners`: CRUD con subida a Cloudinary o fondos incluidos; enlaces solo `/ruta` o `https://`.
- Pedidos: se reutiliza `/vendedor/pedidos` (+ filtro de fechas, `lib/filtro-pedidos.ts`). Solo ADMIN: confirmar pago con comprobante, cancelar con motivo devolviendo stock (`app/admin/pedidos/actions.ts`) y exportar CSV (`/admin/pedidos/exportar`, separador `;`, BOM UTF-8, protegido contra fórmulas).
- `/admin/configuracion` (`lib/validaciones/configuracion.ts`) y `/admin/actividad` (textos en `ACCIONES`).
- Componentes reutilizables: `BotonAccion` (con confirmación) y `AccionConTexto` (motivo/comprobante, `tono`).
- Prisma: `transactionOptions` con timeout 20 s en `lib/prisma.ts` (Neon es lento para transacciones largas).

## Reglas de trabajo
- Toda la interfaz en español.
- Al terminar cada paso: decir qué archivos se crearon, qué comandos ejecutar y cómo probarlo.
- No avanzar al siguiente paso hasta que el usuario lo pida.
- Secretos solo en `.env` (nunca en el código ni en git).
