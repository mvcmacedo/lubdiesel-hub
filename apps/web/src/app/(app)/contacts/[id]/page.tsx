'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { pruneEmpty } from '@/lib/forms';
import { contactName, formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import {
  contactTypeLabels,
  followUpStatusLabels,
  followUpStatusTone,
  followUpTypeLabels,
  followUpTypeOptions,
  interactionTypeLabels,
  label,
  leadSourceLabels,
  leadSourceOptions,
  leadStatusLabels,
  leadStatusTone,
} from '@/lib/labels';
import type { Contact, FollowUp, Interaction, Lead, Order } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/stat-card';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { BackButton, PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

type ContactHistory = Contact & {
  leads: Lead[];
  interactions: Interaction[];
  followUps: FollowUp[];
  orders: Order[];
};

type Action = 'interaction' | 'followup' | 'lead' | null;

const interactionTypeEntries = Object.entries(interactionTypeLabels);

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();

  const [contact, setContact] = useState<ContactHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action>(null);
  const [saving, setSaving] = useState(false);

  const [interactionForm, setInteractionForm] = useState({ type: 'WHATSAPP', description: '' });
  const [followupForm, setFollowupForm] = useState({ type: 'CALL', scheduledAt: '', notes: '' });
  const [leadForm, setLeadForm] = useState({ source: 'WHATSAPP', estimatedValue: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ContactHistory>(`/contacts/${params.id}/history`);
      setContact(data);
    } catch {
      notify('Não foi possível carregar o contato.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [params.id, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitInteraction(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/interactions', {
        method: 'POST',
        body: { contactId: params.id, ...interactionForm },
      });
      notify('Interação registrada.', 'success');
      setAction(null);
      setInteractionForm({ type: 'WHATSAPP', description: '' });
      await load();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function submitFollowup(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/follow-ups', {
        method: 'POST',
        body: pruneEmpty({
          contactId: params.id,
          type: followupForm.type,
          scheduledAt: new Date(followupForm.scheduledAt).toISOString(),
          notes: followupForm.notes,
        }),
      });
      notify('Follow-up agendado.', 'success');
      setAction(null);
      setFollowupForm({ type: 'CALL', scheduledAt: '', notes: '' });
      await load();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function submitLead(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/leads', {
        method: 'POST',
        body: pruneEmpty({
          contactId: params.id,
          source: leadForm.source,
          estimatedValue: leadForm.estimatedValue ? Number(leadForm.estimatedValue) : undefined,
        }),
      });
      notify('Lead criado.', 'success');
      setAction(null);
      setLeadForm({ source: 'WHATSAPP', estimatedValue: '' });
      await load();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-foreground-muted">Carregando...</p>;
  }
  if (!contact) {
    return <p className="text-sm text-danger">Contato não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <BackButton onClick={() => router.push('/contacts')} />

      <PageHeader
        title={contactName(contact)}
        description={[contact.email, contact.whatsapp || contact.phone].filter(Boolean).join(' · ')}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setAction('interaction')}>
              Interação
            </Button>
            <Button variant="secondary" onClick={() => setAction('followup')}>
              Follow-up
            </Button>
            <Button onClick={() => setAction('lead')}>Novo lead</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge>{label(contactTypeLabels, contact.type)}</Badge>
        {contact.source ? (
          <Badge tone="brand">{label(leadSourceLabels, contact.source)}</Badge>
        ) : null}
        {contact.company ? (
          <span className="text-foreground-muted">{contact.company.name}</span>
        ) : null}
        {contact.city ? (
          <span className="text-foreground-muted">
            {[contact.city, contact.state].filter(Boolean).join('/')}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-foreground">Leads</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {contact.leads.length === 0 ? (
              <li className="text-foreground-muted">Nenhum lead.</li>
            ) : (
              contact.leads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between">
                  <button
                    className="text-left text-foreground hover:text-brand"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    {label(leadSourceLabels, lead.source)} · {formatCurrency(lead.estimatedValue)}
                  </button>
                  <Badge tone={leadStatusTone(lead.status)}>
                    {label(leadStatusLabels, lead.status)}
                  </Badge>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground">Follow-ups</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {contact.followUps.length === 0 ? (
              <li className="text-foreground-muted">Nenhum follow-up.</li>
            ) : (
              contact.followUps.map((f) => (
                <li key={f.id} className="flex items-center justify-between">
                  <span className="text-foreground">
                    {label(followUpTypeLabels, f.type)} · {formatDateTime(f.scheduledAt)}
                  </span>
                  <Badge tone={followUpStatusTone(f.status)}>
                    {label(followUpStatusLabels, f.status)}
                  </Badge>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-foreground">Timeline de interações</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {contact.interactions.length === 0 ? (
            <li className="text-foreground-muted">Nenhuma interação registrada.</li>
          ) : (
            contact.interactions.map((interaction) => (
              <li key={interaction.id} className="border-l-2 border-border pl-3">
                <div className="flex items-center gap-2">
                  <Badge tone="brand">{label(interactionTypeLabels, interaction.type)}</Badge>
                  <span className="text-xs text-foreground-muted">
                    {formatDateTime(interaction.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-foreground">{interaction.description}</p>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-foreground">Pedidos</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {contact.orders.length === 0 ? (
            <li className="text-foreground-muted">Nenhum pedido.</li>
          ) : (
            contact.orders.map((order) => (
              <li key={order.id} className="flex items-center justify-between">
                <button
                  className="text-left text-foreground hover:text-brand"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  {formatDate(order.createdAt)} · {order.items.length} item(ns)
                </button>
                <span className="font-medium text-foreground">{formatCurrency(order.total)}</span>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Modal
        open={action === 'interaction'}
        onClose={() => setAction(null)}
        title="Registrar interação"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancelar
            </Button>
            <Button form="interaction-form" type="submit" disabled={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="interaction-form" onSubmit={submitInteraction} className="space-y-4">
          <Field label="Tipo">
            <Select
              value={interactionForm.type}
              onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}
            >
              {interactionTypeEntries.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Descrição">
            <Textarea
              required
              value={interactionForm.description}
              onChange={(e) =>
                setInteractionForm({ ...interactionForm, description: e.target.value })
              }
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={action === 'followup'}
        onClose={() => setAction(null)}
        title="Agendar follow-up"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancelar
            </Button>
            <Button form="followup-form" type="submit" disabled={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="followup-form" onSubmit={submitFollowup} className="space-y-4">
          <Field label="Tipo">
            <Select
              value={followupForm.type}
              onChange={(e) => setFollowupForm({ ...followupForm, type: e.target.value })}
            >
              {followUpTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data e hora">
            <Input
              type="datetime-local"
              required
              value={followupForm.scheduledAt}
              onChange={(e) => setFollowupForm({ ...followupForm, scheduledAt: e.target.value })}
            />
          </Field>
          <Field label="Observações">
            <Textarea
              value={followupForm.notes}
              onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={action === 'lead'}
        onClose={() => setAction(null)}
        title="Novo lead"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancelar
            </Button>
            <Button form="lead-form" type="submit" disabled={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="lead-form" onSubmit={submitLead} className="space-y-4">
          <Field label="Origem">
            <Select
              value={leadForm.source}
              onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
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
              value={leadForm.estimatedValue}
              onChange={(e) => setLeadForm({ ...leadForm, estimatedValue: e.target.value })}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
