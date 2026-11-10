# ITALCOMPU — Ecommerce de tecnología (Ecuador)

Eslogan: **"Vendemos soluciones"**. Logo vectorial animado: `components/marca/logo-italcompu.tsx` (ver sección "Logo"); `public/logo-italcompu.webp` queda solo para Open Graph / JSON-LD.
Lógica de referencia: tecnomegastore.ec (solo la lógica; marca, textos e imágenes propios).
Guía de pasos: `../GUIA_PROMPTS_ECOMMERCE.md`. Avanzar **un paso a la vez**.

## Negocio
- Categorías: computadores, laptops, componentes, periféricos, monitores, impresión, móviles, TV y video, energía, hogar, audio, redes, servidores, software, gaming (con subcategorías).
- Moneda USD. Precios mostrados "Precio incluye IVA" (IVA 15 %, configurable). Se guarda `precioSinIva` y el IVA se calcula.
- Producto: código (SKU), nombre, marca, categoría/subcategoría, descripción, especificaciones clave/valor, imágenes, precio, stock, estado (BORRADOR / PENDIENTE / PUBLICADO / RECHAZADO), destacado, nuevo.
- **NO es marketplace**: todo lo vende ITALCOMPU. Los VENDEDORES son el personal de la tienda.
- **Distribuidores**: un CLIENTE con local del mismo giro solicita ser distribuidor (RUC, nombre del local…) → el ADMIN aprueba → ve todos los precios con el % general `descuento_distribuidor` (Setting, por defecto 10 %). Mientras está PENDIENTE ve precios normales.
- Precios SIEMPRE calculados en el servidor con `lib/precios.ts` (`getTarifa()` + `calcularPrecio()`); el pedido guarda el precio cobrado y el % aplicado.
- Envíos en Ecuador (Servientrega u otro). **Sin pasarela de pago**: el pedido se confirma por WhatsApp (ver "Pedidos por WhatsApp"). Formas de pago: transferencia, contra entrega y tarjeta mediante link de pago que la tienda envía por WhatsApp.
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
- `/pedido/[numero]/confirmacion`: solo el dueño (o personal). Botón para (re)enviar el pedido por WhatsApp; transferencia muestra `datos_bancarios` (Setting).
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

## Pedidos por WhatsApp (Paso 12, decisión del dueño: sin pasarela de pago)
- Botón final del checkout: "Enviar pedido por WhatsApp". `crearPedido` guarda el pedido (reserva stock) y devuelve `whatsapp` = enlace wa.me armado en el SERVIDOR con `enlaceWhatsappPedido()` (`lib/whatsapp-pedido.ts`): productos, totales, entrega, pago, notas y link al detalle.
- La pestaña de WhatsApp se abre en el mismo clic (`window.open` antes de esperar al servidor) para que el navegador no la bloquee; la tienda pasa a la confirmación.
- Número que recibe pedidos y comprobantes: Setting `whatsapp_pedidos` (Admin → Configuración); si está vacío, se usa `whatsapp` (atención).
- Botón `EnviarPorWhatsapp` en la confirmación y en `/cuenta/pedidos/[numero]` mientras el pedido esté pendiente de pago.
- Pagos: el admin confirma manualmente (comprobante) en el detalle del pedido. Tarjeta = link de pago enviado por WhatsApp.
- Pendiente: envío por provincia y emails transaccionales (Resend) si el dueño los quiere.

## Páginas informativas (Paso 13)
- `/quienes-somos`, `/servicio-tecnico`, `/distribuidores`, `/contacto`, `/politicas-de-garantia`, `/proteccion-de-datos` (LOPDP), `/terminos`.
- Plantilla `PaginaInfo` + `Prosa` + `AvisoEjemplo` (aviso amarillo de "texto de ejemplo", solo en desarrollo) en `components/info/pagina-info.tsx`.
- Datos legales y sucursales: `lib/empresa.ts` (razón social y RUC con [placeholders] a completar). Contacto/horario/dirección: Setting.
- Contacto: mapa de Google sin API key (iframe `?output=embed`) y formulario que abre WhatsApp (no envía correos).
- Textos de ejemplo: el dueño debe revisarlos; los legales, con un abogado.

