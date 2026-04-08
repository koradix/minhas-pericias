import { cn } from '@/lib/utils'

// ─── Status maps (domínio centralizado) ───────────────────────────────────────

type Variant = 'lime' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet'

interface StatusDef {
  label: string
  variant: Variant
}

const STATUS_MAP: Record<string, StatusDef> = {
  // Pericias
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
  lime:    'bg-[#a3e635] text-[#1f2937]',
  emerald: 'bg-emerald-100 text-emerald-900',
  amber:   'bg-amber-100   text-amber-900',
  rose:    'bg-red-100     text-red-900',
  slate:   'bg-slate-100   text-slate-900',
  violet:  'bg-violet-100  text-violet-900',
}

// ─── Dot indicator ─────────────────────────────────────────────────────────────

const dotClass: Record<Variant, string> = {
  lime:    'bg-[#a3e635]',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-red-500',
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
      <span className={cn('inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500', className)}>
        <span className={cn('h-2 w-2 rounded-none flex-shrink-0', dotClass[variant])} />
        {displayLabel}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-none px-2 py-1 text-[10px] font-black uppercase tracking-widest',
        variantClass[variant],
        className,
      )}
    >
      {displayLabel}
    </span>
  )
}
