import https from 'https'

const DB_URL = process.env.TURSO_DATABASE_URL
const TOKEN = process.env.TURSO_AUTH_TOKEN

if (!DB_URL || !TOKEN) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN')
  process.exit(1)
}

const host = DB_URL.replace('libsql://', '')
const apiUrl = `https://${host}/v2/pipeline`

const statements = [
  `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "name" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'perito', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE TABLE IF NOT EXISTS "Parceiro" ("id" TEXT NOT NULL PRIMARY KEY, "nome" TEXT NOT NULL, "tipo" TEXT NOT NULL DEFAULT 'outro', "email" TEXT, "telefone" TEXT, "cidade" TEXT, "estado" TEXT, "observacoes" TEXT, "status" TEXT NOT NULL DEFAULT 'ativo', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "ModeloBase" ("id" TEXT NOT NULL PRIMARY KEY, "nome" TEXT NOT NULL, "tipo" TEXT NOT NULL, "descricao" TEXT, "area" TEXT, "nomeArquivo" TEXT, "caminhoArq" TEXT, "status" TEXT NOT NULL DEFAULT 'ativo', "totalUsos" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "DocumentoGerado" ("id" TEXT NOT NULL PRIMARY KEY, "tipo" TEXT NOT NULL, "titulo" TEXT NOT NULL, "periciaNum" TEXT, "modeloId" TEXT, "status" TEXT NOT NULL DEFAULT 'gerado', "conteudo" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "PeritoPerfil" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "cpf" TEXT, "telefone" TEXT, "formacao" TEXT, "formacaoCustom" TEXT, "registro" TEXT, "especialidades" TEXT NOT NULL DEFAULT '[]', "cursos" TEXT NOT NULL DEFAULT '[]', "tribunais" TEXT NOT NULL DEFAULT '[]', "estados" TEXT NOT NULL DEFAULT '[]', "cidade" TEXT, "estado" TEXT, "areaAtuacao" TEXT, "areaPrincipal" TEXT, "areasSecundarias" TEXT NOT NULL DEFAULT '[]', "especialidades2" TEXT NOT NULL DEFAULT '[]', "keywords" TEXT NOT NULL DEFAULT '[]', "perfilCompleto" BOOLEAN NOT NULL DEFAULT false, "sincronizadoEm" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PeritoPerfil_userId_key" ON "PeritoPerfil"("userId")`,
  `CREATE TABLE IF NOT EXISTS "TribunalVara" ("id" TEXT NOT NULL PRIMARY KEY, "peritoId" TEXT NOT NULL, "tribunalSigla" TEXT NOT NULL, "tribunalNome" TEXT NOT NULL, "varaNome" TEXT NOT NULL, "varaId" TEXT, "cidade" TEXT, "uf" TEXT, "ativa" BOOLEAN NOT NULL DEFAULT true, "totalNomeacoes" INTEGER NOT NULL DEFAULT 0, "enderecoTexto" TEXT, "latitude" REAL, "longitude" REAL, "sincronizadoEm" DATETIME, "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TribunalVara_peritoId_tribunalSigla_varaNome_key" ON "TribunalVara"("peritoId", "tribunalSigla", "varaNome")`,
  `CREATE TABLE IF NOT EXISTS "VaraStats" ("id" TEXT NOT NULL PRIMARY KEY, "tribunalSigla" TEXT NOT NULL, "varaNome" TEXT NOT NULL, "totalPeritosSugeridos" INTEGER NOT NULL DEFAULT 0, "totalNomeacoes" INTEGER NOT NULL DEFAULT 0, "atualizadoEm" DATETIME NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VaraStats_tribunalSigla_varaNome_key" ON "VaraStats"("tribunalSigla", "varaNome")`,
  `CREATE TABLE IF NOT EXISTS "DemandaParceiro" ("id" TEXT NOT NULL PRIMARY KEY, "titulo" TEXT NOT NULL, "descricao" TEXT, "tipo" TEXT NOT NULL, "cidade" TEXT NOT NULL, "uf" TEXT NOT NULL, "valor" REAL NOT NULL, "prazo" TEXT, "status" TEXT NOT NULL DEFAULT 'aberta', "userId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "Proposta" ("id" TEXT NOT NULL PRIMARY KEY, "demandaId" TEXT NOT NULL, "demandaTitulo" TEXT NOT NULL, "peritoId" TEXT NOT NULL, "peritoNome" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'enviada', "mensagem" TEXT, "valorProposto" REAL, "userId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "PericiaEnderecoOverride" ("id" TEXT NOT NULL PRIMARY KEY, "pericoId" TEXT NOT NULL, "userId" TEXT NOT NULL, "endereco" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PericiaEnderecoOverride_pericoId_userId_key" ON "PericiaEnderecoOverride"("pericoId", "userId")`,
  `CREATE TABLE IF NOT EXISTS "PericiaStatusOverride" ("id" TEXT NOT NULL PRIMARY KEY, "pericoId" TEXT NOT NULL, "userId" TEXT NOT NULL, "status" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PericiaStatusOverride_pericoId_userId_key" ON "PericiaStatusOverride"("pericoId", "userId")`,
  `CREATE TABLE IF NOT EXISTS "PropostaHonorarios" ("id" TEXT NOT NULL PRIMARY KEY, "pericoId" TEXT NOT NULL, "pericoNumero" TEXT NOT NULL, "pericoAssunto" TEXT NOT NULL, "pericoProcesso" TEXT NOT NULL, "pericoVara" TEXT NOT NULL, "pericoPartes" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'rascunho', "dataProposta" TEXT NOT NULL DEFAULT '', "peritoNome" TEXT NOT NULL DEFAULT '', "peritoQualificacao" TEXT NOT NULL DEFAULT '', "descricaoServicos" TEXT NOT NULL DEFAULT '', "valorHonorarios" REAL, "prazoEstimado" TEXT NOT NULL DEFAULT '', "observacoes" TEXT NOT NULL DEFAULT '', "custoDeslocamento" REAL, "horasTecnicas" REAL, "complexidadeNota" TEXT NOT NULL DEFAULT '', "userId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PropostaHonorarios_pericoId_userId_key" ON "PropostaHonorarios"("pericoId", "userId")`,
  `CREATE TABLE IF NOT EXISTS "RadarConfig" ("id" TEXT NOT NULL PRIMARY KEY, "peritoId" TEXT NOT NULL, "tribunaisMonitorados" TEXT NOT NULL, "tribunaisResolvidos" TEXT NOT NULL DEFAULT '[]', "tribunaisIgnorados" TEXT NOT NULL DEFAULT '[]', "monitoramentoExtId" TEXT, "ultimaBusca" DATETIME, "totalCitacoes" INTEGER NOT NULL DEFAULT 0, "saldoUltimaVerif" REAL, "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" DATETIME NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RadarConfig_peritoId_key" ON "RadarConfig"("peritoId")`,
  `CREATE TABLE IF NOT EXISTS "NomeacaoCitacao" ("id" TEXT NOT NULL PRIMARY KEY, "peritoId" TEXT NOT NULL, "externalId" TEXT NOT NULL, "diarioSigla" TEXT NOT NULL, "diarioNome" TEXT NOT NULL, "diarioData" DATETIME NOT NULL, "snippet" TEXT NOT NULL, "numeroProcesso" TEXT, "linkCitacao" TEXT NOT NULL, "visualizado" BOOLEAN NOT NULL DEFAULT false, "fonte" TEXT NOT NULL DEFAULT 'escavador', "tribunalVaraId" TEXT, "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "NomeacaoCitacao_peritoId_externalId_key" ON "NomeacaoCitacao"("peritoId", "externalId")`,
  `CREATE TABLE IF NOT EXISTS "RotaPericia" ("id" TEXT NOT NULL PRIMARY KEY, "peritoId" TEXT NOT NULL, "pericoId" TEXT, "titulo" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'em_andamento', "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" DATETIME NOT NULL)`,
  // Migration: add pericoId column to existing RotaPericia table (safe — ignored if column already exists)
  `ALTER TABLE "RotaPericia" ADD COLUMN "pericoId" TEXT`,
  `CREATE TABLE IF NOT EXISTS "Checkpoint" ("id" TEXT NOT NULL PRIMARY KEY, "rotaId" TEXT NOT NULL, "ordem" INTEGER NOT NULL, "titulo" TEXT NOT NULL, "endereco" TEXT, "lat" REAL, "lng" REAL, "status" TEXT NOT NULL DEFAULT 'pendente', "chegadaEm" DATETIME, "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "pericoId" TEXT, "tribunalSigla" TEXT, "varaNome" TEXT)`,
  // Migrations: add new columns to existing Checkpoint table (ignored if already exists)
  `ALTER TABLE "Checkpoint" ADD COLUMN "pericoId" TEXT`,
  `ALTER TABLE "Checkpoint" ADD COLUMN "tribunalSigla" TEXT`,
  `ALTER TABLE "Checkpoint" ADD COLUMN "varaNome" TEXT`,
  `CREATE TABLE IF NOT EXISTS "CheckpointMidia" ("id" TEXT NOT NULL PRIMARY KEY, "checkpointId" TEXT NOT NULL, "tipo" TEXT NOT NULL, "url" TEXT, "texto" TEXT, "descricao" TEXT, "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "VaraContato" ("id" TEXT NOT NULL PRIMARY KEY, "peritoId" TEXT NOT NULL, "tribunalSigla" TEXT NOT NULL, "varaNome" TEXT NOT NULL, "telefone" TEXT, "email" TEXT, "juizNome" TEXT, "secretarioNome" TEXT, "secretarioLinkedin" TEXT, "observacoes" TEXT, "updatedAt" DATETIME NOT NULL, "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VaraContato_peritoId_tribunalSigla_varaNome_key" ON "VaraContato"("peritoId", "tribunalSigla", "varaNome")`,
]

const requests = [
  ...statements.map(sql => ({ type: 'execute', stmt: { sql } })),
  { type: 'close' },
]

const body = JSON.stringify({ requests })

const options = {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}

const req = https.request(apiUrl, options, (res) => {
  let data = ''
  res.on('data', chunk => (data += chunk))
  res.on('end', () => {
    if (res.statusCode === 200) {
      const parsed = JSON.parse(data)
      // Ignore "duplicate column name" — ALTER TABLE on a fresh DB already has the column
      const errors = parsed.results?.filter(r =>
        r.type === 'error' &&
        !r.error?.message?.toLowerCase().includes('duplicate column name')
      )
      if (errors?.length) {
        console.error('Errors:', JSON.stringify(errors, null, 2))
        process.exit(1)
      } else {
        console.log(`SUCCESS: ${statements.length} statements applied to Turso`)
      }
    } else {
      console.error(`HTTP ${res.statusCode}:`, data)
      process.exit(1)
    }
  })
})

req.on('error', e => {
  console.error('Request error:', e)
  process.exit(1)
})
req.write(body)
req.end()
