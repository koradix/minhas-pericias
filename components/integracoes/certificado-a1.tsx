'use client'

import { useState, useRef, useTransition } from 'react'
import { ShieldCheck, Upload, Trash2, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'
import { uploadCertificado, removerCertificado } from '@/lib/actions/certificado-escavador'
import type { CertificadoInfo } from '@/lib/actions/certificado-escavador'

interface Props {
  certificados: CertificadoInfo[]
}

export function CertificadoA1Section({ certificados: initial }: Props) {
  const [certs, setCerts] = useState<CertificadoInfo[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [senha, setSenha] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!arquivo || !senha.trim()) return
    setStatus('uploading')
    const fd = new FormData()
    fd.append('certificado', arquivo)
    fd.append('senha', senha.trim())
    const res = await uploadCertificado(fd)
    if (!res.ok) { setStatus('error'); setMsg(res.error); return }
    setStatus('ok')
    setMsg(`Certificado de ${res.titular} cadastrado com sucesso.`)
    setShowForm(false)
    setSenha('')
    setArquivo(null)
    // Reload list
    startTransition(async () => {
      const { listarCertificados } = await import('@/lib/actions/certificado-escavador')
      setCerts(await listarCertificados())
    })
  }

  async function handleRemover(id: number) {
    setRemovingId(id)
    const res = await removerCertificado(id)
    if (res.ok) setCerts((prev) => prev.filter((c) => c.id !== id))
    setRemovingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Certificados cadastrados */}
      {certs.length > 0 && (
        <div className="space-y-2">
          {certs.map((cert) => (
            <div key={cert.id} className="flex items-center gap-4 rounded-xl border border-[#d8f5a2] bg-[#f4fce3] px-5 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-[#d8f5a2]">
                <ShieldCheck className="h-5 w-5 text-[#416900]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#1f2937]">{cert.titular}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[12px] text-[#416900] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    CPF {cert.cpf || '—'}
                  </p>
                  {cert.validade && (
                    <p className="text-[11px] text-[#9ca3af]">válido até {new Date(cert.validade).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemover(cert.id)}
                disabled={removingId === cert.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition-all disabled:opacity-50 flex-shrink-0"
              >
                {removingId === cert.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      {status === 'ok' && (
        <div className="flex items-center gap-2 rounded-lg bg-[#f4fce3] border border-[#d8f5a2] px-4 py-3 text-[13px] text-[#416900]">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {msg}
        </div>
      )}

      {/* Upload form */}
      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); setStatus('idle') }}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#e2e8f0] hover:border-[#416900] hover:bg-[#f4fce3] px-5 py-3 text-[13px] font-semibold text-[#374151] hover:text-[#416900] transition-all"
        >
          <Upload className="h-4 w-4" />
          {certs.length > 0 ? 'Adicionar outro certificado' : 'Cadastrar certificado A1 (.pfx / .p12)'}
        </button>
      ) : (
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#374151]" />
            <p className="text-[14px] font-semibold text-[#1f2937]">Cadastrar certificado digital A1</p>
          </div>
          <p className="text-[13px] text-[#6b7280] leading-relaxed">
            O certificado é enviado ao Escavador de forma segura e criptografada. Ele é usado pelos robôs do Escavador para autenticar no PJe e acessar os autos do processo em seu nome.
          </p>

          <div className="space-y-3">
            {/* File picker */}
            <div>
              <label className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                Arquivo do certificado (.pfx ou .p12)
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="mt-1 flex items-center gap-3 cursor-pointer rounded-lg border-2 border-dashed border-[#e2e8f0] hover:border-[#416900] px-4 py-3 transition-all"
              >
                <Upload className="h-5 w-5 text-[#9ca3af]" />
                <span className="text-[13px] text-[#6b7280]">
                  {arquivo ? arquivo.name : 'Clique para selecionar'}
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pfx,.p12"
                className="hidden"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Senha */}
            <div>
              <label className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                Senha do certificado
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpload()}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-[14px] text-[#1f2937] placeholder-[#d1d5db] focus:outline-none focus:border-[#416900] focus:ring-2 focus:ring-[#416900]/20"
              />
            </div>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-[13px] text-rose-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {msg}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={status === 'uploading' || !arquivo || !senha.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#416900] hover:bg-[#2d4a00] px-4 py-2.5 text-[14px] font-semibold text-white transition-all disabled:opacity-50"
            >
              {status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === 'uploading' ? 'Enviando…' : 'Cadastrar certificado'}
            </button>
            <button
              onClick={() => { setShowForm(false); setStatus('idle'); setArquivo(null); setSenha('') }}
              className="rounded-xl border border-[#e2e8f0] hover:bg-[#f8f9ff] px-4 py-2.5 text-[14px] font-semibold text-[#374151] transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isPending && (
        <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Atualizando lista…
        </div>
      )}
    </div>
  )
}
