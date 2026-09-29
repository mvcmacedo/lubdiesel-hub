'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, ApiError, apiList } from '@/lib/api';
import { pruneEmpty } from '@/lib/forms';
import { contactName, formatCurrency, formatDateTime } from '@/lib/format';
import {
  followUpTypeOptions,
  interactionTypeLabels,
  label,
  LeadStatus,
  leadSourceLabels,
  leadStatusLabels,
  leadStatusOptions,
  leadStatusTone,
  lostReasonLabels,
  lostReasonOptions,
} from '@/lib/labels';
import type { Interaction, Lead } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/stat-card';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { BackButton, PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

type Action = 'stage' | 'interaction' | 'followup' | null;

const interactionTypeEntries = Object.entries(interactionTypeLabels);

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action>(null);
  const [saving, setSaving] = useState(false);

  const [stageForm, setStageForm] = useState({
    status: 'CONTACTED',
    note: '',
    lostReason: 'PRICE',
  });
  const [interactionForm, setInteractionForm] = useState({ type: 'WHATSAPP', description: '' });
  const [followupForm, setFollowupForm] = useState({ type: 'CALL', scheduledAt: '', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadData, interactionsData] = await Promise.all([
        apiFetch<Lead>(`/leads/${params.id}`),
        apiList<Interaction>(`/interactions?leadId=${params.id}&pageSize=100`),
      ]);
      setLead(leadData);
      setInteractions(interactionsData.data);
    } catch {
      notify('Não foi possível carregar o lead.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [params.id, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitStage(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/leads/${params.id}/stage`, {
        method: 'PATCH',
        body: pruneEmpty({
          status: stageForm.status,
          note: stageForm.note,
          lostReason: stageForm.status === LeadStatus.LOST ? stageForm.lostReason : undefined,
        }),
      });
      notify('Etapa atualizada.', 'success');
      setAction(null);
      await load();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function submitInteraction(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/interactions', {
        method: 'POST',
        body: { leadId: params.id, ...interactionForm },
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
          leadId: params.id,
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

  if (loading) return <p className="text-sm text-foreground-muted">Carregando...</p>;
  if (!lead) return <p className="text-sm text-danger">Lead não encontrado.</p>;

  return (
    <div className="space-y-6">
      <BackButton onClick={() => router.push('/leads')} />

      <PageHeader
        title={contactName(lead.contact)}
        description={`${label(leadSourceLabels, lead.source)} · ${formatCurrency(lead.estimatedValue)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setAction('interaction')}>
              Interação
            </Button>
            <Button variant="secondary" onClick={() => setAction('followup')}>
              Follow-up
            </Button>
            <Button onClick={() => setAction('stage')}>Mudar etapa</Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={leadStatusTone(lead.status)}>{label(leadStatusLabels, lead.status)}</Badge>
        {lead.lostReason ? (
          <Badge tone="danger">Perda: {label(lostReasonLabels, lead.lostReason)}</Badge>
        ) : null}
        {lead.contact ? (
          <button
            className="text-sm text-foreground-muted hover:text-brand"
            onClick={() => router.push(`/contacts/${lead.contactId}`)}
          >
            Ver contato →
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-foreground">Histórico de estágios</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {(lead.stageHistory ?? []).length === 0 ? (
              <li className="text-foreground-muted">Sem histórico.</li>
            ) : (
              (lead.stageHistory ?? []).map((entry) => (
                <li key={entry.id} className="border-l-2 border-border pl-3">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">
                      {entry.fromStatus ? `${label(leadStatusLabels, entry.fromStatus)} → ` : ''}
                      {label(leadStatusLabels, entry.toStatus)}
                    </span>
                    <span className="text-xs text-foreground-muted">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                  {entry.note ? <p className="mt-1 text-foreground-muted">{entry.note}</p> : null}
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground">Interações</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {interactions.length === 0 ? (
              <li className="text-foreground-muted">Nenhuma interação.</li>
            ) : (
              interactions.map((interaction) => (
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
      </div>

      <Modal
        open={action === 'stage'}
        onClose={() => setAction(null)}
        title="Mudar etapa"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancelar
            </Button>
            <Button form="stage-form" type="submit" disabled={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="stage-form" onSubmit={submitStage} className="space-y-4">
          <Field label="Novo status">
            <Select
              value={stageForm.status}
              onChange={(e) => setStageForm({ ...stageForm, status: e.target.value })}
            >
              {leadStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          {stageForm.status === LeadStatus.LOST ? (
            <Field label="Motivo da perda">
              <Select
                value={stageForm.lostReason}
                onChange={(e) => setStageForm({ ...stageForm, lostReason: e.target.value })}
              >
                {lostReasonOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Field label="Observação">
            <Textarea
              value={stageForm.note}
              onChange={(e) => setStageForm({ ...stageForm, note: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={action === 'interaction'}
        onClose={() => setAction(null)}
        title="Registrar interação"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancelar
            </Button>
            <Button form="lead-interaction-form" type="submit" disabled={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="lead-interaction-form" onSubmit={submitInteraction} className="space-y-4">
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
            <Button form="lead-followup-form" type="submit" disabled={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="lead-followup-form" onSubmit={submitFollowup} className="space-y-4">
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
    </div>
  );
}
