import type { Money } from './types';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatCurrency(value: Money | null | undefined): string {
  if (value === null || value === undefined || value === '') return brl.format(0);
  return brl.format(Number(value));
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR').format(value ?? 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Value formatted for a datetime-local input (YYYY-MM-DDTHH:mm). */
export function toDateTimeLocal(value: string | Date | null | undefined): string {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function contactName(
  contact?: {
    firstName: string;
    lastName?: string | null;
  } | null,
): string {
  if (!contact) return '—';
  return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
}
