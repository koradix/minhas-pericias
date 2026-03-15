'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
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

const SECTION_LABELS: Record<string, string> = {
  Principal: 'Operação',
  Financeiro: 'Financeiro',
  Gestão: 'Gestão',
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
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-slate-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 flex-shrink-0 items-center border-b border-slate-100',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        {collapsed ? (
          <Link href="/dashboard" title="PeriLaB">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-500 text-white text-xs font-bold select-none">
              PL
            </div>
          </Link>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-lime-500 text-white text-xs font-bold select-none">
                PL
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-tight">PeriLaB</p>
                <p className="text-[10px] text-slate-400 leading-tight">Gestão Pericial</p>
              </div>
            </Link>
            <button
              onClick={onMobileClose}
              className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {activeNav.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {SECTION_LABELS[section.title] ?? section.title}
              </p>
            )}
            {collapsed && <div className="mx-2 mb-2 border-t border-slate-100" />}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.title : undefined}
                      onClick={onMobileClose}
                      className={cn(
                        'flex items-center rounded-md transition-colors duration-150',
                        collapsed
                          ? 'justify-center h-9 w-9 mx-auto'
                          : 'gap-2.5 px-2.5 py-2 w-full',
                        active
                          ? 'bg-lime-50 text-lime-700'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                      )}
                    >
                      <Icon
                        className={cn(
                          'flex-shrink-0',
                          collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4',
                          active ? 'text-lime-600' : 'text-slate-400',
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-sm font-medium">{item.title}</span>
                          {item.badge != null && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-lime-500 px-1 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 border-t border-slate-100 p-2 space-y-0.5">
        {activeBottom.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.title : undefined}
              className={cn(
                'flex items-center rounded-md transition-colors duration-150',
                collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 py-2 w-full',
                active
                  ? 'bg-lime-50 text-lime-700'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
              )}
            >
              <Icon
                className={cn(
                  'flex-shrink-0',
                  collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4',
                  active ? 'text-lime-600' : 'text-slate-400',
                )}
              />
              {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
            </Link>
          )
        })}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'hidden lg:flex items-center rounded-md transition-colors duration-150 text-slate-400 hover:bg-slate-100 hover:text-slate-600',
            collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 py-2 w-full',
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
