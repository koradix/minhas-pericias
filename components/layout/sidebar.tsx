'use client'

import Link from 'next/link'
import Image from 'next/image'
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
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300',
        collapsed ? 'w-16' : 'w-[220px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      )}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex h-14 flex-shrink-0 items-center border-b border-slate-100',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        {collapsed ? (
          <Link href="/dashboard" title="Perilab">
            <Image src="/logo-icon.svg" alt="PL" width={32} height={32} priority />
          </Link>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center min-w-0">
              <Image src="/logo.svg" alt="Perilab" width={120} height={44} priority />
            </Link>
            <button
              onClick={onMobileClose}
              className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
        {activeNav.map((section) => (
          <div key={section.title}>
            {/* Section label */}
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400/80">
                {section.title}
              </p>
            )}
            {collapsed && <div className="mx-3 mb-2 border-t border-slate-100" />}

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
                          ? cn(
                              'justify-center h-9 w-9 mx-auto',
                              active ? 'bg-lime-50 text-lime-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600',
                            )
                          : cn(
                              'gap-2.5 py-2 w-full pl-2.5 pr-3 border-l-2',
                              active
                                ? 'border-l-lime-500 bg-lime-50 text-lime-700'
                                : 'border-l-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                            ),
                      )}
                    >
                      <Icon
                        className={cn(
                          'flex-shrink-0',
                          collapsed ? 'h-[17px] w-[17px]' : 'h-4 w-4',
                          active ? 'text-lime-600' : 'text-slate-400',
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-[13px] font-medium">{item.title}</span>
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

      {/* ── Bottom ── */}
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
                collapsed
                  ? cn(
                      'justify-center h-9 w-9 mx-auto',
                      active ? 'bg-lime-50 text-lime-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600',
                    )
                  : cn(
                      'gap-2.5 px-3 py-2 w-full',
                      active
                        ? 'bg-lime-50 text-lime-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                    ),
              )}
            >
              <Icon
                className={cn(
                  'flex-shrink-0',
                  collapsed ? 'h-[17px] w-[17px]' : 'h-4 w-4',
                  active ? 'text-lime-600' : 'text-slate-400',
                )}
              />
              {!collapsed && <span className="text-[13px] font-medium">{item.title}</span>}
            </Link>
          )
        })}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'hidden lg:flex items-center rounded-md transition-colors duration-150 text-slate-400 hover:bg-slate-50 hover:text-slate-600',
            collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-3 py-2 w-full',
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[13px] font-medium">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
