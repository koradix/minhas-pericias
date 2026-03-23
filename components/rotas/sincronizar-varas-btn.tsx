'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { syncTribunaisReais } from '@/lib/actions/perfil'
import { Button } from '@/components/ui/button'

export function SincronizarVarasBtn() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSync() {
    setLoading(true)
    setMsg('')
    const res = await syncTribunaisReais()
    if (res.ok) {
      setMsg(`${res.varasSalvas} vara(s) sincronizada(s)`)
      router.refresh()
    } else {
      setMsg(res.error)
    }
    setLoading(false)
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleSync}
        disabled={loading}
        className="gap-1.5"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Sincronizando...' : 'Sincronizar varas'}
      </Button>
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </div>
  )
}
