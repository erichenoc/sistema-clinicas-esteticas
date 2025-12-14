import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portal | Med Luxe',
  description: 'Portal de acceso para pacientes y profesionales',
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A67C52]/5 via-background to-[#A67C52]/10">
      {children}
    </div>
  )
}
