'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { salvarLaudoDraft, type LaudoSecao, type LaudoTemplateRow, type LaudoDraftRow } from '@/lib/actions/laudo'
import type { GerarLaudoInput, GerarLaudoOutput } from '@/app/api/pericias/laudo/gerar/route'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MidiaItem {
  tipo: string
  url: string | null
  texto: string | null
  descricao: string | null
}

export interface LaudoTabProps {
  periciaId: string
  pericia: {
    numero: string
    assunto: string
    processo: string | null
    vara: string | null
    partes: string | null
    tribunal: string
  }
  analise: {
    resumoProcesso?: { tipoAcao?: string; objetoPericia?: string; areaTecnica?: string } | null
    nomeacaoDespacho?: { quesitos?: string[] } | null
    autor?: string | null
    reu?: string | null
  } | null
  peritoNome: string
  peritoFormacao: string
  templates: LaudoTemplateRow[]
  rascunho: LaudoDraftRow | null
  midias: MidiaItem[]
}

type Phase = 'template' | 'editor' | 'preview'

// ─── Component ────────────────────────────────────────────────────────────────

export function LaudoTab({
  periciaId, pericia, analise, peritoNome, peritoFormacao,
  templates, rascunho, midias,
}: LaudoTabProps) {

  const [phase, setPhase] = useState<Phase>(
    rascunho && rascunho.secoes.length > 0 ? 'editor' : 'template'
  )
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(rascunho?.templateId ?? null)
  const [secoes, setSecoes] = useState<LaudoSecao[]>(rascunho?.secoes ?? [])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  // ── Load template into editor ──────────────────────────────────────────────

  function handleSelectTemplate(templateId: string) {
    const tpl = templates.find((t) => t.id === templateId)
    if (!tpl) return
    setSelectedTemplateId(templateId)

    // If editor already has content, ask before replacing
    if (secoes.length > 0 && secoes.some((s) => s.conteudo.trim())) {
      if (!confirm('Substituir o conteúdo atual pelo template selecionado?')) return
    }

    setSecoes(tpl.secoes.map((s) => ({ titulo: s.titulo, conteudo: '' })))
    setPhase('editor')
  }

  // ── AI generation ──────────────────────────────────────────────────────────

  async function handleGerarIA() {
    if (!selectedTemplate) {
      setError('Selecione um template primeiro')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const a = analise ?? {}
      const fotos = midias.filter((m) => m.tipo === 'foto' || m.url).map((m) => ({
        url: m.url,
        descricao: m.descricao,
        local: m.descricao, // use description as location hint
        tipo: m.tipo,
        texto: m.texto,
      }))
      const transcricoes = midias.filter((m) => m.tipo === 'audio' && m.texto).map((m) => ({
        descricao: m.descricao,
        texto: m.texto ?? '',
      }))
      const notas = midias.filter((m) => m.tipo === 'nota').map((m) => m.texto).filter(Boolean)

      const input: GerarLaudoInput = {
        numeroProcesso: pericia.processo ?? pericia.numero,
        tribunal: pericia.tribunal,
        vara: pericia.vara ?? '',
        autor: a.autor ?? null,
        reu: a.reu ?? null,
        tipoAcao: a.resumoProcesso?.tipoAcao ?? null,
        objetoPericia: a.resumoProcesso?.objetoPericia ?? pericia.assunto,
        quesitos: a.nomeacaoDespacho?.quesitos ?? [],
        peritoNome,
        peritoQualificacao: peritoFormacao,
        resumoProcesso: a.resumoProcesso ? JSON.stringify(a.resumoProcesso) : null,
        areaTecnica: a.resumoProcesso?.areaTecnica ?? null,
        templateCategoria: selectedTemplate.categoria,
        templateSecoes: selectedTemplate.secoes.map((s) => ({ titulo: s.titulo, placeholder: s.conteudo || 'Preencher' })),
        fotos,
        transcricoes,
        observacoesVistoria: notas.join('\n') || null,
      }

      const res = await fetch('/api/pericias/laudo/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const json = await res.json()
      if (!json.ok) {
        setError(json.error ?? 'Erro ao gerar laudo')
        return
      }

      const output = json.output as GerarLaudoOutput
      setSecoes(output.secoes.map((s) => ({ titulo: s.titulo, conteudo: s.conteudo })))
      setPhase('editor')

      // Auto-save
      await salvarLaudoDraft(periciaId, {
        templateId: selectedTemplateId,
        categoria: selectedTemplate.categoria,
        secoes: output.secoes.map((s) => ({ titulo: s.titulo, conteudo: s.conteudo })),
        iaModel: json.model ?? '',
        iaRawOutput: JSON.stringify(output),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Save draft ─────────────────────────────────────────────────────────────

  function handleSave() {
    setIsSaving(true)
    setSaved(false)
    startTransition(async () => {
      const res = await salvarLaudoDraft(periciaId, {
        templateId: selectedTemplateId,
        categoria: selectedTemplate?.categoria ?? '',
        secoes,
        status: 'rascunho',
      })
      setIsSaving(false)
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(res.error ?? 'Erro ao salvar')
      }
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ── Phase: Template selection ─────────────────────────────────────── */}
      {phase === 'template' && (
        <div className="space-y-6">
          <div className="border border-slate-200 bg-white">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Modelo do laudo</h3>
              <p className="text-[12px] text-slate-400 mt-1">Selecione uma categoria para estruturar as seções do laudo pericial.</p>
            </div>

            <div className="p-6 space-y-3">
              {/* Group by categoria */}
              {Array.from(new Set(templates.map((t) => t.categoria))).map((cat) => {
                const catTemplates = templates.filter((t) => t.categoria === cat)
                return (
                  <div key={cat}>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mb-2">{cat}</p>
                    <div className="space-y-1">
                      {catTemplates.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => handleSelectTemplate(tpl.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-5 py-4 text-left transition-all",
                            selectedTemplateId === tpl.id
                              ? "bg-slate-900 text-white"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                          )}
                        >
                          <div>
                            <p className="text-[12px] font-bold">{tpl.nome}</p>
                            <p className={cn("text-[10px] mt-0.5", selectedTemplateId === tpl.id ? "text-slate-400" : "text-slate-400")}>
                              {tpl.secoes.length} seções · {tpl.isDefault ? 'PeriLaB' : 'Personalizado'}
                            </p>
                          </div>
                          {selectedTemplateId === tpl.id && (
                            <span className="text-[9px] font-bold text-[#a3e635] uppercase tracking-widest">SELECIONADO</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}

              {templates.length === 0 && (
                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest py-8 text-center">
                  Nenhum modelo disponível
                </p>
              )}
            </div>
          </div>

          {/* AI Generate button */}
          {selectedTemplateId && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const tpl = templates.find((t) => t.id === selectedTemplateId)
                  if (tpl) {
                    setSecoes(tpl.secoes.map((s) => ({ titulo: s.titulo, conteudo: '' })))
                    setPhase('editor')
                  }
                }}
                className="flex items-center gap-2 border-2 border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-600 transition-all"
              >
                Preencher manualmente
              </button>
              <button
                onClick={handleGerarIA}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-[#a3e635] hover:bg-[#bef264] px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-900 transition-all disabled:opacity-50"
              >
                {isGenerating
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando com IA...</>
                  : 'Gerar rascunho com IA'
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Phase: Editor ─────────────────────────────────────────────────── */}
      {phase === 'editor' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPhase('template')}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                ← Trocar modelo
              </button>
              {selectedTemplate && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">
                  {selectedTemplate.categoria} · {selectedTemplate.nome}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest">✓ SALVO</span>
              )}
              <button
                onClick={handleGerarIA}
                disabled={isGenerating}
                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Regenerar com IA
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isPending}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Salvar rascunho
              </button>
            </div>
          </div>

          {/* Editable sections */}
          <div className="border border-slate-200 bg-white divide-y divide-slate-100">
            {secoes.map((secao, idx) => (
              <div key={idx} className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">
                    {secao.titulo}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                    Seção {idx + 1}/{secoes.length}
                  </span>
                </div>
                <textarea
                  value={secao.conteudo}
                  onChange={(e) => {
                    const updated = [...secoes]
                    updated[idx] = { ...secao, conteudo: e.target.value }
                    setSecoes(updated)
                  }}
                  placeholder={`Conteúdo de "${secao.titulo}"...`}
                  rows={Math.max(4, Math.ceil(secao.conteudo.length / 80))}
                  className="w-full bg-slate-50 border-0 text-[13px] text-slate-700 leading-relaxed px-4 py-3 focus:ring-0 placeholder:text-slate-200 resize-y"
                />
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
              {secoes.length} seções · Versão {rascunho?.versao ?? 1}
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving || isPending}
              className="bg-[#a3e635] text-slate-900 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#bef264] transition-all disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar rascunho'}
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 px-5 py-3">
          <p className="text-[11px] font-bold text-rose-700">{error}</p>
        </div>
      )}
    </div>
  )
}
