import { Sidebar } from '@/components/shared/sidebar'
import { Header } from '@/components/shared/header'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Fetch user from Supabase session
  const mockUser = {
    firstName: 'Admin',
    lastName: 'Usuario',
    email: 'admin@clinica.com',
    role: 'admin',
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={mockUser} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
