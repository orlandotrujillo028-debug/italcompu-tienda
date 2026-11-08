# ITALCOMPU — Tienda en línea

Ecommerce de tecnología con tres roles: **Admin**, **Vendedor** y **Cliente**.
Contexto completo del proyecto en [CLAUDE.md](CLAUDE.md).

## Puesta en marcha

1. Copia `.env.example` a `.env` y completa `DATABASE_URL`, `DIRECT_URL` y `AUTH_SECRET` (`npx auth secret`).
2. Instala dependencias: `npm install`
3. Crea las tablas: `npm run db:migrate`
4. Carga datos de ejemplo: `npm run db:seed` (⚠️ borra todo y vuelve a crear)
5. Arranca: `npm run dev` → http://localhost:3000

## Comandos útiles

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run db:migrate` | Aplicar cambios del `prisma/schema.prisma` |
| `npm run db:seed` | Reiniciar datos de ejemplo |
| `npm run db:studio` | Ver y editar la base de datos en el navegador |

## Usuarios de prueba (solo desarrollo)

Todos usan la contraseña **`Italcompu2026!`** (definida en `prisma/seed.ts`).

| Rol | Email | Notas |
|---|---|---|
| Admin | admin@italcompu.test | Acceso a `/admin` |
| Vendedor | vendedor1@italcompu.test | Tienda "ITALCOMPU Matriz" (aprobado) |
| Vendedor | vendedor2@italcompu.test | Tienda "TecnoAliado Quito" (aprobado, 2 productos pendientes) |
| Vendedor | vendedor3@italcompu.test | Cuenta en revisión (PENDIENTE) |
| Cliente | cliente1@italcompu.test | Quito |
| Cliente | cliente2@italcompu.test | Guayaquil |

Nunca uses estos usuarios ni esta contraseña en producción.

## Datos de ejemplo

- 16 categorías con 60 subcategorías, 16 marcas
- 40 productos publicados (códigos `ITC-1000` a `ITC-1039`) + 2 pendientes de aprobación
- 3 banners, configuración inicial (IVA 15 %, envío $5, envío gratis desde $300)
- Los pedidos se numeran desde el #1001
