import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { getVarasPublicas, getComarcas } from '@/lib/data/prospeccao'
import { prisma } from '@/lib/prisma'
import ProspeccaoClient from '@/components/prospeccao/prospeccao-client'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Prospecção de Varas — PeriLaB' }

export default async function ProspeccaoPage({
  searchParams,
}: {
  searchParams: Promise<{ uf?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const uf = params.uf ?? 'RJ'

  const [varas, comarcas, kpis] = await Promise.all([
    getVarasPublicas({ uf }),
    getComarcas(uf),
    prisma.varaPublica.groupBy({ by: ['uf'], _count: true }),
  ])

  const porUf = Object.fromEntries(kpis.map(k => [k.uf, k._count]))
  const ufs = Object.keys(porUf).sort()
  const total = Object.values(porUf).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospecção de Varas"
        description={`${total} varas em ${ufs.length} estado${ufs.length > 1 ? 's' : ''}`}
      />

      {/* UF tabs */}
      {ufs.length > 1 && (
        <div className="flex items-center gap-1">
          {ufs.map(u => (
            <Link
              key={u}
              href={`/prospeccao?uf=${u}`}
              className={cn(
                'px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                u === uf
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {u} <span className="text-[8px] font-bold ml-1 opacity-60">{porUf[u]}</span>
            </Link>
          ))}
        </div>
      )}

      <ProspeccaoClient
        varas={varas}
        comarcas={comarcas}
        visitas={[]}
      />
    </div>
  )
}
