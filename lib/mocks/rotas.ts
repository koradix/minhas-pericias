import type { Rota } from '@/lib/types/rotas'

export const rotas: Rota[] = [
  {
    id: 'RT-001',
    tipo: 'PROSPECCAO',
    titulo: 'Circuito Centro — Fórum João Mendes',
    data: '16/12/2024',
    status: 'planejada',
    distanciaKm: 18,
    tempoEstimadoMin: 90,
    custoEstimado: 45,
    pontos: [
      { id: 'P1', rotaId: 'RT-001', nome: 'Fórum João Mendes', latitude: -23.548, longitude: -46.636, tipo: 'FORUM', ordem: 1 },
      { id: 'P2', rotaId: 'RT-001', nome: '1ª Vara Cível', latitude: -23.547, longitude: -46.637, tipo: 'VARA_CIVEL', ordem: 2 },
      { id: 'P3', rotaId: 'RT-001', nome: '3ª Vara Cível', latitude: -23.546, longitude: -46.638, tipo: 'VARA_CIVEL', ordem: 3 },
      { id: 'P4', rotaId: 'RT-001', nome: 'Lima & Associados', latitude: -23.560, longitude: -46.650, tipo: 'ESCRITORIO', ordem: 4 },
    ],
  },
  {
    id: 'RT-002',
    tipo: 'PROSPECCAO',
    titulo: 'Zona Sul — Circuito Seguradoras',
    data: '19/12/2024',
    status: 'planejada',
    distanciaKm: 31,
    tempoEstimadoMin: 150,
    custoEstimado: 78,
    pontos: [
      { id: 'P5', rotaId: 'RT-002', nome: 'Seguradora Confiança', latitude: -23.610, longitude: -46.680, tipo: 'ESCRITORIO', ordem: 1 },
      { id: 'P6', rotaId: 'RT-002', nome: 'Porto Seguro', latitude: -23.630, longitude: -46.700, tipo: 'ESCRITORIO', ordem: 2 },
      { id: 'P7', rotaId: 'RT-002', nome: 'Liberty Seguros', latitude: -23.620, longitude: -46.690, tipo: 'ESCRITORIO', ordem: 3 },
    ],
  },
  {
    id: 'RT-003',
    tipo: 'PROSPECCAO',
    titulo: 'Lapa-Barra Funda — TRT e Varas Trabalhistas',
    data: '05/12/2024',
    status: 'concluida',
    distanciaKm: 22,
    tempoEstimadoMin: 120,
    custoEstimado: 55,
    pontos: [
      { id: 'P8', rotaId: 'RT-003', nome: 'TRT-2', latitude: -23.525, longitude: -46.675, tipo: 'FORUM', ordem: 1 },
      { id: 'P9', rotaId: 'RT-003', nome: '4ª Vara Trabalhista', latitude: -23.524, longitude: -46.674, tipo: 'VARA_CIVEL', ordem: 2 },
      { id: 'P10', rotaId: 'RT-003', nome: 'Dra. Ana Carvalho', latitude: -23.530, longitude: -46.660, tipo: 'ESCRITORIO', ordem: 3 },
    ],
  },
  {
    id: 'RT-004',
    tipo: 'PERICIA',
    titulo: 'Vistoria PRC-2024-001 e PRC-2024-004',
    data: '13/12/2024',
    status: 'em_execucao',
    distanciaKm: 24,
    tempoEstimadoMin: 180,
    custoEstimado: 60,
    pontos: [
      { id: 'P11', rotaId: 'RT-004', nome: 'Imóvel PRC-2024-001', latitude: -23.570, longitude: -46.660, tipo: 'PERICIA', ordem: 1 },
      { id: 'P12', rotaId: 'RT-004', nome: 'Estabelecimento PRC-2024-004', latitude: -23.575, longitude: -46.655, tipo: 'PERICIA', ordem: 2 },
    ],
  },
  {
    id: 'RT-005',
    tipo: 'PERICIA',
    titulo: 'Vistoria PRC-2024-006 — Centro',
    data: '18/12/2024',
    status: 'planejada',
    distanciaKm: 11,
    tempoEstimadoMin: 90,
    custoEstimado: 30,
    pontos: [
      { id: 'P13', rotaId: 'RT-005', nome: 'Local PRC-2024-006', latitude: -23.548, longitude: -46.636, tipo: 'PERICIA', ordem: 1 },
    ],
  },
  {
    id: 'RT-006',
    tipo: 'PERICIA',
    titulo: 'Diligência PRC-2024-002 — TRT-2',
    data: '28/11/2024',
    status: 'concluida',
    distanciaKm: 16,
    tempoEstimadoMin: 120,
    custoEstimado: 40,
    pontos: [
      { id: 'P14', rotaId: 'RT-006', nome: 'TRT-2 — Entrevista', latitude: -23.525, longitude: -46.675, tipo: 'PERICIA', ordem: 1 },
    ],
  },
]

export const statusMapRotas = {
  planejada: { label: 'Planejada', variant: 'info' as const },
  em_execucao: { label: 'Em execução', variant: 'warning' as const },
  concluida: { label: 'Concluída', variant: 'success' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
}
