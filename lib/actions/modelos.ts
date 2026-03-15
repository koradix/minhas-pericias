'use server'

import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export type ModeloActionState = {
  errors?: { nome?: string[]; tipo?: string[] }
  message?: string
}

export async function criarModelo(
  _prevState: ModeloActionState,
  formData: FormData,
): Promise<ModeloActionState> {
  const nome = (formData.get('nome') as string | null)?.trim() ?? ''
  const tipo = (formData.get('tipo') as string | null)?.trim() ?? ''
  const descricao = (formData.get('descricao') as string | null)?.trim() || null
  const area = (formData.get('area') as string | null)?.trim() || null
  const arquivo = formData.get('arquivo') as File | null

  const errors: ModeloActionState['errors'] = {}
  if (!nome) errors.nome = ['Nome é obrigatório']
  if (!tipo) errors.tipo = ['Tipo é obrigatório']
  if (Object.keys(errors).length > 0) return { errors }

  let nomeArquivo: string | null = null
  let caminhoArq: string | null = null

  if (arquivo && arquivo.size > 0) {
    const buffer = Buffer.from(await arquivo.arrayBuffer())
    const safeFilename = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${Date.now()}-${safeFilename}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'modelos')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)
    nomeArquivo = arquivo.name
    caminhoArq = `/uploads/modelos/${filename}`
  }

  await prisma.modeloBase.create({
    data: { nome, tipo, descricao, area, nomeArquivo, caminhoArq },
  })

  redirect('/documentos/modelos')
}
