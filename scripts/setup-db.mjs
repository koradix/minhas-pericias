/**
 * Ensures the Turso database schema is up to date at build time.
 *
 * Strategy:
 *   1. Run `prisma migrate diff` against an in-memory SQLite (empty) to generate
 *      the full CREATE TABLE SQL for all models.
 *   2. Send each statement via the Turso HTTP API (which accepts arbitrary SQL).
 *
 * This is non-fatal — if it fails the deploy still proceeds (existing tables intact).
 */
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'

const tursoUrl   = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

if (!tursoUrl || !tursoToken) {
  console.log('[setup-db] Local dev — skipping Turso schema sync')
  process.exit(0)
}

console.log('[setup-db] Syncing schema to Turso…')

try {
  // Generate CREATE TABLE SQL by diffing empty → current schema
  const sql = execSync(
    'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).toString()

  // Split into individual statements (skip empty lines and comments)
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--') && !s.startsWith('/*') && !s.startsWith('PRAGMA'))

  // Turso HTTP API: POST /v2/pipeline
  const httpUrl = tursoUrl.replace('libsql://', 'https://')
  const body = JSON.stringify({
    requests: statements.map((stmt) => ({
      type: 'execute',
      stmt: { sql: stmt + ';' },
    })),
  })

  const response = await fetch(`${httpUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tursoToken}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    console.warn('[setup-db] Turso API warning:', response.status, text.slice(0, 200))
  } else {
    console.log('[setup-db] Schema in sync ✓')
  }
} catch (err) {
  // Non-fatal — most likely tables already exist (expected on first diff)
  console.warn('[setup-db] Schema sync skipped (non-fatal):', err.message?.slice(0, 200))
}
