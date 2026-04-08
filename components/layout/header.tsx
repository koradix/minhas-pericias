'use client'

import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
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
          className="flex h-10 px-2 flex-shrink-0 items-center justify-center rounded-none text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-900 transition-all lg:hidden"
          aria-label="Abrir menu"
        >
          Menu
        </button>

        <div className="flex items-center gap-2 min-w-0">
          {section && (
            <>
              <span className="hidden sm:block text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{section}</span>
              <span className="hidden sm:block text-slate-200 text-xs">/</span>
            </>
          )}
          <h2 className="text-lg font-bold text-slate-900 tracking-tight truncate">{title}</h2>
        </div>
      </div>

      {/* ── Center — search ── */}
      <div className="hidden md:flex flex-1 max-w-sm">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Buscar por processo, nome ou tribunal..."
            className="w-full h-10 pl-2 pr-3 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-300 border-0 border-b border-slate-100 focus:border-slate-900 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Notifications */}
        <button
          className="relative flex h-10 px-3 items-center justify-center rounded-none text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
          title="Notificações"
        >
          Alertas
          <span className="absolute right-0 top-3 flex h-1.5 w-1.5 rounded-full bg-[#a3e635]" />
        </button>

        {/* User menu */}
        <div className="relative ml-2 group">
          <button
            className="flex items-center gap-3 rounded-none px-2 py-1.5 transition-all"
            title={user.name}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-none bg-slate-900 text-white text-[11px] font-bold select-none tracking-widest">
              {getInitials(user.name)}
            </div>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-0 w-60 rounded-none bg-white border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-2xl shadow-black/5">
            {/* User info */}
            <div className="px-5 py-5 border-b border-slate-100 bg-slate-50 overflow-hidden">
              <p className="text-[13px] font-bold text-slate-900 truncate uppercase tracking-tight">{user.name}</p>
              <p className="text-[12px] text-slate-400 font-medium truncate mt-1">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="p-0">
              <Link
                href="/contatos"
                className="flex w-full items-center gap-3 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                Contatos
              </Link>
              <Link
                href="/parceiros"
                className="flex w-full items-center gap-3 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                Parceiros
              </Link>
              <div className="h-[1px] bg-slate-100" />
              <button className="flex w-full items-center gap-3 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
                Configurações
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-3 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all border-t border-red-50"
              >
                Encerrar Sessão
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
