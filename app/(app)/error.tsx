'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>

      <div className="max-w-md space-y-1">
        <h2 className="text-base font-semibold text-slate-900">Algo deu errado</h2>
        <p className="text-sm text-red-600 font-mono break-words">{error.message}</p>
        {error.digest && (
          <p className="text-[10px] text-slate-400 mt-2">
            Digest: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>

      <Button onClick={reset} size="sm" variant="outline" className="gap-2">
        <RefreshCw className="h-3.5 w-3.5" />
        Tentar novamente
      </Button>
    </div>
  )
}
