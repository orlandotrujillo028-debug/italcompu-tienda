// Cómo se ve en la tienda cada producto del Excel del sistema contable:
// categoría/subcategoría de la tienda, marca y nombre legible.
// En el sistema contable 277 de 484 productos están en "CATEGORIA GENERAL" y casi todos con
// "MARCA GENERICA", así que se deduce por el NOMBRE (reglas de abajo, la primera que coincide gana).
// Para corregir un producto mal ubicado: agrega o ajusta una regla aquí (o muévelo a mano en el panel).
// Sin "server-only": lo usan también los scripts de la terminal.

export type Ubicacion = { categoria: string; sub: string | null };

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const clave = (s: string) => sinTildes(s).toUpperCase().replace(/\s+/g, " ").trim();

// [expresión sobre el nombre en MAYÚSCULAS sin tildes, categoría, subcategoría]
type Regla = [RegExp, string, string | null];

const REGLAS: Regla[] = [
  // Servicios
  [/^SERVICIO\b/, "Servicio técnico", "Servicios"],
  // Computadoras
  [/^(NOTEBOOK|LAPTOP)\b.*\b(RTX|GTX|TUF|NITRO|GAMING|ROG|LEGION|OMEN|VICTUS)\b/, "Laptops", "Gaming"],
  [/^(NOTEBOOK|LAPTOP)\b.*(\b(LATITUDE|THINKPAD|PROBOOK|ELITEBOOK|VOSTRO)\b|\bLT \d)|^NOTEBOOK DELL \d{4}\b/, "Laptops", "Comercial"],
  [/^(NOTEBOOK|LAPTOP)\b/, "Laptops", "Hogar y estudio"],
  [/^(TODO EN UNO|ALL IN ONE)\b|\bAIO\b/, "Computadores", "Todo en uno"],
  [/^(CPU|PC|DESKTOP|DESTOKP|COMPUTADOR)\b/, "Computadores", "Escritorio"],
  [/^MONITOR\b.*\bCURVO\b/, "Monitores", "Curvos"],
  [/^MONITOR\b.*(\b(1[4-9]\d|2\d\d) ?HZ|GAMER|GAMING)/, "Monitores", "Gaming"],
  [/^MONITOR\b/, "Monitores", "Oficina"],
  // Componentes
  [/^PROCESADOR\b/, "Componentes", "Procesadores"],
  [/^MEMORIA RAM\b|^MEMORIA DDR/, "Componentes", "Memorias RAM"],
  [/^TARJETA (GRAFICA|DE VIDEO)\b/, "Componentes", "Tarjetas de video"],
  [/^(MAINBOARD|PLACA MADRE|MOTHERBOARD)\b/, "Componentes", "Placas madre"],
  [/^FUENTE CENTRALIZADA\b/, "Hogar", "Cámaras de seguridad"],
  [/^(FUENTE|CABLE PSU)\b/, "Componentes", "Fuentes de poder"],
  [/^CASE\b.*\b2[.,]5\b/, "Almacenamiento", "Cases para disco"],
  [/^CASE\b/, "Componentes", "Cases"],
  [/^VENTILADOR (DELL|HP|LENOVO|ASUS|ACER|TOSHIBA|SAMSUNG|MSI)\b/, "Servicio técnico", "Repuestos de laptop"],
  [/^(VENTILADOR|ENFRIAMIENTO|DISIPADOR|PASTA TERMICA|PAD TERMICO)\b|^COOLING (SPEEDMIND|PROCESADOR)/, "Componentes", "Refrigeración"],
  [/^COOLING\b|^BASE (PARA|DE) LAPTOP/, "Periféricos", "Bases para laptops"],
  [/^TARJETA PCI\b/, "Componentes", null],
  // Almacenamiento
  [/^(DISCO SOLIDO|SSD)\b.*\bM[.]?2\b/, "Almacenamiento", "SSD M.2"],
  [/^(DISCO SOLIDO|SSD)\b/, "Almacenamiento", "SSD SATA"],
  [/^DISCO (DURO )?EXTERNO\b/, "Almacenamiento", "Discos externos"],
  [/^DISCO DURO\b/, "Almacenamiento", "Discos duros internos"],
  [/^(FLASH ?MEMORY|FLASH|MEMORIA USB|PENDRIVE)\b/, "Almacenamiento", "Memorias USB"],
  // Periféricos
  [/^(MOUSE PAD|PAD MOUSE|MOUSEPAD)\b/, "Periféricos", "Pads de mouse"],
  [/^MOUSE\b/, "Periféricos", "Mouse"],
  [/^TECLADO (NUMERICO|GENIUS|SCORPION|XTRIKE|MARVO|GAMING|GAMER|MECANICO|INALAMBRICO|USB|LOGITECH|MEETION|REDRAGON)\b/, "Periféricos", "Teclados"],
  [/^TECLADO\b/, "Servicio técnico", "Repuestos de laptop"], // teclados internos de laptop
  [/^(COMBO|KIT \d EN \d)\b/, "Periféricos", "Combos"],
  [/^(CAMARA WEB|WEBCAM)\b/, "Periféricos", "Webcams"],
  [/^CAMARA\b/, "Hogar", "Cámaras de seguridad"],
  // Impresión
  [/^IMPRESORA\b.*\b(TERMICA|ETIQUETAS?|POS)\b/, "Impresión", "Punto de venta"],
  [/^IMPRESORA\b/, "Impresión", "Multifuncionales"],
  [/^(TONER|TINTA|CARTUCHO|BOTELLA DE TINTA|CINTA EPSON)\b/, "Impresión", "Tintas y tóners"],
  [
    /^(ALMOHADILLA|CHIP|CIRCUITO INTEGRADO|CINTA DE ENCODER|DISCO DE ENCODER|FLEX DE CABEZAL|CABLE BUS FLEX|TANQUE DE MANTENIMIENTO|CABEZAL|PAPER GUIDE|GRASA LUBRICANTE|RODILLO|FUSOR|UNIDAD DE IMAGEN|CILINDRO|DRUM|REVELADOR|CUCHILLA DE LIMPIEZA)\b/,
    "Impresión",
    "Repuestos de impresora",
  ],
  [/^(ENCODER|MANGUERA EPSON)\b/, "Impresión", "Repuestos de impresora"],
  [/^(TARJETAS? PARA CREDENCIAL|PAPEL|ROLLO|ETIQUETAS|CINTA ZEBRA)\b|^MICA X \d+ UNIDADES/, "Impresión", "Papel y suministros"],
  // Energía
  [/^UPS\b/, "Energía", "UPS"],
  [/^REGULADOR\b/, "Energía", "Reguladores"],
  [/^CARGADOR UNIVERSAL AA\b|^PILAS?\b/, "Energía", "Baterías y pilas"],
  [/^CARGADOR\b/, "Energía", "Cargadores"],
  [/^BATERIA\b/, "Servicio técnico", "Repuestos de laptop"], // baterías internas de laptop
  [/^(CABLE DE PODER|CABLE TREBOL|CONECTOR CAMARA PARA FUENTE|REGLETA|CABLE DE ALIMENTACION)\b/, "Energía", "Cables de poder"],
  // Audio
  [/^AUDIFONOS?\b/, "Audio", "Audífonos"],
  [/^MICROFONO\b/, "Audio", "Micrófonos"],
  [/^(PARLANTES?|BOCINA)\b/, "Audio", "Parlantes"],
  [/^SOPORTE (DE|PARA) (AUDIFONO|MICROFONO)/, "Audio", null],
  // Redes
  [/^ROUTER\b/, "Redes", "Routers"],
  [/^SWITCH\b/, "Redes", "Switches"],
  [/^(EXTENSOR|ACCESS POINT|REPETIDOR)\b/, "Redes", "Access Points"],
  [/^ADAPTADOR (INALAMBRICO|TP.?LINK|MINI BLUETOOTH|BLUETOOTH)\b|^ADAPTADOR\b.*\bRJ45\b|^TARJETA DE RED\b/, "Redes", "Adaptadores de red"],
  [/^PONCHADORA\b/, "Servicio técnico", "Herramientas"], // antes que "PLUG RJ45"
  [/CABLE UTP|^PATCH (CORD|PANEL)|^JACK\b|PLUG RJ45|^CAJETIN|^CAPUCHON|^CONECTOR(ES)? RJ|^FACE ?PLATE|^ORGANIZADOR/, "Redes", "Cableado"],
  // Herramientas (antes que "limpieza": "LIMPIADOR DE PUNTA DE CAUTIN" es herramienta)
  [
    /^(DESTORNILLADOR|SET DESTORNILLADORES|PINZA|KIT DE PINZAS|CAUTIN|ESTANO|CHUPA SUELDA|MULTIMETRO|KIT DE HERRAMIENTAS|CAJA DE HERRAMIENTAS|ESTILETE|CUCHILLA|NAVAJA|CORTADORA|PISTOLA DE SILICON|PULSERA ANTIESTATICA|LIMPIADOR DE PUNTA DE CAUTIN|ASPIRADOR DE CALOR|MANGUERA PARA BOMBA|PONCHADORA|COMPROBADOR DE REDES)\b/,
    "Servicio técnico",
    "Herramientas",
  ],
  [/LIMPI|^ALCOHOL\b|^SPRAY\b|^PENETRANTE\b|\bWD-40\b|^GEL PARA/, "Servicio técnico", "Limpieza y mantenimiento"],
  [/^(PANTALLA|FLEX|BISAGRA|CARCASA|TOUCHPAD|PUERTO DC|JACK DC)\b/, "Servicio técnico", "Repuestos de laptop"],
  // Cables y adaptadores
  [/^CABLE\b.*\b(HDMI|VGA|DISPLAY ?PORT|DISPLAY|DVI)\b/, "Cables y adaptadores", "Cables de video"],
  [/^CABLE\b/, "Cables y adaptadores", "Cables USB y datos"],
  [/^(ADAPTADOR|CONVERTIDOR|HUB|EXTENSION USB|UGREEN PLUG|SPLITT?ER|UNION HDMI)\b/, "Cables y adaptadores", "Adaptadores y hubs"],
  // Gaming, mobiliario y software
  [/^SILLA (GAMING|GAMER)\b/, "Gaming", "Sillas gamer"],
  [/^(SILLA|ESCRITORIO|MESA)\b/, "Mobiliario", null],
  [/^(CONTROL PARA|GAMEPAD|JOYSTICK)\b/, "Gaming", "Controles"],
  [/\b(LICENCIA|KASPERSKY|ANTIVIRUS|ESET)\b/, "Software", "Antivirus"],
  // Accesorios
  [/^(MOCHILA|BOLSO|ESTUCHE|MALETIN|FUNDA)\b/, "Accesorios", "Mochilas y estuches"],
];

