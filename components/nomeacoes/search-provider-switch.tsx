'use client'

/**
 * Wrapper que mostra o botão correto baseado no provedor escolhido
 * em /integracoes (localStorage).
 *
 * - judit: mostra só JuditSearchBtn
 * - escavador: mostra só RadarBuscarBtn
 * - both: mostra os dois
 */

import { useState, useEffect } from 'react'
import { JuditSearchBtn } from '@/components/nomeacoes/judit-search-btn'
import { RadarBuscarBtn } from '@/components/nomeacoes/radar-buscar-btn'

type ApiProvider = 'escavador' | 'judit' | 'both'

interface Props {
  cpf: string | null
  siglas: string[]
  radarConfigurado: boolean
}

export function SearchProviderSwitch({ cpf, siglas, radarConfigurado }: Props) {
  const [provider, setProvider] = useState<ApiProvider>('judit')

  useEffect(() => {
    const stored = localStorage.getItem('perilab_api_provider') as ApiProvider | null
    if (stored) setProvider(stored)
  }, [])

  return (
    <div className="space-y-3">
      {/* Judit */}
      {(provider === 'judit' || provider === 'both') && (
        <JuditSearchBtn cpf={cpf} />
      )}

      {/* Escavador */}
      {(provider === 'escavador' || provider === 'both') && (
        <RadarBuscarBtn novas={0} siglas={siglas} radarConfigurado={radarConfigurado} />
      )}

      {/* Indicador discreto do provedor ativo */}
      <p className="text-[9px] text-slate-400 text-center uppercase tracking-widest">
        Provedor: {provider === 'both' ? 'Judit + Escavador' : provider === 'judit' ? 'Judit' : 'Escavador'}
        {' · '}
        <a href="/integracoes" className="text-slate-500 hover:text-slate-700 underline">Alterar</a>
      </p>
    </div>
  )
}
