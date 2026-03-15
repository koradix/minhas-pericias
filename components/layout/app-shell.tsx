'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'

interface AppShellProps {
  children: React.ReactNode
  user: { name: string; email: string; role: string }
}

export default function AppShell({ children, user }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        role={user.role}
        onMobileClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className="app-content flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ '--sidebar-w': collapsed ? '64px' : '256px' } as React.CSSProperties}
      >
        <Header onMenuClick={() => setMobileOpen(true)} user={user} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
