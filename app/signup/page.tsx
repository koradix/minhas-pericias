'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import { signup } from '@/lib/actions/signup'
import {
  ESTADOS_DISPONIVEIS,
  TRIBUNAIS_POR_ESTADO,
  getTribunaisParaEstados,
  tipoCor,
  type TipoTribunal,
} from '@/lib/constants/tribunais'

// ─── Options ──────────────────────────────────────────────────────────────────

const FORMACOES = [
  'Engenheiro Civil', 'Engenheiro Eletricista', 'Engenheiro Mecânico',
  'Engenheiro de Produção', 'Arquiteto', 'Contador', 'Médico',
  'Psicólogo', 'Administrador', 'Técnico', 'Outro',
]

const ESPECIALIDADES = [
  'Avaliação de Imóvel', 'Engenharia Civil', 'Perícia Trabalhista',
  'Perícia Contábil', 'Avaliação de Empresa', 'Perícia Médica',
  'Avaliação de Veículo', 'Ambiental', 'Outro',
]

const CURSOS = [
  'Perícia Judicial', 'Assistência Técnica', 'Avaliação de Imóveis',
  'Inspeção Predial', 'Laudos Técnicos', 'Cálculos Judiciais',
  'Perícia Trabalhista', 'Perícia Cível', 'Mediação e Arbitragem', 'Outro',
]

const TIPO_LABEL: Record<TipoTribunal, string> = {
  estadual:  'Estadual',
  trabalho:  'Trabalho',
  federal:   'Federal',
  eleitoral: 'Eleitoral',
}

// ─── Chip multi-select genérico ───────────────────────────────────────────────

