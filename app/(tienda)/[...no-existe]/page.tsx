import { notFound } from "next/navigation";

// Cualquier dirección que no existe cae aquí y muestra el 404 de la tienda
// (con header, menú y footer) en lugar de una página en blanco.
export default function RutaInexistente() {
  notFound();
}
