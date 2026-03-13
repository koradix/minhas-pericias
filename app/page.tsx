import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Radar,
  Navigation,
  Zap,
  Mail,
  Users,
  Send,
  Star,
  BarChart3,
  Shield,
} from 'lucide-react'

// ─── Data ───────────────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText,
    title: 'Gestão de Perícias',
    description:
      'Centralize todos os processos periciais: prazos, documentos, laudos e acompanhamento de status em um só lugar.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Radar,
    title: 'Radar de Nomeações',
    description:
      'Monitore varas e juízes estratégicos. Identifique padrões de nomeação e antecipe oportunidades de trabalho.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Navigation,
    title: 'Rotas Inteligentes',
    description:
      'Otimize seus deslocamentos entre visitas e perícias. Reduza tempo e custo com planejamento de rotas eficiente.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Zap,
    title: 'Geração de Documentos',
    description:
      'Gere laudos, propostas e pareceres com auxílio de IA treinada nos seus próprios documentos anteriores.',
    color: 'bg-amber-50 text-amber-600',
  },
]

const prospectionFeatures = [
  { icon: Mail, text: 'Envio automatizado de e-mails para advogados e escritórios' },
  { icon: Users, text: 'Cadastro e organização de leads qualificados' },
  { icon: Send, text: 'Envio de propostas e currículo profissional' },
  { icon: BarChart3, text: 'Acompanhamento de funil e taxa de resposta' },
  { icon: Zap, text: 'Identificação automática de oportunidades' },
]

const plans = [
  {
    name: 'Essencial',
    price: 'R$ 89',
    period: '/mês',
    description: 'Para quem está começando a organizar sua atuação pericial.',
    highlight: false,
    features: [
      'Até 20 perícias ativas',
      'Gestão de documentos',
      'Controle de visitas',
      'Contatos e parceiros',
      'Dashboard financeiro',
    ],
    cta: 'Começar agora',
  },
  {
    name: 'Profissional',
    price: 'R$ 189',
    period: '/mês',
    description: 'Para peritos que querem crescer e prospectar ativamente.',
    highlight: true,
    features: [
      'Perícias ilimitadas',
      'Tudo do Essencial',
      'Radar de Nomeações',
      'Rotas inteligentes',
      'Prospecção por e-mail',
      'Envio de propostas e currículo',
    ],
    cta: 'Começar agora',
  },
  {
    name: 'Premium',
    price: 'R$ 389',
    period: '/mês',
    description: 'Automação completa para maximizar sua captação de trabalhos.',
    highlight: false,
    features: [
      'Tudo do Profissional',
      'Automação de prospecção',
      'Identificação de leads qualificados',
      'Geração de documentos com IA',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    cta: 'Falar com consultor',
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white select-none">
              P
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">PERIX</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#funcionalidades" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Funcionalidades
            </a>
            <a href="#prospeccao" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Prospecção
            </a>
            <a href="#planos" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Planos
            </a>
          </nav>

          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Entrar
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
        {/* subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* glow */}
        <div className="pointer-events-none absolute inset-x-0 -top-40 flex justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300">
            <Star className="h-3.5 w-3.5 fill-blue-400 text-blue-400" />
            Plataforma para Peritos Judiciais
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Organize suas perícias e{' '}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent">
              conquiste novos trabalhos
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400">
            A plataforma completa para gestão de perícias judiciais, prospecção de novos trabalhos
            e organização profissional do perito.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/40"
            >
              Entrar no sistema
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#planos"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-700 px-8 text-base font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Ver planos
            </a>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 border-t border-slate-800 pt-10 sm:gap-12">
            {[
              { value: '200+', label: 'Peritos cadastrados' },
              { value: '5.000+', label: 'Perícias gerenciadas' },
              { value: '12.000+', label: 'Documentos gerados' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-white sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Funcionalidades
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Tudo que o perito precisa
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
              Do controle de processos à geração de laudos — uma plataforma integrada para
              profissionalizar sua atuação.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-slate-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Prospection ── */}
      <section id="prospeccao" className="bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
                Módulo de Prospecção
              </p>
              <h2 className="mb-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Conquiste novos clientes{' '}
                <span className="text-blue-600">no piloto automático</span>
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                O Perix automatiza a prospecção de advogados, escritórios e seguradoras. Envie
                e-mails personalizados, propostas e currículo de forma organizada e escalável —
                enquanto você foca nas perícias.
              </p>
              <ul className="space-y-4">
                {prospectionFeatures.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-blue-100">
                        <Icon className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <span className="text-sm text-slate-700">{item.text}</span>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-10">
                <a
                  href="#planos"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Disponível nos planos Profissional e Premium
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Visual card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Campanha ativa</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Enviando
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { nome: 'Dr. Ricardo Alves', status: 'Respondeu', color: 'bg-emerald-50 text-emerald-700' },
                  { nome: 'Escritório Martins & Assoc.', status: 'Abriu e-mail', color: 'bg-blue-50 text-blue-700' },
                  { nome: 'Dra. Camila Santos', status: 'Enviado', color: 'bg-slate-100 text-slate-600' },
                  { nome: 'Braz Advogados', status: 'Enviado', color: 'bg-slate-100 text-slate-600' },
                  { nome: 'Dr. Fernando Costa', status: 'Agendou reunião', color: 'bg-violet-50 text-violet-700' },
                ].map((lead) => (
                  <div
                    key={lead.nome}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                        {lead.nome[0]}
                      </div>
                      <span className="text-xs font-medium text-slate-800">{lead.nome}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${lead.color}`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                {[
                  { label: 'Enviados', value: '124' },
                  { label: 'Abertos', value: '68' },
                  { label: 'Respondidos', value: '19' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-base font-bold text-slate-900">{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="planos" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Planos
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Escolha o seu plano
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-slate-500">
              Comece grátis por 14 dias. Sem cartão de crédito.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-md ${
                  plan.highlight
                    ? 'border-blue-200 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-900'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                      Mais popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className={`mb-1 text-sm font-semibold ${plan.highlight ? 'text-blue-200' : 'text-slate-500'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-slate-400'}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlight ? 'text-blue-100' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          plan.highlight ? 'text-blue-200' : 'text-emerald-500'
                        }`}
                      />
                      <span className={plan.highlight ? 'text-blue-50' : 'text-slate-700'}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Todos os planos incluem 14 dias de teste gratuito · Cancele a qualquer momento
          </p>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-slate-950 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400">
            <Shield className="h-4 w-4 text-blue-400" />
            Dados seguros · LGPD compliant
          </div>
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
            Pronto para profissionalizar sua atuação?
          </h2>
          <p className="mb-8 text-base text-slate-400">
            Junte-se a centenas de peritos que já usam o Perix para organizar processos e
            conquistar novos trabalhos.
          </p>
          <Link
            href="/login"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500"
          >
            Entrar no sistema
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white select-none">
              P
            </div>
            <span className="text-sm font-semibold text-slate-300">PERIX</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} PERIX. Todos os direitos reservados.
          </p>
          <div className="flex gap-5 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Termos de uso</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Privacidade</a>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
