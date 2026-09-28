'use client';

import { useEffect, useState } from 'react';
import { Card, StatCard } from '@/components/ui/stat-card';
import { apiFetch } from '@/lib/api';

interface DashboardSummary {
  cards: {
    leadsNew: number;
    leadsNegotiation: number;
    customers: number;
    resellers: number;
    salesThisMonth: number;
    revenueThisMonth: number;
    stock60ml: number;
    stock1L: number;
  };
  pipeline: { status: string; count: number }[];
  followUps: { today: number; overdue: number; upcoming: number };
}

interface LeadSource {
  source: string;
  count: number;
}

const STAGE_LABELS: Record<string, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contato realizado',
  INTERESTED: 'Interessado',
  NEGOTIATION: 'Negociação',
  WAITING: 'Aguardando',
  WON: 'Venda',
};

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<DashboardSummary>('/dashboard/summary'),
      apiFetch<LeadSource[]>('/dashboard/lead-sources'),
    ])
      .then(([summaryData, sourcesData]) => {
        setSummary(summaryData);
        setSources(sourcesData);
      })
      .catch(() => setError('Não foi possível carregar os indicadores.'));
  }, []);

  const cards = summary?.cards;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Visão geral das operações comerciais da Lubdiesel.
        </p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Leads novos" value={cards?.leadsNew ?? '—'} />
        <StatCard label="Em negociação" value={cards?.leadsNegotiation ?? '—'} />
        <StatCard label="Clientes" value={cards?.customers ?? '—'} />
        <StatCard label="Revendedores" value={cards?.resellers ?? '—'} />
        <StatCard label="Vendas no mês" value={cards?.salesThisMonth ?? '—'} accent />
        <StatCard
          label="Receita no mês"
          value={cards ? brl.format(cards.revenueThisMonth) : '—'}
          accent
        />
        <StatCard label="Estoque 60 ml" value={cards?.stock60ml ?? '—'} hint="LUB-060" />
        <StatCard label="Estoque 1 L" value={cards?.stock1L ?? '—'} hint="LUB-1000" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Pipeline</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(summary?.pipeline ?? []).map((stage) => (
              <div
                key={stage.status}
                className="rounded-lg border border-border bg-background-secondary p-3 text-center"
              >
                <p className="text-2xl font-semibold text-foreground">{stage.count}</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {STAGE_LABELS[stage.status] ?? stage.status}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground">Follow-ups</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-foreground-muted">Hoje</span>
              <span className="font-medium text-foreground">{summary?.followUps.today ?? '—'}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-foreground-muted">Atrasados</span>
              <span className="font-medium text-danger">{summary?.followUps.overdue ?? '—'}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-foreground-muted">Próximos</span>
              <span className="font-medium text-foreground">
                {summary?.followUps.upcoming ?? '—'}
              </span>
            </li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-foreground">Origem dos leads</h2>
          {sources.length === 0 ? (
            <p className="mt-4 text-sm text-foreground-muted">Sem dados ainda.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {sources.map((item) => (
                <li key={item.source} className="flex items-center justify-between">
                  <span className="text-foreground-muted">{item.source}</span>
                  <span className="font-medium text-foreground">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-foreground">Vendas (últimos 30 dias)</h2>
          <p className="mt-4 text-sm text-foreground-muted">
            Série disponível em <code className="text-foreground">/dashboard/sales</code>.
          </p>
        </Card>
      </section>
    </div>
  );
}
