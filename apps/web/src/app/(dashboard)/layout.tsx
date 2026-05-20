import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const navItems = [
  { href: '/dashboard',              icon: '🏠', label: 'Início' },
  { href: '/dashboard/products',     icon: '📦', label: 'Produtos' },
  { href: '/dashboard/transactions', icon: '🔄', label: 'Movimentações' },
  { href: '/dashboard/analytics',    icon: '📊', label: 'Análise ABC' },
  { href: '/dashboard/kanban',       icon: '📋', label: 'Kanban' },
  { href: '/dashboard/team',         icon: '👥', label: 'Equipe' },
  { href: '/dashboard/reports',      icon: '📄', label: 'Relatórios' },
  { href: '/dashboard/settings',     icon: '⚙️', label: 'Configurações' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-[#E5E7EB] flex flex-col">
        <div className="p-6 border-b border-[#E5E7EB]">
          <span className="text-2xl">📦</span>
          <h1 className="text-lg font-bold text-[#1A1C2E] mt-1">EstoqueApp</h1>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1C2E] transition-colors text-sm font-medium"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB]">
          <p className="text-xs text-[#9CA3AF] truncate">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
