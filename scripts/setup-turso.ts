/**
 * Setup Turso + Vercel em um único comando.
 *
 * Uso:
 *   npx tsx scripts/setup-turso.ts <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>
 *
 * Exemplo:
 *   npx tsx scripts/setup-turso.ts libsql://minhas-pericias-koradix.turso.io eyJhbGc...
 *
 * O script:
 *  1. Aplica todas as migrations SQL no banco Turso
 *  2. Popula com o seed de produção (usuários demo)
 *  3. Adiciona TURSO_DATABASE_URL e TURSO_AUTH_TOKEN ao Vercel (production)
 *  4. Faz redeploy do Vercel
 */

import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import { execSync } from 'child_process'

const [,, DB_URL, DB_TOKEN] = process.argv

if (!DB_URL || !DB_TOKEN) {
  console.error('❌  Uso: npx tsx scripts/setup-turso.ts <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>')
  console.error('\nObtendo credenciais:')
  console.error('  1. Acesse https://app.turso.tech')
  console.error('  2. Crie um banco chamado "minhas-pericias"')
  console.error('  3. Vá em "Connect" → copie a URL e o token')
  process.exit(1)
}

const db = createClient({ url: DB_URL, authToken: DB_TOKEN })

// ─── SQL das migrations ────────────────────────────────────────────────────

