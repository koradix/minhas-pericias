import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  Camera,
  ScrollText,
  Package,
  Send,
  Sparkles,
  MapPin,
  ChevronRight,
  NotebookPen,
} from 'lucide-react'
import { auth } from '@/auth'
import { pericias } from '@/lib/mocks/pericias'
import { getStatusOverrides } from '@/lib/data/pericias-status'
import { getEnderecoOverride } from '@/lib/data/pericias-endereco'
import { EnderecoEdit } from '@/components/pericias/endereco-edit'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

// ─── Types ────────────────────────────────────────────────────────────────────

type PropostaStatus = 'nao_gerada' | 'gerada' | 'enviada' | 'aprovada'
type LaudoStatus = 'nao_iniciado' | 'em_elaboracao' | 'concluido'
type EntregaStatus = 'pendente' | 'entregue'

interface MockDetail {
  resumo: string
  proposta: { status: PropostaStatus; valor?: string; enviadoEm?: string }
  registros: { id: string; titulo: string; texto: string; data: string }[]
  laudoStatus: LaudoStatus
  entregaStatus: EntregaStatus
  entregaData?: string
}

// ─── Mock detail data (enriches basic Pericia mock) ───────────────────────────

const MOCK_DETAILS: Record<number, MockDetail> = {
  1: {
    resumo: 'Avaliação de imóvel residencial para fins de partilha em ação de divórcio. O imóvel possui 180m² de área privativa, 3 dormitórios e 2 vagas de garagem no bairro Jardins. O laudo deverá apurar o valor de mercado com base em pesquisa de imóveis comparáveis na região.',
    proposta: { status: 'aprovada', valor: 'R$ 4.200,00' },
    registros: [
      { id: 'r1', titulo: 'Vistoria presencial', texto: 'Imóvel vistoriado em 10/01/2025. Estado de conservação: bom. Documentação analisada in loco. Foram fotografados todos os cômodos e áreas comuns.', data: '10/01/2025' },
      { id: 'r2', titulo: 'Pesquisa de mercado', texto: 'Levantamento de 12 transações comparáveis na região dos Jardins. Método empregado: comparativo direto de dados de mercado conforme ABNT NBR 14.653.', data: '12/01/2025' },
    ],
    laudoStatus: 'em_elaboracao',
    entregaStatus: 'pendente',
  },
  2: {
    resumo: 'Cálculo de verbas rescisórias, horas extras e adicional noturno em ação trabalhista. O período de apuração compreende 01/2020 a 06/2024. A empresa ré apresentou documentação parcial; o juízo determinou que a parte faltante seja presumida em favor do reclamante.',
    proposta: { status: 'aprovada', valor: 'R$ 3.500,00' },
    registros: [
      { id: 'r1', titulo: 'Análise documental', texto: 'Recebidos fichas de ponto, holerites e CTPS. Identificadas inconsistências nos registros de ponto de março e abril de 2022.', data: '18/01/2025' },
    ],
    laudoStatus: 'nao_iniciado',
    entregaStatus: 'pendente',
  },
  3: {
    resumo: 'Apuração de haveres societários em dissolução parcial de sociedade limitada com 4 sócios. Balanços dos exercícios de 2021, 2022 e 2023 foram objeto de análise. Identificadas inconsistências contábeis no estoque do exercício de 2022.',
    proposta: { status: 'aprovada', valor: 'R$ 8.000,00' },
    registros: [
      { id: 'r1', titulo: 'Análise dos balanços', texto: 'Análise dos balanços patrimoniais 2021-2023. Ajuste de R$ 43.200 no estoque de 2022 identificado como necessário.', data: '10/12/2024' },
      { id: 'r2', titulo: 'Laudo entregue ao juízo', texto: 'Laudo pericial contábil protocolado via PJe. Conclusão: haveres do sócio requerente equivalem a R$ 1.243.890,00 (valor base: data do requerimento).', data: '18/12/2024' },
    ],
    laudoStatus: 'concluido',
    entregaStatus: 'entregue',
    entregaData: '18/12/2024',
  },
  4: {
    resumo: 'Avaliação de estabelecimento comercial do ramo alimentício para fins de indenização em rescisão de contrato de locação. Será apurado o fundo de comércio, equipamentos, estoques e o ponto comercial.',
    proposta: { status: 'aprovada', valor: 'R$ 6.500,00' },
    registros: [],
    laudoStatus: 'nao_iniciado',
    entregaStatus: 'pendente',
  },
  5: {
    resumo: 'Identificação e avaliação de vícios construtivos em edifício residencial: infiltrações, trincas estruturais e fissuras em fachada. O laudo deverá apontar a causa, extensão e custo de reparação dos danos.',
    proposta: { status: 'enviada', valor: 'R$ 5.200,00', enviadoEm: '05/01/2025' },
    registros: [],
    laudoStatus: 'nao_iniciado',
    entregaStatus: 'pendente',
  },
  6: {
    resumo: 'Avaliação de área de dano ambiental causado por descarte irregular de resíduos industriais em APP (Área de Preservação Permanente). Perícia determinará extensão do dano e custo de recuperação.',
    proposta: { status: 'nao_gerada' },
    registros: [],
    laudoStatus: 'nao_iniciado',
    entregaStatus: 'pendente',
  },
  7: {
    resumo: 'Revisão de contrato de financiamento bancário com alegação de cobrança de juros abusivos e anatocismo. O perito deverá recalcular o saldo devedor aplicando as taxas legalmente admitidas.',
    proposta: { status: 'aprovada', valor: 'R$ 3.800,00' },
    registros: [
      { id: 'r1', titulo: 'Análise de planilhas', texto: 'Planilhas de evolução do saldo devedor analisadas. Anatocismo identificado em 3 períodos distintos. Valor a restituir preliminar: R$ 18.400,00.', data: '20/01/2025' },
    ],
    laudoStatus: 'em_elaboracao',
    entregaStatus: 'pendente',
  },
  8: {
    resumo: 'Avaliação de imóvel comercial com 1.200m² objeto de desapropriação por utilidade pública para ampliação viária. Será apurado o valor justo de indenização conforme Decreto-lei nº 3.365/41.',
    proposta: { status: 'gerada', valor: 'R$ 12.000,00' },
    registros: [],
    laudoStatus: 'nao_iniciado',
    entregaStatus: 'pendente',
  },
}

