import { cn } from '@/lib/utils'

// ─── Status maps (domínio centralizado) ───────────────────────────────────────

type Variant = 'lime' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet'

interface StatusDef {
  label: string
  variant: Variant
}

const STATUS_MAP: Record<string, StatusDef> = {
  // Péricias
  em_andamento:   { label: 'Em andamento',    variant: 'amber'   },
  aguardando:     { label: 'Aguardando',       variant: 'slate'   },
  concluida:      { label: 'Concluída',        variant: 'emerald' },
  cancelada:      { label: 'Cancelada',        variant: 'rose'    },

  // Demandas (perito)
  disponivel:     { label: 'Disponível',       variant: 'lime'    },
  aceita:         { label: 'Aceita',           variant: 'emerald' },
  expirada:       { label: 'Expirada',         variant: 'rose'    },

  // Demandas (parceiro)
  aberta:         { label: 'Aberta',           variant: 'lime'    },
  em_andamento_d: { label: 'Em andamento',     variant: 'amber'   }, // alias interno

  // Propostas
  enviada:        { label: 'Enviada',          variant: 'slate'   },
  visualizada:    { label: 'Visualizada',      variant: 'amber'   },
  recusada:       { label: 'Recusada',         variant: 'rose'    },
  em_negociacao:  { label: 'Em negociação',    variant: 'violet'  },

  // Rotas
  planejada:      { label: 'Planejada',        variant: 'slate'   },
  em_execucao:    { label: 'Em execução',      variant: 'amber'   },

  // Parceiros
  ativo:          { label: 'Ativo',            variant: 'emerald' },
  inativo:        { label: 'Inativo',          variant: 'rose'    },

  // Prioridade
  alta:           { label: 'Alta',             variant: 'lime'    },
  media:          { label: 'Média',            variant: 'amber'   },
  baixa:          { label: 'Baixa',            variant: 'slate'   },
}

const variantClass: Record<Variant, string> = {
  lime:    'bg-lime-50    text-lime-700    ring-lime-600/15',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  amber:   'bg-amber-50   text-amber-700   ring-amber-600/15',
  rose:    'bg-rose-50    text-rose-700    ring-rose-600/15',
  slate:   'bg-slate-100  text-slate-600   ring-slate-500/15',
  violet:  'bg-violet-50  text-violet-700  ring-violet-600/15',
}

// ─── Dot indicator ─────────────────────────────────────────────────────────────

const dotClass: Record<Variant, string> = {
  lime:    'bg-lime-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  slate:   'bg-slate-400',
  violet:  'bg-violet-500',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BadgeStatusProps {
  status: string
  label?: string         // override do label automático
  dot?: boolean          // mostrar dot colorido ao invés de fundo
  className?: string
}

export function BadgeStatus({ status, label, dot = false, className }: BadgeStatusProps) {
  const def = STATUS_MAP[status] ?? { label: status, variant: 'slate' as Variant }
  const displayLabel = label ?? def.label
  const variant = def.variant

  if (dot) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs text-slate-600', className)}>
        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotClass[variant])} />
        {displayLabel}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantClass[variant],
        className,
      )}
    >
      {displayLabel}
    </span>
  )
}
