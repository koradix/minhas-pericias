'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { signup } from '@/lib/actions/signup'
import {
  ESTADOS_DISPONIVEIS,
  TRIBUNAIS_POR_ESTADO,
  type TipoTribunal,
} from '@/lib/constants/tribunais'
import { cn } from '@/lib/utils'

const FORMACOES = [
  'Engenheiro Civil',
  'Engenheiro Eletricista',
  'Engenheiro Mecânico',
  'Engenheiro de Produção',
  'Arquiteto e Urbanista',
  'Contador',
  'Médico',
  'Psicólogo',
  'Advogado',
  'Administrador',
  'Técnico',
  'Outra formação',
]

const TIPO_LABEL: Record<TipoTribunal, string> = {
  estadual:  'Cível',
  trabalho:  'Trabalho',
  federal:   'Federal',
  eleitoral: 'Eleitoral',
}

const TIPO_COR: Record<TipoTribunal, string> = {
  estadual:  'bg-lime-100 text-lime-800',
  trabalho:  'bg-amber-100 text-amber-800',
  federal:   'bg-sky-100 text-sky-800',
  eleitoral: 'bg-rose-100 text-rose-800',
}

const inputCls = 'w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500'
const labelCls = 'block text-xs font-medium text-slate-700 mb-1.5'