// Si ninguna regla coincide: según la categoría del sistema contable.
const POR_CATEGORIA_CONTABLE: Record<string, Ubicacion> = {
  ACCESORIOS: { categoria: "Accesorios", sub: null },
  SUMINISTROS: { categoria: "Impresión", sub: "Tintas y tóners" },
  "SUMINISTROS RICOH": { categoria: "Impresión", sub: "Tintas y tóners" },
  "REPUESTOS RICOH": { categoria: "Impresión", sub: "Repuestos de impresora" },
  "SERVICIO TECNICO": { categoria: "Servicio técnico", sub: null },
  REDES: { categoria: "Redes", sub: null },
  CARGADOR: { categoria: "Energía", sub: "Cargadores" },
  ENERGIA: { categoria: "Energía", sub: null },
  COMPONENTES: { categoria: "Componentes", sub: null },
  SEGURIDAD: { categoria: "Hogar", sub: "Cámaras de seguridad" },
  "CABLE DE DATOS": { categoria: "Cables y adaptadores", sub: "Cables USB y datos" },
  "CABLE DE VIDEO": { categoria: "Cables y adaptadores", sub: "Cables de video" },
  CONVERTIDOR: { categoria: "Cables y adaptadores", sub: "Adaptadores y hubs" },
  ADAPTADOR: { categoria: "Cables y adaptadores", sub: "Adaptadores y hubs" },
  MOBILIARIOS: { categoria: "Mobiliario", sub: null },
  MONITOR: { categoria: "Monitores", sub: null },
  "PUNTO DE VENTA": { categoria: "Impresión", sub: "Punto de venta" },
  ALMACENAMIENTO: { categoria: "Almacenamiento", sub: null },
  DISCO: { categoria: "Almacenamiento", sub: null },
  DESTOKP: { categoria: "Computadores", sub: "Escritorio" },
};

