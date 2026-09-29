'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { apiFetch, ApiError, apiList } from '@/lib/api';
import { contactName, formatCurrency, formatDateTime } from '@/lib/format';
import {
  label,
  orderSourceLabels,
  orderStatusLabels,
  orderStatusOptions,
  orderStatusTone,
} from '@/lib/labels';
import type { Order, OrderItem, Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/stat-card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Field, Input, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { BackButton, PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

const EDITABLE = new Set(['DRAFT', 'PENDING']);

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ productId: '', quantity: '1' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Order>(`/orders/${params.id}`);
      setOrder(data);
      setStatus(data.status);
    } catch {
      notify('Não foi possível carregar o pedido.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [params.id, notify]);

  useEffect(() => {
    void load();
    apiList<Product>('/products?pageSize=100&active=true')
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));
  }, [load]);

  async function applyStatus() {
    try {
      await apiFetch(`/orders/${params.id}/status`, { method: 'PATCH', body: { status } });
      notify('Status atualizado.', 'success');
      await load();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao atualizar.', 'danger');
    }
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/orders/${params.id}/items`, {
        method: 'POST',
        body: { productId: itemForm.productId, quantity: Number(itemForm.quantity) },
      });
      notify('Item adicionado.', 'success');
      setAddOpen(false);
      setItemForm({ productId: '', quantity: '1' });
      await load();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao adicionar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item: OrderItem) {
    try {
      await apiFetch(`/orders/${params.id}/items/${item.id}`, { method: 'DELETE' });
      notify('Item removido.', 'success');
      await load();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao remover.', 'danger');
    }
  }

  if (loading) return <p className="text-sm text-foreground-muted">Carregando...</p>;
  if (!order) return <p className="text-sm text-danger">Pedido não encontrado.</p>;

  const editable = EDITABLE.has(order.status);

  const columns: Column<OrderItem>[] = [
    { key: 'product', header: 'Produto', render: (i) => i.product?.name ?? i.productId },
    { key: 'quantity', header: 'Qtd', render: (i) => i.quantity },
    { key: 'unitPrice', header: 'Unit.', render: (i) => formatCurrency(i.unitPrice) },
    {
      key: 'subtotal',
      header: 'Subtotal',
      className: 'text-right',
      render: (i) => formatCurrency(i.subtotal),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (i) =>
        editable ? (
          <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <BackButton onClick={() => router.push('/orders')} />

      <PageHeader
        title={`Pedido · ${order.company?.name ?? contactName(order.contact) ?? 'Sem cliente'}`}
        description={`${label(orderSourceLabels, order.source)} · ${formatDateTime(order.createdAt)}`}
        action={
          <Badge tone={orderStatusTone(order.status)}>
            {label(orderStatusLabels, order.status)}
          </Badge>
        }
      />

      <div className="flex flex-wrap items-end gap-2">
        <Field label="Alterar status">
          <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            {orderStatusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Button onClick={applyStatus} disabled={status === order.status}>
          Aplicar
        </Button>
        {editable ? (
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        ) : null}
      </div>

      <DataTable columns={columns} rows={order.items} empty="Sem itens." />

      <Card className="ml-auto max-w-xs">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">Subtotal</span>
          <span className="text-foreground">{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-foreground-muted">Desconto</span>
          <span className="text-foreground">- {formatCurrency(order.discount)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-brand">{formatCurrency(order.total)}</span>
        </div>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Adicionar item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button form="add-item-form" type="submit" disabled={saving}>
              Adicionar
            </Button>
          </>
        }
      >
        <form id="add-item-form" onSubmit={addItem} className="space-y-4">
          <Field label="Produto">
            <Select
              required
              value={itemForm.productId}
              onChange={(e) => setItemForm({ ...itemForm, productId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} ({formatCurrency(p.salePrice)})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantidade">
            <Input
              type="number"
              min="1"
              required
              value={itemForm.quantity}
              onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
