import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runDailySync } from '@/lib/actions/radar-sync'

// ─── Daily cron — FREE, monitored appearances ────────────────────────────────
// Schedule: 0 9 * * *  (daily at 9am UTC)
// Auth: CRON_SECRET header (set in Vercel env + vercel.json)

export async function GET(req: Request) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const peritos = await prisma.radarConfig.findMany({
    where: { monitoramentoExtId: { not: null } },
    select: { peritoId: true },
  })

  let totalNovas = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const { peritoId } of peritos) {
    try {
      const { novas } = await runDailySync(peritoId)
      if (novas === -1) totalSkipped++
      else totalNovas += novas
    } catch (err) {
      totalErrors++
      console.error(`[cron/radar-diario] Erro para ${peritoId}:`, err)
    }
  }

  console.log(`[cron/radar-diario] ${peritos.length} peritos | +${totalNovas} novas | ${totalSkipped} skip | ${totalErrors} err`)

  return NextResponse.json({
    ok: true,
    peritos: peritos.length,
    novas: totalNovas,
    skipped: totalSkipped,
    errors: totalErrors,
  })
}
