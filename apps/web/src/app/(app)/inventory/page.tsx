'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { apiFetch, ApiError, apiList } from '@/lib/api';
import { pruneEmpty } from '@/lib/forms';
import { useApiList } from '@/lib/use-api-list';
import { formatDateTime } from '@/lib/format';
import { label, movementTypeLabels, movementTypeOptions } from '@/lib/labels';
import type { InventoryMovement, Product, ProductBalance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/stat-card';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { PageHeader, Toolbar } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [productId, setProductId] = useState('');
  const { items, meta, loading, reload } = useApiList<InventoryMovement>('/inventory/movements', {
    page,
    pageSize: 20,
    productId: productId || undefined,
  });

  const [balances, setBalances] = useState<ProductBalance[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'PURCHASE', quantity: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  const loadBalances = useCallback(() => {
    apiFetch<ProductBalance[]>('/inventory/balance')
      .then((data) => setBalances(data ?? []))
      .catch(() => setBalances([]));
  }, []);

  useEffect(() => {
    loadBalances();
    apiList<Product>('/products?pageSize=100')
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));
  }, [loadBalances]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/inventory/movements', {
        method: 'POST',
        body: pruneEmpty({
          productId: form.productId,
          type: form.type,
          quantity: Number(form.quantity),
          reason: form.reason,
        }),
      });
      notify('Movimentação registrada.', 'success');
      setOpen(false);
      setForm({ productId: '', type: 'PURCHASE', quantity: '', reason: '' });
      reload();
      loadBalances();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao registrar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<InventoryMovement>[] = [
    { key: 'createdAt', header: 'Data', render: (m) => formatDateTime(m.createdAt) },
    { key: 'product', header: 'Produto', render: (m) => m.product?.name ?? m.productId },
    { key: 'type', header: 'Tipo', render: (m) => label(movementTypeLabels, m.type) },
    {
      key: 'quantity',
      header: 'Qtd',
      className: 'text-right',
      render: (m) => <span className="font-medium">{m.quantity}</span>,
    },
    { key: 'reason', header: 'Motivo', render: (m) => m.reason ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Saldo por produto e histórico de movimentações."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nova movimentação
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {balances.map((balance) => (
          <Card key={balance.productId}>
            <p className="text-xs text-foreground-muted">{balance.sku}</p>
            <p className="mt-1 text-sm text-foreground">{balance.name}</p>
            <p className="mt-2 text-2xl font-semibold text-brand">{balance.balance}</p>
          </Card>
        ))}
      </div>

      <Toolbar>
        <Select
          className="max-w-xs"
          value={productId}
          onChange={(e) => {
            setPage(1);
            setProductId(e.target.value);
          }}
        >
          <option value="">Todos os produtos</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.name}
            </option>
          ))}
        </Select>
      </Toolbar>

      <DataTable columns={columns} rows={items} loading={loading} />
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nova movimentação"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button form="movement-form" type="submit" disabled={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="movement-form" onSubmit={submit} className="space-y-4">
          <Field label="Produto">
            <Select
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {movementTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantidade" hint="ADJUSTMENT pode ser negativo para reduzir o saldo.">
            <Input
              type="number"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </Field>
          <Field label="Motivo">
            <Textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
