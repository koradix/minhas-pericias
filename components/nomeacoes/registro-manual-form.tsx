'use client'

/**
 * Formulário de registro manual de perícia.
 * Campos: Nº Processo, Autor, Réu, UF, Comarca (select), Vara (select).
 * Comarcas e varas vêm do banco (VaraPublica).
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight } from 'lucide-react'
import { criarPericiaManual, getComarcasByUf, getVarasByComarca } from '@/lib/actions/pericias-manual'
import { cn } from '@/lib/utils'

const UFS = ['RJ', 'MG', 'SP']

export function RegistroManualForm() {
  const [processo, setProcesso] = useState('')
  const [autor, setAutor] = useState('')
  const [reu, setReu] = useState('')
  const [uf, setUf] = useState('RJ')
  const [comarca, setComarca] = useState('')
  const [vara, setVara] = useState('')
  const [comarcas, setComarcas] = useState<string[]>([])
  const [varas, setVaras] = useState<string[]>([])
  const [loading, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [loadingComarcas, setLoadingComarcas] = useState(false)
  const [loadingVaras, setLoadingVaras] = useState(false)
  const router = useRouter()

  async function handleUfChange(newUf: string) {
    setUf(newUf)
    setComarca('')
    setVara('')
    setVaras([])
    setLoadingComarcas(true)
    try {
      const list = await getComarcasByUf(newUf)
      setComarcas(list)
    } catch { setComarcas([]) }
    setLoadingComarcas(false)
  }

  async function handleComarcaChange(newComarca: string) {
    setComarca(newComarca)
    setVara('')
    setLoadingVaras(true)
    try {
      const list = await getVarasByComarca(uf, newComarca)
      setVaras(list)
    } catch { setVaras([]) }
    setLoadingVaras(false)
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const res = await criarPericiaManual({ processo, autor, reu, uf, comarca, vara })
      if (res.ok) {
        router.push(`/pericias/${res.periciaId}`)
      } else {
        setError(res.error)
      }
    })
  }

  // Carregar comarcas no mount
  if (comarcas.length === 0 && !loadingComarcas) {
    handleUfChange(uf)
  }

  const inputCls = 'w-full border border-slate-200 bg-white px-4 py-3 text-[12px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 uppercase tracking-wide transition-all'
  const selectCls = cn(inputCls, 'appearance-none')
  const labelCls = 'text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nº Processo */}
        <div>
          <label className={labelCls}>Nº do Processo (CNJ)</label>
          <input className={inputCls} value={processo} onChange={e => setProcesso(e.target.value)} placeholder="0000000-00.0000.0.00.0000" />
        </div>

        {/* UF */}
        <div>
          <label className={labelCls}>Estado (UF)</label>
          <select className={selectCls} value={uf} onChange={e => handleUfChange(e.target.value)}>
            {UFS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Autor */}
        <div>
          <label className={labelCls}>Nome do Autor</label>
          <input className={inputCls} value={autor} onChange={e => setAutor(e.target.value)} placeholder="Nome completo do autor" />
        </div>

        {/* Réu */}
        <div>
          <label className={labelCls}>Nome do Réu</label>
          <input className={inputCls} value={reu} onChange={e => setReu(e.target.value)} placeholder="Nome completo do réu" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Comarca */}
        <div>
          <label className={labelCls}>Comarca {loadingComarcas && '...'}</label>
          <select className={selectCls} value={comarca} onChange={e => handleComarcaChange(e.target.value)}>
            <option value="">Selecione a comarca</option>
            {comarcas.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Vara */}
        <div>
          <label className={labelCls}>Vara {loadingVaras && '...'}</label>
          <select className={selectCls} value={vara} onChange={e => setVara(e.target.value)} disabled={!comarca}>
            <option value="">Selecione a vara</option>
            {varas.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-[10px] font-bold text-rose-600">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || (!autor && !reu)}
        className="w-full flex items-center justify-center gap-2 bg-[#a3e635] hover:bg-[#bef264] text-slate-900 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {loading ? 'Criando...' : 'Criar perícia'}
      </button>
    </div>
  )
}
