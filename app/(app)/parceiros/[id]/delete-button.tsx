'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteParceiro } from '@/lib/actions/parceiros'

export default function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Excluir este parceiro? Esta ação não pode ser desfeita.')) return
    startTransition(() => deleteParceiro(id))
  }

  return (
    <Button variant="danger" size="sm" onClick={handleDelete} disabled={isPending}>
      <Trash2 className="h-4 w-4" />
      {isPending ? 'Excluindo...' : 'Excluir'}
    </Button>
  )
}
