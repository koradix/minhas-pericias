import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { AgendaView } from '@/components/agenda/agenda-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Agenda — Perilab' }
export const dynamic = 'force-dynamic'

// ─── Workflow checkpoints → auto agenda items ─────────────────────────────────
// Cada perícia gera items baseado no estado do fluxo processual

interface PericiaAgendaContext {
  id: string
  numero: string
  assunto: string
  vara: string | null
  status: string
  criadoEm: Date
  hasAnalise: boolean
  hasProposta: boolean
  propostaAceita: boolean
  hasRota: boolean
  hasMidias: boolean
}

function gerarCheckpointsProcessuais(ctx: PericiaAgendaContext) {
  const items: { titulo: string; tipo: string; etapa: string; diasOffset: number; concluido: boolean }[] = []

  // Etapa 1: Upload da nomeação → análise IA
  items.push({
    titulo: 'Upload do documento de nomeação',
    tipo: 'action', etapa: 'NOMEAÇÃO', diasOffset: 0,
    concluido: ctx.hasAnalise,
  })

  // Etapa 2: Conferir dados extraídos
  if (ctx.hasAnalise) {
    items.push({
      titulo: 'Conferir dados extraídos pela IA',
      tipo: 'action', etapa: 'ANÁLISE', diasOffset: 1,
      concluido: ctx.hasAnalise, // auto-concluído quando análise existe
    })
  }

  // Etapa 3: Proposta de honorários
  items.push({
    titulo: 'Gerar proposta de honorários',
    tipo: 'action', etapa: 'PROPOSTA', diasOffset: 3,
    concluido: ctx.hasProposta,
  })

  // Etapa 4: Enviar proposta para o juiz
  if (ctx.hasProposta) {
    items.push({
      titulo: 'Enviar proposta para a Vara',
      tipo: 'action', etapa: 'PROPOSTA', diasOffset: 4,
      concluido: ctx.propostaAceita,
    })
  }

  // Etapa 5: Aguardar aceite / cobrar
  if (ctx.hasProposta && !ctx.propostaAceita) {
    items.push({
      titulo: 'Cobrar retorno sobre honorários',
      tipo: 'reminder', etapa: 'PROPOSTA', diasOffset: 10,
      concluido: ctx.propostaAceita,
    })
  }

  // Etapa 6: Agendar vistoria
  items.push({
    titulo: 'Agendar vistoria técnica',
    tipo: 'action', etapa: 'VISTORIA', diasOffset: 7,
    concluido: ctx.hasRota,
  })

  // Etapa 7: Notificar partes
  if (ctx.hasRota) {
    items.push({
      titulo: 'Notificar partes sobre a vistoria',
      tipo: 'action', etapa: 'VISTORIA', diasOffset: 8,
      concluido: ctx.hasMidias,
    })
  }

  // Etapa 8: Realizar vistoria e registrar evidências
  items.push({
    titulo: 'Registrar evidências da vistoria',
    tipo: 'action', etapa: 'MÍDIAS', diasOffset: 14,
    concluido: ctx.hasMidias,
  })

  // Etapa 9: Elaborar laudo
  items.push({
    titulo: 'Elaborar e entregar laudo pericial',
    tipo: 'deadline', etapa: 'LAUDO', diasOffset: 30,
    concluido: ctx.status === 'concluida',
  })

  return items.map((item) => ({
    ...item,
    periciaId: ctx.id,
    periciaNumero: ctx.numero,
    periciaAssunto: ctx.assunto,
    periciaVara: ctx.vara,
    dataEstimada: new Date(ctx.criadoEm.getTime() + item.diasOffset * 86400000),
  }))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgendaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  // Fetch all perícias do perito
  const pericias = await prisma.pericia.findMany({
    where: { peritoId: userId },
    orderBy: { criadoEm: 'desc' },
    select: { id: true, numero: true, assunto: true, vara: true, status: true, criadoEm: true },
  })

  if (pericias.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agenda do Perito" description="Acompanhe prazos e ações de cada processo" />
        <div className="border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <p className="text-sm font-semibold text-slate-500">Nenhuma perícia cadastrada</p>
          <p className="text-xs text-slate-400 mt-1">Crie uma perícia para a agenda ser preenchida automaticamente.</p>
          <Link href="/pericias/nova" className="inline-block mt-4 text-[10px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-slate-900 transition-colors">
            Nova perícia →
          </Link>
        </div>
      </div>
    )
  }

  // Fetch context for each perícia
  const periciaIds = pericias.map((p) => p.id)

  const [nomeacoes, propostas, rotas, checkpointsComMidia] = await Promise.all([
    prisma.nomeacao.findMany({ where: { peritoId: userId, processoId: { not: undefined } }, select: { id: true, peritoId: true } }).catch(() => []),
    prisma.feeProposal.findMany({ where: { userId, periciaId: { in: periciaIds } }, select: { periciaId: true, status: true } }).catch(() => []),
    prisma.rotaPericia.findMany({ where: { peritoId: userId }, select: { id: true } }).catch(() => []),
    prisma.checkpointMidia.findMany({ select: { checkpointId: true }, take: 100 }).catch(() => []),
  ])

  const propostaByPericia = new Map(propostas.map((p) => [p.periciaId, p]))
  const hasRotas = rotas.length > 0
  const hasMidiasGlobal = checkpointsComMidia.length > 0

  // Generate workflow items for each perícia
  const allItems = pericias.flatMap((p) => {
    const proposta = propostaByPericia.get(p.id)
    return gerarCheckpointsProcessuais({
      id: p.id,
      numero: p.numero,
      assunto: p.assunto,
      vara: p.vara,
      status: p.status,
      criadoEm: p.criadoEm,
      hasAnalise: !!nomeacoes.find((n) => n.peritoId === userId),
      hasProposta: !!proposta,
      propostaAceita: proposta?.status === 'aceita',
      hasRota: hasRotas,
      hasMidias: hasMidiasGlobal,
    })
  })

  const pending = allItems.filter((i) => !i.concluido)
  const completed = allItems.filter((i) => i.concluido)

  // Serialize dates
  const serialized = allItems.map((i) => ({
    ...i,
    dataEstimada: i.dataEstimada.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda do Perito"
        description={`${pending.length} pendente${pending.length !== 1 ? 's' : ''} · ${completed.length} concluída${completed.length !== 1 ? 's' : ''}`}
      />
      <AgendaView items={serialized} peritoNome={session.user.name ?? 'Perito'} />
    </div>
  )
}
