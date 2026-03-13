import type { Metadata } from 'next'
import { getParceiros } from '@/lib/data/parceiros'
import ParceirosListClient from './parceiros-list'

export const metadata: Metadata = { title: 'Parceiros' }

export default async function ParceirosPage() {
  const parceiros = await getParceiros()
  return <ParceirosListClient parceiros={parceiros} />
}
