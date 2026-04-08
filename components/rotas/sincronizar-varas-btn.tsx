'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { syncTribunaisReais } from '@/lib/actions/perfil'

export function SincronizarVarasBtn() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSync() {
    setLoading(true)
    setMsg('')
    try {
      const res = await syncTribunaisReais()
      if (res.ok) {
        setMsg(`${res.varasSalvas} VARA(S) SINCRONIZADA(S)`)
        router.refresh()
      } else {
        setMsg(res.error || 'ERRO AO SINCRONIZAR')
      }
    } catch {
      setMsg('ERRO DE CONEXÃO')
    }
    setLoading(false)
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSync}
        disabled={loading}
        className="h-10 px-6 border border-slate-200 bg-white text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 disabled:opacity-20 transition-all flex items-center justify-center min-w-[200px]"
      >
        {loading ? 'SINCRONIZANDO...' : 'SINCRONIZAR VARAS'}
      </button>
      {msg && (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          {msg}
        </span>
      )}
    </div>
  )
}
