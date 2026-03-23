import { prisma } from '@/lib/prisma'

/**
 * Returns a map of { pericoId → effectiveStatus } for all overrides of a user.
 * Use this to patch mock data without a DB model for péricias.
 */
export async function getStatusOverrides(userId: string): Promise<Record<string, string>> {
  const rows = await prisma.periciaStatusOverride.findMany({ where: { userId } })
  return Object.fromEntries(rows.map((r) => [r.pericoId, r.status]))
}