// ─── Workflow steps ────────────────────────────────────────────────────────────

const ETAPAS = [
  { id: 1, label: 'Nomeação' },
  { id: 2, label: 'Proposta' },
  { id: 3, label: 'Aprovação' },
  { id: 4, label: 'Em andamento' },
  { id: 5, label: 'Laudo' },
  { id: 6, label: 'Entregue' },
]

function getEtapaAtual(status: string, proposta: PropostaStatus, laudo: LaudoStatus, entrega: EntregaStatus): number {
  if (entrega === 'entregue') return 6
  if (laudo === 'em_elaboracao' || laudo === 'concluido') return 5
  if (status === 'em_andamento') return 4
  if (proposta === 'aprovada') return 4
  if (proposta === 'enviada') return 3
  if (proposta === 'gerada') return 2
  return 1
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const PROPOSTA_BADGE: Record<PropostaStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'secondary' }> = {
  nao_gerada:  { label: 'Não gerada',  variant: 'secondary' },
  gerada:      { label: 'Gerada',      variant: 'info'      },
  enviada:     { label: 'Enviada',     variant: 'warning'   },
  aprovada:    { label: 'Aprovada',    variant: 'success'   },
}

const LAUDO_BADGE: Record<LaudoStatus, { label: string; variant: 'secondary' | 'warning' | 'success' }> = {
  nao_iniciado:   { label: 'Não iniciado',   variant: 'secondary' },
  em_elaboracao:  { label: 'Em elaboração',  variant: 'warning'   },
  concluido:      { label: 'Concluído',      variant: 'success'   },
}

