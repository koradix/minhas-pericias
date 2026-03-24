'use client'

import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Menu, Bell, Search, LogOut, Settings, ChevronRight, Users, Handshake } from 'lucide-react'
import { navigation, navigationParceiro } from '@/lib/constants/nav'

interface HeaderProps {
  onMenuClick: () => void
  user: { name: string; email: string; role: string }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function getPageInfo(
  pathname: string,
  role: string,
): { title: string; section: string | null } {
  const nav = role === 'parceiro' ? navigationParceiro : navigation
  const allItems = nav.flatMap((s) => s.items)

  const item = allItems.find((i) =>
    i.href === '/dashboard' || i.href === '/parceiro/dashboard'
      ? pathname === i.href
      : pathname === i.href || pathname.startsWith(i.href + '/'),
  )

  let section: string | null = null
  if (item) {
    for (const s of nav) {
      if (s.items.some((i) => i.href === item.href)) {
        section = s.title !== 'Principal' ? s.title : null
        break
      }
    }
  }

  return { title: item?.title ?? 'Perilab', section }
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  const pathname = usePathname()
  const { title, section } = getPageInfo(pathname, user.role)

  return (
    <header className="sticky top-0 z-10 flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-sm px-4 lg:px-5 gap-4">

      {/* ── Left — breadcrumb ── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          {section && (
            <>
              <span className="hidden sm:block text-xs text-slate-400 font-medium">{section}</span>
              <ChevronRight className="hidden sm:block h-3 w-3 text-slate-300 flex-shrink-0" />
            </>
          )}
          <span className="text-[13px] font-semibold text-slate-700 truncate">{title}</span>
        </div>
      </div>

      {/* ── Center — search ── */}
      <div className="hidden md:flex flex-1 max-w-[260px]">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-lime-500/20 transition-colors"
          />
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-0.5 flex-shrink-0">

        {/* Search icon — mobile */}
        <button
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title="Buscar"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title="Notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 flex h-1.5 w-1.5 rounded-full bg-lime-500" />
        </button>

        {/* User menu */}
        <div className="relative ml-1 group">
          <button
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors"
            title={user.name}
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-white text-[10px] font-bold select-none tracking-wide">
              {getInitials(user.name)}
            </div>
            <span className="hidden sm:block text-[12px] font-medium text-slate-700 max-w-[88px] truncate">
              {user.name.split(' ')[0]}
            </span>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
            {/* User info */}
            <div className="px-3.5 py-3 border-b border-slate-100">
              <p className="text-[12px] font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
              <span className="inline-block mt-1.5 text-[9px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md capitalize tracking-wide uppercase">
                {user.role}
              </span>
            </div>

            {/* Actions */}
            <div className="p-1">
              <Link
                href="/contatos"
                className="flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Contatos
              </Link>
              <Link
                href="/parceiros"
                className="flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Handshake className="h-3.5 w-3.5 text-slate-400" />
                Parceiros
              </Link>
              <div className="my-1 border-t border-slate-100" />
              <button className="flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-slate-600 hover:bg-slate-50 transition-colors">
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                Configurações
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
