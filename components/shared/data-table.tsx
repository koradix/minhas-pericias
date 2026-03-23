import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type HideBreakpoint = 'sm' | 'md' | 'lg' | 'xl'

export interface DataTableColumn<T> {
  key: string
  label: string
  width?: string
  align?: 'left' | 'right' | 'center'
  hidden?: HideBreakpoint
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  keyField: keyof T
  onRowClick?: (row: T) => void
  emptyState?: ReactNode
  footer?: ReactNode
  className?: string
}

const hiddenClass: Record<HideBreakpoint, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

const alignClass = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyState,
  footer,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full table-fixed">

          {/* Header */}
          <thead>
            <tr className="border-b border-border bg-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500',
                    alignClass[col.align ?? 'left'],
                    col.hidden ? hiddenClass[col.hidden] : '',
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10">
                  {emptyState ?? (
                    <p className="text-center text-sm text-zinc-500">Nenhum resultado</p>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={String(row[keyField])}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    onRowClick
                      ? 'cursor-pointer hover:bg-muted'
                      : 'hover:bg-muted/60',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm text-zinc-300',
                        alignClass[col.align ?? 'left'],
                        col.hidden ? hiddenClass[col.hidden] : '',
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-border px-4 py-3 bg-card">
          {footer}
        </div>
      )}
    </div>
  )
}
