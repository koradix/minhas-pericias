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
    <header className="sticky top-0 z-10 flex h-20 flex-shrink-0 items-center justify-between bg-white px-6 lg:px-10 gap-8 border-b border-slate-100">
      
      {/* ── Left — breadcrumb ── */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-none text-slate-400 hover:text-[#1f2937] hover:bg-slate-50 transition-all lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          {section && (
            <>
              <span className="hidden sm:block text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{section}</span>
              <ChevronRight className="hidden sm:block h-3 w-3 text-slate-200 flex-shrink-0" />
            </>
          )}
          <h2 className="text-lg font-black text-[#1f2937] tracking-tighter truncate font-manrope">{title}</h2>
        </div>
      </div>

      {/* ── Center — search ── */}
      <div className="hidden md:flex flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Buscar por processo, nome ou tribunal..."
            className="w-full h-10 pl-8 pr-3 bg-transparent text-sm font-bold text-[#1f2937] placeholder:text-slate-300 border-0 border-b border-slate-100 focus:border-[#1f2937] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Search icon — mobile */}
        <button
          className="flex md:hidden h-10 w-10 items-center justify-center rounded-none text-slate-400 hover:bg-slate-50 transition-all"
          title="Buscar"
        >
          <Search className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-none text-slate-400 hover:text-[#1f2937] hover:bg-slate-50 transition-all"
          title="Notificações"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          <span className="absolute right-2.5 top-2.5 flex h-2 w-2 rounded-full border-2 border-white bg-[#84cc16]" />
        </button>

        {/* User menu */}
        <div className="relative ml-2 group">
          <button
            className="flex items-center gap-3 rounded-none px-2 py-1.5 transition-all"
            title={user.name}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-none bg-[#1f2937] text-white text-[11px] font-black select-none tracking-widest font-manrope">
              {getInitials(user.name)}
            </div>
            <span className="hidden sm:block text-[11px] font-black text-[#1f2937] uppercase tracking-widest max-w-[100px] truncate">
              {user.name.split(' ')[0]}
            </span>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-0 w-60 rounded-none bg-white border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-2xl shadow-black/5">
            {/* User info */}
            <div className="px-5 py-5 border-b border-slate-100 bg-slate-50 overflow-hidden">
              <p className="text-[13px] font-black text-[#1f2937] truncate uppercase tracking-tight">{user.name}</p>
              <p className="text-[12px] text-slate-400 font-medium truncate mt-1">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="p-0">
              <Link
                href="/contatos"
                className="flex w-full items-center gap-3 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-[#1f2937] transition-all"
              >
                <Users className="h-4 w-4" strokeWidth={2} />
                Contatos
              </Link>
              <Link
                href="/parceiros"
                className="flex w-full items-center gap-3 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-[#1f2937] transition-all"
              >
                <Handshake className="h-4 w-4" strokeWidth={2} />
                Parceiros
              </Link>
              <div className="h-[1px] bg-slate-100" />
              <button className="flex w-full items-center gap-3 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-[#1f2937] transition-all">
                <Settings className="h-4 w-4" strokeWidth={2} />
                Configurações
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-3 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all border-t border-red-50"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
                Encerrar Sessão
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