## Calidad, seguridad y SEO (Paso 14)
- Límite de intentos en BD (`LimiteIntento`, `lib/limite.ts`, SQL atómico): login 5/15 min por correo y 30/15 min por IP (DENTRO de `authorize` en `auth.ts`, porque /api/auth/callback/credentials se puede llamar directo; lanza `DemasiadosIntentos`), registros y recuperar 5/h por IP. Login correcto reinicia el contador del correo.
- Encabezados de seguridad y `poweredByHeader: false` en `next.config.ts`.
- SEO: `app/sitemap.ts` (solo publicados y categorías visibles), `app/robots.ts`, `metadataBase` + Open Graph en `app/layout.tsx`, JSON-LD con `components/seo/json-ld.tsx` (escapa `<`): Product + BreadcrumbList en el producto (precio PÚBLICO), ElectronicsStore en la home. Si una página define `openGraph`, repetir siteName/locale (Next no los combina).
- 404: `app/(tienda)/not-found.tsx` + ruta comodín `app/(tienda)/[...no-existe]`. ⚠️ NO poner loading.tsx en segmentos que llaman notFound() (producto, categoría, marca): el 404 respondería con código 200. Hay loading en buscar/nuevos/marcas y en los paneles; error.tsx en cada sección y global-error.tsx.
- Contraste: `marca-gris` = #646464 (no #7a7a7a); nunca texto blanco sobre `marca-cyan` ni texto cyan sobre blanco; verde WhatsApp para botones #0f7a6e (hover #075e54).
- `npm audit`: quedan alertas solo en herramientas de compilación/CLI (postcss dentro de Next, CLI de Prisma y shadcn); se corrigen con Next 16 / Prisma 7 (actualización mayor pendiente).

## Publicación (Paso 15)
- Guía para el dueño: `PUBLICAR.md` (GitHub privado → Neon producción separada → datos iniciales → Vercel → dominio .ec).
- `vercel-build` = `prisma migrate deploy && next build`: cada despliegue aplica migraciones pendientes.
- Producción: `npm run db:produccion` (`prisma/seed-produccion.ts`, idempotente, nunca borra) y `npm run crear-admin` (`scripts/crear-admin.ts`). NUNCA `db:seed` en producción.
- Datos base compartidos por ambos seeds: `prisma/datos-base.ts`.
- Variables en Vercel: DATABASE_URL (pooler), DIRECT_URL, AUTH_SECRET (nueva), NEXT_PUBLIC_SITE_URL (dominio final), CLOUDINARY_*.
- Las migraciones se hicieron con `migrate diff` + `migrate deploy` (el entorno no es interactivo); probado que aplican limpias desde una base vacía.

## Logo (vectorial y animado)
- `<LogoItalcompu variante="icono"|"completo" animado decorativo />` en `components/marca/logo-italcompu.tsx`: SVG en línea, nítido a cualquier tamaño. Se usa en header (icono), footer, login/registro, paneles y 404 raíz.
- Trazos en `components/marca/logo-datos.ts` (GENERADO a partir de medidas del logo original 1492×1342; texto convertido a trazos con Roboto 500 / Roboto Condensed 700 ajustado letra por letra). No editar a mano.
- Animación (CSS en `app/globals.css`, sección "Logo animado"): el monitor aparece, las órbitas se dibujan con máscaras (stroke-dashoffset), los nodos aparecen y laten con una onda suave, brillo periódico en la pantalla y letras en cascada. Con "reducir movimiento" del sistema se muestra quieto.
- `tono="claro"`: versión para fondos oscuros (textos blancos, pantalla translúcida, sin recuadro blanco). Hoy no la usa ninguna página (el login pasó a fondo blanco).
- IDs internos con `useId()`: se puede poner varias veces en la misma página. Usa `decorativo` cuando el nombre ya está escrito al lado (evita lectura doble).

