import { Sidebar } from '@/components/shared/sidebar'
import { HeaderWrapper } from '@/components/shared/header-wrapper'
import { Toaster } from '@/components/ui/sonner'
import { UserProvider } from '@/contexts/user-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <HeaderWrapper />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>

        <Toaster position="top-right" />
      </div>
    </UserProvider>
  )
}
