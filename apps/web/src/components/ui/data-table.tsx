import type { PaginationMeta } from '@lubdiesel/shared';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string }>({
  columns,
  rows,
  loading,
  empty,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-background-secondary text-left text-xs uppercase tracking-wide text-foreground-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn('px-4 py-3 font-medium', column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-foreground-muted">
                Carregando...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-foreground-muted">
                {empty ?? 'Nenhum registro encontrado.'}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id ?? index}
                className={cn(
                  'bg-card',
                  onRowClick && 'cursor-pointer transition-colors hover:bg-background-secondary',
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 py-3 text-foreground', column.className)}
                  >
                    {column.render
                      ? column.render(row)
                      : String((row as Record<string, unknown>)[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta | null;
  onPage: (page: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) {
    return meta ? <p className="text-xs text-foreground-muted">{meta.total} registro(s)</p> : null;
  }

  return (
    <div className="flex items-center justify-between text-sm text-foreground-muted">
      <span className="text-xs">{meta.total} registro(s)</span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
        >
          Anterior
        </Button>
        <span className="px-1 text-xs">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
