import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExportButtons } from '@/components/documentos/export-buttons'
import { getDocumentoById } from '@/lib/data/documentos'
import { tipoDocumentoLabels, statusMapDocumentos } from '@/lib/mocks/documentos'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Documento Gerado' }

const tipoColors: Record<string, string> = {
  LAUDO: 'bg-blue-50 text-blue-700',
  PROPOSTA_HONORARIOS: 'bg-violet-50 text-violet-700',
  PARECER_TECNICO: 'bg-amber-50 text-amber-700',
  RESPOSTA_QUESITOS: 'bg-emerald-50 text-emerald-700',
}

export default async function DocumentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const doc = await getDocumentoById(id)
  if (!doc) notFound()

  const st = statusMapDocumentos[doc.status as keyof typeof statusMapDocumentos] ?? {
    label: doc.status,
    variant: 'secondary' as const,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.titulo}
        description={`${tipoDocumentoLabels[doc.tipo]} · gerado em ${new Date(doc.createdAt).toLocaleDateString('pt-BR')}`}
        actions={<ExportButtons titulo={doc.titulo} conteudo={doc.conteudo} />}
      />

      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/documentos/historico">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <ArrowLeft className="h-3.5 w-3.5" />
            Histórico
          </Button>
        </Link>

        <span
          className={
            tipoColors[doc.tipo] +
            ' inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold'
          }
        >
          {tipoDocumentoLabels[doc.tipo]}
        </span>

        <Badge variant={st.variant}>{st.label}</Badge>

        {doc.periciaNum && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <FileText className="h-3 w-3" />
            {doc.periciaNum}
          </span>
        )}

        <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
          <Clock className="h-3 w-3" />
          Atualizado em{' '}
          {new Date(doc.updatedAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Document content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Conteúdo do documento
          </p>
          <p className="text-[10px] text-slate-300">
            {doc.conteudo.length} caracteres
          </p>
        </div>
        <div className="overflow-x-auto p-6">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-[1.7] text-slate-700">
            {doc.conteudo}
          </pre>
        </div>
      </div>
    </div>
  )
}
