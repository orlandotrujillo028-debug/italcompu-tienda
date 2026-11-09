# Publicar ITALCOMPU en internet

Guía paso a paso para poner la tienda en línea con **GitHub** (guarda el código), **Neon** (base de datos)
y **Vercel** (servidor), y conectar tu dominio **.ec**. Todo tiene plan gratuito para empezar.

> ⏱️ Tiempo estimado: 1 a 2 horas la primera vez (más lo que tarde el registro del dominio).

---

## 0. Antes de publicar (lista de revisión)

- [ ] **Datos legales:** completa razón social, RUC y año de inicio en [`lib/empresa.ts`](lib/empresa.ts).
- [ ] **Textos:** revisa ¿Quiénes somos?, Servicio técnico y Distribuidores. Que un abogado revise
      Garantía, Protección de datos y Términos (archivos en `app/(tienda)/…/page.tsx`).
- [ ] **Cloudinary** (para subir fotos de productos): crea una cuenta gratis en <https://cloudinary.com>
      y anota **Cloud name**, **API Key** y **API Secret** (Dashboard → *Product Environment*).
- [ ] Ten a mano el **número de WhatsApp** que recibirá los pedidos y tus **datos bancarios**.

> ⚠️ **Nunca** ejecutes `npm run db:seed` contra la base de producción: **borra todo** y crea usuarios de prueba.
> En producción se usa `npm run db:produccion` (no borra nada).

---

## 1. Subir el código a GitHub

1. Crea una cuenta en <https://github.com> (si no tienes).
2. Arriba a la derecha: **+ → New repository**.
   - Nombre: `italcompu-tienda`
   - Visibilidad: **Private** (privado)
   - **No** marques “Add a README” ni “.gitignore” (ya existen).
   - **Create repository**.
3. En VS Code abre la terminal (**Ctrl + ñ**) dentro de la carpeta `tienda` y ejecuta
   (cambia `TU-USUARIO` por tu usuario de GitHub):

   ```bash
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/italcompu-tienda.git
   git push -u origin main
   ```

   La primera vez se abrirá una ventana para iniciar sesión en GitHub.

✅ Tu archivo `.env` (con las claves) **no** se sube: está protegido por `.gitignore`.

---

## 2. Crear la base de datos de producción en Neon

Usa una base **separada** de la de pruebas, para que los datos de prueba nunca se mezclen con los reales.

1. Entra a <https://console.neon.tech> → **New Project**.
   - Nombre: `italcompu-produccion`
   - Región: la más cercana a Ecuador que ofrezca (por ejemplo, **AWS US East**).
   - **Create project**.
2. En el proyecto: botón **Connect**. Copia **dos** direcciones:
   - **Con “Connection pooling” activado** → será `DATABASE_URL` (el host termina en `-pooler`).
   - **Con “Connection pooling” desactivado** → será `DIRECT_URL`.

Guárdalas en un lugar seguro (son como contraseñas).

---

## 3. Cargar los datos iniciales y crear tu administrador

Esto se hace **una sola vez**, desde tu computadora, apuntando a la base de producción.
En VS Code abre una **terminal PowerShell nueva** en la carpeta `tienda` y ejecuta (pega tus direcciones
entre las comillas):

```powershell
$env:DATABASE_URL = "postgresql://...-pooler.../neondb?sslmode=require"
$env:DIRECT_URL   = "postgresql://.../neondb?sslmode=require"
npm run db:deploy
npm run db:produccion
npm run crear-admin
```

- `db:deploy` crea las tablas.
- `db:produccion` crea las **16 categorías con sus subcategorías, 16 marcas, la configuración inicial y 3 banners**
  (sin usuarios ni productos de prueba).
- `crear-admin` te pide correo, nombre y contraseña para **tu cuenta de administrador**.
  Al inicio muestra a qué base se está conectando: **revisa que sea la de producción**.

Cuando termine, **cierra esa terminal** (así las variables de producción no quedan activas).

---

## 4. Publicar en Vercel

