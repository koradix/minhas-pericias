import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Building2 } from 'lucide-react'
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

      {/* Varas management link */}
      <Link
        href="/configuracoes/varas"
        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-violet-200 transition-all group"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 group-hover:bg-violet-100 transition-colors">
          <Building2 className="h-5 w-5 text-violet-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Gerenciar Varas</p>
          <p className="text-xs text-slate-500 mt-0.5">Editar endereços e adicionar varas manualmente</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-violet-400 transition-colors" />
      </Link>
    </div>
  )
}
