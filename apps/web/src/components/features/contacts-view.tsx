'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { apiFetch, ApiError, apiList } from '@/lib/api';
import { pruneEmpty } from '@/lib/forms';
import { useApiList } from '@/lib/use-api-list';
import {
  contactTypeLabels,
  contactTypeOptions,
  label,
  leadSourceLabels,
  leadSourceOptions,
} from '@/lib/labels';
import { contactName } from '@/lib/format';
import type { Company, Contact } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { PageHeader, Toolbar } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  whatsapp: '',
  email: '',
  city: '',
  state: '',
  type: 'LEAD',
  source: '',
  companyId: '',
  notes: '',
};

interface ContactsViewProps {
  title: string;
  description: string;
  fixedType?: string;
}

export function ContactsView({ title, description, fixedType }: ContactsViewProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { items, meta, loading, reload } = useApiList<Contact>('/contacts', {
    page,
    pageSize: 20,
    search: search || undefined,
    type: fixedType ?? typeFilter ?? undefined,
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ ...emptyForm, type: fixedType ?? 'LEAD' });
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    apiList<Company>('/companies?pageSize=100')
      .then((res) => setCompanies(res.data))
      .catch(() => setCompanies([]));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, type: fixedType ?? 'LEAD' });
    setOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditing(contact);
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName ?? '',
      phone: contact.phone ?? '',
      whatsapp: contact.whatsapp ?? '',
      email: contact.email ?? '',
      city: contact.city ?? '',
      state: contact.state ?? '',
      type: contact.type,
      source: contact.source ?? '',
      companyId: contact.companyId ?? '',
      notes: contact.notes ?? '',
    });
    setOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = pruneEmpty(form);
      if (editing) {
        await apiFetch(`/contacts/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiFetch('/contacts', { method: 'POST', body });
      }
      notify('Contato salvo com sucesso.', 'success');
      setOpen(false);
      reload();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function remove(contact: Contact) {
    if (!window.confirm(`Excluir o contato "${contactName(contact)}"?`)) return;
    try {
      await apiFetch(`/contacts/${contact.id}`, { method: 'DELETE' });
      notify('Contato excluído.', 'success');
      reload();
    } catch {
      notify('Erro ao excluir.', 'danger');
    }
  }

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (c) => <span className="font-medium">{contactName(c)}</span>,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (c) => <Badge>{label(contactTypeLabels, c.type)}</Badge>,
    },
    { key: 'contact', header: 'Contato', render: (c) => c.whatsapp || c.phone || c.email || '—' },
    { key: 'source', header: 'Origem', render: (c) => label(leadSourceLabels, c.source) },
    { key: 'company', header: 'Empresa', render: (c) => c.company?.name ?? '—' },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.push(`/contacts/${c.id}`)}>
            Abrir
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
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
        title={title}
        description={description}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo contato
          </Button>
        }
      />

      <Toolbar>
        <Input
          placeholder="Buscar por nome, e-mail, telefone..."
          className="max-w-xs"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        {!fixedType ? (
          <Select
            className="max-w-[180px]"
            value={typeFilter}
            onChange={(e) => {
              setPage(1);
              setTypeFilter(e.target.value);
            }}
          >
            <option value="">Todos os tipos</option>
            {contactTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ) : null}
      </Toolbar>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        onRowClick={(c) => router.push(`/contacts/${c.id}`)}
      />
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar contato' : 'Novo contato'}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button form="contact-form" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form id="contact-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <Input
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </Field>
          <Field label="Sobrenome">
            <Input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
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
          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {contactTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Origem">
            <Select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              <option value="">—</option>
              {leadSourceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Empresa">
            <Select
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">—</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
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
