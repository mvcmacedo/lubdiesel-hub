'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { apiFetch, ApiError, apiList } from '@/lib/api';
import { pruneEmpty } from '@/lib/forms';
import { useApiList } from '@/lib/use-api-list';
import { contactName, formatCurrency, formatDate } from '@/lib/format';
import {
  label,
  orderSourceLabels,
  orderSourceOptions,
  orderStatusLabels,
  orderStatusOptions,
  orderStatusTone,
} from '@/lib/labels';
import type { Contact, Order, Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Field, Input, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { PageHeader, Toolbar } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

interface ItemRow {
  productId: string;
  quantity: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { items, meta, loading, reload } = useApiList<Order>('/orders', {
    page,
    pageSize: 20,
    status: status || undefined,
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [header, setHeader] = useState({ contactId: '', source: 'DIRECT', discount: '' });
  const [rows, setRows] = useState<ItemRow[]>([{ productId: '', quantity: '1' }]);
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    apiList<Contact>('/contacts?pageSize=100')
      .then((res) => setContacts(res.data))
      .catch(() => setContacts([]));
    apiList<Product>('/products?pageSize=100&active=true')
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));
  }, []);

  function openCreate() {
    setHeader({ contactId: '', source: 'DIRECT', discount: '' });
    setRows([{ productId: '', quantity: '1' }]);
    setOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const validItems = rows
      .filter((row) => row.productId)
      .map((row) => ({ productId: row.productId, quantity: Number(row.quantity) }));
    if (validItems.length === 0) {
      notify('Adicione ao menos um item.', 'danger');
      return;
    }
    setSaving(true);
    try {
      const order = await apiFetch<Order>('/orders', {
        method: 'POST',
        body: pruneEmpty({
          contactId: header.contactId,
          source: header.source,
          discount: header.discount ? Number(header.discount) : undefined,
          items: validItems,
        }),
      });
      notify('Pedido criado.', 'success');
      setOpen(false);
      reload();
      router.push(`/orders/${order.id}`);
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Order>[] = [
    {
      key: 'customer',
      header: 'Cliente',
      render: (o) => o.company?.name ?? contactName(o.contact) ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <Badge tone={orderStatusTone(o.status)}>{label(orderStatusLabels, o.status)}</Badge>
      ),
    },
    { key: 'source', header: 'Origem', render: (o) => label(orderSourceLabels, o.source) },
    {
      key: 'total',
      header: 'Total',
      className: 'text-right',
      render: (o) => <span className="font-medium">{formatCurrency(o.total)}</span>,
    },
    { key: 'createdAt', header: 'Criado', render: (o) => formatDate(o.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Pedidos, itens e baixa de estoque."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo pedido
          </Button>
        }
      />

      <Toolbar>
        <Select
          className="max-w-[180px]"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">Todos os status</option>
          {orderStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        onRowClick={(o) => router.push(`/orders/${o.id}`)}
      />
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo pedido"
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button form="order-form" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Criar pedido'}
            </Button>
          </>
        }
      >
        <form id="order-form" onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Cliente (contato)">
              <Select
                value={header.contactId}
                onChange={(e) => setHeader({ ...header, contactId: e.target.value })}
              >
                <option value="">—</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {contactName(c)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Origem">
              <Select
                value={header.source}
                onChange={(e) => setHeader({ ...header, source: e.target.value })}
              >
                {orderSourceOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Desconto (R$)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={header.discount}
                onChange={(e) => setHeader({ ...header, discount: e.target.value })}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground-muted">Itens</p>
            {rows.map((row, index) => (
              <div key={index} className="flex gap-2">
                <Select
                  className="flex-1"
                  value={row.productId}
                  onChange={(e) => {
                    const next = [...rows];
                    next[index] = { ...row, productId: e.target.value };
                    setRows(next);
                  }}
                >
                  <option value="">Selecione o produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name} ({formatCurrency(p.salePrice)})
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min="1"
                  className="w-20"
                  value={row.quantity}
                  onChange={(e) => {
                    const next = [...rows];
                    next[index] = { ...row, quantity: e.target.value };
                    setRows(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRows(rows.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRows([...rows, { productId: '', quantity: '1' }])}
            >
              <Plus className="h-4 w-4" /> Adicionar item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
