"use client";

import { ErrorPagina } from "@/components/estados/error-pagina";

export default function ErrorSeccion({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPagina error={error} reset={reset} inicio="/vendedor" />;
}
