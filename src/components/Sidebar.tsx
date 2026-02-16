'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings,
  PlusCircle,
  FileCheck,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rechnungen', label: 'Rechnungen', icon: FileText },
  { href: '/rechnungen/neu', label: 'Neue Rechnung', icon: PlusCircle },
  { href: '/angebote', label: 'Angebote', icon: FileCheck },
  { href: '/kunden', label: 'Kunden', icon: Users },
  { href: '/produkte', label: 'Produkte', icon: Package },
  { href: '/mahnungen', label: 'Mahnungen', icon: AlertTriangle },
  { href: '/berichte', label: 'Berichte', icon: TrendingUp },
  { href: '/einstellungen', label: 'Einstellungen', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-sm">
            📄
          </span>
          Rechnung Pro
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-green-500 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500">
          © 2026 Rechnung Pro
        </div>
      </div>
    </aside>
  )
}
