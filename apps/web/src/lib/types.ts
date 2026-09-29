import type {
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
  UserRole,
} from '@lubdiesel/shared';

/** Money fields arrive as strings (Prisma Decimal) or numbers. */
export type Money = string | number;

export interface UserRef {
  id: string;
  name: string;
  email?: string;
}

export interface CompanyRef {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  legalName?: string | null;
  document?: string | null;
  type: CompanyType;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  type: ContactType;
  source?: LeadSource | null;
  notes?: string | null;
  assignedUserId?: string | null;
  companyId?: string | null;
  company?: CompanyRef | null;
  assignedUser?: UserRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStageHistory {
  id: string;
  fromStatus?: LeadStatus | null;
  toStatus: LeadStatus;
  note?: string | null;
  createdAt: string;
}

export interface Lead {
  id: string;
  contactId: string;
  status: LeadStatus;
  source: LeadSource;
  estimatedValue?: Money | null;
  assignedUserId?: string | null;
  lostReason?: LostReason | null;
  convertedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: Pick<
    Contact,
    'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'whatsapp' | 'type'
  >;
  assignedUser?: UserRef | null;
  stageHistory?: LeadStageHistory[];
}

export interface FollowUp {
  id: string;
  type: FollowUpType;
  scheduledAt: string;
  completedAt?: string | null;
  status: FollowUpStatus;
  notes?: string | null;
  leadId?: string | null;
  contactId?: string | null;
  assignedUserId?: string | null;
  assignedUser?: UserRef | null;
  contact?: { id: string; firstName: string; lastName?: string | null } | null;
  lead?: { id: string; status: LeadStatus } | null;
}

export interface Interaction {
  id: string;
  type: InteractionType;
  description: string;
  contactId?: string | null;
  leadId?: string | null;
  createdBy?: UserRef | null;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  volumeMl: number;
  costPrice: Money;
  salePrice: Money;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  unit: string;
  reason?: string | null;
  referenceId?: string | null;
  createdAt: string;
  product?: { id: string; sku: string; name: string };
}

export interface ProductBalance {
  productId: string;
  sku: string;
  name: string;
  balance: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: Money;
  costPrice: Money;
  subtotal: Money;
  product?: { id: string; sku: string; name: string };
}

export interface Order {
  id: string;
  contactId?: string | null;
  companyId?: string | null;
  status: OrderStatus;
  source: OrderSource;
  subtotal: Money;
  discount: Money;
  total: Money;
  notes?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  contact?: { id: string; firstName: string; lastName?: string | null } | null;
  company?: CompanyRef | null;
}
