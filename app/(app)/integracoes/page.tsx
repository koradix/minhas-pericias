import { Plug, CheckCircle, Clock, ArrowRight, KeyRound, ShieldCheck, Zap } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { ApiProviderSelect } from '@/components/integracoes/api-provider-select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CredenciaisPjeSection } from '@/components/integracoes/credenciais-pje'
import type { TribunalCredItem } from '@/components/integracoes/credenciais-pje'
import { CertificadoA1Section } from '@/components/integracoes/certificado-a1'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { listarCertificados } from '@/lib/actions/certificado-escavador'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Integrações' }

type IntegracaoStatus = 'disponivel' | 'em_breve' | 'conectado'

const integracoes = [
  {
    id: 1,
    nome: 'TJSP — Tribunal de Justiça de SP',
    descricao: 'Consulta e monitoramento de processos, alertas de nomeações automáticos.',
    status: 'em_breve' as IntegracaoStatus,
    categoria: 'Tribunal Estadual',
    logo: 'TJ',
    logoColor: 'bg-blue-600',
  },
  {
    id: 2,
    nome: 'TRF-3 — Tribunal Regional Federal',
    descricao: 'Acesso a processos federais, nomeações e comunicações automáticas.',
    status: 'em_breve' as IntegracaoStatus,
    categoria: 'Tribunal Federal',
    logo: 'TRF',
    logoColor: 'bg-indigo-600',
  },
  {
    id: 3,
    nome: 'TRT-2 — Tribunal Regional do Trabalho',
    descricao: 'Monitoramento de processos trabalhistas e alertas de nomeação.',
    status: 'em_breve' as IntegracaoStatus,
    categoria: 'Tribunal Trabalhista',
    logo: 'TRT',
    logoColor: 'bg-emerald-600',
  },
  {
    id: 5,
    nome: 'E-mail — Alertas e Notificações',
    descricao: 'Envio automático de notificações, lembretes de prazo e resumos semanais.',
    status: 'disponivel' as IntegracaoStatus,
    categoria: 'Comunicação',
    logo: '@',
    logoColor: 'bg-violet-600',
  },
  {
    id: 6,
    nome: 'Google Calendar',
    descricao: 'Sincronize suas visitas e prazos com o Google Calendar automaticamente.',
    status: 'disponivel' as IntegracaoStatus,
    categoria: 'Produtividade',
    logo: 'GC',
    logoColor: 'bg-rose-500',
  },
]

const statusConfig: Record<IntegracaoStatus, { label: string; variant: 'success' | 'secondary' | 'info'; icon: typeof CheckCircle }> = {
  conectado: { label: 'Conectado', variant: 'success', icon: CheckCircle },
  disponivel: { label: 'Disponível', variant: 'info', icon: Plug },
  em_breve: { label: 'Em breve', variant: 'secondary', icon: Clock },
}

// Tribunais com suporte a PJe via Escavador
const TRIBUNAIS_PJE = [
  { sigla: 'TJRJ',  nome: 'Tribunal de Justiça do Rio de Janeiro' },
  { sigla: 'TJSP',  nome: 'Tribunal de Justiça de São Paulo' },
  { sigla: 'TJMG',  nome: 'Tribunal de Justiça de Minas Gerais' },
  { sigla: 'TJRS',  nome: 'Tribunal de Justiça do Rio Grande do Sul' },
  { sigla: 'TJPR',  nome: 'Tribunal de Justiça do Paraná' },
  { sigla: 'TJSC',  nome: 'Tribunal de Justiça de Santa Catarina' },
  { sigla: 'TJBA',  nome: 'Tribunal de Justiça da Bahia' },
  { sigla: 'TJPE',  nome: 'Tribunal de Justiça de Pernambuco' },
  { sigla: 'TJGO',  nome: 'Tribunal de Justiça de Goiás' },
  { sigla: 'TJCE',  nome: 'Tribunal de Justiça do Ceará' },
  { sigla: 'TJMT',  nome: 'Tribunal de Justiça do Mato Grosso' },
  { sigla: 'TJMS',  nome: 'Tribunal de Justiça do Mato Grosso do Sul' },
  { sigla: 'TJPA',  nome: 'Tribunal de Justiça do Pará' },
  { sigla: 'TJAM',  nome: 'Tribunal de Justiça do Amazonas' },
  { sigla: 'TJES',  nome: 'Tribunal de Justiça do Espírito Santo' },
  { sigla: 'TJDF',  nome: 'Tribunal de Justiça do Distrito Federal' },
  { sigla: 'TRF1',  nome: 'Tribunal Regional Federal da 1ª Região' },
  { sigla: 'TRF2',  nome: 'Tribunal Regional Federal da 2ª Região' },
  { sigla: 'TRF3',  nome: 'Tribunal Regional Federal da 3ª Região' },
  { sigla: 'TRF4',  nome: 'Tribunal Regional Federal da 4ª Região' },
  { sigla: 'TRF5',  nome: 'Tribunal Regional Federal da 5ª Região' },
]

