// Mapeamento de sigla do tribunal → alias DataJud (CNJ)
// Endpoint: https://api-publica.datajud.cnj.jus.br/api_publica_{alias}/_search

export const DATAJUD_ALIAS: Record<string, string> = {
  // Tribunais de Justiça Estaduais
  TJSP: 'tjsp', TJRJ: 'tjrj', TJMG: 'tjmg', TJRS: 'tjrs', TJPR: 'tjpr',
  TJSC: 'tjsc', TJBA: 'tjba', TJGO: 'tjgo', TJPE: 'tjpe', TJCE: 'tjce',
  TJMA: 'tjma', TJAM: 'tjam', TJPA: 'tjpa', TJMT: 'tjmt', TJMS: 'tjms',
  TJES: 'tjes', TJAL: 'tjal', TJRN: 'tjrn', TJPB: 'tjpb', TJPI: 'tjpi',
  TJSE: 'tjse', TJRO: 'tjro', TJAC: 'tjac', TJRR: 'tjrr', TJAP: 'tjap',
  TJTO: 'tjto', TJDFT: 'tjdft',
  // Tribunais Regionais do Trabalho
  'TRT-1': 'trt1',  'TRT-2': 'trt2',  'TRT-3': 'trt3',  'TRT-4': 'trt4',
  'TRT-5': 'trt5',  'TRT-6': 'trt6',  'TRT-7': 'trt7',  'TRT-8': 'trt8',
  'TRT-9': 'trt9',  'TRT-10': 'trt10', 'TRT-11': 'trt11', 'TRT-12': 'trt12',
  'TRT-13': 'trt13', 'TRT-14': 'trt14', 'TRT-15': 'trt15', 'TRT-16': 'trt16',
  'TRT-17': 'trt17', 'TRT-18': 'trt18', 'TRT-19': 'trt19', 'TRT-20': 'trt20',
  'TRT-21': 'trt21', 'TRT-22': 'trt22', 'TRT-23': 'trt23', 'TRT-24': 'trt24',
  // Tribunais Regionais Federais
  'TRF-1': 'trf1', 'TRF-2': 'trf2', 'TRF-3': 'trf3',
  'TRF-4': 'trf4', 'TRF-5': 'trf5', 'TRF-6': 'trf6',
  // Tribunais Superiores
  STJ: 'stj', TST: 'tst', TSE: 'tse', STM: 'stm',
}

/** Retorna o alias DataJud para uma sigla, ou undefined se não mapeado */
export function getDataJudAlias(sigla: string): string | undefined {
  return DATAJUD_ALIAS[sigla.toUpperCase()]
}

/** Extrai a UF a partir da sigla do tribunal (TJRJ → RJ, TJSP → SP) */
export function tribunalToUF(sigla: string): string | null {
  const m = sigla.match(/^TJ([A-Z]{2,3})$/)
  if (m) return m[1] === 'DFT' ? 'DF' : m[1]
  return null
}
