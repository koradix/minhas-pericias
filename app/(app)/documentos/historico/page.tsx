import Link from 'next/link'
import { FileText, Download, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { getDocumentosGerados } from '@/lib/data/documentos'
import { documentosGerados, statusMapDocumentos, tipoDocumentoLabels } from '@/lib/mocks/documentos'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Histórico de Documentos' }

const tipoColors: Record<string, string> = {
  LAUDO: 'bg-blue-50 text-blue-700',
  PROPOSTA_HONORARIOS: 'bg-violet-50 text-violet-700',
  PARECER_TECNICO: 'bg-amber-50 text-amber-700',
  RESPOSTA_QUESITOS: 'bg-emerald-50 text-emerald-700',
}

export default async function DocumentosHistoricoPage() {
  const reais = await getDocumentosGerados()

  // Unify real docs (from Prisma) with mock docs for display
  type RowDoc = {
    id: string
    titulo: string
    tipo: string
    vinculo: string
    data: string
    status: string
    isReal: boolean
  }

  const rows: RowDoc[] = [
    ...reais.map((d) => ({
      id: d.id,
      titulo: d.titulo,
      tipo: d.tipo,
      vinculo: d.periciaNum ?? '—',
      data: new Date(d.createdAt).toLocaleDateString('pt-BR'),
      status: d.status,
      isReal: true,
    })),
    ...documentosGerados.map((d) => ({
      id: d.id,
      titulo: d.titulo,
      tipo: d.tipo,
      vinculo: d.periciaId ?? d.demandaId ?? '—',
      data: d.dataCriacao,
      status: d.status,
      isReal: false,
    })),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico"
        description="Todos os documentos gerados"
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum documento gerado"
          description='Use um modelo em "Modelos" para gerar seu primeiro documento.'
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Tipo
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Vínculo
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Criado em
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((doc) => {
                  const st =
                    statusMapDocumentos[doc.status as keyof typeof statusMapDocumentos] ?? {
                      label: doc.status,
                      variant: 'secondary' as const,
                    }
                  const tipoColor = tipoColors[doc.tipo] ?? 'bg-slate-50 text-slate-700'
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-violet-50">
                            <FileText className="h-3.5 w-3.5 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{doc.titulo}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[11px] text-slate-400">{doc.id}</p>
                              {doc.isReal && (
                                <span className="inline-flex items-center rounded px-1 py-px bg-emerald-50 text-[9px] font-semibold text-emerald-600">
                                  REAL
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            tipoColor +
                            ' inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold'
                          }
                        >
                          {tipoDocumentoLabels[doc.tipo]}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-xs text-slate-500">
                        {doc.vinculo}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{doc.data}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {doc.isReal ? (
                          <Link href={`/documentos/${doc.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-violet-600 hover:text-violet-700"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-slate-400 cursor-default"
                            disabled
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
            <p className="text-xs text-slate-500">{rows.length} documentos</p>
            {reais.length > 0 && (
              <p className="text-xs text-emerald-600 font-medium">
                {reais.length} gerado{reais.length > 1 ? 's' : ''} pela plataforma
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
