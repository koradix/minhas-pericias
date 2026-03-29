/**
 * Runs `prisma db push` against Turso when TURSO_DATABASE_URL is available.
 * Called as part of the Vercel build so schema changes auto-apply on deploy.
 * No-op in local dev (DATABASE_URL=file:./dev.db).
 */
import { execSync } from 'child_process'

const tursoUrl   = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

if (tursoUrl && tursoToken) {
  const dbUrl = `${tursoUrl}?authToken=${tursoToken}`
  console.log('[setup-db] Pushing schema to Turso…')
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit',
    })
    console.log('[setup-db] Schema in sync ✓')
  } catch (err) {
    // Non-fatal — app can still start if most tables already exist
    console.error('[setup-db] Schema push warning:', err.message?.slice(0, 200))
  }
} else {
  console.log('[setup-db] Local dev — skipping Turso schema push')
}
