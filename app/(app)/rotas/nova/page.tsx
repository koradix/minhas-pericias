import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { NovaRotaForm } from '@/components/rotas/nova-rota-form'
import { pericias } from '@/lib/mocks/pericias'
import type { VaraCatalog } from '@/lib/data/varas-catalog'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nova Rota de Perícias' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractTribunal(vara: string): string {
  const m = vara.match(/—\s*([A-Z0-9-]+)/)
  return m ? m[1] : 'TJRJ'
}

function extractCidade(endereco: string): string {
  const m = endereco.match(/—\s*([^,]+),\s*RJ/)
  return m ? m[1].trim() : 'Rio de Janeiro'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NovaRotaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Pericias com endereço e coordenadas (dados de teste — RJ)
  const varas: VaraCatalog[] = pericias
    .filter((p) => p.endereco && p.latitude && p.longitude)
    .map((p) => ({
      id: String(p.id),
      nome: `${p.numero} — ${p.assunto}`,
      tribunal: extractTribunal(p.vara),
      tipo: 'PERICIA' as const,
      endereco: p.endereco!,
      cidade: extractCidade(p.endereco!),
      uf: 'RJ',
      latitude: p.latitude!,
      longitude: p.longitude!,
    }))

  const grupos: Record<string, VaraCatalog[]> = {}
  for (const v of varas) {
    const key = `RJ — ${v.tribunal}`
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(v)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Rota de Perícias"
        description="Perícias com endereço disponíveis para roteirização — RJ"
        actions={
          <Link href="/rotas/prospeccao">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Button>
          </Link>
        }
      />

      <NovaRotaForm varas={varas} grupos={grupos} />
    </div>
  )
}
