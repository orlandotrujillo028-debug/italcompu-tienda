"use client";

// Último recurso: si falla hasta el layout principal. Debe incluir <html> y <body>.
export default function ErrorGlobal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#f4f5f7", color: "#0b2f8a", textAlign: "center" }}>
        <div>
          <h1>Algo salió mal</h1>
          <p style={{ color: "#555" }}>Estamos trabajando para solucionarlo. Intenta de nuevo en unos minutos.</p>
          <button onClick={reset} style={{ background: "#0a6db3", color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
