/**
 * Coordenadas aproximadas dos fóruns por comarca do TJRJ.
 * Usadas para roteirização de varas sem lat/lng próprio.
 */
export const COORDS_COMARCA_RJ: Record<string, [number, number]> = {
  'CAPITAL':                [-22.9022, -43.1759],
  'NITEROI':                [-22.8839, -43.1046],
  'SAO GONCALO':            [-22.8268, -42.9764],
  'DUQUE DE CAXIAS':        [-22.7892, -43.3122],
  'NOVA IGUACU':            [-22.7563, -43.4519],
  'SAO JOAO DE MERITI':     [-22.8022, -43.3700],
  'NILOPOLIS':              [-22.8039, -43.4200],
  'ITAGUAI':                [-22.8556, -43.7752],
  'QUEIMADOS':              [-22.7162, -43.5613],
  'JAPERI':                 [-22.6434, -43.6451],
  'SEROPEDICA':             [-22.7453, -43.7076],
  'MARICA':                 [-22.9197, -42.8186],
  'GUAPIMIRIM':             [-22.5738, -42.9849],
  'ITABORAI':               [-22.7606, -42.8588],
  'PETROPOLIS':             [-22.5045, -43.1775],
  'TERESOPOLIS':            [-22.4120, -42.9654],
  'NOVA FRIBURGO':          [-22.2830, -42.5319],
  'TRES RIOS':              [-22.1175, -43.2084],
  'VASSOURAS':              [-22.4054, -43.6636],
  'BARRA DO PIRAI':         [-22.4767, -43.8283],
  'PARAIBA DO SUL':         [-22.1619, -43.2978],
  'BARRA MANSA':            [-22.5433, -44.1741],
  'VOLTA REDONDA':          [-22.5204, -44.0942],
  'RESENDE':                [-22.4698, -44.4460],
  'CAMPOS DOS GOYTACAZE':   [-21.7591, -41.3294],
  'MACAE':                  [-22.3706, -41.7870],
  'RIO DAS OSTRAS':         [-22.5267, -41.9478],
  'SAO FIDELIS':            [-21.6464, -41.7425],
  'ITAPERUNA':              [-21.2077, -41.8867],
  'MIRACEMA':               [-21.4647, -42.1961],
  'BOM JESUS DE ITABAPORA': [-21.7469, -41.6779],
  'CABO FRIO':              [-22.8792, -42.0186],
  'BUZIOS':                 [-22.7469, -41.8817],
  'ARARUAMA':               [-22.8739, -42.3353],
  'SAO PEDRO DA ALDEIA':    [-22.8408, -42.1022],
  'RIO BONITO':             [-22.7209, -42.6172],
  'ANGRA DOS REIS':         [-23.0067, -44.3180],
  'SAO JOAO DA BARRA':      [-21.6422, -41.0517],
}

export function getCoordsComarca(comarca: string): [number, number] {
  return COORDS_COMARCA_RJ[comarca] ?? [-22.9068, -43.1729] // Rio de Janeiro centro como fallback
}
