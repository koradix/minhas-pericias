import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AppShell from '@/components/layout/app-shell'
import { DevResetBtn } from '@/components/dev/reset-btn'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = {
    name: session.user.name ?? 'Usuário',
    email: session.user.email ?? '',
    role: (session.user as { role?: string }).role ?? 'perito',
  }

  return (
    <AppShell user={user}>
      {children}
      <DevResetBtn />
    </AppShell>
  )
}