const MIGRATIONS = [
  // Tabelas base (podem já existir — IF NOT EXISTS)
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'perito',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,

  `CREATE TABLE IF NOT EXISTS "PeritoPerfil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "formacao" TEXT,
    "formacaoCustom" TEXT,
    "registro" TEXT,
    "especialidades" TEXT NOT NULL DEFAULT '[]',
    "cursos" TEXT NOT NULL DEFAULT '[]',
    "tribunais" TEXT NOT NULL DEFAULT '[]',
    "estados" TEXT NOT NULL DEFAULT '[]',
    "cidade" TEXT,
    "estado" TEXT,
    "areaAtuacao" TEXT,
    "areaPrincipal" TEXT,
    "areasSecundarias" TEXT NOT NULL DEFAULT '[]',
    "especialidades2" TEXT NOT NULL DEFAULT '[]',
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "perfilCompleto" INTEGER NOT NULL DEFAULT 0,
    "sincronizadoEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PeritoPerfil_userId_key" ON "PeritoPerfil"("userId")`,

  `CREATE TABLE IF NOT EXISTS "Pericia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "peritoId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "processo" TEXT,
    "vara" TEXT,
    "partes" TEXT,
    "endereco" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "status" TEXT NOT NULL DEFAULT 'planejada',
    "prazo" TEXT,
    "valorHonorarios" REAL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "RotaPericia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "peritoId" TEXT NOT NULL,
    "pericoId" TEXT,
    "titulo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "Checkpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rotaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "endereco" TEXT,
    "lat" REAL,
    "lng" REAL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "chegadaEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periciaId" TEXT,
    "pericoId" TEXT,
    "tribunalSigla" TEXT,
    "varaNome" TEXT
  )`,

  // ALTER existing Checkpoint tables that may not have periciaId yet
  `ALTER TABLE "Checkpoint" ADD COLUMN "periciaId" TEXT`,

  `CREATE TABLE IF NOT EXISTS "CheckpointMidia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checkpointId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT,
    "texto" TEXT,
    "descricao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "TribunalVara" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "peritoId" TEXT NOT NULL,
    "tribunalSigla" TEXT NOT NULL,
    "tribunalNome" TEXT NOT NULL,
    "varaNome" TEXT NOT NULL,
    "varaId" TEXT,
    "uf" TEXT,
    "ativa" INTEGER NOT NULL DEFAULT 1,
    "totalNomeacoes" INTEGER NOT NULL DEFAULT 0,
    "enderecoTexto" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "sincronizadoEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TribunalVara_peritoId_tribunalSigla_varaNome_key" ON "TribunalVara"("peritoId", "tribunalSigla", "varaNome")`,

  `CREATE TABLE IF NOT EXISTS "VaraStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tribunalSigla" TEXT NOT NULL,
    "varaNome" TEXT NOT NULL,
    "totalPeritosSugeridos" INTEGER NOT NULL DEFAULT 0,
    "totalNomeacoes" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VaraStats_tribunalSigla_varaNome_key" ON "VaraStats"("tribunalSigla", "varaNome")`,

  `CREATE TABLE IF NOT EXISTS "NomeacaoCitacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "peritoId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "diarioSigla" TEXT NOT NULL,
    "diarioNome" TEXT NOT NULL,
    "diarioData" DATETIME NOT NULL,
    "snippet" TEXT NOT NULL,
    "numeroProcesso" TEXT,
    "linkCitacao" TEXT NOT NULL,
    "visualizado" INTEGER NOT NULL DEFAULT 0,
    "fonte" TEXT NOT NULL DEFAULT 'escavador',
    "tribunalVaraId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "NomeacaoCitacao_peritoId_externalId_key" ON "NomeacaoCitacao"("peritoId", "externalId")`,

  `CREATE TABLE IF NOT EXISTS "RadarConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "peritoId" TEXT NOT NULL,
    "ativo" INTEGER NOT NULL DEFAULT 1,
    "ultimaBusca" DATETIME,
    "totalCitacoes" INTEGER NOT NULL DEFAULT 0,
    "saldoAtual" REAL,
    "saldoUltimaVerif" REAL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RadarConfig_peritoId_key" ON "RadarConfig"("peritoId")`,

  `CREATE TABLE IF NOT EXISTS "VaraContato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "peritoId" TEXT NOT NULL,
    "tribunalSigla" TEXT NOT NULL,
    "varaNome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "juizNome" TEXT,
    "secretarioNome" TEXT,
    "secretarioLinkedin" TEXT,
    "observacoes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VaraContato_peritoId_tribunalSigla_varaNome_key" ON "VaraContato"("peritoId", "tribunalSigla", "varaNome")`,

  `CREATE TABLE IF NOT EXISTS "Processo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroProcesso" TEXT NOT NULL,
    "tribunal" TEXT NOT NULL,
    "classe" TEXT,
    "assunto" TEXT,
    "orgaoJulgador" TEXT,
    "dataDistribuicao" TEXT,
    "dataUltimaAtu" TEXT,
    "partes" TEXT NOT NULL DEFAULT '[]',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Processo_numeroProcesso_key" ON "Processo"("numeroProcesso")`,

  `CREATE TABLE IF NOT EXISTS "Nomeacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "peritoId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'novo',
    "scoreMatch" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Nomeacao_peritoId_processoId_key" ON "Nomeacao"("peritoId", "processoId")`,

  // Parceiro / proposta / demanda
  `CREATE TABLE IF NOT EXISTS "Parceiro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'escritorio',
    "email" TEXT,
    "telefone" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "DemandaParceiro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "valor" REAL,
    "prazo" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "descricao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "Proposta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "demandaId" TEXT NOT NULL,
    "demandaTitulo" TEXT NOT NULL,
    "peritoId" TEXT NOT NULL,
    "peritoNome" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enviada',
    "mensagem" TEXT,
    "valorProposto" REAL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "ModeloBase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "conteudo" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "uploadedById" TEXT,
    "versaoPaiId" TEXT,
    "tamanhoBytes" INTEGER,
    "textoExtraido" TEXT,
    "tokenCount" INTEGER,
    "processadoEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "DocumentoGerado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "periciaNum" TEXT,
    "modeloId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'gerado',
    "conteudo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
]

// ─── Seed de produção ─────────────────────────────────────────────────────

async function seed(userId: string) {
  const now = new Date().toISOString()

  // PeritoPerfil
  await db.execute({
    sql: `INSERT OR IGNORE INTO "PeritoPerfil"
      ("id","userId","formacao","registro","telefone","tribunais","estados","especialidades","cursos","areaPrincipal","cidade","estado","perfilCompleto","updatedAt")
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      `perfil-${userId}`, userId,
      'Ciências Contábeis', 'CRC-RJ 123456', '(21) 99999-0001',
      '["TJRJ","TRT-1","TRF-2"]', '["RJ"]',
      '["Contabilidade","Engenharia Civil","Avaliação de Imóveis"]',
      '["CNPC","CFC"]', 'contabil',
      'Rio de Janeiro', 'RJ', 1, now,
    ],
  })

  // 7 Péricias reais de teste
  type PericiaData = { id: string; numero: string; assunto: string; tipo: string; processo: string; vara: string; partes: string; endereco: string; lat: number; lng: number; prazo: string; valor: number }
  const periciaData: PericiaData[] = [
    { id: `p1-${userId}`, numero: 'PRC-2025-001', assunto: 'Avaliação de Imóvel para Partilha de Bens', tipo: 'Imobiliária', processo: '0012345-11.2025.8.19.0001', vara: '2ª Vara de Família — TJRJ', partes: 'João Ferreira × Maria Ferreira', endereco: 'Rua São Clemente, 450, Botafogo — Rio de Janeiro, RJ', lat: -22.9388, lng: -43.1822, prazo: '30/04/2025', valor: 4200 },
    { id: `p2-${userId}`, numero: 'PRC-2025-002', assunto: 'Vistoria de Vícios Construtivos em Apartamento', tipo: 'Residencial', processo: '0023456-22.2025.8.19.0001', vara: '5ª Vara Cível — TJRJ', partes: 'Construtora Horizonte × Condomínio Solar', endereco: 'Av. Atlântica, 2800, Copacabana — Rio de Janeiro, RJ', lat: -22.9666, lng: -43.1773, prazo: '15/04/2025', valor: 3800 },
    { id: `p3-${userId}`, numero: 'PRC-2025-003', assunto: 'Perícia Hidráulica — Vazamento e Danos em Tubulação', tipo: 'Hidráulica', processo: '0034567-33.2025.8.19.0002', vara: '3ª Vara Cível — TJRJ', partes: 'Condomínio Maracanã × Seguros Brasil S.A.', endereco: 'Av. Rio Branco, 85, Centro — Rio de Janeiro, RJ', lat: -22.9041, lng: -43.1789, prazo: '20/04/2025', valor: 2900 },
    { id: `p4-${userId}`, numero: 'PRC-2025-004', assunto: 'Perícia Elétrica — Análise de Instalação e Incêndio', tipo: 'Elétrica', processo: '0045678-44.2025.8.19.0003', vara: '7ª Vara Cível — TJRJ', partes: 'Metalúrgica São Jorge × Eletrobrás', endereco: 'Rua da Passagem, 120, Botafogo — Rio de Janeiro, RJ', lat: -22.9452, lng: -43.1872, prazo: '10/04/2025', valor: 5500 },
    { id: `p5-${userId}`, numero: 'PRC-2025-005', assunto: 'Perícia Médica — Avaliação de Incapacidade Laboral', tipo: 'Médica', processo: '0056789-55.2025.5.01.0001', vara: '2ª Vara do Trabalho — TRT-1', partes: 'Carlos Eduardo × Empresa de Logística Rio', endereco: 'Rua Conde de Bonfim, 1020, Tijuca — Rio de Janeiro, RJ', lat: -22.9261, lng: -43.2355, prazo: '05/05/2025', valor: 3200 },
    { id: `p6-${userId}`, numero: 'PRC-2025-006', assunto: 'Perícia Psicológica — Avaliação de Dano Moral', tipo: 'Psicológica', processo: '0067890-66.2025.8.19.0004', vara: '10ª Vara Cível — TJRJ', partes: 'Ana Paula Rodrigues × Banco Nacional S.A.', endereco: 'Av. das Américas, 3434, Barra da Tijuca — Rio de Janeiro, RJ', lat: -23.0045, lng: -43.3660, prazo: '25/04/2025', valor: 2800 },
    { id: `p7-${userId}`, numero: 'PRC-2025-007', assunto: 'Perícia Grafotécnica — Autenticidade de Assinatura', tipo: 'Grafotécnica', processo: '0078901-77.2025.8.19.0038', vara: '1ª Vara Empresarial de Niterói — TJRJ', partes: 'Roberto Alves × Sociedade Comercial Niterói', endereco: 'Rua Quinze de Novembro, 8, Centro — Niterói, RJ', lat: -22.8998, lng: -43.1769, prazo: '12/05/2025', valor: 3500 },
  ]

  for (const p of periciaData) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO "Pericia" ("id","peritoId","numero","assunto","tipo","processo","vara","partes","endereco","latitude","longitude","status","prazo","valorHonorarios","criadoEm","atualizadoEm") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [p.id, userId, p.numero, p.assunto, p.tipo, p.processo, p.vara, p.partes, p.endereco, p.lat, p.lng, 'planejada', p.prazo, p.valor, now, now],
    })
  }

  // Rotas de teste ligadas às péricias reais
  const rota1Id = `rota-test-1-${userId}`
  const rota2Id = `rota-test-2-${userId}`

  await db.execute({
    sql: `INSERT OR IGNORE INTO "RotaPericia" ("id","peritoId","titulo","status","criadoEm","atualizadoEm") VALUES (?,?,?,?,?,?)`,
    args: [rota1Id, userId, 'Circuito Centro RJ — Péricias do dia', 'planejada', now, now],
  })
  await db.execute({
    sql: `INSERT OR IGNORE INTO "RotaPericia" ("id","peritoId","titulo","status","criadoEm","atualizadoEm") VALUES (?,?,?,?,?,?)`,
    args: [rota2Id, userId, 'Zona Sul RJ — Vistorias Residenciais', 'em_andamento', now, now],
  })

  // Checkpoints com periciaId
  const cps: [string, string, number, string, string, number, number, string][] = [
    [`${rota1Id}-cp1`, rota1Id, 1, `PRC-2025-001 — Avaliação de Imóvel para Partilha de Bens`, 'Rua São Clemente, 450, Botafogo — Rio de Janeiro, RJ', -22.9388, -43.1822, `p1-${userId}`],
    [`${rota1Id}-cp2`, rota1Id, 2, `PRC-2025-003 — Perícia Hidráulica — Vazamento`, 'Av. Rio Branco, 85, Centro — Rio de Janeiro, RJ', -22.9041, -43.1789, `p3-${userId}`],
    [`${rota1Id}-cp3`, rota1Id, 3, `PRC-2025-007 — Perícia Grafotécnica`, 'Rua Quinze de Novembro, 8, Centro — Niterói, RJ', -22.8998, -43.1769, `p7-${userId}`],
    [`${rota2Id}-cp1`, rota2Id, 1, `PRC-2025-002 — Vistoria de Vícios Construtivos`, 'Av. Atlântica, 2800, Copacabana — Rio de Janeiro, RJ', -22.9666, -43.1773, `p2-${userId}`],
    [`${rota2Id}-cp2`, rota2Id, 2, `PRC-2025-004 — Perícia Elétrica — Instalação`, 'Rua da Passagem, 120, Botafogo — Rio de Janeiro, RJ', -22.9452, -43.1872, `p4-${userId}`],
  ]

  for (const [id, rotaId, ordem, titulo, endereco, lat, lng, periciaId] of cps) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO "Checkpoint" ("id","rotaId","ordem","titulo","endereco","lat","lng","status","periciaId","criadoEm") VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [id, rotaId, ordem, titulo, endereco, lat, lng, 'pendente', periciaId, now],
    })
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔌 Conectando ao Turso...')
  await db.execute('SELECT 1')
  console.log('✅ Conexão OK\n')

  console.log('📋 Aplicando migrations...')
  for (const sql of MIGRATIONS) {
    const name = sql.trim().split('\n')[0].slice(0, 60)
    try {
      await db.execute(sql)
      console.log(`  ✓ ${name}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log(`  ~ ${name} (já existe)`)
      } else {
        console.error(`  ✗ ${name}: ${msg}`)
      }
    }
  }

  console.log('\n👤 Criando usuários demo...')
  const hash = await bcrypt.hash('senha123', 12)
  const hashMm = await bcrypt.hash('123456', 10)
  const now = new Date().toISOString()

  const users = [
    ['user-mm', 'mmbonassi@gmail.com', 'Marcus Martins Bonassi', hashMm, 'perito'],
    ['user-demo', 'perito@demo.com', 'Matheus Perito', hash, 'perito'],
    ['user-admin', 'admin@demo.com', 'Admin', hash, 'admin'],
    ['user-esc', 'escritorio@demo.perix.com.br', 'Carvalho & Menezes Advocacia', hash, 'parceiro'],
    ['user-seg', 'seguradora@demo.perix.com.br', 'Caixa Seguradora RJ', hash, 'parceiro'],
  ]

  for (const [id, email, name, pw, role] of users) {
    try {
      await db.execute({
        sql: `INSERT INTO "User" ("id","email","name","passwordHash","role","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)
              ON CONFLICT("email") DO UPDATE SET "passwordHash"=excluded."passwordHash"`,
        args: [id, email, name, pw, role, now, now],
      })
      console.log(`  ✓ ${email}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`  ✗ ${email}: ${msg}`)
    }
  }

  // Seed perfil + rotas para perito@demo.com
  await seed('user-demo')
  console.log('  ✓ Perfil + rotas de teste criados para perito@demo.com')

  console.log('\n🔑 Adicionando variáveis ao Vercel...')
  try {
    execSync(`echo "${DB_URL}" | npx vercel env add TURSO_DATABASE_URL production --force 2>&1`, { stdio: 'pipe' })
    console.log('  ✓ TURSO_DATABASE_URL')
  } catch { console.log('  ~ TURSO_DATABASE_URL (use: npx vercel env add TURSO_DATABASE_URL production)') }

  try {
    execSync(`echo "${DB_TOKEN}" | npx vercel env add TURSO_AUTH_TOKEN production --force 2>&1`, { stdio: 'pipe' })
    console.log('  ✓ TURSO_AUTH_TOKEN')
  } catch { console.log('  ~ TURSO_AUTH_TOKEN (use: npx vercel env add TURSO_AUTH_TOKEN production)') }

  console.log('\n🚀 Disparando redeploy...')
  try {
    execSync('npx vercel --prod --yes 2>&1', { stdio: 'inherit', timeout: 120000 })
    console.log('\n✅ Deploy concluído!')
  } catch {
    console.log('\n⚠️  Redeploy manual: npx vercel --prod --yes')
  }

  console.log('\n─────────────────────────────────────')
  console.log('Credenciais de acesso:')
  console.log('  perito@demo.com   — senha123')
  console.log('  mmbonassi@gmail.com — 123456')
  console.log('─────────────────────────────────────')
}

main().catch((e) => { console.error('❌', e.message); process.exit(1) }).finally(() => db.close())
