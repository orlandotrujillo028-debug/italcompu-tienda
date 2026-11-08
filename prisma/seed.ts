// Datos de ejemplo para desarrollo. Ejecutar: npx prisma db seed
// ¡Borra y vuelve a crear todo! No usar en producción.
import { PrismaClient, Rol, EstadoDistribuidor, EstadoProducto } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Contraseña de todos los usuarios de prueba (documentada en README.md)
const PASSWORD_PRUEBA = "Italcompu2026!";

// Datos bancarios FICTICIOS para probar el pago por transferencia (se editan en el admin).
const DATOS_BANCARIOS_EJEMPLO =
  "Banco de ejemplo · Cuenta corriente N.º 0000000000\nTitular: ITALCOMPU (ejemplo) · RUC 1790000000001\nEnvía el comprobante por WhatsApp indicando tu número de pedido.";

const slugify = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Categoría principal → icono lucide + subcategorías
const CATEGORIAS: { nombre: string; icono: string; subs: string[] }[] = [
  { nombre: "Computadores", icono: "monitor", subs: ["Escritorio", "Todo en uno", "Mini PC", "Workstation"] },
  { nombre: "Laptops", icono: "laptop", subs: ["Gaming", "Comercial", "Hogar y estudio", "Ultradelgadas"] },
  { nombre: "Componentes", icono: "cpu", subs: ["Procesadores", "Memorias RAM", "Tarjetas de video", "Placas madre", "Fuentes de poder", "Cases"] },
  { nombre: "Almacenamiento", icono: "hard-drive", subs: ["SSD M.2", "SSD SATA", "Discos duros internos", "Discos externos", "Memorias USB"] },
  { nombre: "Periféricos", icono: "mouse", subs: ["Teclados", "Mouse", "Combos", "Webcams", "Bases para laptops"] },
  { nombre: "Monitores", icono: "monitor-smartphone", subs: ["Gaming", "Oficina", "Curvos", "Profesionales"] },
  { nombre: "Impresión", icono: "printer", subs: ["Láser", "Tinta continua", "Multifuncionales", "Tintas y tóners"] },
  { nombre: "Móviles", icono: "smartphone", subs: ["Celulares", "Tablets", "Accesorios"] },
  { nombre: "TV y Video", icono: "tv", subs: ["Televisores", "Proyectores", "Streaming"] },
  { nombre: "Energía", icono: "battery-charging", subs: ["UPS", "Reguladores", "Cargadores"] },
  { nombre: "Audio", icono: "headphones", subs: ["Audífonos", "Parlantes", "Micrófonos"] },
  { nombre: "Redes", icono: "router", subs: ["Routers", "Switches", "Access Points", "Cableado"] },
  { nombre: "Servidores", icono: "server", subs: ["Torre", "Rack", "Almacenamiento NAS"] },
  { nombre: "Software", icono: "app-window", subs: ["Sistemas operativos", "Ofimática", "Antivirus"] },
  { nombre: "Gaming", icono: "gamepad-2", subs: ["Sillas gamer", "Consolas", "Controles"] },
  { nombre: "Hogar", icono: "house", subs: ["Cámaras de seguridad", "Domótica", "Pequeños electrodomésticos"] },
];

const MARCAS = ["HP", "Lenovo", "Dell", "ASUS", "Acer", "Samsung", "Kingston", "Logitech", "Epson", "TP-Link", "Western Digital", "Xiaomi", "Intel", "AMD", "Canon", "APC"];

