'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 text-6xl">⚠️</div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Error en el sistema
        </h2>
        <p className="mb-6 text-muted-foreground">
          Ocurrio un error al cargar esta seccion. Por favor intenta de nuevo.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-[#A67C52] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#8a6543]"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
