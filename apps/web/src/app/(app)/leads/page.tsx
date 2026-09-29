'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { apiFetch, ApiError, apiList } from '@/lib/api';
import { pruneEmpty } from '@/lib/forms';
import { useApiList } from '@/lib/use-api-list';
import { contactName, formatCurrency, formatDate } from '@/lib/format';
import {
  label,
  leadSourceLabels,
  leadSourceOptions,
  leadStatusLabels,
  leadStatusOptions,
  leadStatusTone,
} from '@/lib/labels';
import type { Contact, Lead } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Field, Input, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { PageHeader, Toolbar } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

export default function LeadsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const { items, meta, loading, reload } = useApiList<Lead>('/leads', {
    page,
    pageSize: 20,
    search: search || undefined,
    status: status || undefined,
    source: source || undefined,
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ contactId: '', source: 'WHATSAPP', estimatedValue: '' });
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    apiList<Contact>('/contacts?pageSize=100')
      .then((res) => setContacts(res.data))
      .catch(() => setContacts([]));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/leads', {
        method: 'POST',
        body: pruneEmpty({
          contactId: form.contactId,
          source: form.source,
          estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        }),
      });
      notify('Lead criado.', 'success');
      setOpen(false);
      setForm({ contactId: '', source: 'WHATSAPP', estimatedValue: '' });
      reload();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Lead>[] = [
    {
      key: 'contact',
      header: 'Contato',
      render: (l) => <span className="font-medium">{contactName(l.contact)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => (
        <Badge tone={leadStatusTone(l.status)}>{label(leadStatusLabels, l.status)}</Badge>
      ),
    },
    { key: 'source', header: 'Origem', render: (l) => label(leadSourceLabels, l.source) },
    { key: 'value', header: 'Valor', render: (l) => formatCurrency(l.estimatedValue) },
    { key: 'createdAt', header: 'Criado', render: (l) => formatDate(l.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Oportunidades comerciais, origem e estágio."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo lead
          </Button>
        }
      />

      <Toolbar>
        <Input
          placeholder="Buscar por contato..."
          className="max-w-xs"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <Select
          className="max-w-[170px]"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">Todos os status</option>
          {leadStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          className="max-w-[170px]"
          value={source}
          onChange={(e) => {
            setPage(1);
            setSource(e.target.value);
          }}
        >
          <option value="">Todas as origens</option>
          {leadSourceOptions.map((o) => (
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
        onRowClick={(l) => router.push(`/leads/${l.id}`)}
      />
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo lead"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button form="lead-create-form" type="submit" disabled={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="lead-create-form" onSubmit={submit} className="space-y-4">
          <Field label="Contato">
            <Select
              required
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {contactName(c)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Origem">
            <Select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              {leadSourceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Valor estimado (R$)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.estimatedValue}
              onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
