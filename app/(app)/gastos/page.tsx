import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function GastosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Consumo de APIs</h1>
        <p className="text-[12px] text-slate-400 mt-1">Monitoramento de gastos e requisições</p>
      </div>
      <div className="border border-dashed border-slate-200 rounded-xl py-12 text-center">
        <p className="text-sm text-slate-400">Em breve — dashboard de consumo Escavador</p>
      </div>
    </div>
  )
}