// [nombre, categoría, subcategoría, marca, precio sin IVA, stock, specs]
type Ejemplo = [string, string, string, string, number, number, Record<string, string>];
const PRODUCTOS: Ejemplo[] = [
  ["Laptop ASUS TUF Gaming F15 Core i7 16GB 512GB RTX 4060", "Laptops", "Gaming", "ASUS", 1149, 8, { Procesador: "Intel Core i7-13620H", RAM: "16 GB DDR5", Almacenamiento: "512 GB SSD", Gráficos: "RTX 4060 8 GB", Pantalla: "15.6\" 144 Hz" }],
  ["Laptop Lenovo LOQ 15 Ryzen 7 16GB 1TB RTX 4050", "Laptops", "Gaming", "Lenovo", 999, 5, { Procesador: "AMD Ryzen 7 7435HS", RAM: "16 GB", Almacenamiento: "1 TB SSD", Gráficos: "RTX 4050 6 GB" }],
  ["Laptop HP 250 G10 Core i5 8GB 512GB", "Laptops", "Comercial", "HP", 549, 20, { Procesador: "Intel Core i5-1335U", RAM: "8 GB", Almacenamiento: "512 GB SSD", Pantalla: "15.6\" HD" }],
  ["Laptop Dell Latitude 3540 Core i7 16GB 512GB", "Laptops", "Comercial", "Dell", 899, 6, { Procesador: "Intel Core i7-1355U", RAM: "16 GB", Almacenamiento: "512 GB SSD" }],
  ["Laptop Acer Aspire 3 Ryzen 5 8GB 256GB", "Laptops", "Hogar y estudio", "Acer", 429, 15, { Procesador: "AMD Ryzen 5 7520U", RAM: "8 GB", Almacenamiento: "256 GB SSD" }],
  ["Laptop Lenovo IdeaPad Slim 5 Core Ultra 7 16GB 1TB", "Laptops", "Ultradelgadas", "Lenovo", 1049, 4, { Procesador: "Intel Core Ultra 7 155H", RAM: "16 GB", Almacenamiento: "1 TB SSD", Peso: "1.46 kg" }],
  ["PC de escritorio HP Pro Tower 290 G9 Core i5 8GB 512GB", "Computadores", "Escritorio", "HP", 619, 10, { Procesador: "Intel Core i5-12400", RAM: "8 GB", Almacenamiento: "512 GB SSD" }],
  ["Todo en uno Lenovo IdeaCentre AIO 3 Core i5 16GB 512GB 24\"", "Computadores", "Todo en uno", "Lenovo", 849, 6, { Procesador: "Intel Core i5-13420H", RAM: "16 GB", Pantalla: "23.8\" FHD" }],
  ["Mini PC ASUS ExpertCenter PN42 Celeron 8GB 256GB", "Computadores", "Mini PC", "ASUS", 299, 12, { Procesador: "Intel N100", RAM: "8 GB", Almacenamiento: "256 GB SSD" }],
  ["Workstation Dell Precision 3680 Core i9 32GB 1TB", "Computadores", "Workstation", "Dell", 2399, 2, { Procesador: "Intel Core i9-14900", RAM: "32 GB", Almacenamiento: "1 TB SSD" }],
  ["Procesador Intel Core i5-14400F 10 núcleos LGA1700", "Componentes", "Procesadores", "Intel", 189, 25, { Núcleos: "10", Socket: "LGA1700", Frecuencia: "Hasta 4.7 GHz" }],
  ["Procesador AMD Ryzen 7 7800X3D AM5", "Componentes", "Procesadores", "AMD", 389, 9, { Núcleos: "8", Socket: "AM5", Caché: "96 MB L3" }],
  ["Memoria RAM Kingston FURY Beast 16GB DDR5 5600MHz", "Componentes", "Memorias RAM", "Kingston", 59, 40, { Capacidad: "16 GB", Tipo: "DDR5", Velocidad: "5600 MHz" }],
  ["Memoria RAM Kingston ValueRAM 8GB DDR4 3200MHz", "Componentes", "Memorias RAM", "Kingston", 22, 60, { Capacidad: "8 GB", Tipo: "DDR4", Velocidad: "3200 MHz" }],
  ["Tarjeta de video ASUS Dual GeForce RTX 4060 8GB", "Componentes", "Tarjetas de video", "ASUS", 329, 7, { Memoria: "8 GB GDDR6", Salidas: "HDMI, 3x DP" }],
  ["Placa madre ASUS PRIME B760M-A WiFi DDR5", "Componentes", "Placas madre", "ASUS", 159, 11, { Socket: "LGA1700", Formato: "Micro-ATX", Memoria: "DDR5" }],
  ["SSD M.2 Kingston NV3 1TB NVMe PCIe 4.0", "Almacenamiento", "SSD M.2", "Kingston", 65, 50, { Capacidad: "1 TB", Interfaz: "PCIe 4.0 NVMe", Lectura: "6000 MB/s" }],
  ["SSD M.2 Samsung 990 PRO 2TB NVMe", "Almacenamiento", "SSD M.2", "Samsung", 179, 10, { Capacidad: "2 TB", Interfaz: "PCIe 4.0 NVMe", Lectura: "7450 MB/s" }],
  ["SSD SATA Kingston A400 480GB 2.5\"", "Almacenamiento", "SSD SATA", "Kingston", 32, 45, { Capacidad: "480 GB", Interfaz: "SATA III" }],
  ["Disco duro interno WD Blue 2TB 7200rpm", "Almacenamiento", "Discos duros internos", "Western Digital", 62, 18, { Capacidad: "2 TB", Velocidad: "7200 rpm" }],
  ["Disco externo WD Elements 2TB USB 3.0", "Almacenamiento", "Discos externos", "Western Digital", 79, 14, { Capacidad: "2 TB", Conexión: "USB 3.0" }],
  ["Teclado mecánico Logitech G413 SE", "Periféricos", "Teclados", "Logitech", 59, 22, { Switch: "Táctil", Conexión: "USB" }],
  ["Mouse inalámbrico Logitech M170", "Periféricos", "Mouse", "Logitech", 12, 80, { Conexión: "Inalámbrico 2.4 GHz", DPI: "1000" }],
  ["Combo teclado y mouse Logitech MK270", "Periféricos", "Combos", "Logitech", 29, 35, { Conexión: "Inalámbrico", Idioma: "Español" }],
  ["Webcam Logitech C920s Full HD", "Periféricos", "Webcams", "Logitech", 69, 12, { Resolución: "1080p 30 fps", Micrófono: "Estéreo" }],
  ["Base para laptop con ventilación 15.6\" HP", "Periféricos", "Bases para laptops", "HP", 25, 30, { Ventiladores: "2", Tamaño: "Hasta 15.6\"" }],
  ["Monitor gamer Samsung Odyssey G5 27\" QHD 165Hz curvo", "Monitores", "Curvos", "Samsung", 279, 6, { Tamaño: "27\"", Resolución: "2560x1440", Frecuencia: "165 Hz" }],
  ["Monitor ASUS TUF VG249Q1A 24\" 165Hz", "Monitores", "Gaming", "ASUS", 159, 9, { Tamaño: "23.8\"", Panel: "IPS", Frecuencia: "165 Hz" }],
  ["Monitor Lenovo ThinkVision S24i 24\" FHD", "Monitores", "Oficina", "Lenovo", 119, 16, { Tamaño: "23.8\"", Resolución: "1920x1080" }],
  ["Impresora Epson EcoTank L3250 multifuncional WiFi", "Impresión", "Tinta continua", "Epson", 189, 13, { Funciones: "Imprime, copia, escanea", Conexión: "WiFi" }],
  ["Impresora HP LaserJet M111w", "Impresión", "Láser", "HP", 119, 8, { Tipo: "Láser monocromática", Conexión: "WiFi" }],
  ["Multifuncional Canon PIXMA G3170 WiFi", "Impresión", "Multifuncionales", "Canon", 179, 7, { Funciones: "Imprime, copia, escanea" }],
  ["Botella de tinta Epson 544 negra", "Impresión", "Tintas y tóners", "Epson", 9, 100, { Color: "Negro", Rendimiento: "4500 páginas" }],
  ["Celular Xiaomi Redmi Note 14 256GB 8GB RAM", "Móviles", "Celulares", "Xiaomi", 249, 20, { Almacenamiento: "256 GB", RAM: "8 GB", Cámara: "108 MP" }],
  ["Tablet Samsung Galaxy Tab A9+ 11\" 128GB", "Móviles", "Tablets", "Samsung", 219, 10, { Pantalla: "11\"", Almacenamiento: "128 GB" }],
  ["Smart TV Samsung 55\" Crystal UHD 4K", "TV y Video", "Televisores", "Samsung", 449, 5, { Tamaño: "55\"", Resolución: "4K UHD" }],
  ["UPS APC Back-UPS 750VA", "Energía", "UPS", "APC", 99, 14, { Capacidad: "750 VA / 410 W", Tomas: "6" }],
  ["Audífonos gamer Logitech G435 inalámbricos", "Audio", "Audífonos", "Logitech", 69, 15, { Conexión: "Lightspeed + Bluetooth", Peso: "165 g" }],
  ["Router TP-Link Archer AX55 WiFi 6", "Redes", "Routers", "TP-Link", 89, 18, { Estándar: "WiFi 6 AX3000", Puertos: "4x Gigabit" }],
  ["Switch TP-Link TL-SG108 8 puertos Gigabit", "Redes", "Switches", "TP-Link", 25, 25, { Puertos: "8x Gigabit" }],
];