function ChipSelect({
  options, selected, onChange,
}: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              active
                ? 'bg-lime-500 border-lime-500 text-slate-900'
                : 'border-slate-300 text-slate-600 hover:border-lime-400 hover:text-lime-700 bg-white'
            }`}
          >
            {active && <Check className="h-3 w-3" />}
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─── Input styles ─────────────────────────────────────────────────────────────

const inputCls = "w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
const labelCls = "block text-xs font-medium text-slate-700 mb-1.5"

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [telefone, setTelefone] = useState('')

  // Step 2
  const [formacao, setFormacao] = useState('')
  const [registro, setRegistro] = useState('')
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [cursos, setCursos] = useState<string[]>([])

  // Step 3
  const [estadosSel, setEstadosSel] = useState<string[]>([])
  const [tribunaisSel, setTribunaisSel] = useState<string[]>([])
  const [cidade, setCidade] = useState('')
  const [areaAtuacao, setAreaAtuacao] = useState('')

  // ─── Lógica cascata: estado ↔ tribunais ──────────────────────────────────

  function handleToggleEstado(uf: string) {
    const adicionando = !estadosSel.includes(uf)
    const novosEstados = adicionando
      ? [...estadosSel, uf]
      : estadosSel.filter((e) => e !== uf)

    setEstadosSel(novosEstados)

    if (adicionando) {
      // Auto-seleciona todos os tribunais do estado recém-adicionado
      const siglas = (TRIBUNAIS_POR_ESTADO[uf] ?? []).map((t) => t.sigla)
      setTribunaisSel((prev) => [...new Set([...prev, ...siglas])])
    } else {
      // Remove os tribunais do estado removido (só se não pertencerem a outro estado selecionado)
      const tribunal_restantes = new Set(
        novosEstados.flatMap((e) => (TRIBUNAIS_POR_ESTADO[e] ?? []).map((t) => t.sigla))
      )
      setTribunaisSel((prev) => prev.filter((s) => tribunal_restantes.has(s)))
    }
  }

  function handleToggleTribunal(sigla: string) {
    setTribunaisSel((prev) =>
      prev.includes(sigla) ? prev.filter((s) => s !== sigla) : [...prev, sigla]
    )
  }

  // ─── Validação step 1 ────────────────────────────────────────────────────

  function validateStep1() {
    if (!nome.trim()) return 'Informe seu nome completo.'
    if (!email.trim() || !email.includes('@')) return 'Informe um e-mail válido.'
    if (senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.'
    if (senha !== confirmar) return 'As senhas não coincidem.'
    return ''
  }

  function handleNext() {
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    setError('')
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const result = await signup({
      nome, email, senha, telefone,
      formacao, registro, especialidades, cursos,
      estados: estadosSel,
      tribunais: tribunaisSel,
      cidade,
      areaAtuacao,
    })
    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }
    const res = await signIn('credentials', { email, password: senha, redirect: false })
    router.push(res?.ok ? '/dashboard' : '/login')
  }

  // ─── Tribunais agrupados por estado para exibição ─────────────────────────

  const tribunaisDisponiveis = getTribunaisParaEstados(estadosSel)
  const tribunaisPorEstado = estadosSel.map((uf) => ({
    uf,
    tribunais: TRIBUNAIS_POR_ESTADO[uf] ?? [],
  }))

  const stepLabels = ['Conta', 'Perfil', 'Atuação']

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500 text-slate-900 font-black text-lg select-none">
          P
        </div>
        <span className="text-base font-bold text-slate-900 tracking-tight">PeriLaB</span>
      </div>

      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {stepLabels.map((label, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <div key={n} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done ? 'bg-lime-500 text-slate-900' :
                    active ? 'bg-slate-900 text-white' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : n}
                  </div>
                  <span className={`text-[10px] font-medium ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-16 h-px mx-2 mb-4 ${step > n ? 'bg-lime-400' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">

          {/* ── STEP 1 — Conta ────────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Crie sua conta</h1>
                <p className="text-xs text-slate-500 mt-0.5">Dados de acesso à plataforma</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Nome completo *</label>
                  <input className={inputCls} placeholder="Rafael Costa" value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>E-mail *</label>
                  <input type="email" className={inputCls} placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Senha *</label>
                    <input type="password" className={inputCls} placeholder="••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Confirmar *</label>
                    <input type="password" className={inputCls} placeholder="••••••" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Telefone <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <input className={inputCls} placeholder="(11) 9 0000-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2 — Perfil profissional ──────────────────────────────── */}
          {step === 2 && (
            <>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Perfil profissional</h1>
                <p className="text-xs text-slate-500 mt-0.5">Personaliza seu dashboard e as demandas sugeridas</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Formação principal</label>
                  <select className={inputCls} value={formacao} onChange={(e) => setFormacao(e.target.value)}>
                    <option value="">Selecione...</option>
                    {FORMACOES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Registro profissional <span className="text-slate-400 font-normal">(ex: CREA 0123456)</span></label>
                  <input className={inputCls} placeholder="CREA / CRC / CRM / CRP..." value={registro} onChange={(e) => setRegistro(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Especialidades em perícia</label>
                  <ChipSelect options={ESPECIALIDADES} selected={especialidades} onChange={setEspecialidades} />
                </div>
                <div>
                  <label className={labelCls}>Cursos e capacitações</label>
                  <ChipSelect options={CURSOS} selected={cursos} onChange={setCursos} />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3 — Área de atuação ──────────────────────────────────── */}
          {step === 3 && (
            <>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Área de atuação</h1>
                <p className="text-xs text-slate-500 mt-0.5">Define quais estados e tribunais você monitora</p>
              </div>
              <div className="space-y-5">

                {/* Estados */}
                <div>
                  <label className={labelCls}>
                    Estados de atuação
                    {estadosSel.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-lime-100 text-lime-700 text-[10px] font-bold px-1.5 py-0.5">
                        {estadosSel.length}
                      </span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ESTADOS_DISPONIVEIS.map((uf) => {
                      const active = estadosSel.includes(uf)
                      return (
                        <button
                          key={uf}
                          type="button"
                          onClick={() => handleToggleEstado(uf)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${
                            active
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'border-slate-300 text-slate-600 hover:border-slate-400 bg-white'
                          }`}
                        >
                          {active && <Check className="h-3 w-3" />}
                          {uf}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Tribunais (aparecem quando estados são selecionados) */}
                {estadosSel.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-slate-700">
                        Tribunais de interesse
                        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-lime-100 text-lime-700 text-[10px] font-bold px-1.5 py-0.5">
                          {tribunaisSel.length}/{tribunaisDisponiveis.length}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setTribunaisSel(tribunaisDisponiveis.map((t) => t.sigla))}
                        className="text-[10px] text-lime-600 hover:text-lime-700 font-medium"
                      >
                        Selecionar todos
                      </button>
                    </div>

                    <div className="space-y-3">
                      {tribunaisPorEstado.map(({ uf, tribunais }) => (
                        <div key={uf}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{uf}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {tribunais.map((t) => {
                              const active = tribunaisSel.includes(t.sigla)
                              return (
                                <button
                                  key={t.sigla}
                                  type="button"
                                  onClick={() => handleToggleTribunal(t.sigla)}
                                  title={t.nome}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold border transition-colors ${
                                    active
                                      ? 'bg-lime-500 border-lime-500 text-slate-900'
                                      : `border-slate-200 text-slate-500 hover:border-lime-300 ${tipoCor[t.tipo]}`
                                  }`}
                                >
                                  {active && <Check className="h-2.5 w-2.5" />}
                                  {t.sigla}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Legenda */}
                    <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
                      {(['estadual','trabalho','federal','eleitoral'] as TipoTribunal[]).map((tipo) => (
                        <span key={tipo} className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${tipoCor[tipo]}`}>
                          {TIPO_LABEL[tipo]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cidade + área de atuação */}
                <div>
                  <label className={labelCls}>Cidade principal</label>
                  <input className={inputCls} placeholder="São Paulo, Rio de Janeiro..." value={cidade} onChange={(e) => setCidade(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Área de atuação <span className="text-slate-400 font-normal">(descrição livre)</span></label>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500 resize-none"
                    placeholder="Ex: Perícias cíveis e trabalhistas na região metropolitana..."
                    value={areaAtuacao}
                    onChange={(e) => setAreaAtuacao(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Erro */}
          {error && (
            <p className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-600">{error}</p>
          )}

          {/* Navegação */}
          <div className="flex items-center gap-3 pt-1">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setError(''); setStep((s) => s - 1) }}
                className="flex items-center gap-1 h-10 px-4 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-lime-500 hover:bg-lime-600 text-slate-900 text-sm font-semibold transition-colors"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-lime-500 hover:bg-lime-600 disabled:opacity-60 text-slate-900 text-sm font-semibold transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Já tem conta?{' '}
          <a href="/login" className="font-medium text-lime-600 hover:text-lime-700">
            Entrar
          </a>
        </p>
      </div>
    </div>
  )
}
