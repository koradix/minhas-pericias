'use client'

import { useState, useTransition } from 'react'
import { MapPin, Pencil, Trash2, Plus, Check, X, Loader2, Building2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  updateVaraEndereco,
  addVaraManual,
  desativarVara,
  type VaraManageItem,
} from '@/lib/actions/varas-manage'
import { ESTADOS_DISPONIVEIS } from '@/lib/constants/tribunais'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  varas: VaraManageItem[]
}

// ─── Add form ─────────────────────────────────────────────────────────────────

function AddVaraForm({ onClose }: { onClose: () => void }) {
  const [sigla, setSigla] = useState('')
  const [varaNome, setVaraNome] = useState('')
  const [uf, setUf] = useState('')
  const [endereco, setEndereco] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await addVaraManual({ tribunalSigla: sigla, varaNome, uf, enderecoTexto: endereco })
      if (!result.ok) {
        setError(result.error ?? 'Erro ao salvar')
      } else {
        onClose()
      }
    })
  }

  return (
    <div className="rounded-xl border border-lime-200 bg-lime-50/50 p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <Plus className="h-3.5 w-3.5 text-lime-600" />
        Adicionar vara manualmente
      </p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        <div>
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Tribunal (sigla)</label>
          <input
            value={sigla}
            onChange={(e) => setSigla(e.target.value.toUpperCase())}
            placeholder="ex: TJRJ"
            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">UF</label>
          <select
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            <option value="">Selecione</option>
            {ESTADOS_DISPONIVEIS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Nome da vara / fórum</label>
          <input
            value={varaNome}
            onChange={(e) => setVaraNome(e.target.value)}
            placeholder="ex: 3ª Vara Cível de Niterói"
            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block mb-1">Endereço</label>
          <input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="ex: R. Visconde do Rio Branco, 382 - Centro, Niterói"
            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs border-slate-200">
          Cancelar
        </Button>
        <Button
          size="sm"
          disabled={isPending}
          onClick={handleSave}
          className="h-7 text-xs bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Salvar
        </Button>
      </div>
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function VaraRow({ vara, onRemoved }: { vara: VaraManageItem; onRemoved: (id: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [endereco, setEndereco] = useState(vara.enderecoTexto ?? '')
  const [isPending, startTransition] = useTransition()
  const [removing, startRemoving] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateVaraEndereco(vara.id, endereco)
      setEditing(false)
    })
  }

  function handleRemove() {
    if (!confirm(`Remover "${vara.varaNome}" do seu radar?`)) return
    startRemoving(async () => {
      await desativarVara(vara.id)
      onRemoved(vara.id)
    })
  }

  return (
    <tr className={cn('border-b border-slate-100 hover:bg-slate-50/60 transition-colors', removing && 'opacity-40')}>
      {/* Tribunal */}
      <td className="px-4 py-3">
        <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
          {vara.tribunalSigla}
        </span>
        {vara.uf && <span className="ml-1.5 text-[10px] text-slate-400">{vara.uf}</span>}
      </td>
      {/* Vara */}
      <td className="px-4 py-3">
        <p className="text-xs font-semibold text-slate-800">{vara.varaNome}</p>
      </td>
      {/* Endereço */}
      <td className="px-4 py-3 min-w-[200px]">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              autoFocus
              className="flex-1 h-7 rounded-lg border border-lime-300 bg-white px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            />
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-shrink-0 rounded-md p-1 text-lime-600 hover:bg-lime-50 transition-colors"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => { setEditing(false); setEndereco(vara.enderecoTexto ?? '') }}
              className="flex-shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={cn(
              'group flex items-start gap-1.5 w-full text-left rounded-lg p-1 -m-1 transition-colors hover:bg-lime-50',
            )}
          >
            {vara.enderecoTexto ? (
              <>
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-slate-400 group-hover:text-lime-600 transition-colors" />
                <span className="text-xs text-slate-600 leading-tight">{vara.enderecoTexto}</span>
              </>
            ) : (
              <span className="text-xs text-amber-600 italic">Sem endereço — clique para adicionar</span>
            )}
          </button>
        )}
      </td>
      {/* Nomeações */}
      <td className="px-4 py-3 text-right">
        <span className={cn(
          'text-xs font-bold tabular-nums',
          vara.totalNomeacoes > 0 ? 'text-lime-700' : 'text-slate-300',
        )}>
          {vara.totalNomeacoes}
        </span>
      </td>
      {/* Actions */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setEditing(true)}
            title="Editar endereço"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            title="Remover do radar"
            className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function VarasManager({ varas: initial }: Props) {
  const [varas, setVaras] = useState<VaraManageItem[]>(initial)
  const [showAdd, setShowAdd] = useState(false)

  function handleRemoved(id: string) {
    setVaras((prev) => prev.filter((v) => v.id !== id))
  }

  const semEndereco = varas.filter((v) => !v.enderecoTexto).length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{varas.length} varas</span>
          {semEndereco > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-600 font-medium">{semEndereco} sem endereço</span>
            </>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAdd(true)}
          className="h-8 gap-1.5 text-xs border-slate-200 text-slate-600"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar vara
        </Button>
      </div>

      {/* Add form */}
      {showAdd && <AddVaraForm onClose={() => setShowAdd(false)} />}

      {/* Empty state */}
      {varas.length === 0 && !showAdd && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Building2 className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Nenhuma vara cadastrada</p>
            <p className="text-xs text-slate-400 mt-0.5">Adicione varas manualmente ou sincronize pelo perfil</p>
          </div>
        </div>
      )}

      {/* Table */}
      {varas.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tribunal</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vara</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Endereço <span className="normal-case font-normal text-slate-300">(clique para editar)</span>
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nomeações</th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {varas.map((v) => (
                  <VaraRow key={v.id} vara={v} onRemoved={handleRemoved} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center">
        Clique no endereço de qualquer vara para editar. Varas sem endereço não aparecem no mapa de rotas.
      </p>
    </div>
  )
}
