
import { cn } from '@/lib/utils'

// ─── Status maps (Centralized Digital Atelier) ────────────────────────────────

type Variant = 'lime' | 'success' | 'amber' | 'rose' | 'slate' | 'black'

interface StatusDef {
  label: string
  variant: Variant
}

const STATUS_MAP: Record<string, StatusDef> = {
  // Pericias
  em_andamento:   { label: 'Em andamento',    variant: 'amber'   },
  aguardando:     { label: 'Aguardando',       variant: 'slate'   },
  concluida:      { label: 'Concluída',        variant: 'success' },
  cancelada:      { label: 'Cancelada',        variant: 'rose'    },

  // Demandas (perito)
  disponivel:     { label: 'Disponível',       variant: 'lime'    },
  aceita:         { label: 'Aceita',           variant: 'success' },
  expirada:       { label: 'Expirada',         variant: 'rose'    },

  // Demandas (parceiro)
  aberta:         { label: 'Aberta',           variant: 'lime'    },
  em_andamento_d: { label: 'Em andamento',     variant: 'amber'   },

  // Propostas
  enviada:        { label: 'Enviada',          variant: 'slate'   },
  visualizada:    { label: 'Visualizada',      variant: 'amber'   },
  recusada:       { label: 'Recusada',         variant: 'rose'    },
  em_negociacao:  { label: 'Em negociação',    variant: 'black'   }, // Changed from violet

  // Rotas
  planejada:      { label: 'Planejada',        variant: 'slate'   },
  em_execucao:    { label: 'Em execução',      variant: 'amber'   },

  // Parceiros
  ativo:          { label: 'Ativo',            variant: 'success' },
  inativo:        { label: 'Inativo',          variant: 'rose'    },

  // Prioridade
  alta:           { label: 'Alta',             variant: 'lime'    },
  media:          { label: 'Média',            variant: 'amber'   },
  baixa:          { label: 'Baixa',            variant: 'slate'   },
}

const variantClass: Record<Variant, string> = {
  lime:    'bg-[#a3e635] text-slate-900',
  success: 'bg-[#a3e635]/10 text-[#4d7c0f]',
  amber:   'bg-amber-100 text-amber-950',
  rose:    'bg-red-50 text-red-900',
  slate:   'bg-slate-100 text-slate-500',
  black:   'bg-slate-900 text-white',
}

// ─── Dot indicator ─────────────────────────────────────────────────────────────

const dotClass: Record<Variant, string> = {
  lime:    'bg-[#a3e635]',
  success: 'bg-[#a3e635]',
  amber:   'bg-amber-500',
  rose:    'bg-red-500',
  slate:   'bg-slate-400',
  black:   'bg-slate-900',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BadgeStatusProps {
  status: string
  label?: string
  dot?: boolean
  className?: string
}

export function BadgeStatus({ status, label, dot = false, className }: BadgeStatusProps) {
  const def = STATUS_MAP[status] ?? { label: status, variant: 'slate' as Variant }
  const displayLabel = label ?? def.label
  const variant = def.variant

  if (dot) {
    return (
      <span className={cn('inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500', className)}>
        <span className={cn('h-1.5 w-1.5 rounded-none flex-shrink-0', dotClass[variant])} />
        {displayLabel}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest',
        variantClass[variant],
        className,
      )}
    >
      {displayLabel}
    </span>
  )
}