export function ubicarProducto(nombre: string, categoriaContable: string): Ubicacion {
  const n = clave(nombre);
  for (const [re, categoria, sub] of REGLAS) if (re.test(n)) return { categoria, sub };
  return POR_CATEGORIA_CONTABLE[clave(categoriaContable)] ?? { categoria: "Accesorios", sub: null };
}

// ───────────── Marcas ─────────────
// Se busca la marca dentro del NOMBRE (el sistema contable casi siempre dice "MARCA GENERICA").
// [cómo aparece en el nombre (regex), nombre de la marca en la tienda]
const MARCAS_CONOCIDAS: [RegExp, string][] = [
  [/\bHP\b|\bHEWLETT/, "HP"],
  [/\bDELL\b/, "Dell"],
  [/\bLENOVO\b/, "Lenovo"],
  [/\bASUS\b/, "ASUS"],
  [/\bACER\b/, "Acer"],
  [/\bMSI\b/, "MSI"],
  [/\bEPSON\b/, "Epson"],
  [/\bCANON\b|\bCANNON\b/, "Canon"],
  [/\bBROTHER\b/, "Brother"],
  [/\bRICOH\b/, "Ricoh"],
  [/\bZEBRA\b/, "Zebra"],
  [/\b3NSTAR\b/, "3nStar"],
  [/\bGENIUS\b/, "Genius"],
  [/\bXTRIKE\b/, "Xtrike Me"],
  [/\bMARVO?\b/, "Marvo"],
  [/\bMEETION\b/, "Meetion"],
  [/\bREDRAGON\b/, "Redragon"],
  [/\bLOGITECH\b/, "Logitech"],
  [/\bSPEEDMIND\b/, "Speedmind"],
  [/\bALTEK\b/, "Altek"],
  [/\bANERA\b/, "Anera"],
  [/\bDELTA\b/, "Delta"],
  [/\bTP.?LINK\b/, "TP-Link"],
  [/\bMERCUSYS\b/, "Mercusys"],
  [/\bUGREEN\b/, "Ugreen"],
  [/\bLDNIO\b/, "LDNIO"],
  [/\bTRANYOO\b/, "Tranyoo"],
  [/\bKINGSTON\b/, "Kingston"],
  [/\bADATA\b/, "ADATA"],
  [/\bLEXAR\b/, "Lexar"],
  [/\bVERBATIM\b/, "Verbatim"],
  [/\bCRUCIAL\b/, "Crucial"],
  [/\bSAMSUNG\b/, "Samsung"],
  [/\bT-?FORCE\b/, "T-Force"],
  [/\bINTEL\b/, "Intel"],
  [/\bAMD\b|\bRYZEN\b/, "AMD"],
  [/\bANTEC\b/, "Antec"],
  [/\bCOOLER MASTER\b/, "Cooler Master"],
  [/\bGAMEMAX\b/, "GameMax"],
  [/\bGIGABYTE\b/, "Gigabyte"],
  [/\bEVGA\b/, "EVGA"],
  [/\bZOTAC\b/, "Zotac"],
  [/\bNZXT\b/, "NZXT"],
  [/\bAZZA\b/, "Azza"],
  [/\bARCTIC\b/, "Arctic"],
  [/\bINFINYTEK\b/, "Infinytek"],
  [/\bTEROS\b/, "Teros"],
  [/\bAOC\b/, "AOC"],
  [/\bQUASAD\b/, "Quasad"],
  [/\bRAYWEGO\b/, "Raywego"],
  [/\bHIKVISION\b|\bHILOOK\b/, "Hikvision"],
  [/\bAPC\b/, "APC"],
  [/\bCDP\b/, "CDP"],
  [/\bABLEREX\b/, "Ablerex"],
  [/\bINTERCOPY\b/, "Intercopy"],
  [/\bKASPERSKY\b/, "Kaspersky"],
  [/\bAMERICAN XTREME\b/, "American Xtreme"],
  [/\bVIGGO\b/, "Viggo"],
  [/\bNETCOM\b/, "Netcom"],
  [/\bK-?BYTE\b/, "K-Byte"],
  [/\bKINGSPEC\b/, "KingSpec"],
  [/\bIKON\b/, "Ikon"],
  [/\bADVANCED\b/, "Advanced"],
  [/\bAOWEIXUN\b/, "Aoweixun"],
];

