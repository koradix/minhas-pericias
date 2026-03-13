import { FileText, Download } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { documentosGerados, statusMapDocumentos, tipoDocumentoLabels } from "@/lib/mocks/documentos"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Historico de Documentos" }

const tipoColors: Record<string, string> = {
  LAUDO: "bg-blue-50 text-blue-700",
  PROPOSTA_HONORARIOS: "bg-violet-50 text-violet-700",
  PARECER_TECNICO: "bg-amber-50 text-amber-700",
  RESPOSTA_QUESITOS: "bg-emerald-50 text-emerald-700",
}

export default function DocumentosHistoricoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Historico"
        description="Todos os documentos gerados"
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Documento</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tipo</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vinculo</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Criado em</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Acao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documentosGerados.map((doc) => {
                const st = statusMapDocumentos[doc.status]
                const tipoColor = tipoColors[doc.tipo]
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-violet-50">
                          <FileText className="h-3.5 w-3.5 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{doc.titulo}</p>
                          <p className="text-[11px] text-slate-400">{doc.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={tipoColor + " inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"}>
                        {tipoDocumentoLabels[doc.tipo]}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs text-slate-500">
                      {doc.periciaId ?? doc.demandaId ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{doc.dataCriacao}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">{documentosGerados.length} documentos gerados</p>
        </div>
      </div>
    </div>
  )
}
