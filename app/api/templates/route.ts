import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTemplates } from '@/lib/data/templates'
import type { TipoTemplate } from '@/lib/types/templates'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const tipo = searchParams.get('tipo') as TipoTemplate | null
  const isActiveParam = searchParams.get('isActive')

  const templates = await getTemplates({
    ...(tipo ? { tipo } : {}),
    ...(isActiveParam !== null ? { isActive: isActiveParam !== 'false' } : {}),
  })

  return NextResponse.json(templates)
}
