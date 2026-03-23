import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Camera,
  ScrollText,
  MapPin,
  ChevronRight,
  Circle,
  AlertCircle,
  Play,
  FileText,
  Navigation,
} from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PericiaMediaSection } from '@/components/pericias/pericia-media-section'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getMidiasByPericiaId, type MidiaDaPericia } from '@/lib/data/checkpoint-media'
import { pericias, statusMapPericias } from '@/lib/mocks/pericias'
import type { Metadata } from 'next'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function isMockId(id: string): boolean {
  return /^\d+$/.test(id)
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CpRow {
  id: string
  ordem: number
  titulo: string
  endereco: string | null
  status: string
  midiaCount: number
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const ROTA_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'secondary' }> = {
  em_andamento: { label: 'Em andamento', variant: 'info'      },
  concluida:    { label: 'Concluída',    variant: 'success'   },
  cancelada:    { label: 'Cancelada',    variant: 'secondary' },
}

const CP_STATUS_ICON: Record<string, React.ReactNode> = {
  concluido: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />,
  chegou:    <AlertCircle  className="h-4 w-4 text-amber-500  flex-shrink-0" />,
  pendente:  <Circle       className="h-4 w-4 text-slate-300  flex-shrink-0" />,
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  if (isMockId(id)) {
    const p = pericias.find((x) => x.id === parseInt(id, 10))
    return { title: p ? p.assunto : 'Perícia' }
  }
  let title = 'Perícia'
  try {
    const rota = await prisma.rotaPericia.findUnique({ where: { id }, select: { titulo: true } })
    if (rota) title = rota.titulo
  } catch {}
  return { title }
}

// ─── Mock pericia view ────────────────────────────────────────────────────────

async function MockPericiaView({ id, userId }: { id: string; userId: string }) {
  const mockIndex = parseInt(id, 10)
  const p = pericias.find((x) => x.id === mockIndex)
  if (!p) notFound()

  const st = statusMapPericias[p.status]

  // Load media registered for this pericia (via pericoId on checkpoints/rotas)
  let midias: MidiaDaPericia[] = []
  try {
    midias = await getMidiasByPericiaId(id, userId)
  } catch {}

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/pericias" className="flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Péricias
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 font-medium truncate max-w-xs">{p.assunto}</span>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                {p.numero} · Prazo: {p.prazo}
              </p>
              <h1 className="text-xl font-bold text-slate-900 leading-snug">{p.assunto}</h1>
            </div>
            {st && (
              <Badge variant={st.variant} className="flex-shrink-0 text-sm px-3 py-1">
                {st.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="px-5 py-4 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <FileText className="h-3 w-3" /> Processo
            </p>
            <p className="text-sm font-semibold text-slate-800 font-mono truncate">{p.processo}</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Camera className="h-3 w-3" /> Registros
            </p>
            <p className="text-sm font-semibold text-slate-800">{midias.length} arquivos</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <MapPin className="h-3 w-3" /> Honorários
            </p>
            <p className="text-sm font-semibold text-slate-800">{p.valor}</p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Left — main */}
        <div className="lg:col-span-2 space-y-5">

          {/* Vara / detalhes */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <FileText className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Detalhes do processo</h2>
            </div>
            <div className="divide-y divide-slate-50">
              <div className="grid grid-cols-2 gap-0">
                <div className="px-5 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Vara</p>
                  <p className="text-sm text-slate-800 leading-snug">{p.vara}</p>
                </div>
                <div className="px-5 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Parte</p>
                  <p className="text-sm text-slate-800">{p.cliente}</p>
                </div>
              </div>
              {p.endereco && (
                <div className="px-5 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Local da vistoria</p>
                  <p className="text-sm text-slate-800 flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    {p.endereco}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Media gallery */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <Camera className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Registros e fotos</h2>
              {midias.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
                  {midias.length}
                </span>
              )}
            </div>
            <PericiaMediaSection pericoId={id} midias={midias} />
          </section>

        </div>

        {/* Right — actions */}
        <div className="space-y-5">

          {/* Executar rota */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-50">
                <Play className="h-3.5 w-3.5 text-lime-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Execução</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <Link href={`/rotas/pericias`}>
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                  <Navigation className="h-4 w-4" />
                  Executar rota
                </button>
              </Link>
              <p className="text-xs text-slate-400">
                Planeje e execute uma rota de vistoria para este processo.
              </p>
            </div>
          </section>

          {/* Laudo */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <ScrollText className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Laudo pericial</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {p.status === 'concluida' ? (
                <Link href="/documentos/modelos">
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                    <ScrollText className="h-4 w-4" />
                    Gerar laudo
                  </button>
                </Link>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  Conclua a perícia antes de gerar o laudo
                </div>
              )}
            </div>
          </section>

          {/* Proposta */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Proposta</h2>
            </div>
            <div className="px-5 py-4">
              <Link href={`/pericias/${id}/proposta`}>
                <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm px-4 py-2.5 transition-colors">
                  <FileText className="h-4 w-4" />
                  Proposta de honorários
                </button>
              </Link>
            </div>
          </section>

          {/* Info */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Prazo: {p.prazo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PericiaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) notFound()

  // ── Mock pericia (numeric ID) ───────────────────────────────────────────────
  if (isMockId(id)) {
    return <MockPericiaView id={id} userId={userId} />
  }

  // ── Real RotaPericia (cuid) ────────────────────────────────────────────────

  let rota: { id: string; peritoId: string; titulo: string; status: string; criadoEm: Date | string; atualizadoEm: Date | string } | null = null
  try {
    rota = await prisma.rotaPericia.findUnique({ where: { id } })
  } catch {}
  if (!rota || rota.peritoId !== userId) notFound()

  let checkpoints: CpRow[] = []
  let midias: MidiaDaPericia[] = []

  try {
    const dbCps = await prisma.checkpoint.findMany({
      where: { rotaId: id },
      orderBy: { ordem: 'asc' },
    })

    if (dbCps.length > 0) {
      const cpIds = dbCps.map((c) => c.id)
      const dbMidias = await prisma.checkpointMidia.findMany({
        where: { checkpointId: { in: cpIds } },
        orderBy: { criadoEm: 'desc' },
      })

      midias = dbMidias.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        url: m.url,
        texto: m.texto,
        descricao: m.descricao,
        criadoEm: toISO(m.criadoEm),
      }))

      checkpoints = dbCps.map((cp) => ({
        id: cp.id,
        ordem: cp.ordem,
        titulo: cp.titulo,
        endereco: cp.endereco,
        status: cp.status,
        midiaCount: dbMidias.filter((m) => m.checkpointId === cp.id).length,
      }))
    }
  } catch {}

  const rotaStatus = ROTA_STATUS[rota.status] ?? { label: rota.status, variant: 'secondary' as const }
  const concluidos = checkpoints.filter((c) => c.status === 'concluido').length
  const total = checkpoints.length
  const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0
  const criadoEm = formatDate(toISO(rota.criadoEm))

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/pericias" className="flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Péricias
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 font-medium truncate max-w-xs">{rota.titulo}</span>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                Criada em {criadoEm}
              </p>
              <h1 className="text-xl font-bold text-slate-900 leading-snug">{rota.titulo}</h1>
            </div>
            <Badge variant={rotaStatus.variant} className="flex-shrink-0 text-sm px-3 py-1">
              {rotaStatus.label}
            </Badge>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="px-5 py-4 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <MapPin className="h-3 w-3" /> Checkpoints
            </p>
            <p className="text-sm font-semibold text-slate-800">{total} paradas</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <CheckCircle2 className="h-3 w-3" /> Progresso
            </p>
            <p className="text-sm font-semibold text-slate-800">{concluidos}/{total} ({pct}%)</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Camera className="h-3 w-3" /> Registros
            </p>
            <p className="text-sm font-semibold text-slate-800">{midias.length} arquivos</p>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="px-6 pb-4">
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-lime-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Checkpoints list */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <MapPin className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Checkpoints</h2>
              {total > 0 && (
                <span className="ml-auto text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
                  {concluidos}/{total}
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-50">
              {checkpoints.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <MapPin className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nenhum checkpoint nesta rota.</p>
                  <Link href="/rotas/pericias">
                    <button className="mt-3 text-xs font-semibold text-lime-600 hover:text-lime-700">
                      Planejar rota
                    </button>
                  </Link>
                </div>
              ) : (
                checkpoints.map((cp) => (
                  <div key={cp.id} className="flex items-start gap-3 px-5 py-3.5">
                    {CP_STATUS_ICON[cp.status] ?? CP_STATUS_ICON.pendente}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium leading-snug',
                        cp.status === 'concluido' ? 'text-slate-500 line-through' : 'text-slate-800',
                      )}>
                        {cp.titulo}
                      </p>
                      {cp.endereco && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{cp.endereco}</p>
                      )}
                    </div>
                    {cp.midiaCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 flex-shrink-0">
                        <Camera className="h-3 w-3" />
                        {cp.midiaCount}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Media gallery */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <Camera className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Registros e fotos</h2>
              {midias.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
                  {midias.length}
                </span>
              )}
            </div>
            <PericiaMediaSection pericoId={id} midias={midias} />
          </section>

        </div>

        {/* Right — sidebar actions */}
        <div className="space-y-5">

          {/* Executar rota */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-50">
                <Play className="h-3.5 w-3.5 text-lime-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Execução</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {rota.status === 'concluida' ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                  Rota concluída
                </div>
              ) : (
                <Link href={`/rotas/pericias`}>
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                    <MapPin className="h-4 w-4" />
                    Executar rota
                  </button>
                </Link>
              )}
              <p className="text-xs text-slate-400">
                {rota.status === 'em_andamento'
                  ? 'Continue a execução desta rota registrando chegadas e coletando evidências.'
                  : 'Acesse o módulo de Visitas e Rotas para continuar.'}
              </p>
            </div>
          </section>

          {/* Laudo pericial */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <ScrollText className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Laudo pericial</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {rota.status === 'concluida' ? (
                <Link href="/documentos/modelos">
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                    <ScrollText className="h-4 w-4" />
                    Gerar laudo
                  </button>
                </Link>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  Conclua a rota antes de gerar o laudo
                </div>
              )}
              <p className="text-xs text-slate-400">
                Use um modelo para gerar o laudo com os registros e fotos desta perícia.
              </p>
            </div>
          </section>

          {/* Proposta de honorários */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Proposta</h2>
            </div>
            <div className="px-5 py-4">
              <Link href={`/pericias/${id}/proposta`}>
                <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm px-4 py-2.5 transition-colors">
                  <FileText className="h-4 w-4" />
                  Proposta de honorários
                </button>
              </Link>
            </div>
          </section>

          {/* Timeline info */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Criada em {criadoEm}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Atualizada em {formatDate(toISO(rota.atualizadoEm))}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
