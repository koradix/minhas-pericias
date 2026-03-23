'use client'

import { useState, useTransition } from 'react'
import { Check, CheckCircle2, Loader2, Save, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saveTribunaisEstados } from '@/lib/actions/perfil'
import {
  ESTADOS_DISPONIVEIS,
  TRIBUNAIS_POR_ESTADO,
  getTribunaisParaEstados,
  tipoCor,
  type TipoTribunal,
} from '@/lib/constants/tribunais'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<TipoTribunal, string> = {
  estadual:  'Estadual',
  trabalho:  'Trabalho',
  federal:   'Federal',
  eleitoral: 'Eleitoral',
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
        active
          ? 'bg-brand-500 border-lime-500 text-foreground'
          : 'border-border text-zinc-400 hover:border-brand-400 hover:text-brand-400 bg-card',
      )}
    >
      {active && <Check className="h-3 w-3" />}
      {label}
    </button>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialEstados: string[]
  initialTribunais: string[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TribunaisForm({ initialEstados, initialTribunais }: Props) {
  const [estados, setEstados] = useState<string[]>(initialEstados)
  const [tribunais, setTribunais] = useState<string[]>(initialTribunais)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleEstado(uf: string) {
    setEstados((prev) => {
      const next = prev.includes(uf) ? prev.filter((e) => e !== uf) : [...prev, uf]
      // Auto-select all tribunals for newly added state
      if (!prev.includes(uf)) {
        const novos = getTribunaisParaEstados([uf]).map((t) => t.sigla)
        setTribunais((t) => [...new Set([...t, ...novos])])
      }
      return next
    })
  }

  function toggleTribunal(sigla: string) {
    setTribunais((prev) =>
      prev.includes(sigla) ? prev.filter((s) => s !== sigla) : [...prev, sigla],
    )
  }

  function handleSave() {
    setResult(null)
    startTransition(async () => {
      const res = await saveTribunaisEstados(tribunais, estados)
      setResult({
        ok: res.ok,
        msg: res.ok
          ? `${tribunais.length} tribunal(is) salvo(s) com sucesso!`
          : res.error ?? 'Erro ao salvar',
      })
    })
  }

  const tribunaisDoEstados = getTribunaisParaEstados(estados)

  // Group by state for display
  const grupos: { uf: string; itens: { sigla: string; nome: string; tipo: TipoTribunal }[] }[] =
    estados.map((uf) => ({
      uf,
      itens: (TRIBUNAIS_POR_ESTADO[uf] ?? []) as { sigla: string; nome: string; tipo: TipoTribunal }[],
    }))

  return (
    <div className="space-y-6">

      {/* Estados */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Estados de atuação</p>
          <p className="text-xs text-zinc-400 mt-0.5">Selecione os estados onde você atua como perito.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ESTADOS_DISPONIVEIS.map((uf) => (
            <Chip
              key={uf}
              label={uf}
              active={estados.includes(uf)}
              onClick={() => toggleEstado(uf)}
            />
          ))}
        </div>
      </div>

      {/* Tribunais por estado */}
      {grupos.length > 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Tribunais monitorados</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Clique para ativar/desativar. O DataJud buscará nomeações nesses tribunais.
            </p>
          </div>

          {grupos.map(({ uf, itens }) => (
            <div key={uf} className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{uf}</p>
              <div className="flex flex-wrap gap-2">
                {itens.map((t) => (
                  <button
                    key={t.sigla}
                    type="button"
                    onClick={() => toggleTribunal(t.sigla)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors',
                      tribunais.includes(t.sigla)
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-card border-border text-zinc-400 hover:border-slate-400',
                    )}
                  >
                    {tribunais.includes(t.sigla) && <Check className="h-3 w-3" />}
                    <span className="font-bold">{t.sigla}</span>
                    <span className={cn('rounded px-1 py-0.5 text-[10px] font-medium', tipoCor[t.tipo])}>
                      {TIPO_LABEL[t.tipo]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {tribunaisDoEstados.length === 0 && (
            <p className="text-xs text-zinc-500">Nenhum tribunal disponível para os estados selecionados.</p>
          )}
        </div>
      )}

      {/* Summary + Save */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-xs text-zinc-400">
          {tribunais.length > 0
            ? `${tribunais.length} tribunal(is) selecionado(s)`
            : 'Nenhum tribunal selecionado'}
        </p>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-brand-500 hover:bg-lime-600 text-foreground font-semibold gap-1.5"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</>
          ) : (
            <><Save className="h-4 w-4" /> Salvar tribunais</>
          )}
        </Button>
      </div>

      {/* Result toast */}
      {result && (
        <div className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-3 text-sm',
          result.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200',
        )}>
          {result.ok
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <XCircle className="h-4 w-4 flex-shrink-0" />}
          {result.msg}
        </div>
      )}
    </div>
  )
}
