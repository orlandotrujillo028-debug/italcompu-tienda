/*
 * DATOS LEGALES Y SUCURSALES DE ITALCOMPU — ✏️ EDITA AQUÍ
 * Se usan en las páginas de Quiénes somos, Contacto, Términos, Garantía y Protección de datos.
 * Los datos de contacto (teléfono, WhatsApp, correo, horario, dirección de la matriz)
 * se editan en Admin → Configuración.
 */

export const EMPRESA = {
  nombreComercial: "ITALCOMPU",
  // ⚠️ Completa con los datos reales del RUC antes de publicar la tienda.
  razonSocial: "[Razón social de ITALCOMPU]",
  ruc: "[RUC de ITALCOMPU]",
  ciudad: "Quito",
  // Año en que empezó el negocio (se usa en "Quiénes somos").
  desde: 2010,
  // Correo para trámites de datos personales (derechos ARCO). Puede ser el mismo de contacto.
  correoDatosPersonales: "", // vacío = se usa el correo de contacto de la Configuración
  // Fecha de la última actualización de los textos legales.
  actualizacionLegal: "8 de noviembre de 2026",
};

/** Sucursales que aparecen en /contacto (la primera es la matriz). */
export const SUCURSALES: {
  nombre: string;
  direccion: string; // vacío = se usa la dirección de la matriz de la Configuración
  ciudad: string;
  telefono?: string;
  horario?: string;
  /** Texto que se busca en el mapa (dirección + ciudad). */
  mapa?: string;
}[] = [
  { nombre: "Matriz", direccion: "", ciudad: "Quito" },
  // Ejemplo para agregar otra sucursal:
  // { nombre: "Sucursal Norte", direccion: "Av. de la Prensa N45-12", ciudad: "Quito", telefono: "02 000 0001", horario: "Lun a Sáb 9:00–19:00" },
];
