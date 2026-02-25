import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 text-8xl font-bold text-[#A67C52]">404</div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Pagina no encontrada
        </h2>
        <p className="mb-6 text-muted-foreground">
          La pagina que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[#A67C52] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#8a6543]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