async function getTribunaisCredenciais(userId: string): Promise<TribunalCredItem[]> {
  try {
    // Credenciais salvas
    const perfil = await prisma.peritoPerfil.findUnique({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: { credenciaisTribunais: true } as any,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (perfil as any)?.credenciaisTribunais as string | undefined
    const credMap: Record<string, { usuario: string }> = raw ? JSON.parse(raw) : {}

    // Tribunais do perfil (varas sincronizadas), deduplicated
    const varas = await prisma.tribunalVara.findMany({
      where: { peritoId: userId },
      select: { tribunalSigla: true, tribunalNome: true },
      orderBy: { tribunalSigla: 'asc' },
    })
    const seenSiglas = new Set(varas.map((v) => v.tribunalSigla))

    // Merge: tribunais do perfil + lista fixa PJe (sem duplicar)
    const perfilTribunais = [...new Map(varas.map((v) => [v.tribunalSigla, v])).values()]
    const extraTribunais = TRIBUNAIS_PJE.filter((t) => !seenSiglas.has(t.sigla)).map((t) => ({
      tribunalSigla: t.sigla,
      tribunalNome: t.nome,
    }))
    const tribunais = [...perfilTribunais, ...extraTribunais]

    return tribunais.map((v) => ({
      sigla: v.tribunalSigla,
      nome: v.tribunalNome,
      configurado: !!credMap[v.tribunalSigla],
      usuario: credMap[v.tribunalSigla]?.usuario,
    }))
  } catch {
    return []
  }
}

export default async function IntegracoesPage() {
  const session = await auth()
  const userId = session?.user?.id
  const [tribunaisCredenciais, certificados] = await Promise.all([
    userId ? getTribunaisCredenciais(userId) : Promise.resolve([]),
    listarCertificados(),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrações"
        description="Conecte o Minhas Perícias com tribunais e ferramentas externas"
      />

      {/* ── Seção: Provedor de API ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f3f9]">
            <Zap className="h-5 w-5 text-[#374151]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#1f2937] font-manrope">Provedor de busca</h2>
            <p className="text-[13px] text-[#6b7280]">
              Escolha qual serviço usar para buscar nomeações e processos.
            </p>
          </div>
        </div>
        <ApiProviderSelect />
      </section>

      <div className="border-t border-[#f2f3f9]" />

      {/* ── Seção: Certificado Digital A1 ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f3f9]">
            <ShieldCheck className="h-5 w-5 text-[#374151]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#1f2937] font-manrope">Certificado Digital A1</h2>
            <p className="text-[13px] text-[#6b7280]">
              Método recomendado. O Escavador autentica no PJe usando seu certificado para acessar os autos do processo.
            </p>
          </div>
        </div>
        <CertificadoA1Section certificados={certificados} />
      </section>

      <div className="border-t border-[#f2f3f9]" />

      {/* ── Seção: Credenciais PJe (usuário/senha — fallback) ─────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f3f9]">
            <KeyRound className="h-5 w-5 text-[#374151]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#1f2937] font-manrope">Login PJe por tribunal</h2>
            <p className="text-[13px] text-[#6b7280]">
              Alternativa quando não há certificado A1. Usuário e senha por tribunal para os robôs do Escavador.
            </p>
          </div>
        </div>
        <CredenciaisPjeSection tribunais={tribunaisCredenciais} />
      </section>

      <div className="border-t border-[#f2f3f9]" />

      {/* ── Seção: Outras integrações ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1f2937] font-manrope">Outras integrações</h2>
          <p className="text-[13px] text-[#6b7280] mt-0.5">Conecte ferramentas externas ao seu fluxo de trabalho.</p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Integrações com Tribunais em Desenvolvimento</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Estamos trabalhando para conectar o sistema diretamente aos tribunais. As integrações
              serão liberadas progressivamente. Você será notificado quando estiverem disponíveis.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integracoes.map((integracao) => {
            const config = statusConfig[integracao.status]
            const StatusIcon = config.icon
            const isAvailable = integracao.status === 'disponivel'
            const isConnected = integracao.status === 'conectado'

            return (
              <div
                key={integracao.id}
                className={`rounded-xl border bg-white p-5 flex flex-col gap-4 transition-all ${
                  isAvailable
                    ? 'border-slate-200 hover:shadow-md hover:border-blue-200 cursor-pointer'
                    : 'border-slate-200'
                } ${!isAvailable && !isConnected ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold ${integracao.logoColor}`}
                    >
                      {integracao.logo}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {integracao.nome}
                      </p>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        {integracao.categoria}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed flex-1">{integracao.descricao}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Badge variant={config.variant}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                  {isAvailable && (
                    <Button size="sm" variant="outline" className="text-xs">
                      Configurar
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                  {isConnected && (
                    <Button size="sm" variant="ghost" className="text-xs text-slate-500">
                      Gerenciar
                    </Button>
                  )}
                  {integracao.status === 'em_breve' && (
                    <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      Notificar-me
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-center py-4">
        <p className="text-xs text-slate-400 text-center max-w-md">
          Precisa de uma integração específica?{' '}
          <button className="text-blue-600 hover:underline font-medium">
            Solicite aqui
          </button>{' '}
          e avaliaremos a implementação.
        </p>
      </div>
    </div>
  )
}
