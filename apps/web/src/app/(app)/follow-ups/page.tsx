'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { apiFetch, ApiError, apiList } from '@/lib/api';
import { pruneEmpty } from '@/lib/forms';
import { useApiList } from '@/lib/use-api-list';
import { contactName, formatDateTime } from '@/lib/format';
import {
  FollowUpStatus,
  followUpStatusLabels,
  followUpStatusTone,
  followUpTypeLabels,
  followUpTypeOptions,
  label,
} from '@/lib/labels';
import type { Contact, FollowUp } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { PageHeader, Toolbar } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const scopes = [
  { value: '', label: 'Todos' },
  { value: 'today', label: 'Hoje' },
  { value: 'overdue', label: 'Atrasados' },
  { value: 'upcoming', label: 'Próximos' },
];

export default function FollowUpsPage() {
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState('');
  const { items, meta, loading, reload } = useApiList<FollowUp>('/follow-ups', {
    page,
    pageSize: 20,
    scope: scope || undefined,
  });

  const [summary, setSummary] = useState({ today: 0, overdue: 0, upcoming: 0 });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'CALL', scheduledAt: '', notes: '', contactId: '' });
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    apiFetch<{ today: number; overdue: number; upcoming: number }>('/follow-ups/summary')
      .then(setSummary)
      .catch(() => undefined);
    apiList<Contact>('/contacts?pageSize=100')
      .then((res) => setContacts(res.data))
      .catch(() => setContacts([]));
  }, [items]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/follow-ups', {
        method: 'POST',
        body: pruneEmpty({
          type: form.type,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          notes: form.notes,
          contactId: form.contactId,
        }),
      });
      notify('Follow-up agendado.', 'success');
      setOpen(false);
      setForm({ type: 'CALL', scheduledAt: '', notes: '', contactId: '' });
      reload();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function complete(followUp: FollowUp) {
    try {
      await apiFetch(`/follow-ups/${followUp.id}/complete`, { method: 'PATCH' });
      notify('Follow-up concluído.', 'success');
      reload();
    } catch {
      notify('Erro ao concluir.', 'danger');
    }
  }

  async function cancel(followUp: FollowUp) {
    try {
      await apiFetch(`/follow-ups/${followUp.id}/cancel`, { method: 'PATCH' });
      notify('Follow-up cancelado.', 'success');
      reload();
    } catch {
      notify('Erro ao cancelar.', 'danger');
    }
  }

  const columns: Column<FollowUp>[] = [
    { key: 'type', header: 'Tipo', render: (f) => label(followUpTypeLabels, f.type) },
    { key: 'scheduledAt', header: 'Agendado', render: (f) => formatDateTime(f.scheduledAt) },
    {
      key: 'related',
      header: 'Relacionado',
      render: (f) => (f.contact ? contactName(f.contact) : f.lead ? 'Lead' : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (f) => (
        <Badge tone={followUpStatusTone(f.status)}>{label(followUpStatusLabels, f.status)}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (f) =>
        f.status === FollowUpStatus.PENDING ? (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => complete(f)}>
              Concluir
            </Button>
            <Button variant="ghost" size="sm" onClick={() => cancel(f)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <span className="text-xs text-foreground-muted">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description="Agenda de follow-ups: hoje, atrasados e próximos."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo follow-up
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-foreground-muted">Hoje</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{summary.today}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-foreground-muted">Atrasados</p>
          <p className="mt-1 text-2xl font-semibold text-danger">{summary.overdue}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-foreground-muted">Próximos</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{summary.upcoming}</p>
        </div>
      </div>

      <Toolbar>
        {scopes.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setPage(1);
              setScope(s.value);
            }}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              scope === s.value
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border text-foreground-muted hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </Toolbar>

      <DataTable columns={columns} rows={items} loading={loading} />
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo follow-up"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button form="followup-page-form" type="submit" disabled={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="followup-page-form" onSubmit={submit} className="space-y-4">
          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {followUpTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contato (opcional)">
            <Select
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            >
              <option value="">—</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {contactName(c)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data e hora">
            <Input
              type="datetime-local"
              required
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
          </Field>
          <Field label="Observações">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
