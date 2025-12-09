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
      <div className="flex h-screen overflow-hidden bg-[#FDFCFA]">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <HeaderWrapper />
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#FDFCFA] via-white to-[#f5f3f0] p-4 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
              {children}
            </div>
          </main>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e8e4df',
              borderRadius: '1rem',
              boxShadow: '0 10px 40px -4px rgba(166, 124, 82, 0.12)',
            },
          }}
        />
      </div>
    </UserProvider>
  )
}
