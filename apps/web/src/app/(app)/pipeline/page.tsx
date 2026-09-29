'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, apiFetchRaw } from '@/lib/api';
import { contactName, formatCurrency } from '@/lib/format';
import { label, leadSourceLabels } from '@/lib/labels';
import type { Lead } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface PipelineColumn {
  status: string;
  label: string;
  count: number;
  leads: Lead[];
}

export default function PipelinePage() {
  const router = useRouter();
  const { notify } = useToast();
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const board = await apiFetchRaw<{ columns: PipelineColumn[] }>('/pipeline');
      setColumns(board.columns);
    } catch {
      notify('Não foi possível carregar o pipeline.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function move(leadId: string, fromStatus: string, toStatus: string) {
    if (fromStatus === toStatus) return;
    try {
      await apiFetch(`/pipeline/leads/${leadId}/move`, {
        method: 'PATCH',
        body: { status: toStatus },
      });
      notify('Lead movido.', 'success');
      await load();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao mover.', 'danger');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Arraste os cards entre as colunas para mudar o estágio."
      />

      {loading ? (
        <p className="text-sm text-foreground-muted">Carregando...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(column.status);
              }}
              onDragLeave={() => setDragOver((prev) => (prev === column.status ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const leadId = e.dataTransfer.getData('leadId');
                const fromStatus = e.dataTransfer.getData('fromStatus');
                if (leadId) void move(leadId, fromStatus, column.status);
              }}
              className={cn(
                'flex w-64 shrink-0 flex-col rounded-xl border bg-background-secondary',
                dragOver === column.status ? 'border-brand' : 'border-border',
              )}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-sm font-medium text-foreground">{column.label}</span>
                <span className="rounded-full bg-card px-2 py-0.5 text-xs text-foreground-muted">
                  {column.count}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2">
                {column.leads.length === 0 ? (
                  <p className="px-1 py-4 text-center text-xs text-foreground-muted">Vazio</p>
                ) : (
                  column.leads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('leadId', lead.id);
                        e.dataTransfer.setData('fromStatus', column.status);
                      }}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="cursor-grab rounded-lg border border-border bg-card p-3 text-sm active:cursor-grabbing"
                    >
                      <p className="font-medium text-foreground">{contactName(lead.contact)}</p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {label(leadSourceLabels, lead.source)}
                      </p>
                      <p className="mt-1 text-xs text-brand">
                        {formatCurrency(lead.estimatedValue)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
