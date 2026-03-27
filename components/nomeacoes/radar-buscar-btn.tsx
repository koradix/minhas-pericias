'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ManualCitacaoForm } from '@/components/nomeacoes/manual-citacao-form'

interface Props {
  novas: number     // reservado para uso futuro
  siglas: string[]  // siglas para o form manual
}

export function RadarBuscarBtn({ siglas }: Props) {
  const [showManualForm, setShowManualForm] = useState(false)

  return (
    <>
      <Button
        className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-2 shadow-sm"
        onClick={() => setShowManualForm(true)}
      >
        <Plus className="h-4 w-4" />
        Registrar processo
      </Button>

      {showManualForm && (
        <ManualCitacaoForm siglas={siglas} onClose={() => setShowManualForm(false)} />
      )}
    </>
  )
}
