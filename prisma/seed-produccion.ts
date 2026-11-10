// Datos INICIALES para la tienda real (producción).
// Ejecutar UNA vez después de crear la base:  npm run db:produccion
//
// ✅ Seguro: NO borra nada y NO crea usuarios ni productos de prueba.
//    Solo agrega lo que falte (categorías, marcas, configuración y banners de ejemplo).
//    Se puede volver a ejecutar sin duplicar nada.
import { PrismaClient } from "@prisma/client";
import { BANNERS, CATEGORIAS, MARCAS, slugify } from "./datos-base";

const prisma = new PrismaClient();

// Configuración inicial. Los datos de contacto quedan VACÍOS: complétalos en Admin → Configuración.
const CONFIGURACION: Record<string, string> = {
  iva: "15",
  utilidad_publico: "35",
  utilidad_distribuidor: "25",
  costo_envio: "5",
  envio_gratis_desde: "300",
  whatsapp: "",
  whatsapp_pedidos: "",
  email_contacto: "",
  telefono: "",
  direccion_matriz: "",
  horario: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  datos_bancarios: "",
};

async function main() {
  console.log("Configuración…");
  let nuevas = 0;
  for (const [clave, valor] of Object.entries(CONFIGURACION)) {
    const existe = await prisma.setting.findUnique({ where: { clave } });
    if (!existe) {
      await prisma.setting.create({ data: { clave, valor } });
      nuevas++;
    }
  }
  console.log(`  ${nuevas} ajustes nuevos (los existentes no se tocan).`);

  console.log("Categorías y subcategorías…");
  let cats = 0;
  for (const [orden, cat] of CATEGORIAS.entries()) {
    const slug = slugify(cat.nombre);
    let padre = await prisma.category.findUnique({ where: { slug } });
    if (!padre) {
      padre = await prisma.category.create({ data: { nombre: cat.nombre, slug, icono: cat.icono, orden } });
      cats++;
    }
    for (const [subOrden, sub] of cat.subs.entries()) {
      const subSlug = `${padre.slug}-${slugify(sub)}`;
      if (!(await prisma.category.findUnique({ where: { slug: subSlug } }))) {
        await prisma.category.create({ data: { nombre: sub, slug: subSlug, orden: subOrden, parentId: padre.id } });
        cats++;
      }
    }
  }
  console.log(`  ${cats} categorías nuevas.`);

  console.log("Marcas…");
  let marcas = 0;
  for (const nombre of MARCAS) {
    const slug = slugify(nombre);
    if (!(await prisma.brand.findUnique({ where: { slug } }))) {
      await prisma.brand.create({ data: { nombre, slug } });
      marcas++;
    }
  }
  console.log(`  ${marcas} marcas nuevas.`);

  // Banners solo si no hay ninguno (luego se editan en Admin → Banners).
  if ((await prisma.banner.count()) === 0) {
    for (const [orden, b] of BANNERS.entries()) {
      await prisma.banner.create({ data: { ...b, orden, imagen: `/banners/banner-${orden + 1}.svg` } });
    }
    console.log(`Banners: ${BANNERS.length} de ejemplo creados.`);
  } else {
    console.log("Banners: ya existen, no se tocan.");
  }

  console.log("\n✔ Listo. Siguiente paso: crea tu administrador con  npm run crear-admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
