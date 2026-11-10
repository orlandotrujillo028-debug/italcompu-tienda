-- Productos que el admin volvió a mostrar a mano aunque no estén en el Excel de la sucursal.
ALTER TABLE "Product" ADD COLUMN "stockManual" BOOLEAN NOT NULL DEFAULT false;
