'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  navigation,
  navigationParceiro,
  bottomNavigation,
  bottomNavigationParceiro,
} from '@/lib/constants/nav'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  role: string
  onMobileClose: () => void
  onToggleCollapse: () => void
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  role,
  onMobileClose,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname()
  const activeNav = role === 'parceiro' ? navigationParceiro : navigation
  const activeBottom = role === 'parceiro' ? bottomNavigationParceiro : bottomNavigation

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/parceiro/dashboard') return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-50 border-r border-slate-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-[240px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      )}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex h-20 flex-shrink-0 items-center border-b border-slate-50',
          collapsed ? 'justify-center px-1' : 'justify-between px-6',
        )}
      >
        {collapsed ? (
          <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 bg-white border-2 border-slate-900 group-hover:border-[#a3e635] transition-colors">
            <span className="text-xl font-black text-slate-900">P</span><span className="text-xl font-black text-[#a3e635]">L</span>
          </Link>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center min-w-0">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Peri<span className="text-[#a3e635]">LaB</span>
              </span>
            </Link>
            <button
              onClick={onMobileClose}
              className="lg:hidden text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
            >
              FECHAR
            </button>
          </>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-8 space-y-8">
        {activeNav.map((section) => (
          <div key={section.title} className="px-0">
            {/* Section label */}
            {!collapsed && (
              <p className="mb-4 px-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {section.title}
              </p>
            )}
            {collapsed && <div className="mx-4 mb-4 border-t border-slate-50" />}

            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.title : undefined}
                      onClick={onMobileClose}
                      className={cn(
                        'flex items-center transition-all duration-200 border-l-4',
                        collapsed
                          ? cn(
                              'justify-center h-12 w-full',
                              active
                                ? 'bg-white text-slate-900 border-[#a3e635]'
                                : 'border-transparent text-slate-500 hover:bg-white/50 hover:text-slate-900',
                            )
                          : cn(
                              'gap-4 py-3 w-full pl-8 pr-6',
                              active
                                ? 'bg-[#a3e635]/5 text-slate-900 border-[#a3e635]'
                                : 'border-transparent text-slate-500 hover:bg-white/50 hover:text-slate-900',
                            ),
                      )}
                    >
                      {!collapsed ? (
                        <>
                          <span className={cn(
                            "flex-1 text-[14px] tracking-tight",
                            active ? "font-bold text-slate-900" : "font-medium text-slate-500"
                          )}>{item.title}</span>
                          {item.badge != null && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-[#a3e635] px-1.5 text-[10px] font-bold text-slate-900">
                              {item.badge}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className={cn(
                          "text-xs font-bold",
                          active ? "text-[#a3e635]" : "text-slate-400"
                        )}>
                          {item.title.charAt(0)}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="flex-shrink-0 py-6 border-t border-slate-100">
        {activeBottom.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.title : undefined}
              className={cn(
                'flex items-center border-l-4 transition-all duration-200',
                collapsed
                  ? cn(
                      'justify-center h-12 w-full',
                      active
                        ? 'bg-white text-slate-900 border-[#a3e635]'
                        : 'border-transparent text-slate-500 hover:bg-white/50 hover:text-slate-900',
                    )
                  : cn(
                      'gap-4 px-8 py-3 w-full',
                      active
                        ? 'bg-[#a3e635]/5 text-slate-900 border-[#a3e635]'
                        : 'border-transparent text-slate-500 hover:bg-white/50 hover:text-slate-900',
                    ),
              )}
            >
              {!collapsed && <span className="text-[14px] font-medium tracking-tight h-5 flex items-center">{item.title}</span>}
              {collapsed && (
                 <span className={cn(
                   "text-xs font-bold",
                   active ? "text-[#a3e635]" : "text-slate-400"
                 )}>
                   {item.title.charAt(0)}
                 </span>
              )}
            </Link>
          )
        })}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'hidden lg:flex items-center border-l-4 border-transparent transition-all duration-200 text-slate-400 hover:bg-white/50 hover:text-slate-900',
            collapsed ? 'justify-center h-12 w-full' : 'gap-4 px-8 py-3 w-full',
          )}
        >
          {collapsed ? (
            <span className="text-[10px] font-bold text-slate-400">»</span>
          ) : (
            <div className="flex items-center gap-4 px-8">
              <span className="text-[10px] font-bold text-slate-400">«</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recolher</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
