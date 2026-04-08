'use client'

import { useState, useTransition, useMemo } from 'react'
import type { VaraPublicaRow } from '@/lib/data/prospeccao'
import { registrarVisita, marcarEmailEnviado } from '@/lib/actions/prospeccao'
import { salvarRotaProspeccao } from '@/lib/actions/rotas-nova'
import { getCoordsComarca } from '@/lib/data/coords-rj'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type VisitaRow = {
  id: string
  varaId: string | null
  comarca: string
  varaNome: string
  dataVisita: string
  resultado: string
  anotacoes: string | null
  juizEncontrado: string | null
  contatoNome: string | null
  contatoRole: string | null
  contatoEmail: string | null
  contatoFotoUrl: string | null
  emailEnviadoEm: string | null
  followUpEm: string | null
  criadoEm: string
}

type Props = {
  varas: VaraPublicaRow[]
  comarcas: string[]
  visitas: VisitaRow[]
}

// ─── Regiões ──────────────────────────────────────────────────────────────────

const REGIOES: { nome: string; comarcas: string[] }[] = [
  { nome: 'Capital',             comarcas: ['CAPITAL'] },
  { nome: 'Grande Rio',          comarcas: ['DUQUE DE CAXIAS','NOVA IGUACU','SAO JOAO DE MERITI','NILOPOLIS','QUEIMADOS','JAPERI','SEROPEDICA','ITAGUAI','SAO GONCALO','NITEROI','MARICA','GUAPIMIRIM','ITABORAI'] },
  { nome: 'Serrana',             comarcas: ['PETROPOLIS','TERESOPOLIS','NOVA FRIBURGO','TRES RIOS','VASSOURAS','BARRA DO PIRAI','PARAIBA DO SUL'] },
  { nome: 'Médio Paraíba',       comarcas: ['BARRA MANSA','VOLTA REDONDA','RESENDE'] },
  { nome: 'Norte Fluminense',    comarcas: ['CAMPOS DOS GOYTACAZE','MACAE','RIO DAS OSTRAS','SAO FIDELIS','ITAPERUNA','MIRACEMA','BOM JESUS DE ITABAPORA'] },
  { nome: 'Baixadas Litorâneas', comarcas: ['CABO FRIO','BUZIOS','ARARUAMA','SAO PEDRO DA ALDEIA','RIO BONITO','ANGRA DOS REIS','SAO JOAO DA BARRA'] },
]

const RESULTADOS = [
  { value: 'realizada',    label: 'Realizada',    color: 'bg-emerald-100/50 text-emerald-700 ring-emerald-200/30' },
  { value: 'nao_atendido', label: 'Não atendido', color: 'bg-amber-100/50 text-amber-700 ring-amber-200/30' },
  { value: 'remarcado',    label: 'Remarcada',    color: 'bg-slate-100 text-slate-600 ring-slate-200' },
  { value: 'cancelado',    label: 'Cancelada',    color: 'bg-slate-100 text-slate-500 ring-slate-200' },
]

function ResultadoBadge({ resultado }: { resultado: string }) {
  const r = RESULTADOS.find((x) => x.value === resultado) ?? RESULTADOS[0]
  return <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset', r.color)}>{r.label}</span>
}

// ─── Contact Avatar ───────────────────────────────────────────────────────────

