/**
 * Static address lookup for major Brazilian tribunais.
 * Used to enrich Escavador /origens data (which lacks addresses) without
 * calling a paid geocoding API. Coordinates are approximate building centroids.
 */

export interface EnderecoTribunal {
  tribunalSigla: string
  enderecoTexto: string
  latitude: number
  longitude: number
}

/** Lookup map: tribunalSigla (uppercase) → address + coordinates */
export const ENDERECOS_TRIBUNAIS: Record<string, Omit<EnderecoTribunal, 'tribunalSigla'>> = {
  // ── São Paulo ────────────────────────────────────────────────────────────────
  TJSP:   { enderecoTexto: 'Praça da Sé, s/n, Centro, São Paulo - SP',                  latitude: -23.5489,  longitude: -46.6337 },
  'TRT-2': { enderecoTexto: 'Rua Boa Vista, 83, Centro, São Paulo - SP',                latitude: -23.5466,  longitude: -46.6347 },
  'TRT-15':{ enderecoTexto: 'Av. Marechal Câmara, 160, Centro, Campinas - SP',          latitude: -22.9070,  longitude: -47.0626 },
  TRTSP:  { enderecoTexto: 'Rua Boa Vista, 83, Centro, São Paulo - SP',                  latitude: -23.5466,  longitude: -46.6347 },
  TRFSP:  { enderecoTexto: 'Av. Paulista, 1842, Bela Vista, São Paulo - SP',             latitude: -23.5653,  longitude: -46.6521 },
  'TRF-3': { enderecoTexto: 'Av. Paulista, 1842, Bela Vista, São Paulo - SP',           latitude: -23.5653,  longitude: -46.6521 },

  // ── Rio de Janeiro ───────────────────────────────────────────────────────────
  TJRJ:   { enderecoTexto: 'Av. Erasmo Braga, 115, Centro, Rio de Janeiro - RJ',        latitude: -22.9089,  longitude: -43.1752 },
  'TRT-1': { enderecoTexto: 'Av. Augusto Severo, 84, Glória, Rio de Janeiro - RJ',      latitude: -22.9167,  longitude: -43.1789 },
  'TRF-2': { enderecoTexto: 'Rua Acre, 80, Centro, Rio de Janeiro - RJ',                latitude: -22.9039,  longitude: -43.1764 },
  TRFRJ:  { enderecoTexto: 'Rua Acre, 80, Centro, Rio de Janeiro - RJ',                  latitude: -22.9039,  longitude: -43.1764 },

  // ── Minas Gerais ─────────────────────────────────────────────────────────────
  TJMG:   { enderecoTexto: 'Av. Getúlio Vargas, 1145, Funcionários, Belo Horizonte - MG', latitude: -19.9358, longitude: -43.9352 },
  'TRT-3': { enderecoTexto: 'Av. Augusto de Lima, 1234, Centro, Belo Horizonte - MG',   latitude: -19.9204,  longitude: -43.9402 },
  'TRF-6': { enderecoTexto: 'Av. Álvares Cabral, 1805, Lourdes, Belo Horizonte - MG',   latitude: -19.9395,  longitude: -43.9460 },

  // ── Rio Grande do Sul ────────────────────────────────────────────────────────
  TJRS:   { enderecoTexto: 'Praça Marechal Deodoro, s/n, Centro Histórico, Porto Alegre - RS', latitude: -30.0337, longitude: -51.2301 },
  'TRT-4': { enderecoTexto: 'Av. Praia de Belas, 1432, Praia de Belas, Porto Alegre - RS', latitude: -30.0522, longitude: -51.2268 },
  'TRF-4': { enderecoTexto: 'Rua Otávio Francisco Caruso da Rocha, 300, Centro Histórico, Porto Alegre - RS', latitude: -30.0312, longitude: -51.2298 },

  // ── Paraná ───────────────────────────────────────────────────────────────────
  TJPR:   { enderecoTexto: 'Praça Nossa Senhora da Salete, s/n, Centro Cívico, Curitiba - PR', latitude: -25.4147, longitude: -49.2649 },
  'TRT-9': { enderecoTexto: 'Av. Victor Ferreira do Amaral, 2473, Tarumã, Curitiba - PR', latitude: -25.3944, longitude: -49.2427 },

  // ── Santa Catarina ───────────────────────────────────────────────────────────
  TJSC:   { enderecoTexto: 'Rua Deodoro, 92, Centro, Florianópolis - SC',               latitude: -27.5943,  longitude: -48.5499 },
  'TRT-12':{ enderecoTexto: 'Av. Mauro Ramos, 804, Centro, Florianópolis - SC',         latitude: -27.5895,  longitude: -48.5481 },

  // ── Bahia ────────────────────────────────────────────────────────────────────
  TJBA:   { enderecoTexto: 'Rua Joana Angélica, 70, Nazaré, Salvador - BA',             latitude: -12.9907,  longitude: -38.5128 },
  'TRT-5': { enderecoTexto: 'Rua Bela Vista do Cabrito, 35, Engenho Velho da Federação, Salvador - BA', latitude: -12.9653, longitude: -38.4823 },

  // ── Goiás ────────────────────────────────────────────────────────────────────
  TJGO:   { enderecoTexto: 'Praça Cívica, s/n, Centro, Goiânia - GO',                  latitude: -16.6779,  longitude: -49.2496 },
  'TRT-18':{ enderecoTexto: 'Av. T-4, Qd. G-01, Lt. 01, Setor Bueno, Goiânia - GO',   latitude: -16.7040,  longitude: -49.2637 },

  // ── Pernambuco ───────────────────────────────────────────────────────────────
  TJPE:   { enderecoTexto: 'Rua do Imperador Pedro II, s/n, Boa Vista, Recife - PE',    latitude: -8.0600,   longitude: -34.8728 },
  'TRT-6': { enderecoTexto: 'Av. Martins de Barros, 593, Santo Antônio, Recife - PE',   latitude: -8.0644,   longitude: -34.8766 },

  // ── Ceará ────────────────────────────────────────────────────────────────────
  TJCE:   { enderecoTexto: 'Av. Padre Antônio Tomás, 400, Água Fria, Fortaleza - CE',   latitude: -3.7382,   longitude: -38.5398 },
  'TRT-7': { enderecoTexto: 'Av. Santos Dumont, 3384, Aldeota, Fortaleza - CE',         latitude: -3.7305,   longitude: -38.4985 },

  // ── Distrito Federal ─────────────────────────────────────────────────────────
  TJDFT:  { enderecoTexto: 'SEPN 514, Bloco C, Asa Norte, Brasília - DF',              latitude: -15.7550,  longitude: -47.8773 },
  TJDF:   { enderecoTexto: 'SEPN 514, Bloco C, Asa Norte, Brasília - DF',              latitude: -15.7550,  longitude: -47.8773 },
  'TRT-10':{ enderecoTexto: 'SAFS Quadra 8, Lote 1, Brasília - DF',                    latitude: -15.8011,  longitude: -47.9094 },
  'TRF-1': { enderecoTexto: 'SAFS Quadra 2, Lote 2, Brasília - DF',                    latitude: -15.8000,  longitude: -47.9011 },

  // ── Amazonas ──────────────────────────────────────────────────────────────────
  TJAM:   { enderecoTexto: 'Av. André Araújo, s/n, Aleixo, Manaus - AM',               latitude: -3.1010,   longitude: -59.9860 },
  'TRT-11':{ enderecoTexto: 'Rua Monsenhor Coutinho, 1220, Centro, Manaus - AM',        latitude: -3.1205,   longitude: -60.0192 },

  // ── Pará ──────────────────────────────────────────────────────────────────────
  TJPA:   { enderecoTexto: 'Av. Almirante Barroso, 3089, Marco, Belém - PA',            latitude: -1.4220,   longitude: -48.4667 },
  'TRT-8': { enderecoTexto: 'Trav. Dom Pedro I, 698, Umarizal, Belém - PA',             latitude: -1.4563,   longitude: -48.5035 },

  // ── Maranhão ─────────────────────────────────────────────────────────────────
  TJMA:   { enderecoTexto: 'Rua do Passeio, s/n, Centro, São Luís - MA',               latitude: -2.5314,   longitude: -44.3012 },
  'TRT-16':{ enderecoTexto: 'Av. Senador Vitorino Freire, s/n, Areinha, São Luís - MA', latitude: -2.5012,   longitude: -44.2723 },

  // ── Mato Grosso ──────────────────────────────────────────────────────────────
  TJMT:   { enderecoTexto: 'Praça Alencastro, s/n, Centro, Cuiabá - MT',               latitude: -15.5989,  longitude: -56.0969 },
  'TRT-23':{ enderecoTexto: 'Av. Coronel Escolástico, 456, Duque de Caxias, Cuiabá - MT', latitude: -15.5825, longitude: -56.0879 },

  // ── Mato Grosso do Sul ────────────────────────────────────────────────────────
  TJMS:   { enderecoTexto: 'Av. Mato Grosso, 2777, Parque dos Poderes, Campo Grande - MS', latitude: -20.4424, longitude: -54.6130 },
  'TRT-24':{ enderecoTexto: 'Rua Maracaju, 1059, Centro, Campo Grande - MS',            latitude: -20.4611,  longitude: -54.6133 },

  // ── Espírito Santo ───────────────────────────────────────────────────────────
  TJES:   { enderecoTexto: 'Av. Alfredo Rodrigues Tissot, 1, Maruípe, Vitória - ES',   latitude: -20.2881,  longitude: -40.2981 },
  'TRT-17':{ enderecoTexto: 'Av. Júlio Brandão, 4, Bento Ferreira, Vitória - ES',      latitude: -20.2914,  longitude: -40.3115 },

  // ── Rio Grande do Norte ───────────────────────────────────────────────────────
  TJRN:   { enderecoTexto: 'Av. Duque de Caxias, 90, Petrópolis, Natal - RN',          latitude: -5.7867,   longitude: -35.2026 },
  'TRT-21':{ enderecoTexto: 'Av. Murilo Braga, 655, Tirol, Natal - RN',                latitude: -5.8093,   longitude: -35.2040 },

  // ── Alagoas ───────────────────────────────────────────────────────────────────
  TJAL:   { enderecoTexto: 'Rua João Pessoa, 59, Centro, Maceió - AL',                 latitude: -9.6659,   longitude: -35.7353 },
  'TRT-19':{ enderecoTexto: 'Av. Gustavo Paiva, 4400, Cruz das Almas, Maceió - AL',    latitude: -9.6487,   longitude: -35.7215 },

  // ── Sergipe ───────────────────────────────────────────────────────────────────
  TJSE:   { enderecoTexto: 'Rua Pacatuba, 241, Centro, Aracaju - SE',                  latitude: -10.9100,  longitude: -37.0520 },
  'TRT-20':{ enderecoTexto: 'Praça Camerino, s/n, Centro, Aracaju - SE',               latitude: -10.9121,  longitude: -37.0493 },

  // ── Piauí ─────────────────────────────────────────────────────────────────────
  TJPI:   { enderecoTexto: 'Rua Senador Teodoro Pacheco, s/n, Centro, Teresina - PI',  latitude: -5.0893,   longitude: -42.8036 },
  'TRT-22':{ enderecoTexto: 'Rua Rui Barbosa, 302, Centro, Teresina - PI',             latitude: -5.0891,   longitude: -42.8016 },

  // ── Paraíba ───────────────────────────────────────────────────────────────────
  TJPB:   { enderecoTexto: 'Rua Dr. Diógenes Chianca, 1777, Água Fria, João Pessoa - PB', latitude: -7.1149, longitude: -34.8655 },
  'TRT-13':{ enderecoTexto: 'Av. Capitão Argemiro de Figueiredo, 3005, Bancários, João Pessoa - PB', latitude: -7.1384, longitude: -34.8525 },

  // ── Roraima ───────────────────────────────────────────────────────────────────
  TJRR:   { enderecoTexto: 'Av. Brigadeiro Eduardo Gomes, 3402, Centro, Boa Vista - RR', latitude: 2.8206,   longitude: -60.6717 },

  // ── Rondônia ──────────────────────────────────────────────────────────────────
  TJRO:   { enderecoTexto: 'Av. Farquar, s/n, Bairro Pedrinhas, Porto Velho - RO',     latitude: -8.7619,   longitude: -63.8775 },
  'TRT-14':{ enderecoTexto: 'Av. Carlos Gomes, 2776, São Cristóvão, Porto Velho - RO',  latitude: -8.7647,   longitude: -63.8942 },

  // ── Tocantins ─────────────────────────────────────────────────────────────────
  TJTO:   { enderecoTexto: 'Praça dos Girassóis, s/n, Centro, Palmas - TO',            latitude: -10.1836,  longitude: -48.3337 },

  // ── Acre ──────────────────────────────────────────────────────────────────────
  TJAC:   { enderecoTexto: 'Rua Tribunal de Justiça, s/n, Bosque, Rio Branco - AC',    latitude: -9.9748,   longitude: -67.8103 },

  // ── Amapá ─────────────────────────────────────────────────────────────────────
  TJAP:   { enderecoTexto: 'Av. Cônego Farias, s/n, Centro, Macapá - AP',              latitude: 0.0341,    longitude: -51.0620 },
}

/**
 * Lookup address for a given tribunal sigla.
 * Tries the exact sigla, then common aliases (e.g. "TRT2" → "TRT-2").
 */
export function getEnderecoTribunal(sigla: string): Omit<EnderecoTribunal, 'tribunalSigla'> | null {
  const upper = sigla.toUpperCase()
  if (ENDERECOS_TRIBUNAIS[upper]) return ENDERECOS_TRIBUNAIS[upper]

  // Try normalizing "TRT2" → "TRT-2", "TRF3" → "TRF-3", etc.
  const normalized = upper.replace(/^(TRT|TRF)(\d)$/, '$1-$2')
  if (ENDERECOS_TRIBUNAIS[normalized]) return ENDERECOS_TRIBUNAIS[normalized]

  return null
}
