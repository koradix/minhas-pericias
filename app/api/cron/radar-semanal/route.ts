import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runInitialBackfill, runWeeklySync } from '@/lib/actions/radar-sync'

// ─── Weekly cron — PAID, name search + initial backfill ──────────────────────
// Schedule: 0 10 * * 1  (every Monday at 10am UTC)
// Auth: CRON_SECRET header

export async function GET(req: Request) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const peritos = await prisma.radarConfig.findMany({
    select: { peritoId: true, backfillCompletedAt: true },
  })

  let totalNovas = 0
  let totalBackfill = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const { peritoId, backfillCompletedAt } of peritos) {
    try {
      if (!backfillCompletedAt) {
        // First-time backfill takes priority over weekly sync
        await runInitialBackfill(peritoId)
        totalBackfill++
      } else {
        const { novas } = await runWeeklySync(peritoId)
        if (novas === -1) totalSkipped++
        else totalNovas += novas
      }
    } catch (err) {
      totalErrors++
      console.error(`[cron/radar-semanal] Erro para ${peritoId}:`, err)
    }
  }

  console.log(`[cron/radar-semanal] ${peritos.length} peritos | backfill: ${totalBackfill} | +${totalNovas} novas | ${totalSkipped} skip | ${totalErrors} err`)

  return NextResponse.json({
    ok: true,
    peritos: peritos.length,
    backfill: totalBackfill,
    novas: totalNovas,
    skipped: totalSkipped,
    errors: totalErrors,
  })
}
