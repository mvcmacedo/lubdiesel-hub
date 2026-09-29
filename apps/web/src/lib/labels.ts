import {
  CompanyType,
  ContactType,
  FollowUpStatus,
  FollowUpType,
  InteractionType,
  InventoryMovementType,
  LeadSource,
  LeadStatus,
  LostReason,
  OrderSource,
  OrderStatus,
} from '@lubdiesel/shared';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'danger' | 'warning';

function options(map: Record<string, string>): { value: string; label: string }[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

export const contactTypeLabels: Record<string, string> = {
  LEAD: 'Lead',
  CUSTOMER: 'Cliente',
  RESELLER: 'Revendedor',
  WORKSHOP: 'Oficina',
  FLEET: 'Frota',
  SUPPLIER: 'Fornecedor',
  OTHER: 'Outro',
};

export const companyTypeLabels: Record<string, string> = {
  WORKSHOP: 'Oficina',
  RESELLER: 'Revendedor',
  DISTRIBUTOR: 'Distribuidor',
  FLEET: 'Frota',
  SUPPLIER: 'Fornecedor',
  OTHER: 'Outro',
};

export const leadStatusLabels: Record<string, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contato realizado',
  INTERESTED: 'Interessado',
  NEGOTIATION: 'Negociação',
  WAITING: 'Aguardando',
  WON: 'Ganho',
  LOST: 'Perdido',
};

export const leadSourceLabels: Record<string, string> = {
  TOYOCENTER: 'Toyocenter',
  LUBDIESEL_WEBSITE: 'Site Lubdiesel',
  INSTAGRAM_TOYOCENTER: 'Instagram Toyocenter',
  INSTAGRAM_LUBDIESEL: 'Instagram Lubdiesel',
  WHATSAPP: 'WhatsApp',
  MERCADO_LIVRE: 'Mercado Livre',
  REFERRAL: 'Indicação',
  PERSONAL_NETWORK: 'Rede pessoal',
  EVENT: 'Evento',
  RESELLER: 'Revendedor',
  OTHER: 'Outro',
};

export const lostReasonLabels: Record<string, string> = {
  PRICE: 'Preço',
  NO_RESPONSE: 'Sem resposta',
  NO_INTEREST: 'Sem interesse',
  COMPETITOR: 'Concorrente',
  NO_STOCK: 'Sem estoque',
  TIMING: 'Momento',
  OTHER: 'Outro',
};

export const followUpTypeLabels: Record<string, string> = {
  CALL: 'Ligação',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  MEETING: 'Reunião',
  OTHER: 'Outro',
};

export const followUpStatusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export const interactionTypeLabels: Record<string, string> = {
  CALL: 'Ligação',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  MEETING: 'Reunião',
  NOTE: 'Nota',
  SYSTEM: 'Sistema',
};

export const movementTypeLabels: Record<string, string> = {
  PURCHASE: 'Compra',
  SALE: 'Venda',
  SAMPLE: 'Amostra',
  INTERNAL_USE: 'Uso interno',
  GIFT: 'Brinde',
  LOSS: 'Perda',
  ADJUSTMENT: 'Ajuste',
  RETURN: 'Devolução',
};

export const orderStatusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  PAID: 'Pago',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export const orderSourceLabels: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  MERCADO_LIVRE: 'Mercado Livre',
  INSTAGRAM: 'Instagram',
  TOYOCENTER: 'Toyocenter',
  DIRECT: 'Direto',
  RESELLER: 'Revendedor',
  OTHER: 'Outro',
};

export const contactTypeOptions = options(contactTypeLabels);
export const companyTypeOptions = options(companyTypeLabels);
export const leadSourceOptions = options(leadSourceLabels);
export const lostReasonOptions = options(lostReasonLabels);
export const followUpTypeOptions = options(followUpTypeLabels);
export const movementTypeOptions = options(movementTypeLabels);
export const orderSourceOptions = options(orderSourceLabels);
export const leadStatusOptions = options(leadStatusLabels);
export const orderStatusOptions = options(orderStatusLabels);

export function label(map: Record<string, string>, value?: string | null): string {
  if (!value) return '—';
  return map[value] ?? value;
}

export function leadStatusTone(status: LeadStatus): BadgeTone {
  if (status === LeadStatus.WON) return 'success';
  if (status === LeadStatus.LOST) return 'danger';
  if (status === LeadStatus.NEGOTIATION) return 'warning';
  return 'neutral';
}

export function orderStatusTone(status: OrderStatus): BadgeTone {
  if (status === OrderStatus.COMPLETED || status === OrderStatus.PAID) return 'success';
  if (status === OrderStatus.CANCELLED) return 'danger';
  if (status === OrderStatus.PENDING) return 'warning';
  return 'neutral';
}

export function followUpStatusTone(status: FollowUpStatus): BadgeTone {
  if (status === FollowUpStatus.COMPLETED) return 'success';
  if (status === FollowUpStatus.CANCELLED) return 'danger';
  return 'warning';
}

// Re-export enums used by the pages.
export {
  CompanyType,
  ContactType,
  FollowUpStatus,
  FollowUpType,
  InteractionType,
  InventoryMovementType,
  LeadSource,
  LeadStatus,
  LostReason,
  OrderSource,
  OrderStatus,
};
