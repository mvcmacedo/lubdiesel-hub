import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>{children}</div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}

export function StatCard({ label, value, hint, accent }: StatCardProps) {
  return (
    <Card>
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className={cn('mt-2 text-3xl font-semibold', accent ? 'text-brand' : 'text-foreground')}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-foreground-muted">{hint}</p> : null}
    </Card>
  );
}
