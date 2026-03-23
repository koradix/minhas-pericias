'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { upsertPropostaHonorarios, type PropostaActionState } from '@/lib/actions/propostas-honorarios'
import type { PropostaHonorarios } from '@prisma/client'

// ── Input / Textarea style helpers ────────────────────────────────────────────

const inputCls =
  'w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500/40 disabled:opacity-50'

const textareaCls =
  'w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500/40 disabled:opacity-50'

const readonlyCls =
  'w-full h-10 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm text-slate-500 cursor-default select-none flex items-center'

const labelCls = 'block text-xs font-medium text-slate-700 mb-1.5'
const errorCls = 'mt-1 text-xs text-red-500'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Pericia {
  id: string
  numero: string
  assunto: string
  processo: string
  vara: string
  cliente: string
}

interface PropostaFormProps {
  pericia: Pericia
  draft: PropostaHonorarios | null
  peritoNomeDefault: string
  peritoQualDefault: string
}

const initial: PropostaActionState = {}

// ── Today as YYYY-MM-DD ───────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PropostaHonorariosForm({ pericia, draft, peritoNomeDefault, peritoQualDefault }: PropostaFormProps) {
  const [state, formAction, isPending] = useActionState(upsertPropostaHonorarios, initial)
  const [showOptional, setShowOptional] = useState(
    !!(draft?.custoDeslocamento || draft?.horasTecnicas || draft?.complexidadeNota),
  )

  return (
    <form action={formAction} className="space-y-6">

      {/* ── Hidden process context fields ─────────────────────────────────── */}
      <input type="hidden" name="pericoId"       value={String(pericia.id)} />
      <input type="hidden" name="pericoNumero"   value={pericia.numero} />
      <input type="hidden" name="pericoAssunto"  value={pericia.assunto} />
      <input type="hidden" name="pericoProcesso" value={pericia.processo} />
      <input type="hidden" name="pericoVara"     value={pericia.vara} />
      <input type="hidden" name="pericoPartes"   value={pericia.cliente} />

      {/* ══ 1. Dados do processo (read-only) ════════════════════════════════ */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Dados do processo
          </p>
        </div>
        <div className="p-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Número</label>
            <div className={readonlyCls}>{pericia.numero}</div>
          </div>
          <div>
            <label className={labelCls}>Processo</label>
            <div className={readonlyCls}>{pericia.processo}</div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Assunto</label>
            <div className={readonlyCls}>{pericia.assunto}</div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Vara / Tribunal</label>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500 leading-snug">
              {pericia.vara}
            </div>
          </div>
          <div>
            <label className={labelCls}>Parte / Autor</label>
            <div className={readonlyCls}>{pericia.cliente}</div>
          </div>
        </div>
      </section>

      {/* ══ 2. Identificação do perito ══════════════════════════════════════ */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Identificação do perito
          </p>
        </div>
        <div className="p-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="peritoNome" className={labelCls}>
              Nome do perito <span className="text-red-500">*</span>
            </label>
            <input
              id="peritoNome"
              name="peritoNome"
              type="text"
              defaultValue={draft?.peritoNome || peritoNomeDefault}
              placeholder="Nome completo"
              disabled={isPending}
              className={inputCls}
            />
            {state.errors?.peritoNome && (
              <p className={errorCls}>{state.errors.peritoNome[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="peritoQualificacao" className={labelCls}>
              Qualificação
            </label>
            <input
              id="peritoQualificacao"
              name="peritoQualificacao"
              type="text"
              defaultValue={draft?.peritoQualificacao || peritoQualDefault}
              placeholder="Ex: Engenheiro Civil, CREA 12345"
              disabled={isPending}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ══ 3. Proposta ═════════════════════════════════════════════════════ */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Proposta
          </p>
        </div>
        <div className="p-5 space-y-4">

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dataProposta" className={labelCls}>Data da proposta</label>
              <input
                id="dataProposta"
                name="dataProposta"
                type="date"
                defaultValue={draft?.dataProposta || today()}
                disabled={isPending}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="valorHonorarios" className={labelCls}>
                Valor dos honorários (R$)
              </label>
              <input
                id="valorHonorarios"
                name="valorHonorarios"
                type="number"
                min="0"
                step="0.01"
                defaultValue={draft?.valorHonorarios ?? undefined}
                placeholder="0,00"
                disabled={isPending}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="descricaoServicos" className={labelCls}>
              Descrição dos serviços <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descricaoServicos"
              name="descricaoServicos"
              rows={4}
              defaultValue={draft?.descricaoServicos}
              placeholder="Descreva os serviços periciais a serem prestados, metodologia e escopo do trabalho..."
              disabled={isPending}
              className={textareaCls}
            />
            {state.errors?.descricaoServicos && (
              <p className={errorCls}>{state.errors.descricaoServicos[0]}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prazoEstimado" className={labelCls}>
                Prazo estimado de entrega
              </label>
              <input
                id="prazoEstimado"
                name="prazoEstimado"
                type="text"
                defaultValue={draft?.prazoEstimado}
                placeholder="Ex: 30 dias úteis"
                disabled={isPending}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="observacoes" className={labelCls}>Observações</label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={3}
              defaultValue={draft?.observacoes}
              placeholder="Condicionantes, ressalvas, forma de pagamento, etc."
              disabled={isPending}
              className={textareaCls}
            />
          </div>

        </div>
      </section>

      {/* ══ 4. Detalhes adicionais (opcionais, colapsáveis) ═════════════════ */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Detalhes adicionais <span className="font-normal text-slate-400">(opcional)</span>
          </p>
          {showOptional
            ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          }
        </button>

        {showOptional && (
          <div className="p-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="custoDeslocamento" className={labelCls}>
                Custo de deslocamento (R$)
              </label>
              <input
                id="custoDeslocamento"
                name="custoDeslocamento"
                type="number"
                min="0"
                step="0.01"
                defaultValue={draft?.custoDeslocamento ?? undefined}
                placeholder="0,00"
                disabled={isPending}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="horasTecnicas" className={labelCls}>
                Horas técnicas estimadas
              </label>
              <input
                id="horasTecnicas"
                name="horasTecnicas"
                type="number"
                min="0"
                step="0.5"
                defaultValue={draft?.horasTecnicas ?? undefined}
                placeholder="0"
                disabled={isPending}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="complexidadeNota" className={labelCls}>
                Nota de complexidade
              </label>
              <input
                id="complexidadeNota"
                name="complexidadeNota"
                type="text"
                defaultValue={draft?.complexidadeNota}
                placeholder="Ex: Alta — multi-réu"
                disabled={isPending}
                className={inputCls}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Global error ──────────────────────────────────────────────────── */}
      {state.message && !state.ok && (
        <p className="text-xs text-red-500">{state.message}</p>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar rascunho'
          )}
        </button>

        {state.ok && (
          <>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Rascunho salvo
            </span>
            <Link
              href={`/pericias/${pericia.id}/proposta/preview`}
              className="ml-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 transition-colors"
            >
              <Eye className="h-4 w-4" />
              Visualizar proposta
            </Link>
          </>
        )}
      </div>

    </form>
  )
}
