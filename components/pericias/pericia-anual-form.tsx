'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, AlertCircle, CheckCircle2,
  Calendar, FileText, Building2, Users,
  BadgeDollarSign, ArrowRight,
} from 'lucide-react'
import { registrarPericiaManual } from '@/lib/actions/pericias-manual'
import { Button } from '@/components/ui/button'

export function PericiaAnualForm() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('tipo', 'Perícia Anual')

    try {
      const res = await registrarPericiaManual(formData)
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push(`/pericias/${res.periciaId}`), 2000)
      } else {
        setError(res.error ?? 'Erro ao cadastrar')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setIsPending(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-[#e2e8f0] rounded-2xl shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4 animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-[#1f2937] font-manrope mb-2 tracking-tight">Perícia cadastrada!</h2>
        <p className="text-[#6b7280] font-medium mb-8">Redirecionando para o detalhamento…</p>
        <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#416900] animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Info Principal */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#416900]/10 text-[#416900]">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-[#1f2937] font-manrope uppercase tracking-wider">Identificação</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wide mb-1.5">Assunto da Perícia</label>
                <input
                  name="assunto"
                  type="text"
                  required
                  placeholder="EX: Perícia de Engenharia Civil — Vistoria de Imóvel"
                  className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-slate-50/30 px-4 text-sm text-[#1f2937] focus:border-[#416900] focus:ring-1 focus:ring-[#416900]/20 focus:outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wide mb-1.5">Nº do Processo (Opcional)</label>
                <input
                  name="numero"
                  type="text"
                  placeholder="0000000-00.0000.0.0.0000"
                  className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-slate-50/30 px-4 text-sm text-[#1f2937] font-mono focus:border-[#416900] focus:outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#416900]/10 text-[#416900]">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-[#1f2937] font-manrope uppercase tracking-wider">Órgão Julgador</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wide mb-1.5">Vara / Juízo</label>
              <input
                name="vara"
                type="text"
                placeholder="EX: 3ª Vara Cível da Comarca de Niterói"
                className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-slate-50/30 px-4 text-sm text-[#1f2937] focus:border-[#416900] focus:outline-none transition-all placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Lado Direito: Partes e Financeiro */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#416900]/10 text-[#416900]">
                <Users className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-[#1f2937] font-manrope uppercase tracking-wider">Partes do Processo</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wide mb-1.5">Autor × Réu</label>
              <textarea
                name="partes"
                rows={1}
                placeholder="EX: João Silva × Banco Nacional S/A"
                className="w-full rounded-xl border border-[#e2e8f0] bg-slate-50/30 px-4 py-3 text-sm text-[#1f2937] focus:border-[#416900] focus:outline-none transition-all placeholder:text-slate-300 resize-none"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#416900]/10 text-[#416900]">
                <BadgeDollarSign className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-[#1f2937] font-manrope uppercase tracking-wider">Estimativas</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wide mb-1.5">Honorários Adiantados</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 text-[10px] font-bold">R$</span>
                  <input
                    name="valor"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-slate-50/30 pl-9 pr-4 text-sm text-[#1f2937] focus:border-[#416900] focus:outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wide mb-1.5">Prazo Estimado</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    name="prazo"
                    type="text"
                    placeholder="EX: 15 dias"
                    className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-slate-50/30 pl-9 pr-4 text-sm text-[#1f2937] focus:border-[#416900] focus:outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#e2e8f0]">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="text-[#6b7280] font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#416900] hover:bg-[#345200] text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-[#416900]/15 transition-all text-sm gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>Cadastrar Perícia Manual <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </form>
  )
}
