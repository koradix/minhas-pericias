/**
 * Applies schema migrations to Turso at build time via the HTTP API.
 * Uses only safe DDL (CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS).
 * Non-fatal — if something fails the deploy still proceeds.
 */

const tursoUrl   = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

if (!tursoUrl || !tursoToken) {
  console.log('[setup-db] Local dev — skipping Turso schema sync')
  process.exit(0)
}

const httpUrl = tursoUrl.replace('libsql://', 'https://')

async function exec(sql) {
  const res = await fetch(`${httpUrl}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tursoToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql } }] }),
  })
  const data = await res.json()
  const err = data?.results?.[0]?.error
  if (err && !err.message?.includes('already exists') && !err.message?.includes('duplicate column')) {
    console.warn(`[setup-db] SQL warning: ${err.message} — ${sql.slice(0, 80)}`)
  }
}

console.log('[setup-db] Syncing schema to Turso…')

try {
  // ── NomeacaoCitacao — colunas novas ──────────────────────────────────────
  await exec(`ALTER TABLE NomeacaoCitacao ADD COLUMN status TEXT NOT NULL DEFAULT 'pendente'`)
  await exec(`ALTER TABLE NomeacaoCitacao ADD COLUMN periciaId TEXT`)
  await exec(`ALTER TABLE NomeacaoCitacao ADD COLUMN tribunalVaraId TEXT`)

  // ── RadarConfig — colunas novas ──────────────────────────────────────────
  await exec(`ALTER TABLE RadarConfig ADD COLUMN tribunaisResolvidos TEXT NOT NULL DEFAULT '[]'`)
  await exec(`ALTER TABLE RadarConfig ADD COLUMN tribunaisIgnorados TEXT NOT NULL DEFAULT '[]'`)
  await exec(`ALTER TABLE RadarConfig ADD COLUMN monitoramentoExtId TEXT`)
  await exec(`ALTER TABLE RadarConfig ADD COLUMN saldoUltimaVerif REAL`)
  await exec(`ALTER TABLE RadarConfig ADD COLUMN lastMonitorSyncAt DATETIME`)
  await exec(`ALTER TABLE RadarConfig ADD COLUMN lastSearchSyncAt DATETIME`)
  await exec(`ALTER TABLE RadarConfig ADD COLUMN backfillCompletedAt DATETIME`)

  // ── Checkpoint — coluna periciaId ────────────────────────────────────────
  await exec(`ALTER TABLE Checkpoint ADD COLUMN periciaId TEXT`)
  await exec(`ALTER TABLE Checkpoint ADD COLUMN pericoId TEXT`)
  await exec(`ALTER TABLE Checkpoint ADD COLUMN tribunalSigla TEXT`)
  await exec(`ALTER TABLE Checkpoint ADD COLUMN varaNome TEXT`)
  await exec(`ALTER TABLE Checkpoint ADD COLUMN chegadaEm DATETIME`)

  // ── CheckpointMidia ──────────────────────────────────────────────────────
  await exec(`CREATE TABLE IF NOT EXISTS CheckpointMidia (
    id TEXT PRIMARY KEY NOT NULL,
    checkpointId TEXT NOT NULL,
    tipo TEXT NOT NULL,
    url TEXT,
    texto TEXT,
    descricao TEXT,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)

  // ── RotaPericia ──────────────────────────────────────────────────────────
  await exec(`CREATE TABLE IF NOT EXISTS RotaPericia (
    id TEXT PRIMARY KEY NOT NULL,
    peritoId TEXT NOT NULL,
    titulo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'em_andamento',
    pericoId TEXT,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)

  // ── Checkpoint (base table) ──────────────────────────────────────────────
  await exec(`CREATE TABLE IF NOT EXISTS Checkpoint (
    id TEXT PRIMARY KEY NOT NULL,
    rotaId TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    endereco TEXT,
    lat REAL,
    lng REAL,
    status TEXT NOT NULL DEFAULT 'pendente',
    chegadaEm DATETIME,
    periciaId TEXT,
    pericoId TEXT,
    tribunalSigla TEXT,
    varaNome TEXT,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)

  // ── VaraContato ──────────────────────────────────────────────────────────
  await exec(`CREATE TABLE IF NOT EXISTS VaraContato (
    id TEXT PRIMARY KEY NOT NULL,
    tribunalSigla TEXT NOT NULL,
    varaNome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    juizNome TEXT,
    secretarioNome TEXT,
    secretarioLinkedin TEXT,
    observacoes TEXT,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await exec(`CREATE UNIQUE INDEX IF NOT EXISTS VaraContato_unique ON VaraContato(tribunalSigla, varaNome)`)

  // ── ProcessoDocumento ────────────────────────────────────────────────────
  await exec(`CREATE TABLE IF NOT EXISTS ProcessoDocumento (
    id TEXT PRIMARY KEY NOT NULL,
    processoId TEXT NOT NULL,
    escavadorDocId INTEGER NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT,
    dataPublicacao DATETIME,
    urlPublica TEXT,
    paginas INTEGER,
    baixado INTEGER NOT NULL DEFAULT 0,
    blobUrl TEXT,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await exec(`CREATE UNIQUE INDEX IF NOT EXISTS ProcessoDocumento_unique ON ProcessoDocumento(processoId, escavadorDocId)`)

  // ── Nomeacao — colunas novas ─────────────────────────────────────────────
  await exec(`ALTER TABLE Nomeacao ADD COLUMN extractedData TEXT`)
  await exec(`ALTER TABLE Nomeacao ADD COLUMN processSummary TEXT`)
  await exec(`ALTER TABLE Nomeacao ADD COLUMN nomeArquivo TEXT`)
  await exec(`ALTER TABLE Nomeacao ADD COLUMN mimeType TEXT`)
  await exec(`ALTER TABLE Nomeacao ADD COLUMN tamanhoBytes INTEGER`)
  await exec(`ALTER TABLE Nomeacao ADD COLUMN periciaId TEXT`)

  // ── TribunalVara — colunas novas ─────────────────────────────────────────
  await exec(`ALTER TABLE TribunalVara ADD COLUMN enderecoTexto TEXT`)
  await exec(`ALTER TABLE TribunalVara ADD COLUMN latitude REAL`)
  await exec(`ALTER TABLE TribunalVara ADD COLUMN longitude REAL`)
  await exec(`ALTER TABLE TribunalVara ADD COLUMN sincronizadoEm DATETIME`)
  await exec(`ALTER TABLE TribunalVara ADD COLUMN totalNomeacoes INTEGER NOT NULL DEFAULT 0`)

  // ── PeritoPerfil — colunas novas ─────────────────────────────────────────
  await exec(`ALTER TABLE PeritoPerfil ADD COLUMN areaPrincipal TEXT`)
  await exec(`ALTER TABLE PeritoPerfil ADD COLUMN areasSecundarias TEXT NOT NULL DEFAULT '[]'`)
  await exec(`ALTER TABLE PeritoPerfil ADD COLUMN especialidades2 TEXT NOT NULL DEFAULT '[]'`)
  await exec(`ALTER TABLE PeritoPerfil ADD COLUMN keywords TEXT NOT NULL DEFAULT '[]'`)
  await exec(`ALTER TABLE PeritoPerfil ADD COLUMN perfilCompleto INTEGER NOT NULL DEFAULT 0`)
  await exec(`ALTER TABLE PeritoPerfil ADD COLUMN sincronizadoEm DATETIME`)
  await exec(`ALTER TABLE PeritoPerfil ADD COLUMN cpf TEXT`)
  await exec(`ALTER TABLE PeritoPerfil ADD COLUMN formacaoCustom TEXT`)

  // ── Pericia ───────────────────────────────────────────────────────────────
  await exec(`CREATE TABLE IF NOT EXISTS Pericia (
    id TEXT PRIMARY KEY NOT NULL,
    peritoId TEXT NOT NULL,
    numero TEXT NOT NULL,
    assunto TEXT NOT NULL,
    tipo TEXT NOT NULL,
    processo TEXT,
    vara TEXT,
    partes TEXT,
    endereco TEXT,
    latitude REAL,
    longitude REAL,
    status TEXT NOT NULL DEFAULT 'planejada',
    prazo TEXT,
    valorHonorarios REAL,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)

  // ── ProcessoIntake ────────────────────────────────────────────────────────
  await exec(`CREATE TABLE IF NOT EXISTS ProcessoIntake (
    id TEXT PRIMARY KEY NOT NULL,
    peritoId TEXT NOT NULL,
    nomeArquivo TEXT NOT NULL,
    tamanhoBytes INTEGER,
    mimeType TEXT,
    status TEXT NOT NULL DEFAULT 'upload_feito',
    dadosExtraidos TEXT,
    resumo TEXT,
    periciaId TEXT,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)

  // ── NomeacaoCitacao — colunas adicionais (fonte pode estar faltando) ──────
  await exec(`ALTER TABLE NomeacaoCitacao ADD COLUMN fonte TEXT NOT NULL DEFAULT 'escavador'`)

  console.log('[setup-db] Schema sync complete ✓')
} catch (err) {
  console.warn('[setup-db] Non-fatal error:', err?.message?.slice(0, 200))
}
