'use client'

import { useActionState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, Loader2, BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { criarModelo } from '@/lib/actions/modelos'

const TIPOS = [
  { value: 'LAUDO', label: 'Laudo Pericial' },
  { value: 'PROPOSTA_HONORARIOS', label: 'Proposta de Honorários' },
  { value: 'PARECER_TECNICO', label: 'Parecer Técnico' },
  { value: 'RESPOSTA_QUESITOS', label: 'Resposta a Quesitos' },
]

const AREAS = [
  'Avaliação Imobiliária',
  'Perícia Contábil',
  'Perícia Trabalhista',
  'Engenharia Civil',
  'Ambiental',
  'Societária',
  'Bancária / Financeira',
  'Outra',
]

const inputCls =
  'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 ' +
  'focus:ring-violet-500 disabled:opacity-50'

export default function NovoModeloPage() {
  const [state, formAction, isPending] = useActionState(criarModelo, {})
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Novo Modelo de Documento"
        description="Cadastre um template base para geração de laudos e propostas"
        actions={
          <Link href="/documentos/modelos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <form action={formAction} className="space-y-5" encType="multipart/form-data">
            {/* Nome */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nome do Modelo <span className="text-red-500">*</span>
              </label>
              <input
                name="nome"
                type="text"
                placeholder="Ex: Laudo de Avaliação de Imóvel Residencial"
                className={inputCls}
                disabled={isPending}
                required
              />
              {state.errors?.nome && (
                <p className="mt-1 text-xs text-red-600">{state.errors.nome[0]}</p>
              )}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Tipo de Documento <span className="text-red-500">*</span>
              </label>
              <select name="tipo" className={inputCls} disabled={isPending} required>
                <option value="">Selecione o tipo...</option>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {state.errors?.tipo && (
                <p className="mt-1 text-xs text-red-600">{state.errors.tipo[0]}</p>
              )}
            </div>

            {/* Área */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Área / Especialização
              </label>
              <select name="area" className={inputCls} disabled={isPending}>
                <option value="">Selecione a área...</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Descrição
              </label>
              <textarea
                name="descricao"
                rows={3}
                placeholder="Descreva o modelo e para quais situações ele se aplica..."
                className={inputCls + ' resize-none'}
                disabled={isPending}
              />
            </div>

            {/* Arquivo */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Arquivo de Referência
              </label>
              <div
                className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted p-8 text-center hover:border-violet-300 hover:bg-violet-50/30 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-zinc-600" />
                <p className="text-sm font-medium text-zinc-400">
                  Clique para selecionar ou arraste o arquivo
                </p>
                <p className="text-xs text-zinc-500">PDF ou DOCX · máx 10 MB</p>
                <input
                  ref={fileRef}
                  name="arquivo"
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const label = e.target.parentElement?.querySelector('p')
                      if (label) label.textContent = file.name
                    }
                  }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                O arquivo será usado como referência estrutural para geração de documentos.
              </p>
            </div>

            {/* Info IA */}
            <div className="flex items-start gap-3 rounded-lg bg-violet-50 border border-violet-100 p-3">
              <BookOpen className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-violet-700 leading-relaxed">
                O modelo cadastrado ficará disponível na tela de geração de documentos. Quando a
                integração com IA estiver ativa, o arquivo de referência servirá como base
                estrutural para geração automática.
              </p>
            </div>

            {state.message && (
              <p className="text-xs text-red-600">{state.message}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link href="/documentos/modelos" className="flex-1">
                <Button variant="outline" size="sm" className="w-full" disabled={isPending}>
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                size="sm"
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    Salvar Modelo
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
