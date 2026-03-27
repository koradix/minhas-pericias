import {
  AlertTriangle,
  CheckSquare,
  Clock,
  MapPin,
  Wrench,
  FileText,
  Scale,
  Sparkles,
} from 'lucide-react'
import type { AnaliseProcesso } from '@/lib/ai/prompt-mestre-resumo'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safe = (arr: unknown): string[] => (Array.isArray(arr) ? (arr as string[]) : [])

const COMPLEXIDADE: Record<string, string> = {
  'baixa': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'média': 'bg-amber-50 text-amber-700 border border-amber-200',
  'alta':  'bg-rose-50 text-rose-700 border border-rose-200',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnaliseProcessoBlock({ analise }: { analise: AnaliseProcesso }) {
  const rp  = analise.resumoProcesso      ?? {}
  const nd  = analise.nomeacaoDespacho    ?? {}
  const ah  = analise.aceiteHonorarios    ?? {}
  const pr  = analise.prazos              ?? {}
  const lp  = analise.localPericia        ?? {}
  const nt  = analise.necessidadesTecnicas ?? {}
  const ri  = analise.riscos              ?? {}
  const ck  = safe(analise.checklist)

  const quesitos            = safe(nd.quesitos)
  const equipamentos        = safe(nt.equipamentos)
  const coletaDados         = safe(nt.coletaDados)
  const outrosPrazos        = safe(pr.outrosPrazos)
  const justificativas      = safe(ah.justificativasAumento)
  const riscosTecnicos      = safe(ri.tecnico)
  const riscosJuridicos     = safe(ri.juridico)
  const infoFaltando        = safe(ri.informacoesFaltando)
  const hasRiscos = riscosTecnicos.length > 0 || riscosJuridicos.length > 0 || infoFaltando.length > 0

  return (
    <div className="space-y-4">

      {/* Objeto da perícia */}
      {(rp.objetoPericia || rp.tipoAcao) && (
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
          <Sparkles className="h-3.5 w-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            {rp.tipoAcao && (
              <p className="text-sm font-semibold text-slate-800">{rp.tipoAcao}</p>
            )}
            {rp.objetoPericia && (
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{rp.objetoPericia}</p>
            )}
            {rp.areaTecnica && (
              <span className="mt-1.5 inline-flex items-center rounded-md bg-violet-50 border border-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                {rp.areaTecnica}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Prazos + Honorários */}
      <div className="grid sm:grid-cols-2 gap-3">

        {/* Prazos */}
        <div className="rounded-xl border border-slate-100 bg-white p-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-500 mb-2">
            <Clock className="h-3 w-3" /> Prazos
          </p>
          <div className="space-y-1 text-xs text-slate-600">
            {pr.prazoAceite && (
              <p><span className="text-slate-400">Aceite:</span> {pr.prazoAceite}</p>
            )}
            {pr.prazoLaudo && (
              <p><span className="text-slate-400">Laudo:</span> {pr.prazoLaudo}</p>
            )}
            {outrosPrazos.map((p, i) => (
              <p key={i} className="text-slate-500">· {p}</p>
            ))}
            {!pr.prazoAceite && !pr.prazoLaudo && outrosPrazos.length === 0 && (
              <p className="text-slate-400 italic text-[11px]">Não identificados no documento</p>
            )}
          </div>
        </div>

        {/* Honorários */}
        <div className="rounded-xl border border-slate-100 bg-white p-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-500 mb-2">
            <Scale className="h-3 w-3" /> Honorários
          </p>
          {ah.complexidade && (
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold mb-2 ${COMPLEXIDADE[ah.complexidade] ?? COMPLEXIDADE['baixa']}`}>
              Complexidade {ah.complexidade}
            </span>
          )}
          {ah.estrategiaHonorarios && (
            <p className="text-xs text-slate-600 leading-relaxed">{ah.estrategiaHonorarios}</p>
          )}
          {justificativas.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] text-violet-400 mb-1">Justificativas para aumento</p>
              {justificativas.map((j, i) => (
                <p key={i} className="text-[11px] text-slate-500">· {j}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Local */}
      {lp.enderecoCompleto && (
        <div className="rounded-xl border border-slate-100 bg-white p-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            <MapPin className="h-3 w-3" /> Local da perícia
          </p>
          <p className="text-sm text-slate-700">{lp.enderecoCompleto}</p>
          {lp.cidadeEstado && (
            <p className="text-xs text-slate-400 mt-0.5">{lp.cidadeEstado}</p>
          )}
        </div>
      )}

      {/* Quesitos */}
      {quesitos.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-white p-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-500 mb-2">
            <FileText className="h-3 w-3" /> Quesitos ({quesitos.length})
          </p>
          <ul className="space-y-1.5">
            {quesitos.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="text-violet-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Necessidades técnicas */}
      {(equipamentos.length > 0 || coletaDados.length > 0 || nt.tipoVistoria) && (
        <div className="rounded-xl border border-slate-100 bg-white p-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <Wrench className="h-3 w-3" /> Necessidades técnicas
          </p>
          {nt.tipoVistoria && (
            <p className="text-xs text-slate-600 mb-2">
              <span className="text-slate-400">Tipo de vistoria:</span> {nt.tipoVistoria}
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {equipamentos.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Equipamentos</p>
                <ul className="space-y-0.5">
                  {equipamentos.map((e, i) => (
                    <li key={i} className="text-xs text-slate-600">· {e}</li>
                  ))}
                </ul>
              </div>
            )}
            {coletaDados.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Dados a coletar</p>
                <ul className="space-y-0.5">
                  {coletaDados.map((d, i) => (
                    <li key={i} className="text-xs text-slate-600">· {d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Riscos */}
      {hasRiscos && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-500 mb-2">
            <AlertTriangle className="h-3 w-3" /> Riscos e atenção
          </p>
          <div className="space-y-2">
            {riscosTecnicos.length > 0 && (
              <div>
                <p className="text-[10px] text-rose-400 mb-1">Técnicos</p>
                {riscosTecnicos.map((r, i) => (
                  <p key={i} className="text-xs text-rose-700">· {r}</p>
                ))}
              </div>
            )}
            {riscosJuridicos.length > 0 && (
              <div>
                <p className="text-[10px] text-rose-400 mb-1">Jurídicos</p>
                {riscosJuridicos.map((r, i) => (
                  <p key={i} className="text-xs text-rose-700">· {r}</p>
                ))}
              </div>
            )}
            {infoFaltando.length > 0 && (
              <div>
                <p className="text-[10px] text-rose-400 mb-1">Informações faltando</p>
                {infoFaltando.map((r, i) => (
                  <p key={i} className="text-xs text-rose-700">· {r}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checklist */}
      {ck.length > 0 && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-2">
            <CheckSquare className="h-3 w-3" /> Checklist
          </p>
          <ul className="space-y-1">
            {ck.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-emerald-800">
                <span className="text-emerald-400 flex-shrink-0">☐</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
