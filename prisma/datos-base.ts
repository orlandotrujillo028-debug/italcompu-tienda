// Datos BASE de la tienda (categorías, marcas, banners): los usan
//  - prisma/seed.ts (desarrollo: borra todo y agrega datos de prueba) y
//  - prisma/seed-produccion.ts (producción: solo agrega lo que falta, nunca borra).

export const slugify = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Categoría principal → icono lucide + subcategorías
export const CATEGORIAS: { nombre: string; icono: string; subs: string[] }[] = [
  { nombre: "Computadores", icono: "monitor", subs: ["Escritorio", "Todo en uno", "Mini PC", "Workstation"] },
  { nombre: "Laptops", icono: "laptop", subs: ["Gaming", "Comercial", "Hogar y estudio", "Ultradelgadas"] },
  { nombre: "Componentes", icono: "cpu", subs: ["Procesadores", "Memorias RAM", "Tarjetas de video", "Placas madre", "Fuentes de poder", "Cases", "Refrigeración"] },
  { nombre: "Almacenamiento", icono: "hard-drive", subs: ["SSD M.2", "SSD SATA", "Discos duros internos", "Discos externos", "Memorias USB", "Cases para disco"] },
  { nombre: "Periféricos", icono: "mouse", subs: ["Teclados", "Mouse", "Combos", "Webcams", "Bases para laptops", "Pads de mouse"] },
  { nombre: "Monitores", icono: "monitor-smartphone", subs: ["Gaming", "Oficina", "Curvos", "Profesionales"] },
  { nombre: "Impresión", icono: "printer", subs: ["Láser", "Tinta continua", "Multifuncionales", "Tintas y tóners", "Punto de venta", "Repuestos de impresora", "Papel y suministros"] },
  { nombre: "Móviles", icono: "smartphone", subs: ["Celulares", "Tablets", "Accesorios"] },
  { nombre: "TV y Video", icono: "tv", subs: ["Televisores", "Proyectores", "Streaming"] },
  { nombre: "Energía", icono: "battery-charging", subs: ["UPS", "Reguladores", "Cargadores", "Baterías y pilas", "Cables de poder"] },
  { nombre: "Audio", icono: "headphones", subs: ["Audífonos", "Parlantes", "Micrófonos"] },
  { nombre: "Redes", icono: "router", subs: ["Routers", "Switches", "Access Points", "Cableado", "Adaptadores de red"] },
  { nombre: "Servidores", icono: "server", subs: ["Torre", "Rack", "Almacenamiento NAS"] },
  { nombre: "Software", icono: "app-window", subs: ["Sistemas operativos", "Ofimática", "Antivirus"] },
  { nombre: "Gaming", icono: "gamepad-2", subs: ["Sillas gamer", "Consolas", "Controles"] },
  { nombre: "Hogar", icono: "house", subs: ["Cámaras de seguridad", "Alarmas y control de acceso", "Domótica", "Pequeños electrodomésticos"] },
  // Agregadas para el inventario real de la sucursal (Excel del sistema contable).
  { nombre: "Cables y adaptadores", icono: "cable", subs: ["Cables de video", "Cables USB y datos", "Adaptadores y hubs"] },
  { nombre: "Accesorios", icono: "backpack", subs: ["Mochilas y estuches"] },
  { nombre: "Servicio técnico", icono: "wrench", subs: ["Herramientas", "Limpieza y mantenimiento", "Repuestos de laptop", "Servicios"] },
  { nombre: "Mobiliario", icono: "armchair", subs: [] },
];

export const MARCAS = ["HP", "Lenovo", "Dell", "ASUS", "Acer", "Samsung", "Kingston", "Logitech", "Epson", "TP-Link", "Western Digital", "Xiaomi", "Intel", "AMD", "Canon", "APC"];

export const BANNERS = [
  { titulo: "Laptops gaming al mejor precio", subtitulo: "RTX serie 40 con garantía local", enlace: "/categoria/laptops-gaming" },
  { titulo: "Arma tu PC con ITALCOMPU", subtitulo: "Procesadores, tarjetas de video y más", enlace: "/categoria/componentes" },
  { titulo: "Imprime más por menos", subtitulo: "Impresoras de tinta continua", enlace: "/categoria/impresion" },
];
