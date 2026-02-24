import { MedLuxeLogoSimple } from '@/components/shared/medluxe-logo'
import { Toaster } from '@/components/ui/sonner'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-[#A67C52] via-[#8a6543] to-[#6d5035] p-12 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <MedLuxeLogoSimple inverted />
        </div>

        <div className="space-y-6 relative z-10">
          <blockquote className="space-y-4">
            <p className="text-xl font-light leading-relaxed italic">
              &ldquo;Este sistema ha transformado la manera en que gestionamos
              nuestra clínica. La eficiencia ha aumentado un 40% y nuestros
              pacientes están más satisfechos que nunca.&rdquo;
            </p>
            <footer className="text-sm opacity-80 font-medium">
              — Dr. Pamela Moquete, Directora Médica
            </footer>
          </blockquote>
        </div>

        <p className="text-sm opacity-60 relative z-10 tracking-wider uppercase">
          Aesthetics & Wellness Management System
        </p>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2 bg-gradient-to-br from-[#FDFCFA] to-white">
        <div className="w-full max-w-md">{children}</div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'bg-card border-border shadow-luxury-lg',
          },
        }}
      />
    </div>
  )
}
