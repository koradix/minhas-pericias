import Link from "next/link"
import { ScrollText, Plus, ChevronRight, FileText, FileCheck, BookOpen, Zap } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/shared/stats-card"
import { modelos, documentosGerados, statusMapDocumentos, tipoDocumentoLabels } from "@/lib/mocks/documentos"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Documentos" }

export default function DocumentosPage() {
  const finalizados = documentosGerados.filter((d) => d.status === "finalizado").length
  const recentes = documentosGerados.slice(0, 4)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Gere laudos, propostas e pareceres com auxilio de IA"
        actions={
          <Link href="/documentos/modelos">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
              <Zap className="h-3.5 w-3.5" />
              Gerar Documento
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatsCard title="Documentos Gerados" value={documentosGerados.length} description="Total" icon={ScrollText} accent="violet" />
        <StatsCard title="Finalizados" value={finalizados} description="Prontos para uso" icon={FileCheck} accent="emerald" />
        <StatsCard title="Modelos Ativos" value={modelos.length} description="Templates disponiveis" icon={BookOpen} accent="blue" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documentos Recentes</CardTitle>
              <Link href="/documentos/historico">
                <Button variant="ghost" size="sm" className="text-blue-600 -mr-2 gap-1">
                  Ver todos <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-1">
            {recentes.map((doc) => {
              const st = statusMapDocumentos[doc.status]
              return (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted transition-colors cursor-pointer">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-violet-50">
                    <FileText className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{doc.titulo}</p>
                    <p className="text-[11px] text-zinc-500">{tipoDocumentoLabels[doc.tipo]} · {doc.dataCriacao}</p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Modelos Disponiveis</CardTitle>
              <Link href="/documentos/modelos">
                <Button variant="ghost" size="sm" className="text-blue-600 -mr-2 gap-1">
                  Ver todos <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {modelos.slice(0, 4).map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted transition-colors cursor-pointer group">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{m.nome}</p>
                  <p className="text-[11px] text-zinc-500">{tipoDocumentoLabels[m.tipo]} · {m.totalUsos} usos</p>
                </div>
                <Link href="/documentos/modelos">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 text-violet-600">Usar</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: "/documentos/modelos", icon: BookOpen, title: "Modelos", desc: "Templates de laudos e propostas", color: "bg-blue-50 text-blue-600" },
          { href: "/documentos/historico", icon: FileCheck, title: "Historico", desc: "Todos os documentos gerados", color: "bg-emerald-50 text-emerald-600" },
          { href: "/pericias", icon: FileText, title: "Pericias", desc: "Gerar documento a partir de pericia", color: "bg-violet-50 text-violet-600" },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-border transition-all group">
              <div className={item.color + " flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-zinc-400 truncate">{item.desc}</p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
