// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoTribunal = 'estadual' | 'trabalho' | 'federal' | 'eleitoral'

export interface TribunalInfo {
  sigla: string
  nome: string
  tipo: TipoTribunal
}

// ─── Mapa estado → tribunais ───────────────────────────────────────────────────

export const TRIBUNAIS_POR_ESTADO: Record<string, TribunalInfo[]> = {
  RJ: [
    { sigla: 'TJRJ',   nome: 'Tribunal de Justiça do Rio de Janeiro', tipo: 'estadual'  },
    { sigla: 'TRT-1',  nome: '1ª Região — Rio de Janeiro',            tipo: 'trabalho'  },
    { sigla: 'JFRJ',   nome: 'Justiça Federal do Rio de Janeiro',     tipo: 'federal'   },
    { sigla: 'TRE-RJ', nome: 'TRE — Rio de Janeiro',                  tipo: 'eleitoral' },
  ],
  SP: [
    { sigla: 'TJSP',   nome: 'Tribunal de Justiça de São Paulo',      tipo: 'estadual'  },
    { sigla: 'TRT-2',  nome: '2ª Região — São Paulo (Capital)',       tipo: 'trabalho'  },
    { sigla: 'TRT-15', nome: '15ª Região — Campinas / Interior SP',   tipo: 'trabalho'  },
    { sigla: 'JFSP',   nome: 'Justiça Federal de São Paulo',          tipo: 'federal'   },
    { sigla: 'TRE-SP', nome: 'TRE — São Paulo',                       tipo: 'eleitoral' },
  ],
  MG: [
    { sigla: 'TJMG',   nome: 'Tribunal de Justiça de Minas Gerais',   tipo: 'estadual'  },
    { sigla: 'TRT-3',  nome: '3ª Região — Minas Gerais',              tipo: 'trabalho'  },
    { sigla: 'JFMG',   nome: 'Justiça Federal de Minas Gerais',       tipo: 'federal'   },
    { sigla: 'TRE-MG', nome: 'TRE — Minas Gerais',                    tipo: 'eleitoral' },
  ],
  RS: [
    { sigla: 'TJRS',   nome: 'Tribunal de Justiça do Rio Grande do Sul', tipo: 'estadual'  },
    { sigla: 'TRT-4',  nome: '4ª Região — Rio Grande do Sul',            tipo: 'trabalho'  },
    { sigla: 'JFRS',   nome: 'Justiça Federal do Rio Grande do Sul',     tipo: 'federal'   },
    { sigla: 'TRE-RS', nome: 'TRE — Rio Grande do Sul',                  tipo: 'eleitoral' },
  ],
  BA: [
    { sigla: 'TJBA',   nome: 'Tribunal de Justiça da Bahia',          tipo: 'estadual'  },
    { sigla: 'TRT-5',  nome: '5ª Região — Bahia',                     tipo: 'trabalho'  },
    { sigla: 'JFBA',   nome: 'Justiça Federal da Bahia',              tipo: 'federal'   },
    { sigla: 'TRE-BA', nome: 'TRE — Bahia',                           tipo: 'eleitoral' },
  ],
  PE: [
    { sigla: 'TJPE',   nome: 'Tribunal de Justiça de Pernambuco',     tipo: 'estadual'  },
    { sigla: 'TRT-6',  nome: '6ª Região — Pernambuco',                tipo: 'trabalho'  },
    { sigla: 'JFPE',   nome: 'Justiça Federal de Pernambuco',         tipo: 'federal'   },
    { sigla: 'TRE-PE', nome: 'TRE — Pernambuco',                      tipo: 'eleitoral' },
  ],
  CE: [
    { sigla: 'TJCE',   nome: 'Tribunal de Justiça do Ceará',          tipo: 'estadual'  },
    { sigla: 'TRT-7',  nome: '7ª Região — Ceará',                     tipo: 'trabalho'  },
    { sigla: 'JFCE',   nome: 'Justiça Federal do Ceará',              tipo: 'federal'   },
    { sigla: 'TRE-CE', nome: 'TRE — Ceará',                           tipo: 'eleitoral' },
  ],
  PA: [
    { sigla: 'TJPA',   nome: 'Tribunal de Justiça do Pará',           tipo: 'estadual'  },
    { sigla: 'TRT-8',  nome: '8ª Região — Pará / Amapá',             tipo: 'trabalho'  },
    { sigla: 'JFPA',   nome: 'Justiça Federal do Pará',               tipo: 'federal'   },
    { sigla: 'TRE-PA', nome: 'TRE — Pará',                            tipo: 'eleitoral' },
  ],
  AM: [
    { sigla: 'TJAM',   nome: 'Tribunal de Justiça do Amazonas',       tipo: 'estadual'  },
    { sigla: 'TRT-11', nome: '11ª Região — Amazonas / Roraima',       tipo: 'trabalho'  },
    { sigla: 'JFAM',   nome: 'Justiça Federal do Amazonas',           tipo: 'federal'   },
    { sigla: 'TRE-AM', nome: 'TRE — Amazonas',                        tipo: 'eleitoral' },
  ],
  PR: [
    { sigla: 'TJPR',   nome: 'Tribunal de Justiça do Paraná',         tipo: 'estadual'  },
    { sigla: 'TRT-9',  nome: '9ª Região — Paraná',                    tipo: 'trabalho'  },
    { sigla: 'JFPR',   nome: 'Justiça Federal do Paraná',             tipo: 'federal'   },
    { sigla: 'TRE-PR', nome: 'TRE — Paraná',                          tipo: 'eleitoral' },
  ],
  SC: [
    { sigla: 'TJSC',   nome: 'Tribunal de Justiça de Santa Catarina', tipo: 'estadual'  },
    { sigla: 'TRT-12', nome: '12ª Região — Santa Catarina',           tipo: 'trabalho'  },
    { sigla: 'JFSC',   nome: 'Justiça Federal de Santa Catarina',     tipo: 'federal'   },
    { sigla: 'TRE-SC', nome: 'TRE — Santa Catarina',                  tipo: 'eleitoral' },
  ],
  DF: [
    { sigla: 'TJDFT',  nome: 'Tribunal de Justiça do DF e Territórios', tipo: 'estadual'  },
    { sigla: 'TRT-10', nome: '10ª Região — DF / Tocantins',              tipo: 'trabalho'  },
    { sigla: 'JFDF',   nome: 'Justiça Federal do Distrito Federal',      tipo: 'federal'   },
    { sigla: 'TRE-DF', nome: 'TRE — Distrito Federal',                   tipo: 'eleitoral' },
  ],
  GO: [
    { sigla: 'TJGO',   nome: 'Tribunal de Justiça de Goiás',          tipo: 'estadual'  },
    { sigla: 'TRT-18', nome: '18ª Região — Goiás',                    tipo: 'trabalho'  },
    { sigla: 'JFGO',   nome: 'Justiça Federal de Goiás',              tipo: 'federal'   },
    { sigla: 'TRE-GO', nome: 'TRE — Goiás',                           tipo: 'eleitoral' },
  ],
  SE: [
    { sigla: 'TJSE',   nome: 'Tribunal de Justiça de Sergipe',        tipo: 'estadual'  },
    { sigla: 'TRT-20', nome: '20ª Região — Sergipe',                  tipo: 'trabalho'  },
    { sigla: 'JFSE',   nome: 'Justiça Federal de Sergipe',            tipo: 'federal'   },
    { sigla: 'TRE-SE', nome: 'TRE — Sergipe',                         tipo: 'eleitoral' },
  ],
  ES: [
    { sigla: 'TJES',   nome: 'Tribunal de Justiça do Espírito Santo', tipo: 'estadual'  },
    { sigla: 'TRT-17', nome: '17ª Região — Espírito Santo',           tipo: 'trabalho'  },
    { sigla: 'JFES',   nome: 'Justiça Federal do Espírito Santo',     tipo: 'federal'   },
    { sigla: 'TRE-ES', nome: 'TRE — Espírito Santo',                  tipo: 'eleitoral' },
  ],
  MT: [
    { sigla: 'TJMT',   nome: 'Tribunal de Justiça do Mato Grosso',    tipo: 'estadual'  },
    { sigla: 'TRT-23', nome: '23ª Região — Mato Grosso',              tipo: 'trabalho'  },
    { sigla: 'JFMT',   nome: 'Justiça Federal do Mato Grosso',        tipo: 'federal'   },
    { sigla: 'TRE-MT', nome: 'TRE — Mato Grosso',                     tipo: 'eleitoral' },
  ],
  MS: [
    { sigla: 'TJMS',   nome: 'Tribunal de Justiça do Mato Grosso do Sul', tipo: 'estadual'  },
    { sigla: 'TRT-24', nome: '24ª Região — Mato Grosso do Sul',           tipo: 'trabalho'  },
    { sigla: 'JFMS',   nome: 'Justiça Federal do Mato Grosso do Sul',     tipo: 'federal'   },
    { sigla: 'TRE-MS', nome: 'TRE — Mato Grosso do Sul',                  tipo: 'eleitoral' },
  ],
}

// ─── Estados disponíveis no sistema ──────────────────────────────────────────

export const ESTADOS_DISPONIVEIS = Object.keys(TRIBUNAIS_POR_ESTADO).sort()

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Retorna todos os tribunais de uma lista de estados, sem duplicatas */
export function getTribunaisParaEstados(estados: string[]): TribunalInfo[] {
  const seen = new Set<string>()
  const result: TribunalInfo[] = []
  for (const uf of estados) {
    for (const t of TRIBUNAIS_POR_ESTADO[uf] ?? []) {
      if (!seen.has(t.sigla)) {
        seen.add(t.sigla)
        result.push(t)
      }
    }
  }
  return result
}

/** Cor do badge por tipo de tribunal */
export const tipoCor: Record<TipoTribunal, string> = {
  estadual:  'bg-slate-100 text-slate-600',
  trabalho:  'bg-amber-50  text-amber-700',
  federal:   'bg-blue-50   text-blue-700',
  eleitoral: 'bg-violet-50 text-violet-700',
}
