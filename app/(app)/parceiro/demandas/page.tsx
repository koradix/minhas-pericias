import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDemandas } from '@/lib/data/parceiro-demandas'
import { DemandasParceiroList } from './demandas-list'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Minhas Demandas' }

export default async function DemandasParceiroPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const demandas = await getDemandas(session.user.id)

  return <DemandasParceiroList demandas={demandas} />
}
