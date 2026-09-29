'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { label, leadSourceLabels, lostReasonLabels } from '@/lib/labels';
import { Card } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';

interface Sale {
  date: string;
  total: number;
  count: number;
}

function BarList({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="mt-4 text-sm text-foreground-muted">Sem dados ainda.</p>;
  }
  return (
    <ul className="mt-4 space-y-2">
      {data.map((item) => (
        <li key={item.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-foreground-muted">{item.label}</span>
            <span className="text-foreground">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-background-secondary">
            <div
              className="h-2 rounded-full bg-brand"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ReportsPage() {
  const [sources, setSources] = useState<{ source: string; count: number }[]>([]);
  const [reasons, setReasons] = useState<{ reason: string; count: number }[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    apiFetch<{ source: string; count: number }[]>('/dashboard/lead-sources')
      .then((data) => setSources(data ?? []))
      .catch(() => setSources([]));
    apiFetch<{ reason: string; count: number }[]>('/dashboard/loss-reasons')
      .then((data) => setReasons(data ?? []))
      .catch(() => setReasons([]));
    apiFetch<Sale[]>('/dashboard/sales?days=30')
      .then((data) => setSales(data ?? []))
      .catch(() => setSales([]));
  }, []);

  const maxSale = Math.max(1, ...sales.map((s) => s.total));
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Indicadores comerciais e análises." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-foreground">Origem dos leads</h2>
          <BarList
            data={sources.map((s) => ({
              label: label(leadSourceLabels, s.source),
              value: s.count,
            }))}
          />
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-foreground">Motivos de perda</h2>
          <BarList
            data={reasons.map((r) => ({
              label: label(lostReasonLabels, r.reason),
              value: r.count,
            }))}
          />
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Vendas (últimos 30 dias)</h2>
          <span className="text-sm text-brand">{formatCurrency(totalRevenue)}</span>
        </div>
        {sales.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-muted">Sem vendas no período.</p>
        ) : (
          <div className="mt-4 flex h-40 items-end gap-1">
            {sales.map((sale) => (
              <div
                key={sale.date}
                title={`${sale.date}: ${formatCurrency(sale.total)}`}
                className="flex-1 rounded-t bg-brand/70 transition-colors hover:bg-brand"
                style={{ height: `${Math.max((sale.total / maxSale) * 100, 2)}%` }}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
