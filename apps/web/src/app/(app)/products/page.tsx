'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { useApiList } from '@/lib/use-api-list';
import { formatCurrency } from '@/lib/format';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Field, Input, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { PageHeader, Toolbar } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

const emptyForm = {
  sku: '',
  name: '',
  description: '',
  volumeMl: '',
  costPrice: '',
  salePrice: '',
  active: true,
};

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { items, meta, loading, reload } = useApiList<Product>('/products', {
    page,
    pageSize: 20,
    search: search || undefined,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description ?? '',
      volumeMl: String(product.volumeMl),
      costPrice: String(product.costPrice),
      salePrice: String(product.salePrice),
      active: product.active,
    });
    setOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = {
        sku: form.sku,
        name: form.name,
        description: form.description || undefined,
        volumeMl: Number(form.volumeMl),
        costPrice: Number(form.costPrice),
        salePrice: Number(form.salePrice),
        active: form.active,
      };
      if (editing) {
        await apiFetch(`/products/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/products', { method: 'POST', body });
      }
      notify('Produto salvo.', 'success');
      setOpen(false);
      reload();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    try {
      await apiFetch(`/products/${product.id}`, {
        method: 'PATCH',
        body: { active: !product.active },
      });
      reload();
    } catch {
      notify('Erro ao atualizar.', 'danger');
    }
  }

  const columns: Column<Product>[] = [
    {
      key: 'sku',
      header: 'SKU',
      render: (p) => <span className="font-mono text-xs">{p.sku}</span>,
    },
    {
      key: 'name',
      header: 'Produto',
      render: (p) => <span className="font-medium">{p.name}</span>,
    },
    { key: 'volume', header: 'Volume', render: (p) => `${p.volumeMl} ml` },
    { key: 'cost', header: 'Custo', render: (p) => formatCurrency(p.costPrice) },
    { key: 'sale', header: 'Venda', render: (p) => formatCurrency(p.salePrice) },
    {
      key: 'active',
      header: 'Status',
      render: (p) =>
        p.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="danger">Inativo</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleActive(p)}>
            {p.active ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos e SKUs."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        }
      />

      <Toolbar>
        <Input
          placeholder="Buscar por SKU ou nome..."
          className="max-w-xs"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </Toolbar>

      <DataTable columns={columns} rows={items} loading={loading} onRowClick={openEdit} />
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar produto' : 'Novo produto'}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button form="product-form" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form id="product-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="SKU">
            <Input
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </Field>
          <Field label="Nome">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Volume (ml)">
            <Input
              type="number"
              min="1"
              required
              value={form.volumeMl}
              onChange={(e) => setForm({ ...form, volumeMl: e.target.value })}
            />
          </Field>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Ativo
            </label>
          </div>
          <Field label="Preço de custo (R$)">
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
          </Field>
          <Field label="Preço de venda (R$)">
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descrição">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
