import { Stethoscope } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold">Clínica Estética</span>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Este sistema ha transformado la manera en que gestionamos
              nuestra clínica. La eficiencia ha aumentado un 40% y nuestros
              pacientes están más satisfechos que nunca.&rdquo;
            </p>
            <footer className="text-sm opacity-80">
              — Dra. María González, Directora Médica
            </footer>
          </blockquote>
        </div>

        <p className="text-sm opacity-60">
          Sistema de Gestión para Clínicas Estéticas
        </p>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
