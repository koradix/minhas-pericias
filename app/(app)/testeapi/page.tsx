'use client'

import { useState, useTransition } from 'react'
import { Loader2, Search, Wallet, FileSearch } from 'lucide-react'
import {
  testBuscarProcessosEnvolvido,
  testVerificarSaldo,
  testBuscarV1,
  type TestEscavadorResult,
  type TestV1BuscaResult,
} from '@/lib/actions/test-escavador'

export default function TesteApiPage() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [result, setResult] = useState<TestEscavadorResult | null>(null)
  const [resultV1, setResultV1] = useState<TestV1BuscaResult | null>(null)
  const [termoV1, setTermoV1] = useState('')
  const [saldoInfo, setSaldoInfo] = useState<{ saldo?: number; descricao?: string; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isV1Pending, startV1Transition] = useTransition()
  const [isSaldoPending, startSaldoTransition] = useTransition()

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
    </div>
  )
}