function GoogleSignupButton() {
  const [loading, setLoading] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { setLoading(true); signIn('google', { callbackUrl: '/dashboard' }) }}
      disabled={loading}
      className="w-full h-10 flex items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
      )}
      Continuar com Google
    </button>
  )
}

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  // Step 1
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [cpf, setCpf] = useState('')

  // Step 2
  const [formacao, setFormacao] = useState('')
  const [formacaoCustom, setFormacaoCustom] = useState('')

  // Step 3
  const [estados, setEstados] = useState<string[]>([])
  const [tribunais, setTribunais] = useState<string[]>([])

  // Tribunais agrupados pelos estados selecionados
  const grupos = useMemo(() =>
    estados.map((uf) => ({
      uf,
      itens: TRIBUNAIS_POR_ESTADO[uf] ?? [],
    })),
    [estados]
  )

  function toggleEstado(uf: string) {
    setEstados((prev) => {
      const isAdding = !prev.includes(uf)
      const next = isAdding ? [...prev, uf] : prev.filter((e) => e !== uf)
      if (isAdding) {
        // Auto-seleciona só tribunais estaduais (TJ) ao adicionar um estado
        const tjSiglas = (TRIBUNAIS_POR_ESTADO[uf] ?? [])
          .filter((t) => t.tipo === 'estadual')
          .map((t) => t.sigla)
        setTribunais((t) => [...new Set([...t, ...tjSiglas])])
      } else {
        // Remove tribunais do estado que foi desmarcado
        const siglasDo = (TRIBUNAIS_POR_ESTADO[uf] ?? []).map((t) => t.sigla)
        setTribunais((t) => t.filter((s) => !siglasDo.includes(s)))
      }
      return next
    })
  }

  function toggleTribunal(sigla: string) {
    setTribunais((prev) =>
      prev.includes(sigla) ? prev.filter((s) => s !== sigla) : [...prev, sigla]
    )
  }

  function validateStep1() {
    if (!nome.trim()) return 'Informe seu nome completo.'
    if (!email.trim() || !email.includes('@')) return 'Informe um e-mail válido.'
    if (senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.'
    if (senha !== confirmar) return 'As senhas não coincidem.'
    return ''
  }

  function handleNext1() {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError('')
    setStep(2)
  }

  function handleNext2() {
    setError('')
    setStep(3)
  }

  async function handleSubmit() {
    if (estados.length === 0) {
      setError('Selecione pelo menos um estado de atuação.')
      return
    }
    setLoading(true)
    setError('')
    const result = await signup({
      nome,
      email,
      senha,
      cpf: cpf || undefined,
      formacao: formacao || undefined,
      formacaoCustom: formacao === 'Outra formação' ? formacaoCustom : undefined,
      estados,
      tribunais,
    })
    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }
    // Auto sign-in após cadastro (email já verificado automaticamente)
    await signIn('credentials', { email, password: senha, callbackUrl: '/dashboard' })
  }

  const stepLabels = ['Conta', 'Formação', 'Tribunais']

  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/logo.svg" alt="Perilab" width={180} height={68} priority />
        </div>
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-lime-50 flex items-center justify-center">
              <Check className="h-7 w-7 text-lime-500" />
            </div>
          </div>
          <h1 className="text-xl font-black text-slate-900">Conta criada!</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Enviamos um link de confirmação para <strong>{email}</strong>.
            Verifique sua caixa de entrada para ativar sua conta.
          </p>
          <a href="/login" className="inline-block text-sm font-bold text-[#84cc16] hover:underline">
            Ir para o login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <Image src="/logo.svg" alt="Perilab" width={180} height={68} priority />
      </div>

      <div className="w-full max-w-md">
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
                  <div className={`w-12 h-px mx-2 mb-4 ${step > n ? 'bg-lime-400' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">

          {/* STEP 1 — Conta */}
          {step === 1 && (
            <>
              {/* ── Google signup ── */}
              <GoogleSignupButton />
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ou com e-mail</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Crie sua conta</h1>
                <p className="text-xs text-slate-500 mt-0.5">Dados de acesso à plataforma</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Nome completo *</label>
                  <input
                    className={inputCls}
                    placeholder="Rafael Souza Costa"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-amber-700">
                    Use seu nome completo exatamente como consta nos diários oficiais. O Radar de Nomeações busca pelo nome completo.
                  </p>
                </div>
                <div>
                  <label className={labelCls}>E-mail *</label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Senha *</label>
                    <input
                      type="password"
                      className={inputCls}
                      placeholder="••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Confirmar *</label>
                    <input
                      type="password"
                      className={inputCls}
                      placeholder="••••••"
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>
                    CPF <span className="text-slate-400 font-normal">(usado para localizar nomeações)</span>
                  </label>
                  <input
                    className={inputCls}
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* STEP 2 — Formação */}
          {step === 2 && (
            <>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Sua formação</h1>
                <p className="text-xs text-slate-500 mt-0.5">Usada para personalizar seu perfil de perito</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Formação profissional</label>
                  <select
                    className={`${inputCls} cursor-pointer`}
                    value={formacao}
                    onChange={(e) => setFormacao(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {FORMACOES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                {formacao === 'Outra formação' && (
                  <div>
                    <label className={labelCls}>Especifique sua formação</label>
                    <input
                      className={inputCls}
                      placeholder="Ex: Geólogo, Biólogo..."
                      value={formacaoCustom}
                      onChange={(e) => setFormacaoCustom(e.target.value)}
                    />
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  Você pode completar seu perfil a qualquer momento nas configurações.
                </p>
              </div>
            </>
          )}

          {/* STEP 3 — Tribunais */}
          {step === 3 && (
            <>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Tribunais de atuação</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione os estados onde você atua — o radar buscará nomeações nos tribunais correspondentes.
                </p>
              </div>

              {/* Dropdown para adicionar estado */}
              <div className="space-y-2">
                <label className={labelCls}>Adicionar estado *</label>
                <select
                  className={`${inputCls} cursor-pointer`}
                  value=""
                  onChange={(e) => {
                    const uf = e.target.value
                    if (uf && !estados.includes(uf)) toggleEstado(uf)
                    e.target.value = ''
                  }}
                >
                  <option value="">Selecione um estado...</option>
                  {ESTADOS_DISPONIVEIS.filter((uf) => !estados.includes(uf)).map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>

              {/* Estados selecionados com seus tribunais */}
              {grupos.length > 0 && (
                <div className="space-y-3">
                  {grupos.map(({ uf, itens }) => (
                    <div key={uf} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">{uf}</p>
                        <button
                          type="button"
                          onClick={() => toggleEstado(uf)}
                          className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          remover
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {itens.map((t) => (
                          <button
                            key={t.sigla}
                            type="button"
                            onClick={() => toggleTribunal(t.sigla)}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors',
                              tribunais.includes(t.sigla)
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400',
                            )}
                          >
                            {tribunais.includes(t.sigla) && <Check className="h-2.5 w-2.5" />}
                            <span className="font-semibold">{t.sigla}</span>
                            <span className={cn('rounded px-1 text-[10px] font-medium', TIPO_COR[t.tipo])}>
                              {TIPO_LABEL[t.tipo]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {estados.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">
                  Selecione pelo menos um estado para continuar.
                </p>
              )}

              {tribunais.length > 0 && (
                <p className="text-xs text-lime-700 font-medium">
                  {tribunais.filter(s => s.startsWith('TJ')).length} tribunal(is) cível(is) — radar de nomeações ativo.
                </p>
              )}
            </>
          )}

          {error && (
            <p className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-600">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setError(''); setStep(step - 1) }}
                className="flex items-center gap-1 h-10 px-4 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={handleNext1}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-lime-500 hover:bg-lime-600 text-slate-900 text-sm font-semibold transition-colors"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                onClick={handleNext2}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-lime-500 hover:bg-lime-600 text-slate-900 text-sm font-semibold transition-colors"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {step === 3 && (
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
