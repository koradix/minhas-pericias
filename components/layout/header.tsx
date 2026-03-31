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
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between bg-[#f8f9ff] px-4 lg:px-6 gap-4">

      {/* ── Left — breadcrumb ── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#9ca3af] hover:bg-white hover:text-[#374151] transition-all lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          {section && (
            <>
              <span className="hidden sm:block text-[12px] text-[#9ca3af] font-medium tracking-wide">{section}</span>
              <ChevronRight className="hidden sm:block h-3 w-3 text-[#d1d5db] flex-shrink-0" />
            </>
          )}
          <span className="text-[14px] font-semibold text-[#1f2937] truncate font-manrope">{title}</span>
        </div>
      </div>

      {/* ── Center — search ── */}
      <div className="hidden md:flex flex-1 max-w-[280px]">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] pointer-events-none" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white text-[13px] text-[#374151] placeholder:text-[#9ca3af] border-0 focus:outline-none focus:ring-2 focus:ring-[#416900]/20 transition-all shadow-none"
          />
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* Search icon — mobile */}
        <button
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-[#9ca3af] hover:bg-white hover:text-[#374151] transition-all"
          title="Buscar"
        >
          <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#9ca3af] hover:bg-white hover:text-[#374151] transition-all"
          title="Notificações"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span className="absolute right-2 top-2 flex h-1.5 w-1.5 rounded-full bg-[#84cc16]" />
        </button>

        {/* User menu */}
        <div className="relative ml-1.5 group">
          <button
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white transition-all"
            title={user.name}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#416900] text-white text-[11px] font-bold select-none tracking-wide">
              {getInitials(user.name)}
            </div>
            <span className="hidden sm:block text-[13px] font-medium text-[#374151] max-w-[88px] truncate">
              {user.name.split(' ')[0]}
            </span>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-[0_24px_48px_-12px_rgba(31,41,55,0.06)]">
            {/* User info */}
            <div className="px-4 py-3.5 border-b border-[#f2f3f9]">
              <p className="text-[13px] font-semibold text-[#1f2937] truncate">{user.name}</p>
              <p className="text-[12px] text-[#9ca3af] truncate mt-0.5">{user.email}</p>
              <span className="inline-block mt-2 text-[10px] font-semibold bg-[#f2f3f9] text-[#6b7280] px-2 py-0.5 rounded-md capitalize tracking-wide uppercase">
                {user.role}
              </span>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <Link
                href="/contatos"
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#6b7280] hover:bg-[#f8f9ff] hover:text-[#374151] transition-all"
              >
                <Users className="h-4 w-4 text-[#9ca3af]" strokeWidth={1.5} />
                Contatos
              </Link>
              <Link
                href="/parceiros"
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#6b7280] hover:bg-[#f8f9ff] hover:text-[#374151] transition-all"
              >
                <Handshake className="h-4 w-4 text-[#9ca3af]" strokeWidth={1.5} />
                Parceiros
              </Link>
              <div className="my-1 border-t border-[#f2f3f9]" />
              <button className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#6b7280] hover:bg-[#f8f9ff] hover:text-[#374151] transition-all">
                <Settings className="h-4 w-4 text-[#9ca3af]" strokeWidth={1.5} />
                Configurações
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#6b7280] hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
