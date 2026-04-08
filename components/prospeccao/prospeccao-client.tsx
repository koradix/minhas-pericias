'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  MapPin, Search, Phone, Mail, CalendarDays, CheckCircle2,
  Loader2, Plus, ChevronDown, Clock, AlertCircle, X, Building2,
  Route, Check, Send, UserCircle2, MailCheck, MailX,
} from 'lucide-react'
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
  { value: 'realizada',    label: 'Realizada',    color: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  { value: 'nao_atendido', label: 'Não atendido', color: 'bg-amber-100 text-amber-700 ring-amber-200' },
  { value: 'remarcado',    label: 'Remarcada',    color: 'bg-slate-100 text-slate-600 ring-slate-200' },
  { value: 'cancelado',    label: 'Cancelada',    color: 'bg-slate-100 text-slate-500 ring-slate-200' },
]

function ResultadoBadge({ resultado }: { resultado: string }) {
  const r = RESULTADOS.find((x) => x.value === resultado) ?? RESULTADOS[0]
  return <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', r.color)}>{r.label}</span>
}

// ─── Contact Avatar ───────────────────────────────────────────────────────────

function ContactAvatar({ nome, fotoUrl, size = 'md' }: { nome: string | null; fotoUrl: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-7 w-7 text-[11px]' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs'
  const initials = nome ? nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?'
  if (fotoUrl) {
    return <img src={fotoUrl} alt={nome ?? ''} className={cn('rounded-full object-cover border border-slate-200 shrink-0', sz)} />
  }
  return (
    <div className={cn('rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0', sz)}>
      {nome ? initials : <UserCircle2 className="h-4 w-4 text-slate-300" />}
    </div>
  )
}

// ─── Email match badge ────────────────────────────────────────────────────────

function EmailMatchBadge({ contatoEmail, emailRegistrado }: { contatoEmail: string; emailRegistrado: string | null }) {
  if (!emailRegistrado) return null
  const match = contatoEmail.trim().toLowerCase() === emailRegistrado.trim().toLowerCase()
  return match ? (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
      <MailCheck className="h-3 w-3" />Confere
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
      <MailX className="h-3 w-3" />Diverge do registrado
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.14em]">{vara.comarca}</p>
            <p className="font-bold text-slate-900 text-sm">{vara.varaNome}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]">Data da visita</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                className="w-full h-11 rounded-xl border-none bg-slate-100/60 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-lime-500 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]">Follow-up</label>
              <input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)}
                className="w-full h-11 rounded-xl border-none bg-slate-100/60 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-lime-500 focus:outline-none" />
            </div>
          </div>

          {/* Resultado */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]">Resultado</label>
            <div className="flex flex-wrap gap-2">
              {RESULTADOS.map((r) => (
                <button key={r.value} type="button" onClick={() => setResultado(r.value)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                    resultado === r.value ? 'bg-lime-500 border-lime-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-lime-300')}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Juiz */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]">Juiz(a) encontrado</label>
            <input type="text" value={juiz} onChange={(e) => setJuiz(e.target.value)} placeholder="Nome do(a) juiz(a)…"
              className="w-full h-11 rounded-xl border-none bg-slate-100/60 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-lime-500 focus:outline-none placeholder:text-slate-400" />
          </div>

          {/* Contato */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]">Contato na Vara</p>

            <div className="flex items-start gap-3">
              <ContactAvatar nome={contatoNome || null} fotoUrl={contatoFotoUrl || null} size="lg" />
              <div className="flex-1 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome</label>
                    <input type="text" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} placeholder="Secretário(a)…"
                      className="w-full h-9 rounded-lg border-none bg-white px-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none placeholder:text-slate-300 border border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargo</label>
                    <input type="text" value={contatoRole} onChange={(e) => setContatoRole(e.target.value)} placeholder="Cargo…"
                      className="w-full h-9 rounded-lg border-none bg-white px-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none placeholder:text-slate-300 border border-slate-200" />
                  </div>
                </div>

                {/* E-mail com validação */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail do contato</label>
                    {contatoEmail && <EmailMatchBadge contatoEmail={contatoEmail} emailRegistrado={vara.emailPrincipal} />}
                  </div>
                  <input type="email" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)}
                    placeholder={vara.emailPrincipal ?? 'email@tjrj.jus.br'}
                    className={cn(
                      'w-full h-9 rounded-lg border bg-white px-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none placeholder:text-slate-300',
                      contatoEmail && emailMatch === false ? 'border-amber-300' :
                      contatoEmail && emailMatch === true ? 'border-emerald-300' : 'border-slate-200',
                    )} />
                  {vara.emailPrincipal && (
                    <p className="text-[10px] text-slate-400">Registrado: {vara.emailPrincipal}</p>
                  )}
                </div>

                {/* URL da foto */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">URL da foto (opcional)</label>
                  <input type="url" value={contatoFotoUrl} onChange={(e) => setContatoFotoUrl(e.target.value)} placeholder="https://…"
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium focus:ring-2 focus:ring-lime-500 focus:outline-none placeholder:text-slate-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Último e-mail enviado */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]">Data do último e-mail enviado</label>
            <input type="date" value={emailEnviadoEm} onChange={(e) => setEmailEnviadoEm(e.target.value)}
              className="w-full h-11 rounded-xl border-none bg-slate-100/60 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-lime-500 focus:outline-none" />
          </div>

          {/* Anotações */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]">Anotações</label>
            <textarea value={anotacoes} onChange={(e) => setAnotacoes(e.target.value)} rows={3}
              placeholder="Observações, impressões, próximos passos…"
              className="w-full rounded-xl border-none bg-slate-100/60 px-4 py-3 text-sm font-medium resize-none focus:bg-white focus:ring-2 focus:ring-lime-500 focus:outline-none placeholder:text-slate-400" />
          </div>

          {erro && <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"><AlertCircle className="h-4 w-4 shrink-0" />{erro}</div>}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={handleSalvar} disabled={isPending}
            className="flex-1 h-11 rounded-xl bg-lime-500 hover:bg-lime-600 text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Salvar visita
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Salvar Rota Modal ────────────────────────────────────────────────────────

function SalvarRotaModal({ count, onSalvar, onClose }: { count: number; onSalvar: (titulo: string) => void; onClose: () => void }) {
  const [titulo, setTitulo] = useState(`Prospecção — ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-900">Salvar rota</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500"><span className="font-semibold text-slate-800">{count} vara{count !== 1 ? 's' : ''}</span> na rota.</p>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em]">Nome da rota</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus
              className="w-full h-11 rounded-xl border-none bg-slate-100/60 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-lime-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={() => titulo.trim() && onSalvar(titulo.trim())} disabled={!titulo.trim()}
            className="flex-1 h-11 rounded-xl bg-lime-500 hover:bg-lime-600 text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Route className="h-4 w-4" />Criar rota
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Card (dentro do card expandido da vara) ─────────────────────────

function ContactCard({ visita, vara, onMarcarEmail }: { visita: VisitaRow; vara: VaraPublicaRow; onMarcarEmail: (id: string) => void }) {
  const [isPending, startTransition] = useTransition()

  function handleMarcarEmail() {
    startTransition(async () => {
      await marcarEmailEnviado(visita.id)
      onMarcarEmail(visita.id)
    })
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-2.5">
      {/* Header contato */}
      <div className="flex items-center gap-3">
        <ContactAvatar nome={visita.contatoNome} fotoUrl={visita.contatoFotoUrl} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{visita.contatoNome ?? 'Contato não informado'}</p>
          {visita.contatoRole && <p className="text-[11px] text-slate-400">{visita.contatoRole}</p>}
        </div>
        <ResultadoBadge resultado={visita.resultado} />
      </div>

      {/* E-mail */}
      {visita.contatoEmail && (
        <div className="flex items-center gap-2 flex-wrap">
          <a href={`mailto:${visita.contatoEmail}`} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-lime-700 transition-colors">
            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
            {visita.contatoEmail}
          </a>
          <EmailMatchBadge contatoEmail={visita.contatoEmail} emailRegistrado={vara.emailPrincipal} />
        </div>
      )}

      {/* Datas */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3 text-slate-400" />
          Visitado em {new Date(visita.dataVisita).toLocaleDateString('pt-BR')}
        </span>
        {visita.emailEnviadoEm ? (
          <span className="flex items-center gap-1 text-emerald-700">
            <Send className="h-3 w-3" />
            E-mail: {new Date(visita.emailEnviadoEm).toLocaleDateString('pt-BR')}
          </span>
        ) : (
          <button
            onClick={handleMarcarEmail}
            disabled={isPending}
            className="flex items-center gap-1 text-slate-400 hover:text-lime-700 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Marcar e-mail enviado
          </button>
        )}
        {visita.followUpEm && (
          <span className="flex items-center gap-1 text-amber-600">
            <Clock className="h-3 w-3" />
            Follow-up: {new Date(visita.followUpEm).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {visita.anotacoes && <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">{visita.anotacoes}</p>}
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
  const ultimaVisita = visitas[0]
  const followUps = visitas.filter((v) => v.followUpEm && new Date(v.followUpEm) >= new Date())
  const ultimoEmail = visitas.find((v) => v.emailEnviadoEm)

  return (
    <div className={cn(
      'rounded-xl border transition-all',
      selecionada ? 'border-lime-300 bg-lime-50/60' :
      visitas.length > 0 ? 'border-lime-100 bg-lime-50/20' : 'border-slate-100 bg-white',
    )}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {modoRota ? (
          <button onClick={onToggleRota}
            className={cn('h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all',
              selecionada ? 'bg-lime-500 border-lime-500 text-white' : 'border-slate-300 hover:border-lime-400')}>
            {selecionada && <Check className="h-3 w-3" />}
          </button>
        ) : (
          <div className={cn('h-2 w-2 rounded-full shrink-0', visitas.length > 0 ? 'bg-lime-500' : 'bg-slate-200')} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800 truncate">{vara.varaNome}</span>
            {visitas.length > 0 && !modoRota && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-lime-100 px-1.5 py-0.5 text-[10px] font-semibold text-lime-700">
                <CheckCircle2 className="h-2.5 w-2.5" />{visitas.length}
              </span>
            )}
            {followUps.length > 0 && !modoRota && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                <Clock className="h-2.5 w-2.5" />follow-up
              </span>
            )}
          </div>
          {vara.juizTitular && vara.juizTitular !== 'Vago' && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{vara.juizTitular}</p>
          )}
          {/* Último e-mail no subtítulo */}
          {ultimoEmail?.emailEnviadoEm && !modoRota && (
            <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
              <Send className="h-2.5 w-2.5" />
              E-mail: {new Date(ultimoEmail.emailEnviadoEm).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {vara.telefone && !modoRota && (
          <a href={`tel:${vara.telefone.replace(/\D/g, '')}`}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-lime-700 hover:bg-lime-50 transition-colors" title={vara.telefone}>
            <Phone className="h-3.5 w-3.5" />
          </a>
        )}

        {!modoRota && (
          <button onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
          </button>
        )}

        {!modoRota && (
          <button onClick={onRegistrar}
            className="shrink-0 flex items-center gap-1 rounded-lg bg-lime-500 hover:bg-lime-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors">
            <Plus className="h-3 w-3" />Visita
          </button>
        )}
      </div>

      {expanded && !modoRota && (
        <div className="border-t border-slate-100 px-4 pb-3 pt-2.5 space-y-2.5">
          {/* Contact info da vara */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {vara.emailPrincipal && (
              <a href={`mailto:${vara.emailPrincipal}`} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-lime-700 transition-colors">
                <Mail className="h-3 w-3 text-slate-400 shrink-0" />{vara.emailPrincipal}
              </a>
            )}
            {vara.emailGabinete && (
              <a href={`mailto:${vara.emailGabinete}`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-lime-700 transition-colors">
                <Mail className="h-3 w-3 text-slate-300 shrink-0" />{vara.emailGabinete}
                <span className="text-[10px] text-slate-300">gabinete</span>
              </a>
            )}
            {vara.endereco && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />{vara.endereco}
              </span>
            )}
          </div>

          {/* Visitas com contact cards */}
          {visitas.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Histórico de visitas</p>
              {visitas.slice(0, 3).map((v) => (
                <ContactCard
                  key={v.id}
                  visita={v}
                  vara={vara}
                  onMarcarEmail={(id) => onAtualizarVisita(id, { emailEnviadoEm: new Date().toISOString() })}
                />
              ))}
            </div>
          )}

          {visitas.length === 0 && ultimaVisita && (
            <p className="text-[11px] text-slate-400">Última visita: {new Date(ultimaVisita.dataVisita).toLocaleDateString('pt-BR')}</p>
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
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
        <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="flex-1 font-semibold text-slate-800 text-sm capitalize">
          {comarca.charAt(0) + comarca.slice(1).toLowerCase()}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400">{varas.length} vara{varas.length !== 1 ? 's' : ''}</span>
          {modoRota && countSel > 0 && (
            <span className="inline-flex items-center rounded-md bg-lime-100 px-1.5 py-0.5 text-[10px] font-bold text-lime-700">{countSel}</span>
          )}
          {!modoRota && visitadas > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-lime-100 px-2 py-0.5 text-[10px] font-semibold text-lime-700">
              <CheckCircle2 className="h-2.5 w-2.5" />{visitadas}/{varas.length}
            </span>
          )}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-3 py-3 space-y-1.5">
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
    <div className="rounded-2xl border overflow-hidden bg-white border-slate-200">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
        <span className="font-semibold text-sm text-slate-800">{regiao.nome}</span>
        <span className="text-xs text-slate-400 shrink-0">
          {comarcasComVaras.length} comarca{comarcasComVaras.length !== 1 ? 's' : ''} · {totalVaras} varas
        </span>
        {modoRota && totalSel > 0 && (
          <span className="inline-flex items-center rounded-md bg-lime-100 px-1.5 py-0.5 text-[10px] font-bold text-lime-700 shrink-0">{totalSel}</span>
        )}
        {!modoRota && (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 shrink-0 tabular-nums">{pct}%</span>
          </div>
        )}
        <ChevronDown className={cn('h-4 w-4 text-slate-400 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2">
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
    <div className="space-y-5 pb-28">
      {!modoRota && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total de varas',       value: stats.total,       color: 'text-slate-900' },
            { label: 'Visitadas',             value: stats.visitadas,   color: 'text-lime-700'  },
            { label: 'Sem visita',            value: stats.semVisita,   color: 'text-amber-600' },
            { label: 'Visitas registradas',   value: stats.totalVisitas,color: 'text-slate-700' },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className={cn('text-2xl font-black tabular-nums', k.color)}>{k.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por vara, comarca ou juiz…"
            className="w-full h-11 rounded-xl border-none bg-slate-100 pl-10 pr-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-lime-500 focus:outline-none placeholder:text-slate-400" />
        </div>
        <button onClick={() => { setModoRota((v) => !v); setSelecionadasIds(new Set()) }}
          className={cn('h-11 px-4 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 shrink-0',
            modoRota ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300')}>
          {modoRota ? <X className="h-4 w-4" /> : <Route className="h-4 w-4" />}
          {modoRota ? 'Cancelar' : 'Criar Rota'}
        </button>
      </div>

      {modoRota && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0" />
          Selecione as varas para montar a rota de prospecção
        </div>
      )}

      <div className="space-y-2">
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

      {varaForm && !modoRota && (
        <VisitaForm vara={varaForm} onClose={() => setVaraForm(null)}
          onSaved={(v) => { setVisitas((p) => [v, ...p]); setVaraForm(null) }} />
      )}

      {showSalvarModal && (
        <SalvarRotaModal count={selecionadasIds.size} onSalvar={handleSalvarRota} onClose={() => setShowSalvarModal(false)} />
      )}

      {modoRota && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-6 pointer-events-none">
          <div className={cn('pointer-events-auto flex items-center gap-4 rounded-2xl bg-slate-900 px-5 py-3.5 shadow-2xl transition-all',
            selecionadasIds.size === 0 ? 'opacity-60' : 'opacity-100')}>
            <span className="text-sm text-slate-300">
              {selecionadasIds.size === 0 ? 'Nenhuma vara selecionada' :
                <><span className="font-bold text-white">{selecionadasIds.size}</span> vara{selecionadasIds.size !== 1 ? 's' : ''}</>}
            </span>
            <button onClick={() => selecionadasIds.size > 0 && setShowSalvarModal(true)}
              disabled={selecionadasIds.size === 0 || isSalvando}
              className="flex items-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 px-4 py-2 text-sm font-bold text-slate-900 transition-colors disabled:opacity-40">
              {isSalvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
              Salvar rota
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
