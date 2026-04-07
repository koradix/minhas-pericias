'use client'

import { useState, useMemo } from 'react'
import { KeyRound, CheckCircle2, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, X, Search, ChevronDown } from 'lucide-react'
import { saveCredenciaisTribunal, removeCredenciaisTribunal } from '@/lib/actions/credenciais-tribunais'

export interface TribunalCredItem {
  sigla: string
  nome: string
  configurado: boolean
  usuario?: string
}

interface CredFormState {
  sigla: string
  nome: string
  usuario: string
  senha: string
}

export function CredenciaisPjeSection({ tribunais }: { tribunais: TribunalCredItem[] }) {
  const [items, setItems] = useState<TribunalCredItem[]>(tribunais)
  const [form, setForm] = useState<CredFormState | null>(null)
  const [showSenha, setShowSenha] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [showAll, setShowAll] = useState(false)

  const configurados = useMemo(() => items.filter((i) => i.configurado), [items])
  const naoConfigurados = useMemo(() => {
    const filtered = items.filter((i) => !i.configurado)
    if (!busca.trim()) return filtered
    const q = busca.toLowerCase()
    return filtered.filter((i) => i.sigla.toLowerCase().includes(q) || i.nome.toLowerCase().includes(q))
  }, [items, busca])

  const visiveis = showAll ? naoConfigurados : naoConfigurados.slice(0, 5)

  function openForm(item: TribunalCredItem) {
    setForm({ sigla: item.sigla, nome: item.nome, usuario: item.usuario ?? '', senha: '' })
    setStatus('idle')
    setShowSenha(false)
    setErrorMsg('')
  }

  function closeForm() {
    setForm(null)
    setStatus('idle')
    setErrorMsg('')
  }

  async function handleSave() {
    if (!form || !form.usuario.trim() || !form.senha.trim()) return
    setStatus('saving')
    const res = await saveCredenciaisTribunal(form.sigla, form.usuario.trim(), form.senha.trim())
    if (!res.ok) {
      setStatus('error')
      setErrorMsg(res.error ?? 'Erro ao salvar')
      return
    }
    setItems((prev) =>
      prev.map((t) =>
        t.sigla === form.sigla ? { ...t, configurado: true, usuario: form.usuario.trim() } : t,
      ),
    )
    closeForm()
  }

  async function handleRemove(sigla: string) {
    setRemovingId(sigla)
    await removeCredenciaisTribunal(sigla)
    setItems((prev) => prev.map((t) => t.sigla === sigla ? { ...t, configurado: false, usuario: undefined } : t))
    setRemovingId(null)
  }

  return (
    <div className="space-y-4">

      {/* ── Configurados ──────────────────────────────────────────────────────── */}
      {configurados.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
            Configurados ({configurados.length})
          </p>
          {configurados.map((item) => (
            <div
              key={item.sigla}
              className="flex items-center gap-4 rounded-xl border border-[#d8f5a2] bg-[#f4fce3] px-5 py-4"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-[#d8f5a2] text-[11px] font-bold text-[#416900]">
                {item.sigla.slice(0, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#1f2937] truncate">{item.nome}</p>
                <p className="text-[12px] text-[#416900] flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Usuário: {item.usuario}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openForm(item)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8f5a2] bg-white hover:bg-[#f0fad4] px-3 py-1.5 text-[12px] font-semibold text-[#416900] transition-all"
                >
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button
                  onClick={() => handleRemove(item.sigla)}
                  disabled={removingId === item.sigla}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition-all disabled:opacity-50"
                >
                  {removingId === item.sigla
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Trash2 className="h-3 w-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Adicionar ─────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
          {configurados.length > 0 ? 'Adicionar tribunal' : 'Selecione um tribunal para configurar'}
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
          <input
            type="text"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setShowAll(true) }}
            placeholder="Buscar tribunal..."
            className="w-full rounded-lg border border-[#e2e8f0] bg-white pl-9 pr-4 py-2.5 text-[14px] text-[#1f2937] placeholder-[#d1d5db] focus:outline-none focus:border-[#416900] focus:ring-2 focus:ring-[#416900]/20"
          />
        </div>

        {/* List */}
        <div className="space-y-2">
          {visiveis.map((item) => (
            <div
              key={item.sigla}
              className="flex items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white px-5 py-3.5"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#f2f3f9] text-[11px] font-bold text-[#374151]">
                {item.sigla.slice(0, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1f2937] truncate">{item.nome}</p>
                <p className="text-[12px] text-[#9ca3af]">{item.sigla}</p>
              </div>
              <button
                onClick={() => openForm(item)}
                className="inline-flex items-center gap-1.5 flex-shrink-0 rounded-lg bg-[#1f2937] hover:bg-[#374151] px-3 py-1.5 text-[12px] font-semibold text-white transition-all"
              >
                <Plus className="h-3 w-3" /> Configurar
              </button>
            </div>
          ))}

          {naoConfigurados.length === 0 && busca && (
            <p className="text-center text-[13px] text-[#9ca3af] py-4">
              Nenhum tribunal encontrado para &quot;{busca}&quot;.
            </p>
          )}

          {!busca && !showAll && naoConfigurados.length > 5 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#e2e8f0] py-2.5 text-[13px] text-[#6b7280] hover:text-[#374151] hover:border-[#d1d5db] transition-all"
            >
              <ChevronDown className="h-4 w-4" />
              Ver mais {naoConfigurados.length - 5} tribunais
            </button>
          )}
        </div>
      </div>

      {/* ── Modal de credenciais ──────────────────────────────────────────────── */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f3f9] text-[11px] font-bold text-[#374151]">
                  {form.sigla.slice(0, 4)}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#1f2937]">Acesso PJe</p>
                  <p className="text-[12px] text-[#9ca3af]">{form.nome}</p>
                </div>
              </div>
              <button onClick={closeForm} className="rounded-lg p-1.5 hover:bg-[#f2f3f9] text-[#9ca3af] hover:text-[#374151]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-[13px] text-[#6b7280] leading-relaxed">
              Suas credenciais são usadas pelo Escavador para autenticar no PJe e baixar documentos restritos. Ficam armazenadas de forma segura e nunca são compartilhadas.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Usuário / CPF</label>
                <input
                  type="text"
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                  placeholder="CPF ou login do PJe"
                  autoFocus
                  className="mt-1 w-full rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-[14px] text-[#1f2937] placeholder-[#d1d5db] focus:outline-none focus:border-[#416900] focus:ring-2 focus:ring-[#416900]/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Senha</label>
                <div className="relative mt-1">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2.5 pr-10 text-[14px] text-[#1f2937] placeholder-[#d1d5db] focus:outline-none focus:border-[#416900] focus:ring-2 focus:ring-[#416900]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                  >
                    {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {status === 'error' && (
              <p className="text-[13px] text-rose-600 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={status === 'saving' || !form.usuario.trim() || !form.senha.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#416900] hover:bg-[#2d4a00] px-4 py-2.5 text-[14px] font-semibold text-white transition-all disabled:opacity-50"
              >
                {status === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar credenciais
              </button>
              <button
                onClick={closeForm}
                className="rounded-xl border border-[#e2e8f0] hover:bg-[#f8f9ff] px-4 py-2.5 text-[14px] font-semibold text-[#374151] transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
