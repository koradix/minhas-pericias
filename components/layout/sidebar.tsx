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
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-[#f8f9ff] transition-all duration-300',
        collapsed ? 'w-16' : 'w-[220px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      )}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex h-16 flex-shrink-0 items-center',
          collapsed ? 'justify-center px-2' : 'justify-between px-5',
        )}
      >
        {collapsed ? (
          <Link href="/dashboard" title="Perilab">
            <Image src="/logo-icon.svg" alt="PL" width={28} height={28} priority />
          </Link>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center min-w-0">
              <Image src="/logo.svg" alt="Perilab" width={110} height={40} priority />
            </Link>
            <button
              onClick={onMobileClose}
              className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md text-[#6b7280] hover:text-[#1f2937] hover:bg-[#e7e8ee] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-6 px-3">
        {activeNav.map((section) => (
          <div key={section.title}>
            {/* Section label */}
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
                {section.title}
              </p>
            )}
            {collapsed && <div className="mx-3 mb-2 border-t border-[#e2e8f0]" />}

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
                        'flex items-center rounded-lg transition-all duration-200',
                        collapsed
                          ? cn(
                              'justify-center h-10 w-10 mx-auto',
                              active
                                ? 'bg-white text-[#416900] shadow-sm'
                                : 'text-[#6b7280] hover:bg-white/60 hover:text-[#374151]',
                            )
                          : cn(
                              'gap-3 py-2.5 w-full pl-3 pr-3',
                              active
                                ? 'bg-white text-[#416900] font-semibold shadow-sm'
                                : 'text-[#6b7280] hover:bg-white/60 hover:text-[#374151]',
                            ),
                      )}
                    >
                      <Icon
                        className={cn(
                          'flex-shrink-0',
                          collapsed ? 'h-[18px] w-[18px]' : 'h-[18px] w-[18px]',
                          active ? 'text-[#416900]' : 'text-[#9ca3af]',
                        )}
                        strokeWidth={active ? 2.2 : 1.5}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-[13px] font-medium tracking-wide">{item.title}</span>
                          {item.badge != null && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#416900] px-1.5 text-[10px] font-bold text-white">
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
      <div className="flex-shrink-0 p-3 space-y-1">
        {activeBottom.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.title : undefined}
              className={cn(
                'flex items-center rounded-lg transition-all duration-200',
                collapsed
                  ? cn(
                      'justify-center h-10 w-10 mx-auto',
                      active
                        ? 'bg-white text-[#416900] shadow-sm'
                        : 'text-[#9ca3af] hover:bg-white/60 hover:text-[#374151]',
                    )
                  : cn(
                      'gap-3 px-3 py-2.5 w-full',
                      active
                        ? 'bg-white text-[#416900] font-semibold shadow-sm'
                        : 'text-[#6b7280] hover:bg-white/60 hover:text-[#374151]',
                    ),
              )}
            >
              <Icon
                className={cn(
                  'flex-shrink-0 h-[18px] w-[18px]',
                  active ? 'text-[#416900]' : 'text-[#9ca3af]',
                )}
                strokeWidth={active ? 2.2 : 1.5}
              />
              {!collapsed && <span className="text-[13px] font-medium tracking-wide">{item.title}</span>}
            </Link>
          )
        })}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'hidden lg:flex items-center rounded-lg transition-all duration-200 text-[#9ca3af] hover:bg-white/60 hover:text-[#374151]',
            collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5 w-full',
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <span className="text-[13px] font-medium tracking-wide">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
