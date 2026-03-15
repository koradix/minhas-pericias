import Link from 'next/link'
import { BookOpen, Plus, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UsarModeloButton } from '@/components/documentos/usar-modelo-button'
import { modelos, tipoDocumentoLabels } from '@/lib/mocks/documentos'
import { iaConfigurada } from '@/lib/ai/gerar-documento'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Modelos de Documentos' }

const tipoColors: Record<string, string> = {
  LAUDO: 'bg-blue-50 text-blue-700',
  PROPOSTA_HONORARIOS: 'bg-violet-50 text-violet-700',
  PARECER_TECNICO: 'bg-amber-50 text-amber-700',
  RESPOSTA_QUESITOS: 'bg-emerald-50 text-emerald-700',
}

export default function DocumentosModelosPage() {
  const iaAtiva = iaConfigurada()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos"
        description="Templates de documentos treinados com seus laudos anteriores"
        actions={
          <div className="flex gap-2">
            <Link href="/documentos/modelos/novo">
              <Button variant="outline" size="sm">
                <Upload className="h-3.5 w-3.5" />
                Enviar Arquivo
              </Button>
            </Link>
            <Link href="/documentos/modelos/novo">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-3.5 w-3.5" />
                Novo Modelo
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modelos.map((m) => (
          <Card key={m.id} className="hover:shadow-md transition-shadow group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <span
                  className={
                    tipoColors[m.tipo] +
                    ' inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold'
                  }
                >
                  {tipoDocumentoLabels[m.tipo]}
                </span>
              </div>
              <CardTitle className="text-sm mt-3 group-hover:text-blue-700 transition-colors">
                {m.nome}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                {m.descricao}
              </p>

              {m.arquivosTreinamento.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Arquivos de treinamento
                  </p>
                  <div className="space-y-1">
                    {m.arquivosTreinamento.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={a.tipo === 'PDF' ? 'text-red-500' : 'text-blue-500'}>
                          {a.tipo}
                        </span>
                        <span className="truncate">{a.nome}</span>
                        <span className="ml-auto text-slate-400 flex-shrink-0">{a.tamanhoKb}kb</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">
                  {m.totalUsos} usos · criado em {m.criadoEm}
                </span>
                <UsarModeloButton modelo={m} iaAtiva={iaAtiva} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
