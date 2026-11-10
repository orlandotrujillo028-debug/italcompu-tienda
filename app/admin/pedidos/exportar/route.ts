import { NextResponse, type NextRequest } from "next/server";
import { getUsuarioActual } from "@/lib/auth-guards";
import { celdaCsv } from "@/lib/csv";
import { leerFiltroPedidos } from "@/lib/filtro-pedidos";
import { ESTADOS_PEDIDO, METODOS_PAGO_TEXTO, type DireccionPedido } from "@/lib/pedidos-ui";
import { prisma } from "@/lib/prisma";

/**
 * GET /admin/pedidos/exportar?estado=&q=&desde=&hasta=  → archivo CSV (solo ADMIN).
 * Formato para Excel en español: separador ";" , decimales con coma y BOM UTF-8 (tildes correctas).
 */
export async function GET(req: NextRequest) {
  const usuario = await getUsuarioActual();
  if (usuario?.rol !== "ADMIN") return new NextResponse("No autorizado", { status: 403 });

  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const { where, desde, hasta } = leerFiltroPedidos({ ...sp, estado: sp.estado ?? "todos" });
  const pedidos = await prisma.order.findMany({
    where,
    orderBy: { numero: "asc" },
    take: 5000,
    select: {
      numero: true, createdAt: true, estado: true, metodoPago: true, referenciaPago: true, descuentoDistribuidor: true,
      subtotal: true, iva: true, envio: true, total: true, direccionEnvio: true, courier: true, guiaEnvio: true,
      user: { select: { name: true, email: true, cedula: true, telefono: true } },
      _count: { select: { items: true } },
    },
  });

  const celda = celdaCsv;
  const dinero = (v: { toString(): string }) => Number(v).toFixed(2).replace(".", ",");
  const fecha = (d: Date) => new Date(d.getTime() - 5 * 3600_000).toISOString().replace("T", " ").slice(0, 16); // hora de Ecuador

  const encabezado = ["Pedido", "Fecha (Ecuador)", "Cliente", "Correo", "Cédula/RUC", "Teléfono", "Tipo", "Estado", "Pago", "Referencia", "Productos", "Subtotal sin IVA", "IVA", "Envío", "Total", "Entrega", "Ciudad", "Provincia", "Courier", "Guía"];
  const filas = pedidos.map((p) => {
    const d = p.direccionEnvio as DireccionPedido;
    return [
      p.numero, fecha(p.createdAt), p.user.name, p.user.email, p.user.cedula, p.user.telefono,
      Number(p.descuentoDistribuidor) > 0 ? `Distribuidor (${Number(p.descuentoDistribuidor)} %)` : "Público",
      ESTADOS_PEDIDO[p.estado].texto, METODOS_PAGO_TEXTO[p.metodoPago], p.referenciaPago, p._count.items,
      dinero(p.subtotal), dinero(p.iva), dinero(p.envio), dinero(p.total),
      d.tipo === "RETIRO" ? "Retiro en tienda" : "Domicilio", d.ciudad, d.provincia, p.courier, p.guiaEnvio,
    ].map(celda).join(";");
  });

  const nombre = `pedidos-italcompu${desde ? `-desde-${desde}` : ""}${hasta ? `-hasta-${hasta}` : ""}.csv`;
  return new NextResponse("﻿" + [encabezado.join(";"), ...filas].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