const BANNERS = [
  { titulo: "Laptops gaming al mejor precio", subtitulo: "RTX serie 40 con garantía local", enlace: "/categoria/laptops-gaming" },
  { titulo: "Arma tu PC con ITALCOMPU", subtitulo: "Procesadores, tarjetas de video y más", enlace: "/categoria/componentes" },
  { titulo: "Imprime más por menos", subtitulo: "Impresoras de tinta continua", enlace: "/categoria/impresion" },
];

async function main() {
  console.log("Limpiando datos anteriores...");
  await prisma.activityLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany({ where: { parentId: { not: null } } });
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.address.deleteMany();
  await prisma.distributorProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.setting.deleteMany();

  const password = await bcrypt.hash(PASSWORD_PRUEBA, 10);

  console.log("Creando usuarios...");
  await prisma.user.create({
    data: { name: "Administrador ITALCOMPU", email: "admin@italcompu.test", password, rol: Rol.ADMIN },
  });

  // Personal de ITALCOMPU (rol VENDEDOR): gestiona productos y pedidos
  await prisma.user.create({
    data: { name: "Vendedor ITALCOMPU", email: "vendedor1@italcompu.test", password, rol: Rol.VENDEDOR },
  });

  // Distribuidores: clientes con un local del mismo giro (uno aprobado y uno en revisión)
  const distribuidores = [
    { n: 1, local: "CompuRed Ambato", ruc: "1890012345001", provincia: "Tungurahua", ciudad: "Ambato", estado: EstadoDistribuidor.APROBADO },
    { n: 2, local: "TecnoService Cuenca", ruc: "0190012345001", provincia: "Azuay", ciudad: "Cuenca", estado: EstadoDistribuidor.PENDIENTE },
  ];
  for (const d of distribuidores) {
    await prisma.user.create({
      data: {
        name: `Distribuidor ${d.n}`,
        email: `distribuidor${d.n}@italcompu.test`,
        password,
        telefono: "0980000000",
        distribuidor: {
          create: {
            razonSocial: `${d.local} S.A.`,
            nombreLocal: d.local,
            ruc: d.ruc,
            tipoNegocio: "Tienda de computación",
            provincia: d.provincia,
            ciudad: d.ciudad,
            telefono: "0980000000",
            estado: d.estado,
            aprobadoEn: d.estado === EstadoDistribuidor.APROBADO ? new Date() : null,
          },
        },
      },
    });
  }

  for (const i of [1, 2]) {
    await prisma.user.create({
      data: {
        name: `Cliente ${i}`,
        email: `cliente${i}@italcompu.test`,
        password,
        telefono: "0990000000",
        addresses: {
          create: {
            nombre: `Cliente ${i}`,
            telefono: "0990000000",
            provincia: i === 1 ? "Pichincha" : "Guayas",
            ciudad: i === 1 ? "Quito" : "Guayaquil",
            direccion: "Av. Principal N1-23 y Secundaria",
            principal: true,
          },
        },
      },
    });
  }

  console.log("Creando categorías y marcas...");
  const subcategorias = new Map<string, string>(); // "Laptops/Gaming" → id
  for (const [orden, cat] of CATEGORIAS.entries()) {
    const padre = await prisma.category.create({
      data: { nombre: cat.nombre, slug: slugify(cat.nombre), icono: cat.icono, orden },
    });
    for (const [subOrden, sub] of cat.subs.entries()) {
      const hija = await prisma.category.create({
        data: { nombre: sub, slug: `${padre.slug}-${slugify(sub)}`, orden: subOrden, parentId: padre.id },
      });
      subcategorias.set(`${cat.nombre}/${sub}`, hija.id);
    }
  }

  const marcas = new Map<string, string>();
  for (const nombre of MARCAS) {
    const marca = await prisma.brand.create({ data: { nombre, slug: slugify(nombre) } });
    marcas.set(nombre, marca.id);
  }

  console.log("Creando productos...");
  for (const [i, [nombre, cat, sub, marca, precio, stock, specs]] of PRODUCTOS.entries()) {
    const codigo = `ITC-${String(1000 + i)}`;
    const texto = encodeURIComponent(nombre.split(" ").slice(0, 3).join(" "));
    await prisma.product.create({
      data: {
        codigo,
        nombre,
        slug: `${slugify(nombre)}-${codigo.toLowerCase()}`,
        descripcion: `${nombre}. Producto original con garantía local y factura. Envíos a todo Ecuador.`,
        specs: Object.entries(specs).map(([clave, valor]) => ({ clave, valor })),
        precioSinIva: precio,
        stock,
        estado: EstadoProducto.PUBLICADO,
        destacado: i % 5 === 0,
        nuevo: i % 7 === 0,
        categoryId: subcategorias.get(`${cat}/${sub}`)!,
        brandId: marcas.get(marca),
        images: {
          create: [{ url: `https://placehold.co/600x600/f4f5f7/0a6db3/png?text=${texto}`, orden: 0 }],
        },
      },
    });
  }

  // Productos cargados por el personal, esperando aprobación del admin
  for (const [i, nombre] of ["Mouse gamer Logitech G502 X", "Parlante Xiaomi Sound Pocket"].entries()) {
    await prisma.product.create({
      data: {
        codigo: `ITC-P${i + 1}`,
        nombre,
        slug: slugify(nombre),
        precioSinIva: 49 + i * 10,
        stock: 10,
        estado: EstadoProducto.PENDIENTE,
        categoryId: subcategorias.get(i === 0 ? "Periféricos/Mouse" : "Audio/Parlantes")!,
        brandId: marcas.get(i === 0 ? "Logitech" : "Xiaomi"),
        images: { create: [{ url: "https://placehold.co/600x600/f4f5f7/0a6db3/png?text=Pendiente" }] },
      },
    });
  }

  console.log("Creando banners y configuración...");
  for (const [orden, b] of BANNERS.entries()) {
    await prisma.banner.create({
      data: {
        ...b,
        orden,
        imagen: `/banners/banner-${orden + 1}.svg`, // fondo sin texto: el título se dibuja encima
      },
    });
  }

  await prisma.setting.createMany({
    data: [
      { clave: "iva", valor: "15" },
      { clave: "costo_envio", valor: "5" },
      { clave: "envio_gratis_desde", valor: "300" },
      { clave: "descuento_distribuidor", valor: "10" }, // % sobre el precio público
      { clave: "whatsapp", valor: "593990000000" },
      { clave: "email_contacto", valor: "ventas@italcompu.test" },
      { clave: "telefono", valor: "02 000 0000" },
      { clave: "direccion_matriz", valor: "Av. Principal N1-23 y Secundaria, Quito" },
      { clave: "horario", valor: "Lun a Vie 9:00–18:30 · Sáb 9:00–13:00" },
      { clave: "datos_bancarios", valor: DATOS_BANCARIOS_EJEMPLO },
      { clave: "facebook", valor: "https://facebook.com/" },
      { clave: "instagram", valor: "https://instagram.com/" },
      { clave: "tiktok", valor: "https://tiktok.com/" },
    ],
  });

  const total = await prisma.product.count();
  console.log(`✔ Seed completo: ${total} productos, ${CATEGORIAS.length} categorías, ${MARCAS.length} marcas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
