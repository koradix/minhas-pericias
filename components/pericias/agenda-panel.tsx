'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import {
  criarAgendaItem,
  toggleAgendaItem,
  deletarAgendaItem,
  type AgendaItemRow,
} from '@/lib/actions/agenda'

const TIPO_LABEL: Record<string, string> = {
  deadline: 'PRAZO',
  action: 'AÇÃO',
  reminder: 'LEMBRETE',
}

const PRIORIDADE_CLS: Record<string, string> = {
  alta: 'text-red-500',
  normal: 'text-slate-400',
  baixa: 'text-slate-300',
}

interface Props {
  periciaId: string
  initialItems: AgendaItemRow[]
}

export function AgendaPanel({ periciaId, initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('action')
  const [dataLimite, setDataLimite] = useState('')
  const [isPending, startTransition] = useTransition()

  const pending = items.filter((i) => i.status === 'pending')
  const completed = items.filter((i) => i.status === 'completed')

  function handleAdd() {
    if (!titulo.trim()) return
    startTransition(async () => {
      const res = await criarAgendaItem(periciaId, {
        titulo: titulo.trim(),
        tipo,
        dataLimite: dataLimite || undefined,
      })
      if (res.ok) {
        setTitulo('')
        setDataLimite('')
        setShowForm(false)
        // Refresh — server revalidates but we optimistically update
        const newItem: AgendaItemRow = {
          id: crypto.randomUUID(),
          periciaId,
          titulo: titulo.trim(),
          descricao: null,
          tipo,
          origem: 'user',
          dataLimite: dataLimite || null,
          status: 'pending',
          prioridade: 'normal',
          criadoEm: new Date().toISOString(),
        }
        setItems((p) => [newItem, ...p])
      }
    })
  }

  function handleToggle(id: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: i.status === 'pending' ? 'completed' : 'pending' } : i,
      ),
    )
    startTransition(async () => {
      await toggleAgendaItem(id)
    })
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    startTransition(async () => {
      await deletarAgendaItem(id)
    })
  }

  return (
    <div className="border border-slate-100 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Agenda</h3>
          {pending.length > 0 && (
            <span className="text-[9px] font-bold text-white bg-slate-900 rounded-full px-2 py-0.5 leading-none">
              {pending.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-[9px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-slate-900 transition-colors"
        >
          {showForm ? 'CANCELAR' : '+ NOVO'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-6 py-4 border-b border-slate-100 space-y-3">
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="O que precisa ser feito?"
            className="w-full h-9 bg-slate-50 border-0 text-[11px] font-bold tracking-wider px-4 focus:ring-0 placeholder:text-slate-300"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex items-center gap-3">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="h-8 bg-slate-50 border-0 text-[9px] font-bold uppercase tracking-widest text-slate-500 px-3 focus:ring-0"
            >
              <option value="action">Ação</option>
              <option value="deadline">Prazo</option>
              <option value="reminder">Lembrete</option>
            </select>
            <input
              type="date"
              value={dataLimite}
              onChange={(e) => setDataLimite(e.target.value)}
              className="h-8 bg-slate-50 border-0 text-[9px] font-bold tracking-wider text-slate-500 px-3 focus:ring-0"
            />
            <button
              onClick={handleAdd}
              disabled={!titulo.trim() || isPending}
              className="ml-auto h-8 px-5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              ADICIONAR
            </button>
          </div>
        </div>
      )}

      {/* Pending items */}
      {pending.length === 0 && !showForm && (
        <div className="px-6 py-8 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhuma ação pendente</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="divide-y divide-slate-50">
          {pending.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-6 py-3 group hover:bg-slate-50/50 transition-colors">
              <button
                onClick={() => handleToggle(item.id)}
                className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center border border-slate-200 hover:border-[#a3e635] transition-colors"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-900 leading-tight">{item.titulo}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={cn("text-[8px] font-bold uppercase tracking-widest", PRIORIDADE_CLS[item.prioridade] ?? 'text-slate-400')}>
                    {TIPO_LABEL[item.tipo] ?? item.tipo}
                  </span>
                  {item.origem !== 'user' && (
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-200">
                      {item.origem === 'ai' ? 'IA' : 'AUTO'}
                    </span>
                  )}
                  {item.dataLimite && (
                    <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">
                      {new Date(item.dataLimite).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-[9px] font-bold text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all mt-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completed items */}
      {completed.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="px-6 py-2">
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{completed.length} CONCLUÍDO{completed.length > 1 ? 'S' : ''}</p>
          </div>
          <div className="divide-y divide-slate-50">
            {completed.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-6 py-2 group">
                <button
                  onClick={() => handleToggle(item.id)}
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center bg-[#a3e635] text-[8px] font-bold text-slate-900"
                >
                  ✓
                </button>
                <p className="text-[10px] font-bold text-slate-300 line-through flex-1 truncate">{item.titulo}</p>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-[9px] font-bold text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
