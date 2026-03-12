'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { navigation, bottomNavigation } from '@/lib/constants/nav'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onMobileClose: () => void
  onToggleCollapse: () => void
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-slate-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0'
      )}
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          'flex h-16 flex-shrink-0 items-center border-b border-slate-200',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        {collapsed ? (
          <Link href="/dashboard" title="Minhas Perícias">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold select-none">
              MP
            </div>
          </Link>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold select-none">
                MP
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                  Minhas Perícias
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight">
                  Gestão Pericial
                </p>
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navigation.map((section) => (
          <div key={section.title} className="pb-3">
            {!collapsed ? (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {section.title}
              </p>
            ) : (
              <div className="mx-2 mb-1 border-t border-slate-100" />
            )}
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
                        'flex items-center rounded-lg transition-all duration-150',
                        collapsed
                          ? 'justify-center h-10 w-10 mx-auto'
                          : 'gap-3 px-3 py-2 w-full',
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <Icon
                        className={cn(
                          'flex-shrink-0 transition-colors',
                          collapsed ? 'h-5 w-5' : 'h-4 w-4',
                          active ? 'text-blue-600' : 'text-slate-400'
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-sm font-medium">{item.title}</span>
                          {item.badge != null && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
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

      {/* Bottom section */}
      <div className="flex-shrink-0 border-t border-slate-200 p-2 space-y-0.5">
        {bottomNavigation.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.title : undefined}
              className={cn(
                'flex items-center rounded-lg transition-all duration-150',
                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2 w-full',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'flex-shrink-0',
                  collapsed ? 'h-5 w-5' : 'h-4 w-4',
                  active ? 'text-blue-600' : 'text-slate-400'
                )}
              />
              {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
            </Link>
          )
        })}

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'hidden lg:flex items-center rounded-lg transition-all duration-150 text-slate-400 hover:bg-slate-50 hover:text-slate-600',
            collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2 w-full'
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
