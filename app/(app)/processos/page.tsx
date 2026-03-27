import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Upload, FileText, Clock, CheckCircle2, Cpu } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Processos' }

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

const statusMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' }> = {
  upload_feito: { label: 'Aguardando IA', variant: 'secondary' },
  extraindo:    { label: 'Extraindo...',  variant: 'warning'   },
  extraido:     { label: 'Extraído',      variant: 'info'      },
  resumindo:    { label: 'Resumindo...',  variant: 'warning'   },
  resumido:     { label: 'Resumido',      variant: 'info'      },
  card_criado:  { label: 'Card criado',   variant: 'success'   },
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default async function ProcessosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let intakes: {
    id: string; nomeArquivo: string; tamanhoBytes: number | null;
    mimeType: string | null; status: string; criadoEm: string; periciaId: string | null
  }[] = []

  try {
    const rows = await prisma.processoIntake.findMany({
      where: { peritoId: session.user.id },
      orderBy: { criadoEm: 'desc' },
      select: { id: true, nomeArquivo: true, tamanhoBytes: true, mimeType: true, status: true, criadoEm: true, periciaId: true },
    })
    intakes = rows.map((r) => ({ ...r, criadoEm: toISO(r.criadoEm) }))
  } catch { /* DB not ready */ }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processos"
        description="Faça upload de processos judiciais para extração e análise por IA"
        actions={
          <Link href="/processos/novo">
            <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Enviar processo
            </Button>
          </Link>
        }
      />

      {intakes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 mb-4">
            <Upload className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Nenhum processo enviado</p>
          <p className="mt-1 text-xs text-slate-400 max-w-xs">
            Envie um PDF ou documento do processo judicial para extração automática de dados por IA.
          </p>
          <Link href="/processos/novo" className="mt-5">
            <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Enviar processo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Arquivo
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tamanho
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status IA
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Enviado em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {intakes.map((intake) => {
                  const st = statusMap[intake.status] ?? { label: intake.status, variant: 'secondary' as const }
                  const isPdf = intake.mimeType?.includes('pdf')
                  return (
                    <tr key={intake.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                      <td className="px-4 py-4">
                        <Link href={`/processos/${intake.id}`} className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                            intake.status === 'card_criado' ? 'bg-emerald-50' : 'bg-slate-50',
                          )}>
                            {intake.status === 'card_criado'
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              : isPdf
                                ? <FileText className="h-4 w-4 text-rose-400" />
                                : <FileText className="h-4 w-4 text-slate-400" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">
                              {intake.nomeArquivo}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">
                              {intake.id.slice(-8).toUpperCase()}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4 text-sm text-slate-500">
                        {formatBytes(intake.tamanhoBytes)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={st.variant}>{st.label}</Badge>
                          {intake.status !== 'upload_feito' && intake.status !== 'card_criado' && (
                            <Cpu className="h-3.5 w-3.5 text-slate-400 animate-pulse" />
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {new Date(intake.criadoEm).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              {intakes.length} processo{intakes.length !== 1 ? 's' : ''} enviado{intakes.length !== 1 ? 's' : ''}
              {intakes.filter((i) => i.status === 'card_criado').length > 0 && (
                <span className="ml-2 text-emerald-600">
                  · {intakes.filter((i) => i.status === 'card_criado').length} com card criado
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
