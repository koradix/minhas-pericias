import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AdminPanel } from '@/components/admin/admin-panel'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin' }

const ADMIN_EMAILS = ['mmbonassi@gmail.com']

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/dashboard')
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Gerenciamento de usuários e banco de dados"
      />
      <AdminPanel
        users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
      />
    </div>
  )
}
