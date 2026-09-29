'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { pruneEmpty } from '@/lib/forms';
import { useApiList } from '@/lib/use-api-list';
import { companyTypeLabels, companyTypeOptions, label } from '@/lib/labels';
import type { Company } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { PageHeader, Toolbar } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

const emptyForm = {
  name: '',
  legalName: '',
  document: '',
  type: 'OTHER',
  phone: '',
  whatsapp: '',
  email: '',
  city: '',
  state: '',
  notes: '',
};

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const { items, meta, loading, reload } = useApiList<Company>('/companies', {
    page,
    pageSize: 20,
    search: search || undefined,
    type: type || undefined,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setForm({
      name: company.name,
      legalName: company.legalName ?? '',
      document: company.document ?? '',
      type: company.type,
      phone: company.phone ?? '',
      whatsapp: company.whatsapp ?? '',
      email: company.email ?? '',
      city: company.city ?? '',
      state: company.state ?? '',
      notes: company.notes ?? '',
    });
    setOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = pruneEmpty(form);
      if (editing) {
        await apiFetch(`/companies/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/companies', { method: 'POST', body });
      }
      notify('Empresa salva com sucesso.', 'success');
      setOpen(false);
      reload();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function remove(company: Company) {
    if (!window.confirm(`Excluir a empresa "${company.name}"?`)) return;
    try {
      await apiFetch(`/companies/${company.id}`, { method: 'DELETE' });
      notify('Empresa excluída.', 'success');
      reload();
    } catch {
      notify('Erro ao excluir.', 'danger');
    }
  }

  const columns: Column<Company>[] = [
    { key: 'name', header: 'Nome', render: (c) => <span className="font-medium">{c.name}</span> },
    {
      key: 'type',
      header: 'Tipo',
      render: (c) => <Badge>{label(companyTypeLabels, c.type)}</Badge>,
    },
    { key: 'document', header: 'Documento', render: (c) => c.document ?? '—' },
    {
      key: 'location',
      header: 'Cidade/UF',
      render: (c) => [c.city, c.state].filter(Boolean).join(' / ') || '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEdit(c)}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => remove(c)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Oficinas, revendedores, distribuidoras e frotas."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nova empresa
          </Button>
        }
      />

      <Toolbar>
        <Input
          placeholder="Buscar por nome, documento, e-mail..."
          className="max-w-xs"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <Select
          className="max-w-[180px]"
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
        >
          <option value="">Todos os tipos</option>
          {companyTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Toolbar>

      <DataTable columns={columns} rows={items} loading={loading} onRowClick={openEdit} />
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar empresa' : 'Nova empresa'}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button form="company-form" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form id="company-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Razão social">
            <Input
              value={form.legalName}
              onChange={(e) => setForm({ ...form, legalName: e.target.value })}
            />
          </Field>
          <Field label="Documento (CNPJ)">
            <Input
              value={form.document}
              onChange={(e) => setForm({ ...form, document: e.target.value })}
            />
          </Field>
          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {companyTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Telefone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Cidade">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="UF">
            <Input
              maxLength={2}
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Observações">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
