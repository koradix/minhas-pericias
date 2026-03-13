import type { EstatisticaVara, NomeacaoPericia } from '@/lib/types/nomeacoes'

export const varas: EstatisticaVara[] = [
  { vara: '3ª Vara Cível Central', juiz: 'Dr. Ricardo Almeida', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 47, prioridade: 'ALTA', especialidades: ['Avaliação de Imóvel', 'Perícia Contábil'], ultimaNomeacao: '12/12/2024' },
  { vara: '1ª Vara Empresarial', juiz: 'Dr. Fábio Costa', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 38, prioridade: 'ALTA', especialidades: ['Avaliação de Empresa', 'Perícia Contábil'], ultimaNomeacao: '08/12/2024' },
  { vara: 'TRT-2 — 1ª Turma', juiz: 'Dra. Ana Lima', tribunal: 'TRT-2', comarca: 'São Paulo', totalPericias: 35, prioridade: 'ALTA', especialidades: ['Perícia Trabalhista'], ultimaNomeacao: '10/12/2024' },
  { vara: '5ª Vara Cível', juiz: 'Dr. Marcos Silva', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 28, prioridade: 'MEDIA', especialidades: ['Avaliação de Imóvel', 'Avaliação de Veículo'], ultimaNomeacao: '05/12/2024' },
  { vara: '7ª Vara Cível', juiz: 'Dra. Clara Mendes', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 22, prioridade: 'MEDIA', especialidades: ['Avaliação de Imóvel'], ultimaNomeacao: '01/12/2024' },
  { vara: '2ª Vara Trabalhista', juiz: 'Dr. Paulo Souza', tribunal: 'TRT-2', comarca: 'São Paulo', totalPericias: 18, prioridade: 'MEDIA', especialidades: ['Perícia Trabalhista'], ultimaNomeacao: '28/11/2024' },
  { vara: '4ª Vara Cível', juiz: 'Dr. José Santos', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 12, prioridade: 'BAIXA', especialidades: ['Avaliação de Imóvel'], ultimaNomeacao: '15/11/2024' },
  { vara: '6ª Vara Cível', juiz: 'Dr. Carlos Vieira', tribunal: 'TJSP', comarca: 'Guarulhos', totalPericias: 9, prioridade: 'BAIXA', especialidades: ['Perícia Contábil'], ultimaNomeacao: '10/11/2024' },
]

export const nomeacoesRecentes: NomeacaoPericia[] = [
  { id: '1', tribunal: 'TJSP', comarca: 'São Paulo', vara: '3ª Vara Cível Central', juiz: 'Dr. Ricardo Almeida', processo: '0078901-23.2024', data: '12/12/2024', especialidade: 'Avaliação de Imóvel' },
  { id: '2', tribunal: 'TRT-2', comarca: 'São Paulo', vara: '1ª Turma', juiz: 'Dra. Ana Lima', processo: '0014523-11.2024', data: '10/12/2024', especialidade: 'Perícia Trabalhista' },
  { id: '3', tribunal: 'TJSP', comarca: 'São Paulo', vara: '1ª Vara Empresarial', juiz: 'Dr. Fábio Costa', processo: '0045678-09.2024', data: '08/12/2024', especialidade: 'Avaliação de Empresa' },
  { id: '4', tribunal: 'TJSP', comarca: 'São Paulo', vara: '5ª Vara Cível', juiz: 'Dr. Marcos Silva', processo: '0098234-15.2024', data: '05/12/2024', especialidade: 'Avaliação de Veículo' },
  { id: '5', tribunal: 'TJSP', comarca: 'São Paulo', vara: '7ª Vara Cível', juiz: 'Dra. Clara Mendes', processo: '0067891-22.2024', data: '01/12/2024', especialidade: 'Avaliação de Imóvel' },
]

export const juizes = [
  { nome: 'Dr. Ricardo Almeida', vara: '3ª Vara Cível Central', tribunal: 'TJSP', comarca: 'São Paulo', totalNomeacoes: 47, especialidades: ['Avaliação de Imóvel', 'Perícia Contábil'], ultimaNomeacao: '12/12/2024', tendencia: 'alta' as const },
  { nome: 'Dr. Fábio Costa', vara: '1ª Vara Empresarial', tribunal: 'TJSP', comarca: 'São Paulo', totalNomeacoes: 38, especialidades: ['Avaliação de Empresa', 'Perícia Contábil'], ultimaNomeacao: '08/12/2024', tendencia: 'alta' as const },
  { nome: 'Dra. Ana Lima', vara: 'TRT-2 — 1ª Turma', tribunal: 'TRT-2', comarca: 'São Paulo', totalNomeacoes: 35, especialidades: ['Perícia Trabalhista'], ultimaNomeacao: '10/12/2024', tendencia: 'estavel' as const },
  { nome: 'Dr. Marcos Silva', vara: '5ª Vara Cível', tribunal: 'TJSP', comarca: 'São Paulo', totalNomeacoes: 28, especialidades: ['Avaliação de Imóvel', 'Avaliação de Veículo'], ultimaNomeacao: '05/12/2024', tendencia: 'alta' as const },
  { nome: 'Dra. Clara Mendes', vara: '7ª Vara Cível', tribunal: 'TJSP', comarca: 'São Paulo', totalNomeacoes: 22, especialidades: ['Avaliação de Imóvel'], ultimaNomeacao: '01/12/2024', tendencia: 'estavel' as const },
  { nome: 'Dr. Paulo Souza', vara: '2ª Vara Trabalhista', tribunal: 'TRT-2', comarca: 'São Paulo', totalNomeacoes: 18, especialidades: ['Perícia Trabalhista'], ultimaNomeacao: '28/11/2024', tendencia: 'queda' as const },
  { nome: 'Dr. José Santos', vara: '4ª Vara Cível', tribunal: 'TJSP', comarca: 'São Paulo', totalNomeacoes: 12, especialidades: ['Avaliação de Imóvel'], ultimaNomeacao: '15/11/2024', tendencia: 'queda' as const },
  { nome: 'Dr. Carlos Vieira', vara: '6ª Vara Cível', tribunal: 'TJSP', comarca: 'Guarulhos', totalNomeacoes: 9, especialidades: ['Perícia Contábil'], ultimaNomeacao: '10/11/2024', tendencia: 'estavel' as const },
]
