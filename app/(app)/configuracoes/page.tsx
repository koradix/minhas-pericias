import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { TribunaisForm } from '@/components/perfil/TribunaisForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configurações' }

export default async function ConfiguracoesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  let tribunais: string[] = []
  let estados: string[] = []

  try {
    const perfil = await prisma.peritoPerfil.findUnique({
      where: { userId },
      select: { tribunais: true, estados: true },
    })
    tribunais = JSON.parse(perfil?.tribunais ?? '[]')
    estados   = JSON.parse(perfil?.estados   ?? '[]')
  } catch { /* DB not ready */ }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Configurações"
        description="Gerencie seus tribunais e preferências de monitoramento"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <TribunaisForm
          initialEstados={estados}
          initialTribunais={tribunais}
        />
      </div>
    </div>
  )
}
