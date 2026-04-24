'use client'

import { useState, useTransition } from 'react'
import { useEffect } from 'react'
import { Loader2, Search, Wallet, FileSearch, Bug, Target, Zap, Rocket, Flame } from 'lucide-react'
import {
  testBuscarProcessosEnvolvido,
  testVerificarSaldo,
  testBuscarV1,
  testBuscarV2Raw,
  testBuscarProcessoPorCnj,
  testBuscaCompleta,
  testDispararBuscaAssincronaCpf,
  testConsultarBuscaAssincrona,
  testFluxoNomeacoes,
  type TestEscavadorResult,
  type TestV1BuscaResult,
  type TestV2RawResult,
  type TestCnjResult,
  type TestBuscaCompletaResult,
  type TestAssincronaDispararResult,
  type TestAssincronaStatusResult,
  type TestFluxoResult,
} from '@/lib/actions/test-escavador'

export default function TesteApiPage() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<TestEscavadorResult | null>(null)
  const [resultV1, setResultV1] = useState<TestV1BuscaResult | null>(null)
  const [resultV2Raw, setResultV2Raw] = useState<TestV2RawResult | null>(null)
  const [resultCnj, setResultCnj] = useState<TestCnjResult | null>(null)
  const [resultCompleta, setResultCompleta] = useState<TestBuscaCompletaResult | null>(null)
  const [termoV1, setTermoV1] = useState('')
  const [cnjBusca, setCnjBusca] = useState('')
  const [mostrarAvancado, setMostrarAvancado] = useState(false)
  const [saldoInfo, setSaldoInfo] = useState<{ saldo?: number; descricao?: string; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isV1Pending, startV1Transition] = useTransition()
  const [isV2RawPending, startV2RawTransition] = useTransition()
  const [isCnjPending, startCnjTransition] = useTransition()
  const [isCompletaPending, startCompletaTransition] = useTransition()
  const [isSaldoPending, startSaldoTransition] = useTransition()

  // Busca assíncrona (V1 vai direto no PJe)
  const [asyncDispara, setAsyncDispara] = useState<TestAssincronaDispararResult | null>(null)
  const [asyncStatus, setAsyncStatus] = useState<TestAssincronaStatusResult | null>(null)
  const [isAsyncDispararPending, startAsyncDispararTransition] = useTransition()
  const [isAsyncPolling, setIsAsyncPolling] = useState(false)
  const [asyncPollCount, setAsyncPollCount] = useState(0)

  // Fluxo real (mirror de /nomeacoes)
  const [resultFluxo, setResultFluxo] = useState<TestFluxoResult | null>(null)
  const [isFluxoPending, startFluxoTransition] = useTransition()

  function handleTestFluxo() {
    setResultFluxo(null)
    startFluxoTransition(async () => {
      const res = await testFluxoNomeacoes()
      setResultFluxo(res)
    })
  }

  function handleBuscar() {
    setResult(null)
    startTransition(async () => {
      const res = await testBuscarProcessosEnvolvido(nome, cpf)
      setResult(res)
    })
  }

  function handleBuscarV1() {
    setResultV1(null)
    startV1Transition(async () => {
      const res = await testBuscarV1(termoV1 || nome)
      setResultV1(res)
    })
  }

  function handleBuscarV2Raw(opts?: { semCpf?: boolean; comHomonimos?: boolean; status?: 'ATIVO' | 'INATIVO' }) {
    setResultV2Raw(null)
    startV2RawTransition(async () => {
      const res = await testBuscarV2Raw(nome, cpf, opts)
      setResultV2Raw(res)
    })
  }

  function handleBuscarCnj() {
    setResultCnj(null)
    startCnjTransition(async () => {
      const res = await testBuscarProcessoPorCnj(cnjBusca, nome, cpf)
      setResultCnj(res)
    })
  }

  function handleBuscaCompleta() {
    setResultCompleta(null)
    startCompletaTransition(async () => {
      const res = await testBuscaCompleta(nome, cpf, email)
      setResultCompleta(res)
    })
  }

  function handleDispararAsync() {
    setAsyncDispara(null)
    setAsyncStatus(null)
    setAsyncPollCount(0)
    startAsyncDispararTransition(async () => {
      const res = await testDispararBuscaAssincronaCpf(cpf)
      setAsyncDispara(res)
      if (res.ok && res.requestId) {
        setIsAsyncPolling(true)
      }
    })
  }

  // Polling automático a cada 5s enquanto status = pendente/processando
  useEffect(() => {
    if (!isAsyncPolling || !asyncDispara?.requestId) return

    const interval = setInterval(async () => {
      const res = await testConsultarBuscaAssincrona(asyncDispara.requestId!)
      setAsyncStatus(res)
      setAsyncPollCount((n) => n + 1)

      const finalizado = res.status && ['concluido', 'concluído', 'finalizado', 'sucesso', 'done', 'erro', 'error', 'falhou'].some(s => res.status!.toLowerCase().includes(s))
      if (finalizado || !res.ok) {
        setIsAsyncPolling(false)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isAsyncPolling, asyncDispara?.requestId])

  function handleSaldo() {
    setSaldoInfo(null)
    startSaldoTransition(async () => {
      const res = await testVerificarSaldo()
      setSaldoInfo(res)
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8 px-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
          🧪 Teste API Escavador
        </h1>
        <p className="text-[12px] text-slate-400 mt-1">
          Página temporária — testa /v2/envolvido/processos. Exclua depois dos testes.
        </p>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━ FLUXO REAL DE /nomeacoes (mirror) ━━━━━━━━━━━━━━━━━━ */}
      <div className="rounded-xl border-4 border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-indigo-700" />
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-tight">
            🔥 Simular busca de /nomeacoes
          </h2>
        </div>
        <p className="text-[13px] text-slate-700">
          Roda EXATAMENTE o que o botão de buscar nomeações faz:
        </p>
        <ul className="text-[12px] text-slate-700 list-disc list-inside ml-2 space-y-1">
          <li><code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[11px]">GET /api/v2/envolvido/processos</code> (nome + CPF, até 5 páginas)</li>
          <li><code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[11px]">GET /api/v1/busca?q=&quot;&#123;email&#125;&quot;</code> (seu email)</li>
          <li><code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[11px]">GET /api/v1/diarios/&#123;id&#125;</code> (link_api de cada item sem CNJ)</li>
          <li>Aplica dedup + filtro TJ/DJ → mostra como ficaria em /nomeacoes</li>
        </ul>
        <p className="text-[12px] text-indigo-700 bg-white/60 border border-indigo-200 rounded px-3 py-2">
          ⚠️ Usa seus dados logados (nome, CPF, email) · <strong>NÃO persiste no banco</strong> · custo ~R$ 4,53
        </p>

        <button
          onClick={handleTestFluxo}
          disabled={isFluxoPending}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-5 text-[14px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-md"
        >
          {isFluxoPending
            ? <><Loader2 className="h-5 w-5 animate-spin" /> Rodando fluxo real...</>
            : <><Flame className="h-5 w-5" /> EXECUTAR FLUXO /nomeacoes</>
          }
        </button>

        {resultFluxo && (
          <div className="space-y-4 pt-2">
            {!resultFluxo.ok ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
                <p className="text-[13px] text-rose-800">❌ {resultFluxo.error}</p>
              </div>
            ) : (
              <>
                {/* Input usado */}
                {resultFluxo.input && (
                  <div className="rounded-lg bg-white border border-indigo-200 px-4 py-3 text-[12px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Dados usados</p>
                    <p><strong>Nome:</strong> {resultFluxo.input.nome}</p>
                    <p><strong>CPF:</strong> {resultFluxo.input.cpf ?? <span className="text-slate-400">(não cadastrado)</span>}</p>
                    <p><strong>Email:</strong> {resultFluxo.input.email ?? <span className="text-slate-400">(não cadastrado)</span>}</p>
                  </div>
                )}

                {/* Cards de resumo */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-300 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">V2 (páginas)</p>
                    <p className="text-[24px] font-black text-emerald-900">{resultFluxo.v2.paginas}</p>
                    <p className="text-[10px] text-emerald-600">{resultFluxo.v2.totalProcessos} processos</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-300 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">V1 email (items)</p>
                    <p className="text-[24px] font-black text-amber-900">{resultFluxo.v1Email.totalItems}</p>
                    <p className="text-[10px] text-amber-600">
                      snippet:{resultFluxo.v1Email.comCnjNoSnippet} · link_api:{resultFluxo.v1Email.comCnjViaLinkApi}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border-2 border-emerald-400 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">✓ Confirmadas</p>
                    <p className="text-[24px] font-black text-emerald-700">{resultFluxo.confirmadas.length}</p>
                  </div>
                  <div className="rounded-lg bg-white border-2 border-amber-400 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">📰 Diário Oficial</p>
                    <p className="text-[24px] font-black text-amber-700">{resultFluxo.diarioOficial.length}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900 text-white px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Créditos</p>
                    <p className="text-[24px] font-black">{resultFluxo.creditosConsumidos}</p>
                    <p className="text-[10px] text-slate-400">{resultFluxo.durationMs}ms</p>
                  </div>
                </div>

                {/* Preview de como ficaria em /nomeacoes */}
                <details open className="rounded-lg border-2 border-emerald-400 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-emerald-100 text-[13px] font-bold text-emerald-900 hover:bg-emerald-200">
                    ✅ Como apareceriam em /nomeacoes — Nomeações confirmadas ({resultFluxo.confirmadas.length})
                  </summary>
                  <pre className="overflow-auto max-h-[400px] p-4 text-[11px] font-mono text-slate-700">
                    {JSON.stringify(resultFluxo.confirmadas, null, 2)}
                  </pre>
                </details>

                <details open className="rounded-lg border-2 border-amber-400 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-amber-100 text-[13px] font-bold text-amber-900 hover:bg-amber-200">
                    📰 Como apareceriam em /nomeacoes — Diário Oficial ({resultFluxo.diarioOficial.length})
                  </summary>
                  <pre className="overflow-auto max-h-[400px] p-4 text-[11px] font-mono text-slate-700">
                    {JSON.stringify(resultFluxo.diarioOficial, null, 2)}
                  </pre>
                </details>

                {/* Brutos */}
                <details className="rounded-lg border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-700 hover:bg-slate-100">
                    Brutos V2 ({resultFluxo.v2.citacoes.length})
                  </summary>
                  <pre className="overflow-auto max-h-[400px] p-4 text-[11px] font-mono text-slate-700">
                    {JSON.stringify(resultFluxo.v2.citacoes, null, 2)}
                  </pre>
                </details>
                <details className="rounded-lg border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-700 hover:bg-slate-100">
                    Brutos V1 email ({resultFluxo.v1Email.citacoes.length})
                  </summary>
                  <pre className="overflow-auto max-h-[400px] p-4 text-[11px] font-mono text-slate-700">
                    {JSON.stringify(resultFluxo.v1Email.citacoes, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        )}
      </div>

      {/* Verificar saldo */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-slate-500" />
          <h2 className="text-[14px] font-semibold text-slate-800">Verificar saldo (grátis)</h2>
        </div>
        <button
          onClick={handleSaldo}
          disabled={isSaldoPending}
          className="flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-[12px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {isSaldoPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Consultar saldo
        </button>
        {saldoInfo && (
          <div className={`rounded-lg border px-4 py-3 ${saldoInfo.error ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
            {saldoInfo.error ? (
              <p className="text-[13px] text-rose-800">❌ {saldoInfo.error}</p>
            ) : (
              <div>
                <p className="text-[13px] font-semibold text-emerald-900">Saldo: {saldoInfo.saldo}</p>
                {saldoInfo.descricao && (
                  <p className="text-[12px] text-emerald-700">{saldoInfo.descricao}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━ BUSCA COMPLETA — 1 BOTÃO QUE FAZ TUDO ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="rounded-xl border-4 border-lime-500 bg-gradient-to-br from-lime-50 to-emerald-50 p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-lime-700" />
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-tight">
            BUSCA COMPLETA — 1 clique
          </h2>
        </div>
        <p className="text-[13px] text-slate-700">
          Roda <strong>4 estratégias em paralelo</strong> (com CPF, sem CPF, com homônimos, inativos),
          deduplica por CNJ e mostra <strong>todos os processos únicos</strong> em uma lista só.
          Marca de onde cada processo veio.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
              Nome completo *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 focus:outline-none focus:border-lime-600 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
              CPF (opcional)
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="123.456.789-00"
              className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 focus:outline-none focus:border-lime-600 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
              Email (opcional) 🔑
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mmbonassi@gmail.com"
              className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 focus:outline-none focus:border-lime-600 transition-all"
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-600 bg-white/60 border border-lime-200 rounded px-3 py-2">
          🔑 <strong>Email é crucial:</strong> muitos tribunais (ex: Meriti) publicam a nomeação no Diário Oficial
          com o email no texto. Se preencher o email, disparamos busca V1 no Diário Oficial — aparece nomeações
          que a V2 não indexou ainda.
        </p>

        <button
          onClick={handleBuscaCompleta}
          disabled={isCompletaPending || !nome.trim()}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-lime-600 hover:bg-lime-700 text-white px-4 py-5 text-[14px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-md"
        >
          {isCompletaPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
          {isCompletaPending ? 'Rodando buscas em paralelo...' : 'BUSCAR TUDO'}
        </button>

        {resultCompleta && (
          <div className="space-y-4 pt-3">
            {!resultCompleta.ok ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
                <p className="text-[13px] text-rose-800">❌ {resultCompleta.error}</p>
              </div>
            ) : (
              <>
                {/* Resumo */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="rounded-lg bg-white border-2 border-lime-400 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Únicos</p>
                    <p className="text-[24px] font-black text-slate-900">{resultCompleta.totalUnicos ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-300 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Aceitos</p>
                    <p className="text-[24px] font-black text-emerald-900">{resultCompleta.totalAceitos ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-rose-50 border border-rose-300 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700">Rejeitados</p>
                    <p className="text-[24px] font-black text-rose-900">{resultCompleta.totalRejeitados ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-300 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Créditos</p>
                    <p className="text-[24px] font-black text-amber-900">{resultCompleta.creditosConsumidos ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tempo</p>
                    <p className="text-[24px] font-black text-slate-900">{resultCompleta.durationMs}ms</p>
                  </div>
                </div>

                {/* Por estratégia */}
                {resultCompleta.porEstrategia && (
                  <div className="rounded-lg bg-white border border-slate-200 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Processos por estratégia (antes do dedup)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(resultCompleta.porEstrategia).map(([est, count]) => (
                        <span key={est} className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {est}: <strong>{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de processos */}
                <div className="rounded-lg border-2 border-lime-400 bg-white overflow-hidden">
                  <div className="bg-lime-100 px-4 py-3">
                    <p className="text-[13px] font-black text-lime-900 uppercase tracking-widest">
                      📋 Todos os {resultCompleta.processos?.length ?? 0} processos únicos encontrados
                    </p>
                  </div>
                  <div className="max-h-[600px] overflow-auto">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-bold">CNJ</th>
                          <th className="text-left px-3 py-2 font-bold">Tribunal / Unidade</th>
                          <th className="text-left px-3 py-2 font-bold">Polos</th>
                          <th className="text-left px-3 py-2 font-bold">Tipo</th>
                          <th className="text-left px-3 py-2 font-bold">Decisão</th>
                          <th className="text-left px-3 py-2 font-bold">Status</th>
                          <th className="text-left px-3 py-2 font-bold">CPF cad.</th>
                          <th className="text-left px-3 py-2 font-bold">Achado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(resultCompleta.processos ?? []).map((p) => (
                          <tr
                            key={p.cnj}
                            className={p.decisao === 'aceito' ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-rose-50 hover:bg-rose-100'}
                          >
                            <td className="px-3 py-2 font-mono text-[10px]">
                              <a href={p.linkEscavador} target="_blank" rel="noreferrer" className="text-indigo-700 hover:underline">
                                {p.cnj}
                              </a>
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-bold">{p.tribunal}</div>
                              <div className="text-slate-500 text-[10px]">{p.unidade}</div>
                            </td>
                            <td className="px-3 py-2 text-[10px]">
                              {p.poloAtivo && <div>↑ {p.poloAtivo}</div>}
                              {p.poloPassivo && <div>↓ {p.poloPassivo}</div>}
                            </td>
                            <td className="px-3 py-2 font-bold">{p.tipoEnvolvido}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                                p.decisao === 'aceito' ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                              }`}>
                                {p.decisao}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-mono ${
                                p.status === 'INATIVO' ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {p.status ?? '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {p.cpfCadastradoNoProcesso ? (
                                <span className="text-emerald-700 font-bold">✓</span>
                              ) : (
                                <span className="text-rose-700 font-bold">✗</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {p.achadoEm.map((est) => (
                                  <span key={est} className="text-[9px] font-mono bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded">
                                    {est}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Debug V1 - items retornados pela busca por email */}
                {resultCompleta.v1ItemsDebug && resultCompleta.v1ItemsDebug.length > 0 && (
                  <details open className="rounded-lg border-2 border-orange-400 bg-white">
                    <summary className="cursor-pointer px-4 py-3 bg-orange-100 text-[13px] font-bold text-orange-900 hover:bg-orange-200">
                      🔍 DEBUG V1 Email — items retornados pela busca no Diário Oficial ({resultCompleta.v1ItemsDebug.length})
                    </summary>
                    <div className="p-4 space-y-4">
                      {resultCompleta.v1ItemsDebug.map((item, i) => (
                        <div key={i} className="border border-slate-200 rounded-lg p-4 space-y-2 text-[11px]">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-bold text-slate-600">Diário:</span> {item.diario_sigla} — {item.diario_data}
                            </div>
                            <div>
                              <span className="font-bold text-slate-600">CNJ do snippet:</span>{' '}
                              {item.cnj_extraido_do_snippet
                                ? <span className="text-emerald-700 font-mono">✓ {item.cnj_extraido_do_snippet}</span>
                                : <span className="text-rose-700">✗ não encontrado</span>
                              }
                            </div>
                          </div>
                          <div>
                            <span className="font-bold text-slate-600">CNJ via link_api:</span>{' '}
                            {item.cnj_extraido_do_link_api
                              ? <span className="text-emerald-700 font-mono">✓ {item.cnj_extraido_do_link_api}</span>
                              : <span className="text-rose-700">✗ não encontrado</span>
                            }
                          </div>
                          {item.link_api && (
                            <div>
                              <span className="font-bold text-slate-600">link_api:</span>{' '}
                              <a href={item.link_api} target="_blank" rel="noreferrer" className="text-indigo-700 hover:underline font-mono text-[10px] break-all">
                                {item.link_api}
                              </a>
                            </div>
                          )}
                          {item.link && (
                            <div>
                              <span className="font-bold text-slate-600">link:</span>{' '}
                              <a href={item.link} target="_blank" rel="noreferrer" className="text-indigo-700 hover:underline font-mono text-[10px] break-all">
                                {item.link}
                              </a>
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-600">Preview do texto:</span>
                            <p className="bg-slate-50 p-2 rounded mt-1 font-mono text-[10px] text-slate-700 whitespace-pre-wrap">{item.texto_preview}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* JSON bruto */}
                <details className="rounded-lg border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-800 hover:bg-slate-100">
                    JSON completo dos processos consolidados
                  </summary>
                  <pre className="overflow-auto max-h-[500px] p-4 text-[11px] font-mono text-slate-700">
                    {JSON.stringify(resultCompleta.processos, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━ BUSCA ASSÍNCRONA V1 — DIRETO NO PJe ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="rounded-xl border-4 border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-orange-700" />
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-tight">
            🚀 BUSCA NO PJe EM TEMPO REAL (R$ 1,50)
          </h2>
        </div>
        <p className="text-[13px] text-slate-700">
          <strong>Vai direto nos tribunais (PJe, eProc, Projudi)</strong> pelo CPF.
          Não depende do índice do Escavador. É a forma mais completa de descobrir TODOS os
          processos onde você está cadastrado. Assíncrono — leva de minutos a algumas horas.
        </p>

        <div className="rounded-lg bg-white/60 border border-orange-200 px-4 py-3">
          <p className="text-[12px] text-slate-600">
            ⚠️ Usa o CPF do formulário acima: <strong className="font-mono">{cpf || '(vazio)'}</strong>
          </p>
        </div>

        <button
          onClick={handleDispararAsync}
          disabled={isAsyncDispararPending || isAsyncPolling || !cpf.trim()}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-4 py-5 text-[14px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-md"
        >
          {isAsyncDispararPending
            ? <><Loader2 className="h-5 w-5 animate-spin" /> Disparando busca...</>
            : isAsyncPolling
              ? <><Loader2 className="h-5 w-5 animate-spin" /> Buscando nos tribunais... (poll {asyncPollCount})</>
              : <><Rocket className="h-5 w-5" /> DISPARAR BUSCA NO PJe (R$ 1,50)</>
          }
        </button>

        {/* Resposta do dispara */}
        {asyncDispara && (
          <div className="space-y-3 pt-2">
            {!asyncDispara.ok ? (
              <div className="rounded-lg bg-rose-50 border-2 border-rose-300 px-4 py-3">
                <p className="text-[13px] font-bold text-rose-900">❌ Erro ao disparar</p>
                <p className="text-[12px] text-rose-700 mt-1">{asyncDispara.error}</p>
                {asyncDispara.endpoint && (
                  <p className="text-[10px] text-rose-600 mt-1 font-mono">Último endpoint tentado: {asyncDispara.endpoint}</p>
                )}
                {asyncDispara.rawResponse != null && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] text-rose-700">Resposta bruta</summary>
                    <pre className="text-[10px] font-mono bg-white p-2 mt-1 overflow-auto max-h-40">
                      {JSON.stringify(asyncDispara.rawResponse, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-emerald-50 border-2 border-emerald-300 px-4 py-3">
                  <p className="text-[13px] font-bold text-emerald-900">✅ Busca disparada com sucesso!</p>
                  <p className="text-[12px] text-emerald-700 mt-1">
                    Request ID: <span className="font-mono font-bold">{asyncDispara.requestId}</span>
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1 font-mono">
                    Endpoint: {asyncDispara.endpoint}
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-2">
                    💡 Polling automático a cada 5s até concluir ou dar erro.
                  </p>
                </div>

                {/* Status do polling */}
                {asyncStatus && (
                  <div className={`rounded-lg border-2 px-4 py-3 ${
                    asyncStatus.status?.toLowerCase().includes('concluido') || asyncStatus.status?.toLowerCase().includes('sucesso')
                      ? 'bg-emerald-50 border-emerald-400'
                      : asyncStatus.status?.toLowerCase().includes('erro') || asyncStatus.status?.toLowerCase().includes('falhou')
                      ? 'bg-rose-50 border-rose-400'
                      : 'bg-amber-50 border-amber-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Status</p>
                        <p className="text-[18px] font-black text-slate-900 mt-0.5">{asyncStatus.status ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500">Consultas: {asyncPollCount}</p>
                        <p className="text-[10px] text-slate-500">Última resp: {asyncStatus.durationMs}ms</p>
                      </div>
                    </div>

                    {asyncStatus.processos && asyncStatus.processos.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-[13px] font-bold text-slate-800">
                          🎉 {asyncStatus.totalEncontrados ?? asyncStatus.processos.length} processos encontrados direto no PJe
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Resultados */}
                {asyncStatus?.processos && asyncStatus.processos.length > 0 && (
                  <details open className="rounded-lg border-2 border-emerald-400 bg-white">
                    <summary className="cursor-pointer px-4 py-3 bg-emerald-100 text-[13px] font-bold text-emerald-900 hover:bg-emerald-200">
                      📋 {asyncStatus.processos.length} Processos Retornados Direto do PJe
                    </summary>
                    <pre className="overflow-auto max-h-[600px] p-4 text-[11px] font-mono text-slate-700">
                      {JSON.stringify(asyncStatus.processos, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Raw status completo */}
                {asyncStatus?.rawStatus != null && (
                  <details className="rounded-lg border border-slate-200 bg-white">
                    <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-800 hover:bg-slate-100">
                      Status bruto da API
                    </summary>
                    <pre className="overflow-auto max-h-[300px] p-4 text-[11px] font-mono text-slate-700">
                      {JSON.stringify(asyncStatus.rawStatus, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Resultados brutos */}
                {asyncStatus?.rawResultados != null && (
                  <details className="rounded-lg border border-slate-200 bg-white">
                    <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-800 hover:bg-slate-100">
                      Resultados brutos (JSON completo)
                    </summary>
                    <pre className="overflow-auto max-h-[500px] p-4 text-[11px] font-mono text-slate-700">
                      {JSON.stringify(asyncStatus.rawResultados, null, 2)}
                    </pre>
                  </details>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Toggle para modo avançado */}
      <div className="flex items-center justify-center py-4">
        <button
          onClick={() => setMostrarAvancado(!mostrarAvancado)}
          className="text-[12px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
        >
          {mostrarAvancado ? '▼ Ocultar' : '▶ Mostrar'} testes avançados individuais (debug)
        </button>
      </div>

      {!mostrarAvancado ? null : <>

      {/* Busca por nome + CPF */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500" />
          <h2 className="text-[14px] font-semibold text-slate-800">Buscar processos (CUSTA CRÉDITO)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
              Nome completo *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: José da Silva"
              className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 focus:outline-none focus:border-slate-900 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
              CPF (opcional, 11 dígitos)
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="Ex: 123.456.789-00"
              className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 focus:outline-none focus:border-slate-900 transition-all"
            />
          </div>
        </div>
        <button
          onClick={handleBuscar}
          disabled={isPending || !nome.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#a3e635] hover:bg-[#bef264] text-slate-900 px-4 py-3 text-[12px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Buscar processos
        </button>
      </div>

      {/* ───────── Busca direta por CNJ (valida se Escavador tem o processo) ───────── */}
      <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50/30 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-700" />
          <h2 className="text-[14px] font-semibold text-slate-800">
            🎯 Busca direta por CNJ (R$ 0,10 — prova definitiva)
          </h2>
        </div>
        <p className="text-[12px] text-slate-600">
          Se você tem um CNJ que <strong>deveria aparecer mas não apareceu</strong>, cole aqui.
          Esse endpoint vai dizer se o Escavador tem o processo e como você está cadastrado nele
          (como "Perito", "Requerente", sem seu CPF, etc).
        </p>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
            Número CNJ do processo
          </label>
          <input
            type="text"
            value={cnjBusca}
            onChange={(e) => setCnjBusca(e.target.value)}
            placeholder="Ex: 0814811-56.2023.8.19.0054"
            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-mono text-slate-800 focus:outline-none focus:border-indigo-600 transition-all"
          />
        </div>
        <button
          onClick={handleBuscarCnj}
          disabled={isCnjPending || !cnjBusca.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 text-[12px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {isCnjPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
          Consultar processo por CNJ
        </button>

        {resultCnj && (
          <div className="space-y-3 pt-2">
            {!resultCnj.ok ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
                <p className="text-[13px] text-rose-800 font-semibold">
                  ❌ {resultCnj.httpStatus === 404 ? 'Escavador NÃO tem esse processo (404)' : resultCnj.error}
                </p>
                {resultCnj.httpStatus === 404 && (
                  <p className="text-[12px] text-rose-600 mt-1">
                    Significa que o Escavador ainda não indexou esse CNJ. Talvez a publicação tenha sido muito recente ou o tribunal não sincronizou ainda.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Match info */}
                <div className={`rounded-lg px-4 py-3 border-2 ${resultCnj.matchEncontrado ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
                  {resultCnj.matchEncontrado ? (
                    <>
                      <p className="text-[13px] font-bold text-emerald-900">
                        ✅ Você ESTÁ cadastrado neste processo!
                      </p>
                      <div className="mt-2 space-y-1 text-[12px] text-emerald-800">
                        <p><strong>Nome cadastrado:</strong> {resultCnj.matchEncontrado.nome ?? '—'}</p>
                        <p><strong>Tipo:</strong> <span className="font-mono bg-emerald-100 px-1">{resultCnj.matchEncontrado.tipo_normalizado ?? resultCnj.matchEncontrado.tipo ?? '—'}</span></p>
                        <p><strong>CPF cadastrado no processo:</strong> {resultCnj.matchEncontrado.cpf ?? <span className="text-rose-700 font-bold">NÃO</span>}</p>
                      </div>
                      {!resultCnj.matchEncontrado.cpf && (
                        <p className="mt-2 text-[12px] font-semibold text-amber-800 bg-amber-100 px-3 py-2 rounded">
                          🎯 <strong>PROBLEMA ENCONTRADO:</strong> Seu CPF NÃO está cadastrado neste processo no Escavador.
                          Por isso a busca com CPF não o traz. Solução: usar busca por nome (sem CPF).
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[13px] font-bold text-amber-900">
                      ⚠️ Processo existe no Escavador, mas <strong>seu nome/CPF não foi encontrado nos envolvidos</strong>.
                    </p>
                  )}
                </div>

                {/* Meta info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-white border border-indigo-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tribunal</p>
                    <p className="text-[14px] font-bold text-slate-900">{resultCnj.tribunal ?? '—'}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-indigo-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status Escavador</p>
                    <p className={`text-[14px] font-bold ${resultCnj.status === 'INATIVO' ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {resultCnj.status ?? '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-indigo-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Envolvidos</p>
                    <p className="text-[14px] font-bold text-slate-900">{resultCnj.envolvidos?.length ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-indigo-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Última mov.</p>
                    <p className="text-[12px] font-bold text-slate-900">{resultCnj.dataUltimaMov ?? '—'}</p>
                  </div>
                </div>

                {/* Lista de envolvidos */}
                <details open className="rounded-lg border border-indigo-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-indigo-50 text-[13px] font-semibold text-indigo-900 hover:bg-indigo-100">
                    👥 Envolvidos ({resultCnj.envolvidos?.length ?? 0}) — como cada um está cadastrado
                  </summary>
                  <div className="max-h-[400px] overflow-auto">
                    <pre className="p-4 text-[11px] font-mono text-slate-700">
                      {JSON.stringify(resultCnj.envolvidos, null, 2)}
                    </pre>
                  </div>
                </details>

                {/* JSON bruto completo */}
                <details className="rounded-lg border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-800 hover:bg-slate-100">
                    JSON bruto completo do processo
                  </summary>
                  <pre className="overflow-auto max-h-[500px] p-4 text-[11px] font-mono text-slate-700">
                    {JSON.stringify(resultCnj.rawResponse, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        )}
      </div>

      {/* ───────── V2 RAW — SEM FILTROS (debug: ver o que está sendo rejeitado) ───────── */}
      <div className="rounded-xl border-2 border-rose-300 bg-rose-50/30 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-rose-700" />
          <h2 className="text-[14px] font-semibold text-slate-800">
            🐛 V2 RAW — SEM NENHUM FILTRO (debug)
          </h2>
        </div>
        <p className="text-[12px] text-slate-600">
          Usa nome + CPF dos campos acima. Chama <code className="bg-slate-100 px-1 rounded">/v2/envolvido/processos</code> e
          mostra <strong>TODOS os processos</strong> retornados + análise de cada um: quais passaram, quais foram rejeitados e <strong>por quê</strong>.
          Se sua perícia está sendo cortada por algum filtro, aparece aqui na seção "Rejeitados".
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => handleBuscarV2Raw()}
            disabled={isV2RawPending || !nome.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-3 text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isV2RawPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
            V2 Normal (nome + CPF)
          </button>
          <button
            onClick={() => handleBuscarV2Raw({ semCpf: true })}
            disabled={isV2RawPending || !nome.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-3 text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isV2RawPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
            V2 SEM CPF (só nome)
          </button>
          <button
            onClick={() => handleBuscarV2Raw({ comHomonimos: true })}
            disabled={isV2RawPending || !nome.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3 py-3 text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isV2RawPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
            V2 COM HOMÔNIMOS
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => handleBuscarV2Raw({ status: 'INATIVO' })}
            disabled={isV2RawPending || !nome.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white px-3 py-3 text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isV2RawPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
            V2 só INATIVOS (processos antigos)
          </button>
          <button
            onClick={() => handleBuscarV2Raw({ semCpf: true, comHomonimos: true, status: 'INATIVO' })}
            disabled={isV2RawPending || !nome.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-black text-white px-3 py-3 text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isV2RawPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
            V2 MÁXIMO (sem CPF + homônimos + INATIVO)
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          💡 Se não achou no "V2 Normal": tente SEM CPF (tribunal pode não ter seu CPF no processo), COM HOMÔNIMOS (match parcial), INATIVOS (processos antigos arquivados), ou MÁXIMO (tudo combinado).
        </p>

        {resultV2Raw && (
          <div className="space-y-4 pt-2">
            {!resultV2Raw.ok ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
                <p className="text-[13px] text-rose-800">❌ {resultV2Raw.error}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-white border border-rose-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total na API</p>
                    <p className="text-[20px] font-bold text-slate-900">{resultV2Raw.totalProcessos ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-300 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Aceitos</p>
                    <p className="text-[20px] font-bold text-emerald-900">{resultV2Raw.aceitos?.length ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-rose-50 border border-rose-300 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700">❌ Rejeitados</p>
                    <p className="text-[20px] font-bold text-rose-900">{resultV2Raw.rejeitados?.length ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tempo</p>
                    <p className="text-[20px] font-bold text-slate-900">{resultV2Raw.durationMs}ms</p>
                  </div>
                </div>

                {/* Análise item-por-item */}
                <details open className="rounded-lg border-2 border-rose-400 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-rose-100 text-[13px] font-bold text-rose-900 hover:bg-rose-200">
                    🔍 Análise de cada processo (por que passou/foi rejeitado)
                  </summary>
                  <div className="max-h-[500px] overflow-auto">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-bold">CNJ</th>
                          <th className="text-left px-3 py-2 font-bold">Tribunal</th>
                          <th className="text-left px-3 py-2 font-bold">Tipo Escavador</th>
                          <th className="text-left px-3 py-2 font-bold">Decisão</th>
                          <th className="text-left px-3 py-2 font-bold">Motivo</th>
                          <th className="text-left px-3 py-2 font-bold">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(resultV2Raw.analise ?? []).map((a, i) => (
                          <tr key={i} className={a.decisao === 'aceito' ? 'bg-emerald-50' : 'bg-rose-50'}>
                            <td className="px-3 py-2 font-mono text-[10px]">{a.numero_cnj}</td>
                            <td className="px-3 py-2">{a.tribunal_sigla}</td>
                            <td className="px-3 py-2 font-bold">{a.tipoEnvolvido}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                                a.decisao === 'aceito' ? 'bg-emerald-200 text-emerald-900' :
                                a.decisao === 'rejeitado_parte' ? 'bg-rose-200 text-rose-900' :
                                'bg-amber-200 text-amber-900'
                              }`}>
                                {a.decisao}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-600">{a.motivo}</td>
                            <td className="px-3 py-2 text-slate-500">{a.dataUltimaMov ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>

                {/* Rejeitados — JSON bruto */}
                {(resultV2Raw.rejeitados?.length ?? 0) > 0 && (
                  <details className="rounded-lg border border-rose-200 bg-white">
                    <summary className="cursor-pointer px-4 py-3 bg-rose-50 text-[13px] font-semibold text-rose-900 hover:bg-rose-100">
                      ❌ JSON bruto dos {resultV2Raw.rejeitados?.length} processos REJEITADOS
                    </summary>
                    <pre className="overflow-auto max-h-[500px] p-4 text-[11px] font-mono text-slate-700">
                      {JSON.stringify(resultV2Raw.rejeitados, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Aceitos */}
                <details className="rounded-lg border border-emerald-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-emerald-50 text-[13px] font-semibold text-emerald-900 hover:bg-emerald-100">
                    ✅ JSON bruto dos {resultV2Raw.aceitos?.length} processos ACEITOS
                  </summary>
                  <pre className="overflow-auto max-h-[500px] p-4 text-[11px] font-mono text-slate-700">
                    {JSON.stringify(resultV2Raw.aceitos, null, 2)}
                  </pre>
                </details>

                {/* Saldo */}
                <div className="flex items-center gap-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Saldo antes</p>
                    <p className="text-[15px] font-bold text-amber-900">{resultV2Raw.saldoAntes}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Saldo depois</p>
                    <p className="text-[15px] font-bold text-amber-900">{resultV2Raw.saldoDepois}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Consumido</p>
                    <p className="text-[15px] font-bold text-amber-900">
                      {(resultV2Raw.saldoAntes ?? 0) - (resultV2Raw.saldoDepois ?? 0)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ───────── V1 /busca — DIÁRIOS OFICIAIS (onde nomeações aparecem) ───────── */}
      <div className="rounded-xl border-2 border-lime-300 bg-lime-50/30 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-lime-700" />
          <h2 className="text-[14px] font-semibold text-slate-800">
            V1 Busca em Diários Oficiais (R$ 0,03 por busca — ONDE NOMEAÇÕES APARECEM)
          </h2>
        </div>
        <p className="text-[12px] text-slate-600">
          Se sua perícia não apareceu na V2, ela provavelmente está aqui. A V1 busca em publicações
          dos Diários Oficiais dos tribunais (onde nomeações de peritos são publicadas).
        </p>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
            Termo de busca (nome ou CPF) — se vazio usa o nome do campo acima
          </label>
          <input
            type="text"
            value={termoV1}
            onChange={(e) => setTermoV1(e.target.value)}
            placeholder="Ex: Marcus Frederico"
            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 focus:outline-none focus:border-lime-600 transition-all"
          />
        </div>
        <button
          onClick={handleBuscarV1}
          disabled={isV1Pending || (!termoV1.trim() && !nome.trim())}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-lime-600 hover:bg-lime-700 text-white px-4 py-3 text-[12px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {isV1Pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
          Buscar em Diários Oficiais (V1)
        </button>

        {resultV1 && (
          <div className="space-y-4 pt-2">
            {!resultV1.ok ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
                <p className="text-[13px] text-rose-800">❌ {resultV1.error}</p>
                {resultV1.durationMs != null && (
                  <p className="text-[11px] text-rose-600 mt-1">{resultV1.durationMs}ms</p>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-white border border-lime-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total encontrados</p>
                    <p className="text-[20px] font-bold text-slate-900">{resultV1.totalResultados ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-lime-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Páginas</p>
                    <p className="text-[20px] font-bold text-slate-900">{resultV1.totalPaginas ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-lime-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Candidatos (com perito/laudo)</p>
                    <p className="text-[20px] font-bold text-lime-700">{resultV1.candidatos?.length ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-lime-200 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tempo</p>
                    <p className="text-[20px] font-bold text-slate-900">{resultV1.durationMs}ms</p>
                  </div>
                </div>

                {/* Distribuição por tribunal */}
                {resultV1.tribunalCounts && Object.keys(resultV1.tribunalCounts).length > 0 && (
                  <div className="rounded-lg bg-white border border-slate-200 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                      Distribuição por Diário Oficial (DJ*) / Tribunal
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(resultV1.tribunalCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([sigla, count]) => (
                          <span key={sigla} className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                            {sigla}: <strong>{count}</strong>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Saldo */}
                <div className="flex items-center gap-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Saldo antes</p>
                    <p className="text-[15px] font-bold text-amber-900">{resultV1.saldoAntes}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Saldo depois</p>
                    <p className="text-[15px] font-bold text-amber-900">{resultV1.saldoDepois}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Consumido</p>
                    <p className="text-[15px] font-bold text-amber-900">
                      {(resultV1.saldoAntes ?? 0) - (resultV1.saldoDepois ?? 0)}
                    </p>
                  </div>
                </div>

                {/* Candidatos (items com perito/laudo/nomeação) */}
                <details open className="rounded-lg border-2 border-lime-400 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-lime-100 text-[13px] font-bold text-lime-900 hover:bg-lime-200">
                    🎯 CANDIDATOS — items que mencionam perito/perícia/laudo ({resultV1.candidatos?.length ?? 0})
                  </summary>
                  <pre className="overflow-auto max-h-[500px] p-4 text-[11px] font-mono text-slate-700">
                    {JSON.stringify(resultV1.candidatos, null, 2)}
                  </pre>
                </details>

                {/* Todos os items brutos */}
                <details className="rounded-lg border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-800 hover:bg-slate-100">
                    Todos os resultados brutos ({resultV1.rawItems?.length ?? 0})
                  </summary>
                  <pre className="overflow-auto max-h-[500px] p-4 text-[11px] font-mono text-slate-700">
                    {JSON.stringify(resultV1.rawItems, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-[14px] font-semibold text-slate-800">Resultado</h2>

          {!result.ok ? (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
              <p className="text-[13px] text-rose-800">❌ {result.error}</p>
              {result.durationMs != null && (
                <p className="text-[11px] text-rose-600 mt-1">{result.durationMs}ms</p>
              )}
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total processos</p>
                  <p className="text-[20px] font-bold text-slate-900">{result.totalProcessos ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Páginas</p>
                  <p className="text-[20px] font-bold text-slate-900">{result.totalPages ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Citações (filtradas)</p>
                  <p className="text-[20px] font-bold text-slate-900">{result.citacoesCount ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tempo</p>
                  <p className="text-[20px] font-bold text-slate-900">{result.durationMs}ms</p>
                </div>
              </div>

              {/* Saldo */}
              <div className="flex items-center gap-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Saldo antes</p>
                  <p className="text-[15px] font-bold text-amber-900">{result.saldoAntes}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Saldo depois</p>
                  <p className="text-[15px] font-bold text-amber-900">{result.saldoDepois}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Consumido</p>
                  <p className="text-[15px] font-bold text-amber-900">
                    {(result.saldoAntes ?? 0) - (result.saldoDepois ?? 0)}
                  </p>
                </div>
              </div>

              {/* Citações processadas pelo service */}
              <details open className="rounded-lg border border-slate-200">
                <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-800 hover:bg-slate-100">
                  Citações processadas pelo EscavadorService ({result.citacoesCount})
                </summary>
                <pre className="overflow-auto max-h-96 p-4 text-[11px] font-mono text-slate-700 bg-slate-900/5">
                  {JSON.stringify(result.citacoes, null, 2)}
                </pre>
              </details>

              {/* JSON bruto da API */}
              <details className="rounded-lg border border-slate-200">
                <summary className="cursor-pointer px-4 py-3 bg-slate-50 text-[13px] font-semibold text-slate-800 hover:bg-slate-100">
                  JSON bruto da API Escavador (payload completo)
                </summary>
                <pre className="overflow-auto max-h-[500px] p-4 text-[11px] font-mono text-slate-700 bg-slate-900/5">
                  {JSON.stringify(result.rawResponse, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}

      </>}
    </div>
  )
}
