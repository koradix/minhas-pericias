import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash    = await bcrypt.hash('senha123', 12)
  const hashMm  = await bcrypt.hash('123456', 10)

  // ─── Usuários ─────────────────────────────────────────────────────────────

  await prisma.user.upsert({
    where:  { email: 'mmbonassi@gmail.com' },
    update: {},
    create: {
      email:        'mmbonassi@gmail.com',
      name:         'M. Bonassi',
      passwordHash: hashMm,
      role:         'perito',
    },
  })

  // Force-update password so demo login always works
  const demoPerito = await prisma.user.upsert({
    where:  { email: 'perito@demo.com' },
    update: { passwordHash: hash },
    create: {
      email:        'perito@demo.com',
      name:         'Matheus Perito',
      passwordHash: hash,
      role:         'perito',
    },
  })

  await prisma.user.upsert({
    where:  { email: 'admin@demo.com' },
    update: {},
    create: {
      email:        'admin@demo.com',
      name:         'Admin',
      passwordHash: hash,
      role:         'admin',
    },
  })

  await prisma.user.upsert({
    where:  { email: 'escritorio@demo.perix.com.br' },
    update: {},
    create: {
      email:        'escritorio@demo.perix.com.br',
      name:         'Carvalho & Menezes Advocacia',
      passwordHash: hash,
      role:         'parceiro',
    },
  })

  await prisma.user.upsert({
    where:  { email: 'seguradora@demo.perix.com.br' },
    update: {},
    create: {
      email:        'seguradora@demo.perix.com.br',
      name:         'Caixa Seguradora RJ',
      passwordHash: hash,
      role:         'parceiro',
    },
  })

  await prisma.user.upsert({
    where:  { email: 'originador@demo.perix.com.br' },
    update: {},
    create: {
      email:        'originador@demo.perix.com.br',
      name:         'Rio Péricias Originações',
      passwordHash: hash,
      role:         'parceiro',
    },
  })

  // ─── Perfil do perito demo ────────────────────────────────────────────────

  await prisma.peritoPerfil.upsert({
    where:  { userId: demoPerito.id },
    update: {
      tribunais:      JSON.stringify(['TJRJ', 'TRT-1', 'TRF-2']),
      estados:        JSON.stringify(['RJ']),
      especialidades: JSON.stringify(['Contabilidade', 'Engenharia Civil', 'Avaliação de Imóveis']),
      cursos:         JSON.stringify(['CNPC', 'CFC']),
      areaPrincipal:  'contabil',
      cidade:         'Rio de Janeiro',
      estado:         'RJ',
      perfilCompleto: true,
    },
    create: {
      userId:         demoPerito.id,
      formacao:       'Ciências Contábeis',
      registro:       'CRC-RJ 123456',
      telefone:       '(21) 99999-0001',
      tribunais:      JSON.stringify(['TJRJ', 'TRT-1', 'TRF-2']),
      estados:        JSON.stringify(['RJ']),
      especialidades: JSON.stringify(['Contabilidade', 'Engenharia Civil', 'Avaliação de Imóveis']),
      cursos:         JSON.stringify(['CNPC', 'CFC']),
      areaPrincipal:  'contabil',
      cidade:         'Rio de Janeiro',
      estado:         'RJ',
      perfilCompleto: true,
    },
  })

  // ─── Limpa dados de teste anteriores (idempotente) ───────────────────────

  const rotasExistentes = await prisma.rotaPericia.findMany({
    where: { peritoId: demoPerito.id },
    select: { id: true },
  })
  if (rotasExistentes.length > 0) {
    const ids = rotasExistentes.map((r) => r.id)
    await prisma.checkpoint.deleteMany({ where: { rotaId: { in: ids } } })
    await prisma.rotaPericia.deleteMany({ where: { id: { in: ids } } })
  }

  await prisma.pericia.deleteMany({ where: { peritoId: demoPerito.id } })

  // ─── 7 Péricias reais de teste (RJ) ──────────────────────────────────────

  const p1 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-001',
    assunto:  'Avaliação de Imóvel para Partilha de Bens',
    tipo:     'Imobiliária',
    processo: '0012345-11.2025.8.19.0001',
    vara:     '2ª Vara de Família — TJRJ',
    partes:   'João Ferreira da Silva × Maria Ferreira',
    endereco: 'Rua São Clemente, 450, Botafogo — Rio de Janeiro, RJ',
    latitude: -22.9388, longitude: -43.1822,
    status:   'planejada', prazo: '30/04/2025',
    valorHonorarios: 4200,
  }})

  const p2 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-002',
    assunto:  'Vistoria de Vícios Construtivos em Apartamento',
    tipo:     'Residencial',
    processo: '0023456-22.2025.8.19.0001',
    vara:     '5ª Vara Cível da Comarca da Capital — TJRJ',
    partes:   'Construtora Horizonte Ltda × Condomínio Edifício Solar',
    endereco: 'Av. Atlântica, 2800, Copacabana — Rio de Janeiro, RJ',
    latitude: -22.9666, longitude: -43.1773,
    status:   'planejada', prazo: '15/04/2025',
    valorHonorarios: 3800,
  }})

  const p3 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-003',
    assunto:  'Perícia Hidráulica — Vazamento e Danos em Tubulação',
    tipo:     'Hidráulica',
    processo: '0034567-33.2025.8.19.0002',
    vara:     '3ª Vara Cível da Comarca da Capital — TJRJ',
    partes:   'Condomínio Edifício Maracanã × Seguros Brasil S.A.',
    endereco: 'Av. Rio Branco, 85, Centro — Rio de Janeiro, RJ',
    latitude: -22.9041, longitude: -43.1789,
    status:   'planejada', prazo: '20/04/2025',
    valorHonorarios: 2900,
  }})

  const p4 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-004',
    assunto:  'Perícia Elétrica — Análise de Instalação e Incêndio',
    tipo:     'Elétrica',
    processo: '0045678-44.2025.8.19.0003',
    vara:     '7ª Vara Cível da Comarca da Capital — TJRJ',
    partes:   'Indústria Metalúrgica São Jorge × Eletrobrás Distribuição',
    endereco: 'Rua da Passagem, 120, Botafogo — Rio de Janeiro, RJ',
    latitude: -22.9452, longitude: -43.1872,
    status:   'em_andamento', prazo: '10/04/2025',
    valorHonorarios: 5500,
  }})

  const p5 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-005',
    assunto:  'Perícia Médica — Avaliação de Incapacidade Laboral',
    tipo:     'Médica',
    processo: '0056789-55.2025.5.01.0001',
    vara:     '2ª Vara do Trabalho — TRT-1 (Rio de Janeiro)',
    partes:   'Carlos Eduardo Monteiro × Empresa de Logística Rio Ltda',
    endereco: 'Rua Conde de Bonfim, 1020, Tijuca — Rio de Janeiro, RJ',
    latitude: -22.9261, longitude: -43.2355,
    status:   'planejada', prazo: '05/05/2025',
    valorHonorarios: 3200,
  }})

  const p6 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-006',
    assunto:  'Perícia Psicológica — Avaliação de Dano Moral',
    tipo:     'Psicológica',
    processo: '0067890-66.2025.8.19.0004',
    vara:     '10ª Vara Cível da Comarca da Capital — TJRJ',
    partes:   'Ana Paula Rodrigues × Banco Nacional S.A.',
    endereco: 'Av. das Américas, 3434, Barra da Tijuca — Rio de Janeiro, RJ',
    latitude: -23.0045, longitude: -43.3660,
    status:   'planejada', prazo: '25/04/2025',
    valorHonorarios: 2800,
  }})

  const p7 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-007',
    assunto:  'Perícia Grafotécnica — Autenticidade de Assinatura em Contrato',
    tipo:     'Grafotécnica',
    processo: '0078901-77.2025.8.19.0038',
    vara:     '1ª Vara Empresarial da Comarca de Niterói — TJRJ',
    partes:   'Roberto Alves Lima × Sociedade Comercial Niterói Ltda',
    endereco: 'Rua Quinze de Novembro, 8, Centro — Niterói, RJ',
    latitude: -22.8998, longitude: -43.1769,
    status:   'planejada', prazo: '12/05/2025',
    valorHonorarios: 3500,
  }})

  // ─── Rota principal — "Circuito Centro RJ — Péricias do dia" ─────────────

  const rota1 = await prisma.rotaPericia.create({
    data: {
      peritoId: demoPerito.id,
      titulo:   'Circuito Centro RJ — Péricias do dia',
      status:   'planejada',
    },
  })

  await prisma.checkpoint.createMany({
    data: [
      {
        rotaId:    rota1.id,
        ordem:     1,
        titulo:    `${p1.numero} — ${p1.assunto}`,
        endereco:  p1.endereco ?? '',
        lat:       p1.latitude,
        lng:       p1.longitude,
        status:    'pendente',
        periciaId: p1.id,
      },
      {
        rotaId:    rota1.id,
        ordem:     2,
        titulo:    `${p3.numero} — ${p3.assunto}`,
        endereco:  p3.endereco ?? '',
        lat:       p3.latitude,
        lng:       p3.longitude,
        status:    'pendente',
        periciaId: p3.id,
      },
      {
        rotaId:    rota1.id,
        ordem:     3,
        titulo:    `${p7.numero} — ${p7.assunto}`,
        endereco:  p7.endereco ?? '',
        lat:       p7.latitude,
        lng:       p7.longitude,
        status:    'pendente',
        periciaId: p7.id,
      },
    ],
  })

  // ─── Rota 2 — "Zona Sul — Vistorias" ────────────────────────────────────

  const rota2 = await prisma.rotaPericia.create({
    data: {
      peritoId: demoPerito.id,
      titulo:   'Zona Sul RJ — Vistorias Residenciais',
      status:   'em_andamento',
    },
  })

  await prisma.checkpoint.createMany({
    data: [
      {
        rotaId:    rota2.id,
        ordem:     1,
        titulo:    `${p2.numero} — ${p2.assunto}`,
        endereco:  p2.endereco ?? '',
        lat:       p2.latitude,
        lng:       p2.longitude,
        status:    'pendente',
        periciaId: p2.id,
      },
      {
        rotaId:    rota2.id,
        ordem:     2,
        titulo:    `${p4.numero} — ${p4.assunto}`,
        endereco:  p4.endereco ?? '',
        lat:       p4.latitude,
        lng:       p4.longitude,
        status:    'pendente',
        periciaId: p4.id,
      },
    ],
  })

  console.log('=== Seed concluído ===')
  console.log('mmbonassi@gmail.com          — 123456  — perito')
  console.log('perito@demo.com              — senha123 — perito  ← 7 péricias + 2 rotas reais')
  console.log('admin@demo.com               — senha123 — admin')
  console.log('escritorio@demo.perix.com.br — senha123 — parceiro')
  console.log('seguradora@demo.perix.com.br — senha123 — parceiro')
  console.log('originador@demo.perix.com.br — senha123 — parceiro')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
