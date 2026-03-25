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
      name:         'Rio Perícias Originações',
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

  // ─── Rota de teste com checkpoints (câmera) ───────────────────────────────
  // Limpa rotas de teste anteriores para manter seed idempotente

  const rotasExistentes = await prisma.rotaPericia.findMany({
    where: { peritoId: demoPerito.id },
    select: { id: true },
  })
  if (rotasExistentes.length > 0) {
    const ids = rotasExistentes.map((r) => r.id)
    await prisma.checkpoint.deleteMany({ where: { rotaId: { in: ids } } })
    await prisma.rotaPericia.deleteMany({ where: { id: { in: ids } } })
  }

  // Rota 1 — planejada (para testar "Iniciar" → câmera)
  const rota1 = await prisma.rotaPericia.create({
    data: {
      peritoId: demoPerito.id,
      titulo:   'Circuito Centro RJ — 3 Perícias',
      status:   'planejada',
    },
  })
  await prisma.checkpoint.createMany({
    data: [
      {
        rotaId:   rota1.id,
        ordem:    1,
        titulo:   'PRC-2024-004 — Avaliação de Estabelecimento Comercial',
        endereco: 'Rua Uruguaiana, 75, Centro — Rio de Janeiro, RJ',
        lat:      -22.9056,
        lng:      -43.1769,
        status:   'pendente',
        pericoId: '4',
      },
      {
        rotaId:   rota1.id,
        ordem:    2,
        titulo:   'PRC-2024-002 — Perícia Trabalhista — Cálculo de Verbas Rescisórias',
        endereco: 'Av. Presidente Vargas, 1012, Centro — Rio de Janeiro, RJ',
        lat:      -22.9041,
        lng:      -43.1789,
        status:   'pendente',
        pericoId: '2',
      },
      {
        rotaId:   rota1.id,
        ordem:    3,
        titulo:   'PRC-2024-001 — Avaliação de Imóvel Residencial',
        endereco: 'Rua Voluntários da Pátria, 340, Botafogo — Rio de Janeiro, RJ',
        lat:      -22.9388,
        lng:      -43.1822,
        status:   'pendente',
        pericoId: '1',
      },
    ],
  })

  // Rota 2 — em_andamento (para testar câmera diretamente)
  const rota2 = await prisma.rotaPericia.create({
    data: {
      peritoId: demoPerito.id,
      titulo:   'Niterói + São Gonçalo — 2 Perícias',
      status:   'em_andamento',
    },
  })
  await prisma.checkpoint.createMany({
    data: [
      {
        rotaId:   rota2.id,
        ordem:    1,
        titulo:   'PRC-2024-003 — Laudo Contábil — Apuração de Haveres Societários',
        endereco: 'Rua Quinze de Novembro, 8, Centro — Niterói, RJ',
        lat:      -22.8998,
        lng:      -43.1769,
        status:   'pendente',
        pericoId: '3',
      },
      {
        rotaId:   rota2.id,
        ordem:    2,
        titulo:   'PRC-2024-006 — Laudo Ambiental — Avaliação de Dano Ambiental',
        endereco: 'Estrada do Colubandê, s/n, Porto Velho — São Gonçalo, RJ',
        lat:      -22.8297,
        lng:      -43.0505,
        status:   'pendente',
        pericoId: '6',
      },
    ],
  })

  console.log('=== Seed concluído ===')
  console.log('mmbonassi@gmail.com          — 123456  — perito')
  console.log('perito@demo.com              — senha123 — perito  ← perfil RJ completo + 2 rotas de teste')
  console.log('admin@demo.com               — senha123 — admin')
  console.log('escritorio@demo.perix.com.br — senha123 — parceiro')
  console.log('seguradora@demo.perix.com.br — senha123 — parceiro')
  console.log('originador@demo.perix.com.br — senha123 — parceiro')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
