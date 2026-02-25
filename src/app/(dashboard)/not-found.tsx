import Link from 'next/link'

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 text-8xl font-bold text-[#A67C52]">404</div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Seccion no encontrada
        </h2>
        <p className="mb-6 text-muted-foreground">
          La seccion que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[#A67C52] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#8a6543]"
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}