const GENERICA = /^MARCA GENERIC?A?$|^GENERIC|^SIN MARCA$|^$/;

/** Marca para la tienda: primero la que aparece en el nombre, luego la del sistema contable (si no es genérica). */
export function marcaProducto(nombre: string, marcaContable: string): string | null {
  const n = clave(nombre);
  for (const [re, marca] of MARCAS_CONOCIDAS) if (re.test(n)) return marca;
  const m = clave(marcaContable);
  if (GENERICA.test(m)) return null;
  for (const [re, marca] of MARCAS_CONOCIDAS) if (re.test(m)) return marca;
  return nombreLegible(marcaContable);
}

// ───────────── Nombre legible ─────────────
// "MOUSE GENIUS USB DX-101 NEGRO" → "Mouse Genius USB DX-101 Negro"
const SIGLAS = new Set(
  "USB HDMI VGA DVI RAM SSD HDD DDR DDR3 DDR4 DDR5 HD FHD UHD QHD WUXGA UPS RGB ARGB LED LCD IPS PC CPU GPU AMD HP MSI ASUS AOC APC CDP NZXT EVGA TUF ROG RTX GTX OS AC DC AA AAA LAN WIFI POS UTP CCA CU AL NL BK WH SP RJ45 RJ11 PCI PCIE ATX OTG IC PSU NVME SATA IDE LT TD AVR VA OB OC XL XXL UV SSF AIO TP-LINK LDNIO ADATA 3NSTAR II III".split(" "),
);
const MINUSCULAS = new Set("de del para con y a e o en por sin la el los las al x".split(" "));

export function nombreLegible(original: string): string {
  const palabras = original.replace(/\s+/g, " ").trim().split(" ");
  return palabras
    .map((p, i) => {
      const up = p.toUpperCase();
      const limpio = sinTildes(up).replace(/[^A-Z0-9-]/g, "");
      if (SIGLAS.has(limpio) || /\d/.test(p)) return up; // siglas y modelos (DX-101, 16GB, 15.6)
      if (!/[AEIOUÁÉÍÓÚ]/i.test(p) && p.length <= 4) return up; // abreviaturas sin vocales (BK, PCS)
      const low = p.toLowerCase();
      if (i > 0 && MINUSCULAS.has(low)) return low;
      // Respeta separadores: "GRIS/ROSADA" → "Gris/Rosada", "TECLADO-MOUSE" → "Teclado-Mouse"
      return low.replace(/(^|[\/\-(])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toUpperCase());
    })
    .join(" ");
}
