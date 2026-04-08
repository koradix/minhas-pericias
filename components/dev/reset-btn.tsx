'use client'

import { useState, useTransition } from 'react'
import { limparDadosTeste } from '@/lib/actions/dev'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, AlertCircle } from 'lucide-react'

export function DevResetBtn() {
  const [confirming, setConfirming] = useState(false)
  const [erroMsg, setErroMsg] = useState('')
  const [isPending, start] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirming) { setConfirming(true); setErroMsg(''); return }
    start(async () => {
      const res = await limparDadosTeste()
      if (!res.ok) {
        setErroMsg(res.error ?? 'Erro desconhecido')
        setConfirming(false)
        return
      }
      setConfirming(false)
      router.push('/dashboard')
      router.refresh()
    })
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {(confirming || erroMsg) && !isPending && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-lg px-4 py-3 text-xs text-slate-600 w-[200px]">
          {erroMsg ? (
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">{erroMsg}</p>
            </div>
          ) : (
            <>
              <p className="font-semibold text-slate-800 mb-1">Apagar todos os dados?</p>
              <p className="text-slate-400 mb-3 text-[11px]">Volta ao estado inicial de cadastro.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirming(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={handleClick}
                  className="flex-1 rounded-lg bg-red-500 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-red-600">
                  Confirmar
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <button
        onClick={erroMsg ? () => setErroMsg('') : handleClick}
        disabled={isPending}
        title="Limpar dados de teste"
        className="flex items-center gap-1.5 rounded-full bg-slate-100/80 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-2 text-[11px] font-semibold text-slate-400 hover:text-red-500 shadow-sm transition-all backdrop-blur-sm disabled:opacity-50"
      >
        {isPending
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Trash2 className="h-3.5 w-3.5" />}
        {isPending ? 'Limpando...' : confirming ? 'Clique para confirmar' : 'Limpar dados'}
      </button>
    </div>
  )
}
