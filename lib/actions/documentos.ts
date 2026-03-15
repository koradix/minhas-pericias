'use server'

import { prisma } from '@/lib/prisma'
import { pericias } from '@/lib/mocks/pericias'
import { modelos } from '@/lib/mocks/documentos'
import type { TipoDocumento } from '@/lib/types/documentos'
import { gerarDocumentoIA } from '@/lib/ai/gerar-documento'

export async function gerarDocumento(
  modeloId: string,
  tipo: TipoDocumento,
  periciaNum: string,
  instrucao?: string,
): Promise<string> {
  const pericia = pericias.find((p) => p.numero === periciaNum)
  if (!pericia) throw new Error('Perícia não encontrada')

  const modelo = modelos.find((m) => m.id === modeloId)

  const conteudo = await gerarDocumentoIA({
    tipo,
    nomeModelo: modelo?.nome ?? tipo,
    pericia,
    instrucao,
  })

  let titulo: string
  switch (tipo) {
    case 'PROPOSTA_HONORARIOS':
      titulo = `Proposta de Honorários — ${periciaNum}`
      break
    case 'LAUDO':
      titulo = `${modelo?.nome ?? 'Laudo'} — ${periciaNum}`
      break
    case 'PARECER_TECNICO':
      titulo = `Parecer Técnico — ${periciaNum}`
      break
    case 'RESPOSTA_QUESITOS':
      titulo = `Resposta a Quesitos — ${periciaNum}`
      break
    default:
      titulo = `Documento — ${periciaNum}`
  }

  const doc = await prisma.documentoGerado.create({
    data: {
      tipo,
      titulo,
      periciaNum,
      modeloId,
      conteudo,
    },
  })

  return doc.id
}

export async function atualizarStatusDocumento(id: string, status: string) {
  await prisma.documentoGerado.update({
    where: { id },
    data: { status },
  })
}
