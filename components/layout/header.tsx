'use client'

import { usePathname } from 'next/navigation'
import { Menu, Bell, Search, ChevronRight } from 'lucide-react'
import { navigation } from '@/lib/constants/nav'

interface HeaderProps {
  onMenuClick: () => void
}

const allNavItems = navigation.flatMap((s) => s.items)

function getPageTitle(pathname: string): string {
  const item = allNavItems.find((i) =>
    i.href === '/dashboard' ? pathname === '/dashboard' : pathname === i.href || pathname.startsWith(i.href + '/')
  )
  return item?.title ?? 'Minhas Perícias'
}

function getPageSection(pathname: string): string | null {
  for (const section of navigation) {
    if (section.items.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))) {
      return section.title !== 'Principal' ? section.title : null
    }
  }
  return null
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const section = getPageSection(pathname)

  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 gap-4">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0">
          {section && (
            <>
              <span className="text-sm text-slate-400 hidden sm:block">{section}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden sm:block flex-shrink-0" />
            </>
          )}
          <h2 className="text-sm font-semibold text-slate-900 truncate">{title}</h2>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Buscar"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        <div className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold cursor-pointer select-none ring-2 ring-blue-100">
          MP
        </div>
      </div>
    </header>
  )
}