function ContactAvatar({ nome, fotoUrl, size = 'md' }: { nome: string | null; fotoUrl: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-7 w-7 text-[11px]' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs'
  const initials = nome ? nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?'
  if (fotoUrl) {
    return <img src={fotoUrl} alt={nome ?? ''} className={cn('rounded-full object-cover border border-slate-200 shrink-0', sz)} />
  }
  return (
    <div className={cn('rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-400 shrink-0', sz)}>
      {nome ? initials : '?'}
    </div>
  )
}

// ─── Email match badge ────────────────────────────────────────────────────────

function EmailMatchBadge({ contatoEmail, emailRegistrado }: { contatoEmail: string; emailRegistrado: string | null }) {
  if (!emailRegistrado) return null
  const match = contatoEmail.trim().toLowerCase() === emailRegistrado.trim().toLowerCase()
  return match ? (
    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
      CONFERE
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
      DIVERGE
    </span>
  )
}

// ─── Visita Form ──────────────────────────────────────────────────────────────

function VisitaForm({ vara, onClose, onSaved }: { vara: VaraPublicaRow; onClose: () => void; onSaved: (v: VisitaRow) => void }) {
  const [isPending, startTransition] = useTransition()
  const [resultado, setResultado] = useState('realizada')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [anotacoes, setAnotacoes] = useState('')
  const [juiz, setJuiz] = useState(vara.juizTitular && vara.juizTitular !== 'Vago' ? vara.juizTitular : '')
  const [contatoNome, setContatoNome] = useState('')
  const [contatoRole, setContatoRole] = useState('Secretário(a)')
  const [contatoEmail, setContatoEmail] = useState('')
  const [contatoFotoUrl, setContatoFotoUrl] = useState('')
  const [emailEnviadoEm, setEmailEnviadoEm] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [erro, setErro] = useState('')

  function handleSalvar() {
    setErro('')
    startTransition(async () => {
      const res = await registrarVisita({
        varaId: vara.id,
        dataVisita: new Date(data).toISOString(),
        resultado,
        anotacoes: anotacoes || undefined,
        juizEncontrado: juiz || undefined,
        contatoNome: contatoNome || undefined,
        contatoRole: contatoRole || undefined,
        contatoEmail: contatoEmail || undefined,
        contatoFotoUrl: contatoFotoUrl || undefined,
        emailEnviadoEm: emailEnviadoEm ? new Date(emailEnviadoEm).toISOString() : undefined,
        followUpEm: followUp ? new Date(followUp).toISOString() : undefined,
      })
      if (!res.ok) { setErro(res.error); return }
      onSaved({
        id: res.id, varaId: vara.id, comarca: vara.comarca, varaNome: vara.varaNome,
        dataVisita: new Date(data).toISOString(), resultado,
        anotacoes: anotacoes || null, juizEncontrado: juiz || null,
        contatoNome: contatoNome || null, contatoRole: contatoRole || null,
        contatoEmail: contatoEmail || null, contatoFotoUrl: contatoFotoUrl || null,
        emailEnviadoEm: emailEnviadoEm ? new Date(emailEnviadoEm).toISOString() : null,
        followUpEm: followUp ? new Date(followUp).toISOString() : null,
        criadoEm: new Date().toISOString(),
      })
      onClose()
    })
  }

  const emailMatch = contatoEmail && vara.emailPrincipal
    ? contatoEmail.trim().toLowerCase() === vara.emailPrincipal.trim().toLowerCase()
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-none bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-8 py-6 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{vara.comarca}</p>
            <p className="font-bold text-slate-900 text-base uppercase tracking-tight">{vara.varaNome}</p>
          </div>
          <button onClick={onClose} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
            FECHAR
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* Datas */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data da visita</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                className="w-full h-12 border-b border-slate-200 bg-transparent text-sm font-bold focus:border-slate-900 focus:outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Follow-up</label>
              <input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)}
                className="w-full h-12 border-b border-slate-200 bg-transparent text-sm font-bold focus:border-slate-900 focus:outline-none transition-colors" />
            </div>
          </div>

          {/* Resultado */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resultado</label>
            <div className="flex flex-wrap gap-2">
              {RESULTADOS.map((r) => (
                <button key={r.value} type="button" onClick={() => setResultado(r.value)}
                  className={cn('px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all',
                    resultado === r.value ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100')}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Juiz */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Juiz(a) encontrado</label>
            <input type="text" value={juiz} onChange={(e) => setJuiz(e.target.value)} placeholder="NOME DO JUIZ..."
              className="w-full h-12 border-b border-slate-200 bg-transparent text-sm font-bold uppercase tracking-tight focus:border-slate-900 focus:outline-none placeholder:text-slate-300" />
          </div>

          {/* Contato */}
          <div className="bg-slate-50 p-6 space-y-4">
            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Contato na Vara</p>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nome</label>
                  <input type="text" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)}
                    className="w-full h-10 border-b border-slate-200 bg-transparent text-xs font-bold focus:border-slate-900 focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cargo</label>
                  <input type="text" value={contatoRole} onChange={(e) => setContatoRole(e.target.value)}
                    className="w-full h-10 border-b border-slate-200 bg-transparent text-xs font-bold focus:border-slate-900 focus:outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">E-mail</label>
                  {contatoEmail && <EmailMatchBadge contatoEmail={contatoEmail} emailRegistrado={vara.emailPrincipal} />}
                </div>
                <input type="email" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)}
                  className="w-full h-10 border-b border-slate-200 bg-transparent text-xs font-bold focus:border-slate-900 focus:outline-none" />
              </div>
            </div>
          </div>

          {erro && <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{erro}</p>}
        </div>

        <div className="flex gap-0 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 h-16 text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={handleSalvar} disabled={isPending}
            className="flex-1 h-16 bg-[#a3e635] hover:bg-[#bef264] text-xs font-bold text-slate-900 uppercase tracking-widest transition-all disabled:opacity-50">
            {isPending ? 'Salvando...' : 'Salvar visita'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Salvar Rota Modal ────────────────────────────────────────────────────────

function SalvarRotaModal({ count, onSalvar, onClose }: { count: number; onSalvar: (titulo: string) => void; onClose: () => void }) {
  const [titulo, setTitulo] = useState(`ROTA ${new Date().toLocaleDateString('pt-BR')}`)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-none bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <p className="font-bold text-slate-900 text-sm uppercase tracking-widest">Salvar rota</p>
          <button onClick={onClose} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">FECHAR</button>
        </div>
        <div className="p-8 space-y-6">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest"><span className="text-slate-900">{count} VARAS</span> NA ROTA</p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome da rota</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus
              className="w-full h-12 border-b border-slate-200 bg-transparent text-sm font-bold focus:border-slate-900 focus:outline-none uppercase tracking-tight" />
          </div>
        </div>
        <div className="flex gap-0 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 h-16 text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={() => titulo.trim() && onSalvar(titulo.trim())} disabled={!titulo.trim()}
            className="flex-1 h-16 bg-[#a3e635] hover:bg-[#bef264] text-xs font-bold text-slate-900 uppercase tracking-widest transition-all">
            Criar rota
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Card ────────────────────────────────────────────────────────────

function ContactCard({ visita, vara, onMarcarEmail }: { visita: VisitaRow; vara: VaraPublicaRow; onMarcarEmail: (id: string) => void }) {
  const [isPending, startTransition] = useTransition()

  function handleMarcarEmail() {
    startTransition(async () => {
      await marcarEmailEnviado(visita.id)
      onMarcarEmail(visita.id)
    })
  }

  return (
    <div className="bg-white p-5 border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{visita.contatoNome ?? 'SEM NOME'}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{visita.contatoRole ?? 'CONTATO'}</p>
        </div>
        <ResultadoBadge resultado={visita.resultado} />
      </div>

      <div className="flex flex-col gap-2">
        {visita.contatoEmail && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-bold text-slate-900 break-all">{visita.contatoEmail}</span>
            <EmailMatchBadge contatoEmail={visita.contatoEmail} emailRegistrado={vara.emailPrincipal} />
          </div>
        )}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DATA: {new Date(visita.dataVisita).toLocaleDateString('pt-BR')}</p>
          {visita.emailEnviadoEm ? (
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">EMAIL ENVIADO</p>
          ) : (
            <button onClick={handleMarcarEmail} disabled={isPending} className="text-[10px] font-bold text-slate-900 hover:text-[#a3e635] uppercase tracking-widest transition-colors">
              {isPending ? 'ENVIANDO...' : 'MARCAR ENVIADO'}
            </button>
          )}
        </div>
      </div>
      {visita.anotacoes && <p className="text-[11px] text-slate-500 leading-relaxed font-medium pt-2 border-t border-slate-50">{visita.anotacoes}</p>}
    </div>
  )
}

// ─── Vara Row ─────────────────────────────────────────────────────────────────

function VaraRow({
  vara, visitas, onRegistrar, modoRota, selecionada, onToggleRota, onAtualizarVisita,
}: {
  vara: VaraPublicaRow
  visitas: VisitaRow[]
  onRegistrar: () => void
  modoRota: boolean
  selecionada: boolean
  onToggleRota: () => void
  onAtualizarVisita: (id: string, patch: Partial<VisitaRow>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const followUps = visitas.filter((v) => v.followUpEm && new Date(v.followUpEm) >= new Date())
  const ultimoEmail = visitas.find((v) => v.emailEnviadoEm)

  return (
    <div className={cn(
      'border-b border-slate-100 transition-all',
      selecionada ? 'bg-[#a3e635]/5' : 'bg-white'
    )}>
      <div className="flex items-center gap-6 px-4 py-4">
        {modoRota ? (
          <button onClick={onToggleRota}
            className={cn('h-4 w-4 shrink-0 border-2 transition-all',
              selecionada ? 'bg-slate-900 border-slate-900' : 'border-slate-200')} />
        ) : (
          <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', visitas.length > 0 ? 'bg-[#a3e635]' : 'bg-slate-100')} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate">{vara.varaNome}</span>
            {visitas.length > 0 && !modoRota && (
              <span className="text-[10px] font-bold text-[#4d7c0f] uppercase tracking-widest">
                {visitas.length} VISITAS
              </span>
            )}
            {followUps.length > 0 && !modoRota && (
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                FOLLOW-UP
              </span>
            )}
          </div>
          {ultimoEmail?.emailEnviadoEm && !modoRota && (
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">
              EMAIL: {new Date(ultimoEmail.emailEnviadoEm).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {!modoRota && (
          <div className="flex items-center gap-4">
            <button onClick={() => setExpanded((v) => !v)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
              {expanded ? 'Ocultar' : 'Detalhes'}
            </button>
            <button onClick={onRegistrar} className="bg-[#a3e635] text-slate-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#bef264] transition-all">
              Visita
            </button>
          </div>
        )}
      </div>

      {expanded && !modoRota && (
        <div className="px-14 pb-6 pt-2 space-y-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {vara.emailPrincipal && <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{vara.emailPrincipal}</span>}
            {vara.telefone && <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{vara.telefone}</span>}
            {vara.endereco && <span className="text-[11px] text-slate-300 font-medium">{vara.endereco}</span>}
          </div>

          {visitas.length > 0 && (
            <div className="space-y-2 pt-2">
              {visitas.slice(0, 2).map((v) => (
                <ContactCard
                  key={v.id}
                  visita={v}
                  vara={vara}
                  onMarcarEmail={(id) => onAtualizarVisita(id, { emailEnviadoEm: new Date().toISOString() })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Comarca Accordion ────────────────────────────────────────────────────────

function ComarcaAccordion({
  comarca, varas, visitasPorVara, onRegistrar, modoRota, selecionadas, onToggleRota, onAtualizarVisita,
}: {
  comarca: string
  varas: VaraPublicaRow[]
  visitasPorVara: Map<string, VisitaRow[]>
  onRegistrar: (vara: VaraPublicaRow) => void
  modoRota: boolean
  selecionadas: Set<string>
  onToggleRota: (vara: VaraPublicaRow) => void
  onAtualizarVisita: (id: string, patch: Partial<VisitaRow>) => void
}) {
  const [open, setOpen] = useState(false)
  const visitadas = varas.filter((v) => (visitasPorVara.get(v.id)?.length ?? 0) > 0).length
  const countSel = varas.filter((v) => selecionadas.has(v.id)).length

  return (
    <div className="border border-slate-100 bg-white shadow-sm overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
        <span className="font-bold text-slate-900 text-sm uppercase tracking-widest">
          {comarca}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{varas.length} VARAS</span>
          {!modoRota && visitadas > 0 && (
            <span className="text-[10px] font-bold text-[#4d7c0f] uppercase tracking-widest bg-[#a3e635]/10 px-2 py-0.5 rounded">
              {visitadas}/{varas.length} OK
            </span>
          )}
          {modoRota && countSel > 0 && (
            <span className="text-[10px] font-bold text-white bg-slate-900 px-2 py-0.5 rounded uppercase tracking-widest">
              {countSel} SEL
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-50">
          {varas.map((vara) => (
            <VaraRow
              key={vara.id}
              vara={vara}
              visitas={visitasPorVara.get(vara.id) ?? []}
              onRegistrar={() => onRegistrar(vara)}
              modoRota={modoRota}
              selecionada={selecionadas.has(vara.id)}
              onToggleRota={() => onToggleRota(vara)}
              onAtualizarVisita={onAtualizarVisita}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Região Section ───────────────────────────────────────────────────────────

function RegiaoSection({
  regiao, varasPorComarca, visitasPorVara, onRegistrar, modoRota, selecionadas, onToggleRota, onAtualizarVisita,
}: {
  regiao: typeof REGIOES[0]
  varasPorComarca: Map<string, VaraPublicaRow[]>
  visitasPorVara: Map<string, VisitaRow[]>
  onRegistrar: (vara: VaraPublicaRow) => void
  modoRota: boolean
  selecionadas: Set<string>
  onToggleRota: (vara: VaraPublicaRow) => void
  onAtualizarVisita: (id: string, patch: Partial<VisitaRow>) => void
}) {
  const [open, setOpen] = useState(false)
  const comarcasComVaras = regiao.comarcas.filter((c) => (varasPorComarca.get(c)?.length ?? 0) > 0)
  if (comarcasComVaras.length === 0) return null

  const totalVaras = comarcasComVaras.reduce((acc, c) => acc + (varasPorComarca.get(c)?.length ?? 0), 0)
  const totalVisitadas = comarcasComVaras.reduce((acc, c) => acc + (varasPorComarca.get(c) ?? []).filter((v) => (visitasPorVara.get(v.id)?.length ?? 0) > 0).length, 0)
  const totalSel = comarcasComVaras.reduce((acc, c) => acc + (varasPorComarca.get(c) ?? []).filter((v) => selecionadas.has(v.id)).length, 0)
  const pct = totalVaras > 0 ? Math.round((totalVisitadas / totalVaras) * 100) : 0

  return (
    <div className="border border-slate-100 bg-white overflow-hidden shadow-sm">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm text-slate-900 uppercase tracking-[0.2em]">{regiao.nome}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {comarcasComVaras.length} CIDADES · {totalVaras} VARAS
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          {modoRota && totalSel > 0 && (
            <span className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1 uppercase tracking-widest">{totalSel} SELECIONADAS</span>
          )}
          {!modoRota && (
            <div className="flex items-center gap-4">
              <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#a3e635] transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] font-bold text-slate-900 tabular-nums">{pct}%</span>
            </div>
          )}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{open ? 'COLAPSAR' : 'EXPANDIR'}</span>
        </div>
      </button>

      {open && (
        <div className="bg-slate-50 p-4 space-y-4">
          {comarcasComVaras.map((comarca) => (
            <ComarcaAccordion
              key={comarca}
              comarca={comarca}
              varas={varasPorComarca.get(comarca) ?? []}
              visitasPorVara={visitasPorVara}
              onRegistrar={onRegistrar}
              modoRota={modoRota}
              selecionadas={selecionadas}
              onToggleRota={onToggleRota}
              onAtualizarVisita={onAtualizarVisita}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export default function ProspeccaoClient({ varas, comarcas: _c, visitas: initialVisitas }: Props) {
  const [search, setSearch] = useState('')
  const [varaForm, setVaraForm] = useState<VaraPublicaRow | null>(null)
  const [visitas, setVisitas] = useState<VisitaRow[]>(initialVisitas)
  const [modoRota, setModoRota] = useState(false)
  const [selecionadasIds, setSelecionadasIds] = useState<Set<string>>(new Set())
  const [showSalvarModal, setShowSalvarModal] = useState(false)
  const [isSalvando, startSalvando] = useTransition()

  function handleAtualizarVisita(id: string, patch: Partial<VisitaRow>) {
    setVisitas((prev) => prev.map((v) => v.id === id ? { ...v, ...patch } : v))
  }

  const visitasPorVara = useMemo(() => {
    const map = new Map<string, VisitaRow[]>()
    for (const v of visitas) {
      if (!v.varaId) continue
      const list = map.get(v.varaId) ?? []
      list.push(v)
      map.set(v.varaId, list)
    }
    return map
  }, [visitas])

  const filteredVaras = useMemo(() => {
    if (!search.trim()) return varas
    const q = search.toLowerCase()
    return varas.filter((v) =>
      v.varaNome.toLowerCase().includes(q) ||
      v.comarca.toLowerCase().includes(q) ||
      (v.juizTitular ?? '').toLowerCase().includes(q),
    )
  }, [varas, search])

  const varasPorComarca = useMemo(() => {
    const map = new Map<string, VaraPublicaRow[]>()
    for (const v of filteredVaras) {
      const list = map.get(v.comarca) ?? []
      list.push(v)
      map.set(v.comarca, list)
    }
    return map
  }, [filteredVaras])

  const stats = useMemo(() => {
    const visitadas = varas.filter((v) => (visitasPorVara.get(v.id)?.length ?? 0) > 0).length
    return { total: varas.length, visitadas, semVisita: varas.length - visitadas, totalVisitas: visitas.length }
  }, [varas, visitasPorVara, visitas])

  function handleSalvarRota(titulo: string) {
    const varasSel = varas.filter((v) => selecionadasIds.has(v.id))
    startSalvando(async () => {
      await salvarRotaProspeccao({
        titulo,
        pontos: varasSel.map((v, i) => {
          const [lat, lng] = getCoordsComarca(v.comarca)
          return { titulo: `${v.comarca} — ${v.varaNome}`, endereco: v.endereco ?? `${v.comarca} — ${v.varaNome}`, latitude: lat + i * 0.0002, longitude: lng + i * 0.0002, ordem: i + 1 }
        }),
      })
      setShowSalvarModal(false)
      setModoRota(false)
      setSelecionadasIds(new Set())
    })
  }

  return (
    <div className="space-y-10 pb-32 max-w-5xl mx-auto">
      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL VARAS',  value: stats.total,       color: 'text-slate-900 border-slate-200' },
          { label: 'VISITADAS',    value: stats.visitadas,   color: 'text-[#a3e635] border-[#a3e635]/20' },
          { label: 'SEM VISITA',   value: stats.semVisita,   color: 'text-slate-300 border-slate-100' },
          { label: 'REGISTROS',    value: stats.totalVisitas,color: 'text-slate-900 border-slate-200' },
        ].map((k) => (
          <div key={k.label} className={cn('bg-white border p-6 shadow-sm', k.color)}>
            <p className="text-3xl font-bold tabular-nums tracking-tighter leading-none mb-2">{k.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch gap-0 border border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="flex-1 relative border-b md:border-b-0 md:border-r border-slate-100">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="PROCURAR POR VARA, COMARCA OU JUIZ..."
            className="w-full h-16 bg-white px-8 text-xs font-bold uppercase tracking-widest focus:outline-none placeholder:text-slate-200" />
        </div>
        <button onClick={() => { setModoRota((v) => !v); setSelecionadasIds(new Set()) }}
          className={cn('h-16 px-10 text-xs font-bold uppercase tracking-widest transition-all shrink-0',
            modoRota ? 'bg-slate-900 text-white' : 'bg-[#a3e635] text-slate-900 hover:bg-[#bef264]')}>
          {modoRota ? 'CANCELAR ROTA' : 'CRIAR ROTA'}
        </button>
      </div>

      {/* Instruction */}
      {modoRota && (
        <div className="bg-slate-900 text-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg">
          Selecione as varas abaixo para montar sua rota de prospecção
        </div>
      )}

      {/* Regiões */}
      <div className="space-y-4">
        {REGIOES.map((regiao) => (
          <RegiaoSection
            key={regiao.nome}
            regiao={regiao}
            varasPorComarca={varasPorComarca}
            visitasPorVara={visitasPorVara}
            onRegistrar={setVaraForm}
            modoRota={modoRota}
            selecionadas={selecionadasIds}
            onToggleRota={(vara) => setSelecionadasIds((prev) => {
              const next = new Set(prev)
              next.has(vara.id) ? next.delete(vara.id) : next.add(vara.id)
              return next
            })}
            onAtualizarVisita={handleAtualizarVisita}
          />
        ))}
      </div>

      {/* Modals */}
      {varaForm && !modoRota && (
        <VisitaForm vara={varaForm} onClose={() => setVaraForm(null)}
          onSaved={(v) => { setVisitas((p) => [v, ...p]); setVaraForm(null) }} />
      )}

      {showSalvarModal && (
        <SalvarRotaModal count={selecionadasIds.size} onSalvar={handleSalvarRota} onClose={() => setShowSalvarModal(false)} />
      )}

      {/* Sticky Bottom Bar for Rota */}
      {modoRota && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-8 px-4 pointer-events-none">
          <div className={cn('pointer-events-auto flex items-center bg-white border border-slate-200 shadow-2xl transition-all h-20 px-8',
            selecionadasIds.size === 0 ? 'opacity-30' : 'opacity-100')}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-12">
              <span className="text-slate-900">{selecionadasIds.size}</span> VARAS SELECIONADAS
            </p>
            <button onClick={() => selecionadasIds.size > 0 && setShowSalvarModal(true)}
              disabled={selecionadasIds.size === 0 || isSalvando}
              className="bg-[#a3e635] hover:bg-[#bef264] text-slate-900 h-10 px-8 text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-0">
              {isSalvando ? 'SALVANDO...' : 'SALVAR ROTA'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
