-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "precioSinIva" SET DATA TYPE DECIMAL(10,4);

-- CreateTable
CREATE TABLE "InventarioCarga" (
    "id" TEXT NOT NULL,
    "sucursal" TEXT NOT NULL,
    "archivo" TEXT NOT NULL,
    "userId" TEXT,
    "totalProductos" INTEGER NOT NULL,
    "totalUnidades" DECIMAL(14,3) NOT NULL,
    "totalCosto" DECIMAL(14,4) NOT NULL,
    "totalPvp" DECIMAL(14,4) NOT NULL,
    "aplicadaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventarioCarga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventarioItem" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "stock" DECIMAL(12,3) NOT NULL,
    "costo" DECIMAL(12,4) NOT NULL,
    "pvp" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "InventarioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventarioCarga_sucursal_createdAt_idx" ON "InventarioCarga"("sucursal", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventarioItem_cargaId_codigo_key" ON "InventarioItem"("cargaId", "codigo");

-- AddForeignKey
ALTER TABLE "InventarioCarga" ADD CONSTRAINT "InventarioCarga_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioItem" ADD CONSTRAINT "InventarioItem_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "InventarioCarga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