const ENTREGA_BADGE: Record<EntregaStatus, { label: string; variant: 'secondary' | 'success' }> = {
  pendente:  { label: 'Pendente',  variant: 'secondary' },
  entregue:  { label: 'Entregue', variant: 'success'   },
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const p = pericias.find((x) => x.id === Number(id))
  return { title: p ? `${p.numero} — ${p.assunto}` : 'Perícia' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PericiasDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = pericias.find((x) => x.id === Number(id))
  if (!p) notFound()

  const session = await auth()
  const userId  = session?.user?.id ?? ''
  const overrides = userId ? await getStatusOverrides(userId) : {}
  const effectiveStatus = overrides[String(p.id)] ?? p.status
  const enderecoOverride = userId ? await getEnderecoOverride(String(p.id), userId) : null
  const effectiveEndereco = enderecoOverride ?? p.endereco ?? null

  const detail = MOCK_DETAILS[p.id] ?? {
    resumo: '',
    proposta: { status: 'nao_gerada' as PropostaStatus },
    registros: [],
    laudoStatus: 'nao_iniciado' as LaudoStatus,
    entregaStatus: 'pendente' as EntregaStatus,
  }

  const etapa = getEtapaAtual(effectiveStatus, detail.proposta.status, detail.laudoStatus, detail.entregaStatus)
  const propostaBadge = PROPOSTA_BADGE[detail.proposta.status]
  const laudoBadge    = LAUDO_BADGE[detail.laudoStatus]
  const entregaBadge  = ENTREGA_BADGE[detail.entregaStatus]

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/pericias" className="flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Perícias
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 font-medium">{p.numero}</span>
      </div>

      {/* ── Process header ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                {p.numero} · {p.processo}
              </p>
              <h1 className="text-xl font-bold text-slate-900 leading-snug">{p.assunto}</h1>
            </div>
            <Badge variant={etapa === 6 ? 'success' : etapa >= 4 ? 'info' : 'warning'} className="flex-shrink-0 text-sm px-3 py-1">
              {etapa === 6 ? 'Concluído' : etapa >= 4 ? 'Em andamento' : 'Aguardando'}
            </Badge>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
          <div className="px-5 py-4 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <User className="h-3 w-3" /> Autor
            </p>
            <p className="text-sm font-medium text-slate-800 leading-snug">{p.cliente}</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Building2 className="h-3 w-3" /> Vara
            </p>
            <p className="text-xs text-slate-600 leading-snug">{p.vara}</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Calendar className="h-3 w-3" /> Prazo
            </p>
            <p className="text-sm font-medium text-slate-800">{p.prazo}</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <DollarSign className="h-3 w-3" /> Honorários
            </p>
            <p className="text-sm font-semibold text-emerald-700">{p.valor}</p>
          </div>
        </div>

        {/* Endereço da perícia — editável */}
        <EnderecoEdit pericoId={String(p.id)} endereco={effectiveEndereco} />
      </div>

      {/* ── Workflow stepper ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Fluxo do processo</p>
        <div className="flex items-center gap-0">
          {ETAPAS.map((e, idx) => {
            const done    = etapa > e.id
            const current = etapa === e.id
            const last    = idx === ETAPAS.length - 1
            return (
              <div key={e.id} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                    done    ? 'bg-lime-500 border-lime-500 text-white'    :
                    current ? 'bg-white border-lime-500 text-lime-700'   :
                              'bg-white border-slate-200 text-slate-400',
                  )}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : e.id}
                  </div>
                  <p className={cn(
                    'text-[10px] font-medium text-center leading-tight w-16 truncate',
                    current ? 'text-lime-700' : done ? 'text-slate-600' : 'text-slate-400',
                  )}>
                    {e.label}
                  </p>
                </div>
                {!last && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-1 mb-5 rounded',
                    etapa > e.id ? 'bg-lime-400' : 'bg-slate-200',
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Left column (main content) ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Resumo do processo */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <NotebookPen className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">Resumo do processo</h2>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                <Sparkles className="h-3 w-3" />
                IA disponível em breve
              </span>
            </div>
            <div className="px-5 py-4">
              {detail.resumo ? (
                <p className="text-sm text-slate-600 leading-relaxed">{detail.resumo}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">Nenhum resumo cadastrado para este processo.</p>
              )}
            </div>
          </section>

          {/* Registros e fotos */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                  <Camera className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">Registros e fotos da perícia</h2>
              </div>
              <Link
                href="/rotas"
                className="text-xs font-semibold text-lime-700 bg-lime-50 border border-lime-200 rounded-lg px-3 py-1.5 hover:bg-lime-100 transition-colors"
              >
                + Adicionar via Rota
              </Link>
            </div>

            {detail.registros.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                  <Camera className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">Nenhum registro ainda</p>
                <p className="text-xs text-slate-400 mt-1">
                  Realize uma vistoria via <Link href="/rotas" className="text-lime-600 hover:underline">Rotas</Link> para capturar fotos e notas deste processo.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {detail.registros.map((r) => (
                  <div key={r.id} className="px-5 py-4 flex gap-4">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <p className="text-[10px] text-slate-400 tabular-nums">{r.data}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 mb-1">{r.titulo}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{r.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Laudo pericial */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                  <ScrollText className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">Laudo pericial</h2>
              </div>
              <Badge variant={laudoBadge.variant}>{laudoBadge.label}</Badge>
            </div>
            <div className="px-5 py-5">
              {detail.laudoStatus === 'concluido' ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Laudo concluído</p>
                    <p className="text-xs text-emerald-600 mt-0.5">O laudo pericial foi elaborado e está disponível para entrega ao juízo.</p>
                  </div>
                </div>
              ) : detail.laudoStatus === 'em_elaboracao' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800">Laudo em elaboração. Continue a partir dos registros coletados.</p>
                  </div>
                  <Link href="/documentos/modelos">
                    <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                      <ScrollText className="h-4 w-4" />
                      Continuar no modelo
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Gere o laudo pericial a partir de um modelo. Você poderá usar os registros e fotos desta perícia.
                  </p>
                  <Link href="/documentos/modelos">
                    <button className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold text-sm px-4 py-2.5 transition-colors">
                      <ScrollText className="h-4 w-4" />
                      Gerar laudo
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* ── Right column (sidebar) ───────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Proposta de honorários */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">Proposta</h2>
              </div>
              <Badge variant={propostaBadge.variant}>{propostaBadge.label}</Badge>
            </div>
            <div className="px-5 py-4 space-y-3">
              {detail.proposta.valor && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Valor proposto</p>
                  <p className="text-xl font-bold text-slate-900">{detail.proposta.valor}</p>
                  {detail.proposta.enviadoEm && (
                    <p className="text-[11px] text-slate-400 mt-1">Enviada em {detail.proposta.enviadoEm}</p>
                  )}
                </div>
              )}

              {detail.proposta.status === 'aprovada' && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                  Proposta aprovada pelo juízo
                </div>
              )}

              {detail.proposta.status === 'enviada' && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  Aguardando aprovação do juízo
                </div>
              )}

              {(detail.proposta.status === 'nao_gerada' || detail.proposta.status === 'gerada') && (
                <Link href={`/pericias/${p.id}/proposta`}>
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                    <Send className="h-3.5 w-3.5" />
                    {detail.proposta.status === 'nao_gerada' ? 'Gerar proposta de honorários' : 'Enviar proposta'}
                  </button>
                </Link>
              )}
            </div>
          </section>

          {/* Entrega */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <Package className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">Entrega</h2>
              </div>
              <Badge variant={entregaBadge.variant}>{entregaBadge.label}</Badge>
            </div>
            <div className="px-5 py-4">
              {detail.entregaStatus === 'entregue' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>Laudo entregue ao juízo</span>
                  </div>
                  {detail.entregaData && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {detail.entregaData}
                    </p>
                  )}
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-center">
                    <p className="text-xs text-slate-400">Comprovante de protocolo disponível em breve</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    O laudo ainda não foi entregue ao juízo. Finalize o laudo e registre a entrega aqui.
                  </p>
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-center">
                    <p className="text-xs text-slate-400">Entrega disponível após conclusão do laudo</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Próxima ação */}
          {etapa < 6 && (
            <section className="rounded-2xl border border-lime-200 bg-lime-50/50 shadow-sm px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-lime-700 mb-2">Próxima ação</p>
              {etapa === 1 && (
                <Link href={`/pericias/${p.id}/proposta`}>
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                    <DollarSign className="h-4 w-4" />
                    Gerar proposta de honorários
                  </button>
                </Link>
              )}
              {etapa === 2 && (
                <Link href={`/pericias/${p.id}/proposta`}>
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                    <Send className="h-4 w-4" />
                    Enviar proposta ao juízo
                  </button>
                </Link>
              )}
              {etapa === 3 && (
                <p className="text-xs text-slate-600 bg-white border border-lime-100 rounded-xl px-4 py-3">
                  Aguardando aprovação da proposta pelo juízo para iniciar a perícia.
                </p>
              )}
              {etapa === 4 && (
                <Link href="/rotas">
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                    <MapPin className="h-4 w-4" />
                    Iniciar vistoria / rota
                  </button>
                </Link>
              )}
              {etapa === 5 && (
                <Link href="/documentos/modelos">
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                    <ScrollText className="h-4 w-4" />
                    Finalizar e entregar laudo
                  </button>
                </Link>
              )}
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
