import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getVarasPublicas, getComarcas, getVisitasByPerito } from '@/lib/data/prospeccao'
import ProspeccaoClient from '@/components/prospeccao/prospeccao-client'

export const metadata = { title: 'Prospecção de Varas — PeriLaB' }

export default async function ProspeccaoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [varas, comarcas, visitas] = await Promise.all([
    getVarasPublicas({ uf: 'RJ' }),
    getComarcas('RJ'),
    getVisitasByPerito(session.user.id),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospecção de Varas"
        description={`${varas.length} varas cíveis do TJRJ · ${visitas.length} visita${visitas.length !== 1 ? 's' : ''} registrada${visitas.length !== 1 ? 's' : ''}`}
      />
      <ProspeccaoClient
        varas={varas}
        comarcas={comarcas}
        visitas={visitas.map((v) => ({
          ...v,
          dataVisita: v.dataVisita.toISOString(),
          emailEnviadoEm: v.emailEnviadoEm?.toISOString() ?? null,
          followUpEm: v.followUpEm?.toISOString() ?? null,
          criadoEm: v.criadoEm.toISOString(),
        }))}
      />
    </div>
  )
}
