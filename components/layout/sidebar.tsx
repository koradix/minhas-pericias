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
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-[#0f172a] transition-all duration-300',
        collapsed ? 'w-16' : 'w-[240px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      )}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex h-20 flex-shrink-0 items-center border-b border-slate-800',
          collapsed ? 'justify-center px-1' : 'justify-between px-6',
        )}
      >
        {collapsed ? (
          <Link href="/dashboard" className="font-black text-xl tracking-tighter">
            <span className="text-white">P</span><span className="text-[#84cc16]">B</span>
          </Link>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center min-w-0 font-manrope">
              <span className="text-xl font-black text-white tracking-tighter">
                Peri<span className="text-[#84cc16]">LaB</span>
              </span>
            </Link>
            <button
              onClick={onMobileClose}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-none text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
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
              <p className="mb-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {section.title}
              </p>
            )}
            {collapsed && <div className="mx-4 mb-4 border-t border-slate-800" />}

            <ul className="space-y-1">
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
                        'flex items-center transition-all duration-200 border-l-4',
                        collapsed
                          ? cn(
                              'justify-center h-12 w-full',
                              active
                                ? 'bg-slate-800/50 text-[#84cc16] border-[#84cc16]'
                                : 'border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-white',
                            )
                          : cn(
                              'gap-4 py-3.5 w-full pl-5 pr-6',
                              active
                                ? 'bg-slate-800/50 text-[#84cc16] border-[#84cc16]'
                                : 'border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-white',
                            ),
                      )}
                    >
                      <Icon
                        className={cn(
                          'flex-shrink-0 h-[18px] w-[18px]',
                          active ? 'text-[#84cc16]' : 'text-slate-500',
                        )}
                        strokeWidth={active ? 2.5 : 2}
                      />
                      {!collapsed && (
                        <>
                          <span className={cn(
                            "flex-1 text-[13px] tracking-wide font-manrope",
                            active ? "font-black" : "font-medium"
                          )}>{item.title}</span>
                          {item.badge != null && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-none bg-[#84cc16] px-1.5 text-[10px] font-black text-[#0f172a]">
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
      <div className="flex-shrink-0 py-6 border-t border-slate-800">
        {activeBottom.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
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
                        ? 'bg-slate-800/50 text-[#84cc16] border-[#84cc16]'
                        : 'border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-white',
                    )
                  : cn(
                      'gap-4 px-5 py-3.5 w-full',
                      active
                        ? 'bg-slate-800/50 text-[#84cc16] border-[#84cc16]'
                        : 'border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-white',
                    ),
              )}
            >
              <Icon
                className={cn(
                  'flex-shrink-0 h-[18px] w-[18px]',
                  active ? 'text-[#84cc16]' : 'text-slate-500',
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              {!collapsed && <span className="text-[13px] font-manrope font-medium tracking-wide">{item.title}</span>}
            </Link>
          )
        })}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'hidden lg:flex items-center border-l-4 border-transparent transition-all duration-200 text-slate-500 hover:bg-slate-800/30 hover:text-white',
            collapsed ? 'justify-center h-12 w-full' : 'gap-4 px-5 py-3.5 w-full',
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <span className="text-[13px] font-manrope font-medium tracking-wide">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