1. Entra a <https://vercel.com> → **Sign Up → Continue with GitHub**.
2. **Add New… → Project** → elige `italcompu-tienda` → **Import**.
3. Vercel detecta Next.js solo. Antes de desplegar, abre **Environment Variables** y agrega:

   | Nombre | Valor |
   |---|---|
   | `DATABASE_URL` | Dirección de Neon **con** pooling (paso 2) |
   | `DIRECT_URL` | Dirección de Neon **sin** pooling (paso 2) |
   | `AUTH_SECRET` | Una clave nueva y larga. Créala en la terminal con `npx auth secret` y copia el valor (o usa <https://generate-secret.vercel.app/32>). **No reutilices la de tu computadora.** |
   | `NEXT_PUBLIC_SITE_URL` | Por ahora la dirección que te dará Vercel, ej. `https://italcompu-tienda.vercel.app` (en el paso 6 la cambias por tu dominio) |
   | `CLOUDINARY_CLOUD_NAME` | Tu *Cloud name* |
   | `CLOUDINARY_API_KEY` | Tu *API Key* |
   | `CLOUDINARY_API_SECRET` | Tu *API Secret* |

4. **Deploy**. En 2–3 minutos tendrás la tienda en `https://…vercel.app`.

> Cada despliegue ejecuta `vercel-build`: primero aplica las migraciones de la base (si las hay)
> y luego compila. No tienes que hacer nada más cuando agregamos tablas nuevas.

---

## 5. Primeros pasos en la tienda publicada

1. Entra a `https://…vercel.app/login` con tu correo y contraseña de administrador.
2. **Admin → Configuración:** completa WhatsApp de atención, **WhatsApp que recibe los PEDIDOS**,
   correo, teléfono, dirección de la matriz, horario, redes sociales y **datos bancarios**. Guarda.
3. **Admin → Usuarios → Crear cuenta de personal** para tu equipo de ventas.
4. **Panel de ventas → Productos → Nuevo producto:** carga tus productos con sus fotos.
   (Como administrador se publican de inmediato.)
5. **Admin → Banners:** sube tus banners (1600×500, sin texto).
6. Haz una **compra de prueba** desde tu celular para confirmar que el pedido te llega por WhatsApp,
   y luego cancélala desde el detalle del pedido (el stock vuelve).

---

## 6. Conectar tu dominio `.ec`

1. **Compra el dominio** (ej. `italcompu.ec` o `italcompu.com.ec`) en **NIC.EC** (<https://www.nic.ec>)
   o en un registrador acreditado. Los `.com.ec` suelen pedir RUC.
2. En Vercel: tu proyecto → **Settings → Domains → Add** → escribe `italcompu.ec` → **Add**.
   Agrega también `www.italcompu.ec` (Vercel te propone redirigir uno al otro; acepta).
3. Vercel te mostrará los **registros DNS** a configurar. Normalmente son:

   | Tipo | Nombre | Valor |
   |---|---|---|
   | `A` | `@` (el dominio sin www) | `76.76.21.21` |
   | `CNAME` | `www` | `cname.vercel-dns.com` |

   **Usa exactamente los valores que te muestre Vercel** (pueden cambiar). Cárgalos en el panel de DNS
   de donde compraste el dominio.
4. Espera la propagación (de minutos a 24–48 horas). Cuando Vercel muestre ✅ **Valid Configuration**,
   el certificado **HTTPS** se activa solo.
5. En Vercel → **Settings → Environment Variables**, cambia `NEXT_PUBLIC_SITE_URL` a `https://italcompu.ec`
   y vuelve a desplegar (**Deployments → … → Redeploy**). Esto corrige los enlaces de los mensajes de
   WhatsApp, el mapa del sitio y las vistas previas al compartir.

---

## 7. Después de publicar

- **Google:** registra tu dominio en <https://search.google.com/search-console> y envía el mapa del sitio:
  `https://italcompu.ec/sitemap.xml`.
- **Respaldos:** en Neon revisa la sección *Backup & Restore* (el plan gratuito guarda un historial corto;
  si la tienda crece, conviene un plan pago con más días de restauración).
- **Primera visita lenta:** en el plan gratuito Neon “duerme” la base tras unos minutos sin uso; la primera
  visita puede tardar 1–2 segundos más. Es normal.

### Cómo publicar cambios en el futuro

Cada vez que hagamos mejoras, súbelas con:

```bash
git push
```

Vercel detecta el cambio y publica la nueva versión sola en 2–3 minutos.

---

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| El despliegue falla con un error de **Prisma / base de datos** | Revisa `DATABASE_URL` y `DIRECT_URL` en Vercel (sin espacios ni comillas). `DIRECT_URL` debe ser la **sin** `-pooler`. |
| No puedo iniciar sesión (vuelve al login) | Revisa que `AUTH_SECRET` exista en Vercel y vuelve a desplegar. |
| “Demasiados intentos” al entrar | Es la protección contra robo de cuentas: espera 15 minutos. |
| No se suben las fotos de productos | Revisa las 3 variables `CLOUDINARY_*` en Vercel y vuelve a desplegar. |
| Los enlaces de WhatsApp apuntan a `vercel.app` | Actualiza `NEXT_PUBLIC_SITE_URL` (paso 6.5) y vuelve a desplegar. |
| La tienda no muestra los botones de WhatsApp | Falta el número en **Admin → Configuración**. |
