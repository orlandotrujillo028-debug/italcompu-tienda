-- Utilidad por categoría y precio de distribuidor por producto (precios calculados desde el costo).
ALTER TABLE "Category" ADD COLUMN "utilidadPublico" DECIMAL(6,2);

ALTER TABLE "Product" ADD COLUMN "precioDistribuidorSinIva" DECIMAL(10,4);
-- Valor inicial: costo + 25 % cuando el público es costo + 35 % (luego se recalcula desde el costo).
UPDATE "Product" SET "precioDistribuidorSinIva" = round("precioSinIva" * 1.25 / 1.35, 4);
ALTER TABLE "Product" ALTER COLUMN "precioDistribuidorSinIva" SET NOT NULL;
