import { Card, StatCard } from '@/components/ui/stat-card';

const pipelineStages = [
  { label: 'Novo', count: 0 },
  { label: 'Contato realizado', count: 0 },
  { label: 'Interessado', count: 0 },
  { label: 'Negociação', count: 0 },
  { label: 'Aguardando', count: 0 },
  { label: 'Venda', count: 0 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Visão geral das operações comerciais da Lubdiesel.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Leads novos" value={0} />
        <StatCard label="Em negociação" value={0} />
        <StatCard label="Clientes" value={0} />
        <StatCard label="Revendedores" value={0} />
        <StatCard label="Vendas no mês" value={0} accent />
        <StatCard label="Receita no mês" value="R$ 0,00" accent />
        <StatCard label="Estoque 60 ml" value={0} hint="LUB-060" />
        <StatCard label="Estoque 1 L" value={0} hint="LUB-1000" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Pipeline</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {pipelineStages.map((stage) => (
              <div
                key={stage.label}
                className="rounded-lg border border-border bg-background-secondary p-3 text-center"
              >
                <p className="text-2xl font-semibold text-foreground">{stage.count}</p>
                <p className="mt-1 text-xs text-foreground-muted">{stage.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground">Follow-ups</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-foreground-muted">Hoje</span>
              <span className="font-medium text-foreground">0</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-foreground-muted">Atrasados</span>
              <span className="font-medium text-danger">0</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-foreground-muted">Próximos</span>
              <span className="font-medium text-foreground">0</span>
            </li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-foreground">Origem dos leads</h2>
          <p className="mt-4 text-sm text-foreground-muted">
            Gráfico disponível a partir da Entrega 4.
          </p>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-foreground">Vendas (últimos 30 dias)</h2>
          <p className="mt-4 text-sm text-foreground-muted">
            Série histórica disponível a partir da Entrega 4.
          </p>
        </Card>
      </section>
    </div>
  );
}
