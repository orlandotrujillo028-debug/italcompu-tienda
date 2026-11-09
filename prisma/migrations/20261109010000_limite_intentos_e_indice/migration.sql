-- CreateTable
CREATE TABLE "LimiteIntento" (
    "clave" TEXT NOT NULL,
    "conteo" INTEGER NOT NULL DEFAULT 0,
    "expira" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LimiteIntento_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE INDEX "LimiteIntento_expira_idx" ON "LimiteIntento"("expira");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