## Páginas de acceso (login, registro, recuperar, distribuidor)
- `app/(auth)/layout.tsx`: `FondoTecnologico` a pantalla completa en tonos CLAROS (predomina el blanco, a pedido del dueño: cuadrícula azul tenue, resplandores suaves, circuito con pulsos cyan), logo normal, título navy por ruta (`components/auth/titulo-auth.tsx`), redes sociales desde Setting, y el formulario en tarjeta blanca con sombra.
- Estilos en `app/globals.css` sección "Páginas de acceso": `.auth-claro` da a la tarjeta borde redondeado, fondo blanco y sombra azulada; `.auth-pulso`, `.auth-nodo` y `.auth-resplandor` animan el fondo.

## Reglas de trabajo
- Toda la interfaz en español.
- Al terminar cada paso: decir qué archivos se crearon, qué comandos ejecutar y cómo probarlo.
- No avanzar al siguiente paso hasta que el usuario lo pida.
- Secretos solo en `.env` (nunca en el código ni en git).

## Inventario de sucursal (Excel del sistema contable)
- Decisión del dueño (10-nov-2026): la tienda tiene SOLO los productos del inventario de la sucursal (hoy "3 - SUCURSAL SHUSHUFINDI"). Los 42 productos de ejemplo se borraron con `npm run inventario:reemplazar -- "ruta\inventario.xls"` (`scripts/reemplazar-catalogo.ts`: pide escribir BORRAR; borra productos, pedidos, deseos y marcas; reinicia pedidos en #1001). NO usarlo para el día a día.
- Día a día: **Admin → Inventario** (`app/admin/inventario`): subir el .xls → se guarda como `InventarioCarga` + `InventarioItem` (foto, NO toca la tienda) → página de comparación con la carga anterior (llegaron, ya no están, más/menos stock, cambió PVP, cambió costo sin PVP) → botón "Aplicar a la tienda" (solo la carga más reciente). "Borrar carga" solo si no se aplicó.
- El archivo es XML de Excel 2003 (SpreadsheetML), no binario: `lib/inventario/leer-excel.ts` lo lee sin librerías (busca la fila con Código/Stock/PVP; "Bodega:" = sucursal). Un .xlsx re-guardado se rechaza con mensaje.
- `lib/inventario/clasificar.ts`: categoría/subcategoría de la tienda por REGLAS sobre el nombre (277 vienen como "CATEGORIA GENERAL"), luego por categoría contable, si no "Accesorios"; marca buscada en el nombre (casi todas dicen "MARCA GENERICA"); `nombreLegible()` pasa MAYÚSCULAS a Título respetando siglas y modelos. Para corregir ubicaciones: ajustar reglas ahí.
- `lib/inventario/sincronizar.ts` (`aplicarCarga`): nuevos → PUBLICADO (nombre/categoría/marca solo al crear; ediciones del panel se respetan); existentes → solo stock y precio (UPDATE masivo con VALUES); ausentes → BORRADOR + stock 0 + `motivoRechazo = MOTIVO_OCULTO` (se reactivan solos si vuelven); categorías: `activa` = tiene productos publicados (el inventario manda sobre la visibilidad); si no hay destacados, destaca los 8 de mayor precio.
- Precios: PVP del Excel INCLUYE IVA → `precioSinIva = PVP / 1,15` con 4 decimales (`Product.precioSinIva` es Decimal(10,4)). `calcularPrecio` calcula `conIva` desde el valor sin redondear, así el precio mostrado = PVP exacto al centavo. Stock con decimales (metros de cable) se redondea hacia abajo.
- Costo: solo se guarda en `InventarioItem` (no se muestra en la tienda).
- **Reporte** (`/admin/inventario/reporte`, cálculo en `lib/inventario/reporte.ts`, sobre la última carga): por reponer (stock ≤ `minimo` + agotados = estaban en la carga anterior y ya no están, porque el sistema solo exporta productos con stock), alertas de margen (margen = (PVP/1,15 − costo) ÷ (PVP/1,15); bajo costo y < `margen` %), sin movimiento (mismo stock hace ≥ `dias` días: SQL que busca la última carga con stock distinto o ausente) y capital (costo × stock). Filtros en la URL `?minimo=1&margen=15&dias=30`. Descarga CSV por lista en `/admin/inventario/reporte/exportar?lista=reponer|margenes|sin-movimiento|capital`.
- CSV compartido: `lib/csv.ts` (`celdaCsv`, `numeroCsv`, `respuestaCsv`); también lo usa la exportación de pedidos.
