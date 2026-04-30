'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus, X, FileDown } from 'lucide-react'
import { salvarLaudoDraft, criarLaudoTemplate, type LaudoSecao, type LaudoTemplateRow, type LaudoDraftRow } from '@/lib/actions/laudo'
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
  vistoriaData?: { data: string | null; endereco: string | null }
  documentosProcesso?: { id: string; nome: string; tipo: string | null }[]
}

type Phase = 'setup' | 'editor'

// ─── Step badge ─────────────────────────────────────────────────────────────

function StepBadge({ num, done, active }: { num: number; done?: boolean; active?: boolean }) {
  return (
    <span className={cn(
      "inline-flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-black flex-shrink-0",
      done ? "bg-[#a3e635] text-slate-900" : active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
    )}>
      {num}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LaudoTab({
  periciaId, pericia, analise, peritoNome, peritoFormacao, documentosProcesso = [],
  templates: initialTemplates, rascunho, midias, vistoriaData,
}: LaudoTabProps) {

  const [templates, setTemplates] = useState(initialTemplates)
  const [phase, setPhase] = useState<Phase>(
    rascunho && rascunho.secoes.length > 0 ? 'editor' : 'setup'
  )
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(rascunho?.templateId ?? null)
  const [secoes, setSecoes] = useState<LaudoSecao[]>(rascunho?.secoes ?? [])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── Perito inputs ─────────────────────────────────────────────────────────
  const [posicaoPerito, setPosicaoPerito] = useState('')
  const [observacoesPerito, setObservacoesPerito] = useState('')

  // ── Create custom template ────────────────────────────────────────────────
  const [showCriar, setShowCriar] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoCategoria, setNovoCategoria] = useState('')
  const [novoSecoes, setNovoSecoes] = useState('')
  const [criando, setCriando] = useState(false)

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  // Phase flags (avoid TS narrowing issues inside conditional blocks)
  const isSetupPhase = phase === 'setup'
  const isEditorPhase = phase === 'editor'

  // ── Derived ───────────────────────────────────────────────────────────────
  const fotoCount = midias.filter((m) => m.tipo === 'foto').length
  const audioCount = midias.filter((m) => m.tipo === 'audio' && m.texto).length
  const notaCount = midias.filter((m) => m.tipo === 'texto').length
  const hasAnalise = !!analise?.resumoProcesso

  const vistoriaDataFormatada = vistoriaData?.data
    ? new Date(vistoriaData.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  // ── Create custom template ────────────────────────────────────────────────

  async function handleCriarTemplate() {
    if (!novoNome.trim() || !novoCategoria.trim()) return
    setCriando(true)
    try {
      const secoesArr: LaudoSecao[] = novoSecoes.trim()
        ? novoSecoes.split('\n').filter(Boolean).map((l) => ({ titulo: l.trim(), conteudo: '' }))
        : [
            { titulo: '1. Objetivo da Perícia', conteudo: '' },
            { titulo: '2. Localização', conteudo: '' },
            { titulo: '3. Agendamento da Vistoria', conteudo: '' },
            { titulo: '4. Histórico Resumido do Processo', conteudo: '' },
            { titulo: '5. Perícia', conteudo: '' },
            { titulo: '6. Fotos', conteudo: '' },
            { titulo: '7. Respostas aos Quesitos', conteudo: '' },
            { titulo: '8. Conclusão', conteudo: '' },
            { titulo: '9. Encerramento', conteudo: '' },
          ]

      const res = await criarLaudoTemplate({
        categoria: novoCategoria.trim(),
        nome: novoNome.trim(),
        secoes: secoesArr,
      })

      if (res.ok && res.id) {
        const newTpl: LaudoTemplateRow = {
          id: res.id,
          categoria: novoCategoria.trim(),
          nome: novoNome.trim(),
          secoes: secoesArr,
          isDefault: false,
        }
        setTemplates((prev) => [...prev, newTpl])
        setSelectedTemplateId(res.id)
        setShowCriar(false)
        setNovoNome('')
        setNovoCategoria('')
        setNovoSecoes('')
      }
    } catch {}
    setCriando(false)
  }

  // ── AI generation ─────────────────────────────────────────────────────────

  async function handleGerarIA() {
    if (!selectedTemplate) {
      setError('Selecione um modelo primeiro')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const a = analise ?? {}
      const fotos = midias.filter((m) => m.tipo === 'foto').map((m) => ({
        url: m.url,
        descricao: m.descricao,
        local: m.descricao,
        tipo: m.tipo,
        texto: m.texto,
      }))
      const transcricoes = midias.filter((m) => m.tipo === 'audio' && m.texto).map((m) => ({
        descricao: m.descricao,
        texto: m.texto ?? '',
      }))

      // Combine notas from midias + perito inputs
      const notasVistoria = midias.filter((m) => m.tipo === 'texto').map((m) => m.texto).filter(Boolean)
      if (posicaoPerito.trim()) notasVistoria.push(`POSIÇÃO DO PERITO: ${posicaoPerito.trim()}`)
      if (observacoesPerito.trim()) notasVistoria.push(`OBSERVAÇÕES ADICIONAIS: ${observacoesPerito.trim()}`)
      if (vistoriaDataFormatada) notasVistoria.push(`DATA DA VISTORIA: ${vistoriaDataFormatada}`)
      if (vistoriaData?.endereco) notasVistoria.push(`ENDEREÇO DA VISTORIA: ${vistoriaData.endereco}`)

      // Cap individual string fields para não estourar 4.5MB da Vercel
      const MAX_RESUMO = 60_000
      const MAX_TEXTO_MIDIA = 5_000
      const resumoStr = a.resumoProcesso ? JSON.stringify(a.resumoProcesso) : null
      const resumoCapped = resumoStr && resumoStr.length > MAX_RESUMO
        ? resumoStr.slice(0, MAX_RESUMO) + '\n[...truncado]'
        : resumoStr
      // IMPORTANTE: strip da URL — pode ser data URI base64 (MB cada).
      // O server não usa a URL, só descricao/local/texto.
      const fotosCapped = fotos.map((f) => ({
        url: null,
        descricao: f.descricao,
        local: f.local,
        tipo: f.tipo,
        texto: f.texto && f.texto.length > MAX_TEXTO_MIDIA ? f.texto.slice(0, MAX_TEXTO_MIDIA) + '...' : f.texto,
      }))
      const transcricoesCapped = transcricoes.map((t) => ({
        descricao: t.descricao,
        texto: t.texto.length > MAX_TEXTO_MIDIA ? t.texto.slice(0, MAX_TEXTO_MIDIA) + '...' : t.texto,
      }))

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
        resumoProcesso: resumoCapped,
        areaTecnica: a.resumoProcesso?.areaTecnica ?? null,
        templateCategoria: selectedTemplate.categoria,
        templateSecoes: selectedTemplate.secoes.map((s) => ({ titulo: s.titulo, placeholder: s.conteudo || 'Preencher' })),
        fotos: fotosCapped,
        transcricoes: transcricoesCapped,
        observacoesVistoria: notasVistoria.join('\n\n').slice(0, MAX_TEXTO_MIDIA) || null,
        documentosProcesso,
      }

      const bodyStr = JSON.stringify(input)
      if (bodyStr.length > 4_000_000) {
        setError(`Dados muito grandes (${(bodyStr.length / 1024 / 1024).toFixed(1)}MB). Reduza descrições ou contate suporte.`)
        return
      }

      const res = await fetch('/api/pericias/laudo/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
      })

      const rawText = await res.text()
      let json: { ok?: boolean; error?: string; output?: GerarLaudoOutput; model?: string }
      try {
        json = JSON.parse(rawText)
      } catch {
        if (res.status === 413) {
          setError('Dados muito grandes para o servidor. Reduza descrições da vistoria.')
        } else if (res.status === 504 || res.status === 408) {
          setError('IA demorou demais para responder. Tente novamente.')
        } else {
          setError(`Erro ${res.status}: ${rawText.slice(0, 120)}`)
        }
        return
      }
      if (!json.ok) {
        setError(json.error ?? 'Erro ao gerar laudo')
        return
      }

      const output = json.output as GerarLaudoOutput
      setSecoes(output.secoes.map((s) => ({ titulo: s.titulo, conteudo: s.conteudo })))
      setPhase('editor')

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

  // ── Save draft ────────────────────────────────────────────────────────────

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

  // ── Export DOCX ────────────────────────────────────────────────────────────

  const [isExporting, setIsExporting] = useState(false)

  async function handleExportDocx() {
    setIsExporting(true)
    setError(null)
    try {
      // Não envia fotos no body — server busca pelo periciaId pra evitar
      // estourar o limite de 4.5MB (mídias podem ser data URIs base64).
      const res = await fetch('/api/pericias/laudo/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periciaId,
          peritoNome,
          peritoQualificacao: peritoFormacao,
          titulo: selectedTemplate ? `LAUDO PERICIAL — ${selectedTemplate.categoria.toUpperCase()}` : 'LAUDO PERICIAL',
          vara: pericia.vara,
          processo: pericia.processo,
          autor: analise?.autor ?? pericia.partes?.split('×')[0]?.trim(),
          reu: analise?.reu ?? pericia.partes?.split('×')[1]?.trim(),
          secoes,
          documentosProcesso: documentosProcesso.map(d => ({ nome: d.nome, tipo: d.tipo })),
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        let parsed: { error?: string }
        try { parsed = JSON.parse(text) } catch { parsed = { error: `Erro ${res.status}` } }
        setError(parsed.error ?? `Erro ao exportar (${res.status})`)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laudo_${pericia.processo?.replace(/\//g, '-') ?? pericia.numero}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar')
    } finally {
      setIsExporting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Phase: Setup (select model + perito inputs + generate) ──────── */}
      {phase === 'setup' && (
        <div className="space-y-6">

          {/* 1. Model selector (dropdown) */}
          <div className="border border-slate-200 bg-white">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <StepBadge num={8} done={isEditorPhase} active={isSetupPhase} />
              <div className="flex-1">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Escolher modelo de laudo</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Selecione um modelo existente ou crie um personalizado</p>
              </div>
              <button
                onClick={() => setShowCriar(!showCriar)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                {showCriar ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showCriar ? 'Cancelar' : 'Criar modelo'}
              </button>
            </div>

            {/* Create custom template inline */}
            {showCriar && (
              <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={novoCategoria}
                    onChange={(e) => setNovoCategoria(e.target.value)}
                    placeholder="CATEGORIA (ex: Energia)"
                    className="text-[11px] font-bold uppercase tracking-widest text-slate-900 placeholder:text-slate-300 bg-white border border-slate-200 px-4 py-2.5 focus:border-slate-900 focus:ring-0"
                  />
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="NOME DO MODELO"
                    className="text-[11px] font-bold uppercase tracking-widest text-slate-900 placeholder:text-slate-300 bg-white border border-slate-200 px-4 py-2.5 focus:border-slate-900 focus:ring-0"
                  />
                </div>
                <textarea
                  value={novoSecoes}
                  onChange={(e) => setNovoSecoes(e.target.value)}
                  placeholder={"Seções personalizadas (uma por linha):\n1. Objetivo da Perícia\n2. Localização\n...\n\nDeixe vazio para usar a estrutura padrão (9 seções)."}
                  rows={4}
                  className="w-full text-[11px] text-slate-700 bg-white border border-slate-200 px-4 py-2.5 focus:border-slate-900 focus:ring-0 placeholder:text-slate-300"
                />
                <button
                  onClick={handleCriarTemplate}
                  disabled={criando || !novoNome.trim() || !novoCategoria.trim()}
                  className="bg-slate-900 text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-30"
                >
                  {criando ? 'Criando...' : 'Criar modelo'}
                </button>
              </div>
            )}

            <div className="p-4 space-y-3">
              {/* Dropdown */}
              <select
                value={selectedTemplateId ?? ''}
                onChange={(e) => setSelectedTemplateId(e.target.value || null)}
                className="w-full border-2 border-slate-200 bg-white px-4 py-3 text-[12px] font-bold text-slate-800 uppercase tracking-wide focus:outline-none focus:border-slate-900 transition-all appearance-none cursor-pointer"
              >
                <option value="">— Selecione um modelo —</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.categoria.toUpperCase()} — {tpl.nome} ({tpl.secoes.length} seções)
                  </option>
                ))}
              </select>

              {/* Preview do modelo selecionado */}
              {selectedTemplate && (
                <div className="bg-slate-50 px-4 py-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Seções do modelo "{selectedTemplate.nome}"
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.secoes.map((s, i) => (
                      <span key={i} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 font-medium">
                        {s.titulo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {templates.length === 0 && !showCriar && (
                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest py-4 text-center">
                  Nenhum modelo disponível — clique em "Criar modelo" acima
                </p>
              )}
            </div>
          </div>

          {/* 2. Perito inputs */}
          {selectedTemplateId && (
            <div className="border border-slate-200 bg-white">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <StepBadge num={9} done={isEditorPhase} active={isSetupPhase && !!selectedTemplateId} />
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Preencher pontos críticos</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Preencha antes de gerar. Campos opcionais podem ser editados depois.</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Posição do perito / resumo do resultado */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2 block">
                    Posição do perito / Resumo do resultado
                  </label>
                  <textarea
                    value={posicaoPerito}
                    onChange={(e) => setPosicaoPerito(e.target.value)}
                    placeholder="Ex: Constatou-se falha no hidrômetro, com cobrança indevida no período de set/2023 a jun/2024..."
                    rows={3}
                    className="w-full text-[13px] text-slate-700 bg-slate-50 border-0 px-4 py-3 focus:ring-0 placeholder:text-slate-300 resize-y"
                  />
                </div>

                {/* Observações adicionais */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2 block">
                    Observações adicionais (opcional)
                  </label>
                  <textarea
                    value={observacoesPerito}
                    onChange={(e) => setObservacoesPerito(e.target.value)}
                    placeholder="Qualquer detalhe relevante que não está nos documentos..."
                    rows={2}
                    className="w-full text-[13px] text-slate-700 bg-slate-50 border-0 px-4 py-3 focus:ring-0 placeholder:text-slate-300 resize-y"
                  />
                </div>

                {/* Auto-detected data summary */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">DADOS DETECTADOS AUTOMATICAMENTE</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={cn("text-[10px] font-bold px-2.5 py-1", hasAnalise ? "bg-[#a3e635]/20 text-slate-700" : "bg-slate-100 text-slate-300")}>
                      {hasAnalise ? '✓' : '—'} Análise do processo
                    </span>
                    <span className={cn("text-[10px] font-bold px-2.5 py-1", fotoCount > 0 ? "bg-[#a3e635]/20 text-slate-700" : "bg-slate-100 text-slate-300")}>
                      {fotoCount > 0 ? `✓ ${fotoCount} fotos` : '— Sem fotos'}
                    </span>
                    <span className={cn("text-[10px] font-bold px-2.5 py-1", audioCount > 0 ? "bg-[#a3e635]/20 text-slate-700" : "bg-slate-100 text-slate-300")}>
                      {audioCount > 0 ? `✓ ${audioCount} transcrições` : '— Sem áudios'}
                    </span>
                    <span className={cn("text-[10px] font-bold px-2.5 py-1", notaCount > 0 ? "bg-[#a3e635]/20 text-slate-700" : "bg-slate-100 text-slate-300")}>
                      {notaCount > 0 ? `✓ ${notaCount} notas` : '— Sem notas'}
                    </span>
                    {vistoriaDataFormatada && (
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-[#a3e635]/20 text-slate-700">
                        ✓ Vistoria em {vistoriaDataFormatada}
                      </span>
                    )}
                    {vistoriaData?.endereco && (
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-[#a3e635]/20 text-slate-700">
                        ✓ {vistoriaData.endereco.length > 40 ? vistoriaData.endereco.slice(0, 40) + '...' : vistoriaData.endereco}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Main CTA */}
          {selectedTemplateId && (
            <button
              onClick={handleGerarIA}
              disabled={isGenerating}
              className="w-full h-16 bg-[#a3e635] hover:bg-[#bef264] text-slate-900 text-[11px] font-bold uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isGenerating
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Gerando rascunho com IA...</>
                : 'Gerar rascunho com IA'
              }
            </button>
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
                onClick={() => setPhase('setup')}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                ← Configurar
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
                    {secao.conteudo.trim() ? `${secao.conteudo.length} chars` : 'VAZIO'}
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

          {/* ── Passo 10: Baixar minuta de laudo ──────────────────────── */}
          <div className="border border-slate-200 bg-white rounded-xl">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
              <StepBadge num={10} done={false} active={secoes.some(s => s.conteudo.trim())} />
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Baixar minuta de laudo</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Salve o rascunho e exporte o documento final em DOCX</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  {secoes.length} seções · Versão {rascunho?.versao ?? 1}
                </p>
                {saved && (
                  <span className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest">✓ SALVO</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving || isPending}
                  className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Salvar rascunho
                </button>
                <button
                  onClick={handleExportDocx}
                  disabled={isExporting || secoes.every((s) => !s.conteudo.trim())}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#a3e635] text-slate-900 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#bef264] transition-all disabled:opacity-30"
                >
                  {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                  Baixar minuta do laudo (.docx)
                </button>
              </div>
            </div>
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
