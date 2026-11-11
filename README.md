# ITALCOMPU — Tienda en línea

Ecommerce de tecnología con tres roles: **Admin**, **Vendedor** (personal de la tienda) y **Cliente**. Los clientes con un local del mismo giro pueden solicitar ser **distribuidores** y, una vez aprobados, ven precios más económicos.
Contexto completo del proyecto en [CLAUDE.md](CLAUDE.md).

## Puesta en marcha

1. Copia `.env.example` a `.env` y completa `DATABASE_URL`, `DIRECT_URL` y `AUTH_SECRET` (`npx auth secret`).
2. Instala dependencias: `npm install`
3. Crea las tablas: `npm run db:migrate`
4. **Solo en una base NUEVA de pruebas:** carga datos de ejemplo con `npm run db:seed`.
   ⚠️ Hoy la base del `.env` tiene el **catálogo real** (inventario, precios, utilidades): el seed se niega a correr
   ahí para no borrarlo. Haz respaldos con `npm run respaldo`.
5. Arranca: `npm run dev` → http://localhost:3000

## Comandos útiles

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run db:migrate` | Aplicar cambios del `prisma/schema.prisma` |
| `npm run db:seed` | Reiniciar datos de ejemplo (⚠️ BORRA TODO — solo en una base de pruebas; se niega si hay datos reales) |
| `npm run respaldo` | **Respaldo de toda la base** en `respaldos/respaldo-FECHA.json` (no va a git). Hazlo antes de cambios grandes y guárdalo fuera de la PC |
| `npm run restaurar -- "respaldos/archivo.json"` | Carga un respaldo en una base **vacía** (con migraciones aplicadas). Nunca pisa datos |
| `npm run inventario:reemplazar -- "ruta.xls"` | ⚠️ Borra el catálogo y carga solo el Excel. Para el día a día usa Admin → Inventario |
| `npm run db:studio` | Ver y editar la base de datos en el navegador |
| `npm run db:deploy` | Aplicar migraciones en producción (sin borrar datos) |
| `npm run db:produccion` | Datos iniciales de la tienda real: categorías, marcas, configuración y banners (no borra nada) |
| `npm run crear-admin` | Crear (o ascender) la cuenta de administrador |

**Para publicar la tienda en internet sigue [PUBLICAR.md](PUBLICAR.md).**

## Usuarios de prueba (solo desarrollo)

Todos usan la contraseña **`Italcompu2026!`** (definida en `prisma/seed.ts`).

| Rol | Email | Notas |
|---|---|---|
| Admin | admin@italcompu.test | Acceso a `/admin` |
| Vendedor (personal) | vendedor1@italcompu.test | Acceso a `/vendedor` |
| Cliente | cliente1@italcompu.test | Quito, precios normales |
| Cliente | cliente2@italcompu.test | Guayaquil, precios normales |
| Cliente distribuidor | distribuidor1@italcompu.test | "CompuRed Ambato", **APROBADO** → ve precios con descuento |
| Cliente distribuidor | distribuidor2@italcompu.test | "TecnoService Cuenca", solicitud **PENDIENTE** → precios normales |

Nunca uses estos usuarios ni esta contraseña en producción.

## Datos de ejemplo

- 16 categorías con 60 subcategorías, 16 marcas
- 40 productos publicados (códigos `ITC-1000` a `ITC-1039`) + 2 pendientes de aprobación
- 3 banners, configuración inicial (IVA 15 %, envío $5, envío gratis desde $300, descuento distribuidor 10 %)
- Los pedidos se numeran desde el #1001
