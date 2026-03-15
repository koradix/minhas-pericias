import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getPropostas } from '@/lib/data/propostas'
import { PropostasClient } from './propostas-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Propostas' }

export default async function PropostasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const propostas = await getPropostas(session.user.id)

  return <PropostasClient propostas={propostas} />
}
