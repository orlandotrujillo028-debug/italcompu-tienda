-- CreateEnum
CREATE TYPE "EstadoDistribuidor" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'SUSPENDIDO');

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "VendorProfile" DROP CONSTRAINT "VendorProfile_userId_fkey";

-- DropIndex
DROP INDEX "OrderItem_vendorId_idx";

-- DropIndex
DROP INDEX "Product_vendorId_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "descuentoDistribuidor" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "estado",
DROP COLUMN "vendorId";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "vendorId";

-- DropTable
DROP TABLE "DistributorRequest";

-- DropTable
DROP TABLE "VendorProfile";

-- DropEnum
DROP TYPE "EstadoSolicitud";

-- DropEnum
DROP TYPE "EstadoVendedor";

-- CreateTable
CREATE TABLE "DistributorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreLocal" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "tipoNegocio" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT NOT NULL,
    "estado" "EstadoDistribuidor" NOT NULL DEFAULT 'PENDIENTE',
    "motivoRechazo" TEXT,
    "aprobadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DistributorProfile_userId_key" ON "DistributorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DistributorProfile_ruc_key" ON "DistributorProfile"("ruc");

-- CreateIndex
CREATE INDEX "DistributorProfile_estado_idx" ON "DistributorProfile"("estado");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- AddForeignKey
ALTER TABLE "DistributorProfile" ADD CONSTRAINT "DistributorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
