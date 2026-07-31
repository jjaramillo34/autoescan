"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es-EC">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f7f5f0",
          color: "#1a1f2e",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "80px 16px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>AutoEscán</h1>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Ocurrió un error inesperado. Intenta recargar.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: "#c45c26",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
