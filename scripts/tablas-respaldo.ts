// Tablas que guarda `npm run respaldo`, en el ORDEN en que `npm run restaurar` las vuelve a crear
// (primero las que no dependen de otras). Si agregas un modelo nuevo en schema.prisma, agrégalo aquí.
export const TABLAS = [
  "user",
  "account",
  "session",
  "verificationToken",
  "distributorProfile",
  "category",
  "brand",
  "product",
  "productImage",
  "wishlistItem",
  "address",
  "order",
  "orderItem",
  "banner",
  "setting",
  "activityLog",
  "inventarioCarga",
  "inventarioItem",
  "limiteIntento",
] as const;
