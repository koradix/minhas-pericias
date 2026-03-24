import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, ChevronRight, PenLine, Cpu } from 'lucide-react'
import { auth } from '@/auth'
import { getOrDefaultEscritaProfile } from '@/lib/data/escrita-profile'
import { EscritaProfileForm } from '@/components/perfil/escrita-profile-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Perfil de Escrita' }

export default async function EscritaProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profile = await getOrDefaultEscritaProfile(session.user.id)

  return (
    <div className="space-y-6 pb-10 max-w-3xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/perfil" className="hover:text-slate-600 transition-colors flex items-center gap-1">
          <User className="h-3 w-3" />
          Perfil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 font-medium">Perfil de Escrita</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100">
          <PenLine className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Perfil de Escrita</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalize como a IA vai redigir laudos e propostas no seu estilo.
          </p>
        </div>
      </div>

      {/* AI readiness note */}
      <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
        <Cpu className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          Este perfil será injetado automaticamente nos prompts de geração de laudos e propostas,
          garantindo que os documentos reflitam seu vocabulário, estrutura e tom preferidos.
          Quanto mais detalhado, melhores os resultados.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-6">
        <EscritaProfileForm initial={profile} />
      </div>

    </div>
  )
}
